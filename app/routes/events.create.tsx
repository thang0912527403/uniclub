/**
 * events.create.tsx — Tạo sự kiện mới
 *
 * Architecture:
 *  - `formState` là source-of-truth duy nhất cho form fields
 *  - `calState` (CalendarState) được derive từ formState để feed cho FullCalendar
 *  - Khi calendar drag/resize → chỉ cập nhật formState (KHÔNG gọi API)
 *  - Khi bấm "Tạo sự kiện" → gọi createEvent API 1 lần duy nhất
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { encodeId } from '~/utils/idEncoder';
import { message } from 'antd';
import { useCreateEventMutation, useCreateSessionMutation } from '~/cores/api';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { EventForm } from '~/modules/events/components/EventForm';
import { EventCalendarPanel } from '~/modules/events/components/EventCalendarPanel';
import { SessionQuickModal } from '~/modules/events/components/SessionQuickModal';
import type { CalendarState } from '~/modules/events/components/EventCalendarPanel';
import type { SessionQuickModalData } from '~/modules/events/components/SessionQuickModal';
import { useClubRole } from '~/hooks/useClubRole';
import { getClubId } from '~/utils/auth';

// ────────────────────────── Form State Types ──────────────────────────

interface FormState {
    eventName: string;
    description: string;
    location: string;
    meetLink: string;
    startDate: string;     // datetime-local ISO slice
    endDate: string;
    isOnline: boolean;
    isPublic: boolean;
    requiresApproval: boolean;
    regStart: string;      // Registration period
    regEnd: string;
    maxAttendees: string;
    sessions: DraftSession[];
}

interface DraftSession {
    id: number;            // negative temp ID
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
}

let _nextSessionId = -1;
const nextTempId = () => _nextSessionId--;

// ────────────────────────── Helpers ──────────────────────────

function toIso(localDT: string): string {
    if (!localDT) return '';
    try { return new Date(localDT).toISOString(); } catch { return ''; }
}

/**
 * Format a Date to datetime-local string using LOCAL timezone.
 * Dùng getHours()/getMinutes() (local time) — KHÔNG dùng toISOString() (UTC).
 */
function dateToLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return [
        d.getFullYear(), '-',
        pad(d.getMonth() + 1), '-',
        pad(d.getDate()), 'T',
        pad(d.getHours()), ':',
        pad(d.getMinutes()),
    ].join('');
}

/** Convert ISO (UTC) string → datetime-local value in local timezone. */
function toLocal(iso: string): string {
    if (!iso) return '';
    try { return dateToLocal(new Date(iso)); } catch { return ''; }
}

/** Format datetime-local value → "Ngày DD/MM/YYYY HH:mm" */
function formatViDate(localDT: string): string {
    if (!localDT) return '';
    try {
        const d = new Date(localDT);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return localDT; }
}

/** Wrapper hiển thị format Việt Nam, click mở native date-time picker */
function DTPicker({
    value, onChange, placeholder = 'Chọn ngày giờ', className = '', isDark = false,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    isDark?: boolean;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const base = isDark ? 'bg-[#1a1d2e] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const empty = isDark ? 'text-gray-500' : 'text-gray-400';
    return (
        <div
            className={`relative rounded-lg border cursor-pointer ${base} ${className}`}
            onClick={() => ref.current?.showPicker?.()}
        >
            <div className={`px-3 py-2 text-sm select-none ${value ? '' : empty}`}>
                {value
                    ? <><i className="fas fa-calendar-alt mr-1.5 text-blue-500" />{formatViDate(value)}</>
                    : placeholder
                }
            </div>
            <input
                ref={ref}
                type="datetime-local"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                tabIndex={-1}
            />
        </div>
    );
}


function deriveCalendarState(form: FormState): CalendarState {
    return {
        mainEvent: form.startDate && form.endDate ? {
            title: form.eventName || 'Sự kiện',
            start: toIso(form.startDate),
            end: toIso(form.endDate),
        } : null,
        registration: form.regStart && form.regEnd ? {
            start: toIso(form.regStart),
            end: toIso(form.regEnd),
        } : null,
        sessions: form.sessions
            .filter(s => s.startTime && s.endTime)
            .map(s => ({
                id: s.id,
                title: s.sessionName || 'Phiên mới',
                start: toIso(s.startTime),
                end: toIso(s.endTime),
            })),
    };
}

// ────────────────────────── Component ──────────────────────────

export default function CreateEventPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { clubManagerMembership } = useClubRole();
    const clubId = getClubId();

    const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'time'>('info');

    // ── Shared Form State ──
    const [form, setForm] = useState<FormState>({
        eventName: '',
        description: '',
        location: '',
        meetLink: '',
        startDate: '',
        endDate: '',
        isOnline: false,
        isPublic: true,
        requiresApproval: false,
        regStart: '',
        regEnd: '',
        maxAttendees: '',
        sessions: [],
    });

    // Derive calendar state from form (no extra state)
    const calState: CalendarState = deriveCalendarState(form);

    // ── Form → Calendar sync ──
    const handleFormChange = useCallback((data: Partial<FormState>) => {
        setForm(prev => ({ ...prev, ...data }));
    }, []);

    // ── Calendar → Form sync (state-only, KHÔNG gọi API) ──
    // Dùng dateToLocal(Date) vì Date.toISOString() trả UTC, không phải local time.
    const handleMainEventChange = useCallback((start: Date, end: Date, _revert: () => void) => {
        setForm(prev => ({
            ...prev,
            startDate: dateToLocal(start),
            endDate: dateToLocal(end),
        }));
    }, []);

    const handleRegistrationChange = useCallback((start: Date, end: Date, _revert: () => void) => {
        setForm(prev => ({
            ...prev,
            regStart: dateToLocal(start),
            regEnd: dateToLocal(end),
        }));
    }, []);

    const handleSessionChange = useCallback((id: number, start: Date, end: Date, _revert: () => void) => {
        setForm(prev => ({
            ...prev,
            sessions: prev.sessions.map(s =>
                s.id === id
                    ? { ...s, startTime: dateToLocal(start), endTime: dateToLocal(end) }
                    : s
            ),
        }));
    }, []);

    // ── Session CRUD ──
    const addSession = () => {
        setForm(prev => ({
            ...prev,
            sessions: [...prev.sessions, {
                id: nextTempId(),
                sessionName: '',
                startTime: form.startDate || '',
                endTime: '',
                location: '',
                description: '',
            }],
        }));
    };

    const updateSession = (id: number, patch: Partial<DraftSession>) => {
        setForm(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s.id === id ? { ...s, ...patch } : s),
        }));
    };

    const removeSession = (id: number) => {
        setForm(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
    };

    // ── Session Quick Modal (giống Edit) ──
    const [sessionModal, setSessionModal] = useState<{
        mode: 'create' | 'edit';
        sessionId?: number;
        start: string;
        end: string;
    } | null>(null);

    const handleSessionCreate = useCallback((start: Date, end: Date) => {
        setSessionModal({ mode: 'create', start: dateToLocal(start), end: dateToLocal(end) });
    }, []);

    const handleSessionClick = useCallback((sessionId: number) => {
        const s = form.sessions.find(x => x.id === sessionId);
        if (!s) return;
        setSessionModal({ mode: 'edit', sessionId, start: s.startTime, end: s.endTime });
    }, [form.sessions]);

    const handleSessionModalConfirm = useCallback((data: SessionQuickModalData) => {
        if (!sessionModal) return;
        if (sessionModal.mode === 'create') {
            setForm(prev => ({
                ...prev,
                sessions: [...prev.sessions, {
                    id: nextTempId(),
                    sessionName: data.sessionName,
                    startTime: data.start,
                    endTime: data.end,
                    location: data.location,
                    description: data.description,
                }],
            }));
        } else if (sessionModal.mode === 'edit' && sessionModal.sessionId != null) {
            const sid = sessionModal.sessionId;
            setForm(prev => ({
                ...prev,
                sessions: prev.sessions.map(s => s.id === sid ? {
                    ...s,
                    sessionName: data.sessionName,
                    startTime: data.start,
                    endTime: data.end,
                    location: data.location,
                    description: data.description,
                } : s),
            }));
        }
        setSessionModal(null);
    }, [sessionModal]);

    const handleSessionModalDelete = useCallback(() => {
        if (!sessionModal?.sessionId) return;
        removeSession(sessionModal.sessionId);
        setSessionModal(null);
    }, [sessionModal]);

    // ── Submit — 1 lần duy nhất ──
    const handleSubmit = async (submitData: any) => {
        try {
            setError(null);
            // Merge submitData từ EventForm với form state
            const merged = {
                ...submitData,
                startDate: toIso(form.startDate),
                endDate: toIso(form.endDate),
            };
            const result = await createEvent(merged).unwrap();
            message.success('Tạo sự kiện thành công!');
            navigate(`/events/${encodeId(result.eventId)}`);
        } catch (err: any) {
            let msg = 'Không thể tạo sự kiện. Vui lòng thử lại.';
            if (err?.data?.error) {
                msg = err.data.error;
                if (err.data.details) msg += ` - ${err.data.details}`;
            }
            setError(msg);
            message.error(msg);
        }
    };

    const bg = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const card = isDark ? 'bg-[#242838]' : 'bg-white';
    const text = isDark ? 'text-white' : 'text-gray-900';
    const sub = isDark ? 'text-gray-400' : 'text-gray-500';
    const inputCls = isDark
        ? 'bg-[#1a1d2e] border-gray-600 text-white'
        : 'bg-white border-gray-300 text-gray-900';
    const border = isDark ? 'border-gray-700' : 'border-gray-200';

    return (
        <div className="min-h-screen">
            <ApiStatusButton
                apiStatuses={[{ name: 'Tạo sự kiện', isLoading: isCreating }]}
                isDark={isDark}
                onThemeToggle={toggleTheme}
                position="bottom-right"
            />
            <Sidebar currentPath="/events" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Tạo sự kiện mới"
                breadcrumb="Sự kiện / Tạo mới"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bg} min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => navigate('/events')}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                            <i className={`fas fa-arrow-left ${text}`} />
                        </button>
                        <h1 className={`text-2xl font-bold ${text}`}>Tạo sự kiện mới</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* ── Tab Switcher ── */}
                    <div className="flex gap-1 mb-6">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'info'
                                ? 'bg-blue-500 text-white shadow-md'
                                : `${isDark ? 'bg-[#242838] text-gray-400 hover:bg-[#2c3e50]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                            }`}
                        >
                            <i className="fas fa-edit mr-2" />Thông tin sự kiện
                        </button>
                        <button
                            onClick={() => setActiveTab('time')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'time'
                                ? 'bg-blue-500 text-white shadow-md'
                                : `${isDark ? 'bg-[#242838] text-gray-400 hover:bg-[#2c3e50]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                            }`}
                        >
                            <i className="fas fa-calendar-alt mr-2" />Thời gian sự kiện
                        </button>
                    </div>

                    {/* ── Tab: Thông tin sự kiện ── */}
                    {activeTab === 'info' && (
                        <div className={`${card} rounded-xl shadow-sm p-6`}>
                            <EventForm
                                initialData={{
                                    clubId,
                                    startDate: form.startDate,
                                    endDate: form.endDate,
                                    isOnline: form.isOnline,
                                    isPublic: form.isPublic,
                                    requiresApproval: form.requiresApproval,
                                }}
                                onChange={(data) => handleFormChange(data)}
                                onSubmit={handleSubmit}
                                onCancel={() => navigate('/events')}
                                isLoading={isCreating}
                                isDark={isDark}
                                mode="create"
                            />
                        </div>
                    )}

                    {/* ── Tab: Thời gian sự kiện ── */}
                    {activeTab === 'time' && (
                        <div className="space-y-5">
                            {/* Thời gian đăng ký */}
                            <div className={`${card} rounded-xl shadow-sm p-5`}>
                                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
                                    Thời gian đăng ký
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bắt đầu đăng ký</label>
                                        <DTPicker
                                            value={form.regStart}
                                            onChange={v => handleFormChange({ regStart: v })}
                                            placeholder="Chọn ngày bắt đầu"
                                            isDark={isDark}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kết thúc đăng ký</label>
                                        <DTPicker
                                            value={form.regEnd}
                                            onChange={v => handleFormChange({ regEnd: v })}
                                            placeholder="Chọn ngày kết thúc"
                                            isDark={isDark}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className={`${card} rounded-xl shadow-sm p-4`}>
                                <EventCalendarPanel
                                    state={calState}
                                    onMainEventChange={handleMainEventChange}
                                    onRegistrationChange={handleRegistrationChange}
                                    onSessionChange={handleSessionChange}
                                    onSessionCreate={handleSessionCreate}
                                    onSessionClick={handleSessionClick}
                                    onSetEventTime={(start, end) => {
                                        setForm(prev => ({
                                            ...prev,
                                            startDate: dateToLocal(start),
                                            endDate: dateToLocal(end),
                                        }));
                                    }}
                                    onSetRegistrationTime={(start, end) => {
                                        setForm(prev => ({
                                            ...prev,
                                            regStart: dateToLocal(start),
                                            regEnd: dateToLocal(end),
                                        }));
                                    }}
                                    eventTimeConstraint={
                                        form.startDate && form.endDate
                                            ? { start: toIso(form.startDate), end: toIso(form.endDate) }
                                            : null
                                    }
                                    isDark={isDark}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Session Quick Modal */}
            {sessionModal && (
                <SessionQuickModal
                    mode={sessionModal.mode}
                    initialData={{
                        sessionName: sessionModal.mode === 'edit'
                            ? form.sessions.find(s => s.id === sessionModal.sessionId)?.sessionName ?? ''
                            : '',
                        start: sessionModal.start,
                        end: sessionModal.end,
                        location: sessionModal.mode === 'edit'
                            ? form.sessions.find(s => s.id === sessionModal.sessionId)?.location ?? ''
                            : '',
                        description: sessionModal.mode === 'edit'
                            ? form.sessions.find(s => s.id === sessionModal.sessionId)?.description ?? ''
                            : '',
                        sessionType: 'main',
                    }}
                    eventBounds={
                        form.startDate && form.endDate
                            ? { start: toIso(form.startDate), end: toIso(form.endDate) }
                            : null
                    }
                    onConfirm={handleSessionModalConfirm}
                    onDelete={sessionModal.mode === 'edit' ? handleSessionModalDelete : undefined}
                    onClose={() => setSessionModal(null)}
                    isDark={isDark}
                />
            )}
        </div>
    );
}
