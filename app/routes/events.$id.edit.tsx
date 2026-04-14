/**
 * events.$id.edit.tsx — Sửa sự kiện
 *
 * Architecture giống Create nhưng:
 *  - Load existing event data vào formState khi mount
 *  - calendar drag/resize → chỉ update formState (KHÔNG gọi API ngay)
 *  - Bấm "Cập nhật sự kiện" → gọi updateEvent API 1 lần duy nhất
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    useGetEventByIdQuery,
    useUpdateEventMutation,
    useCreateSessionMutation,
    useUpdateSessionMutation,
    useDeleteSessionMutation,
    useOpenRegistrationMutation,
} from '~/cores/api';
import { useEventPermission } from '~/hooks/useEventPermission';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useNotification } from '~/components/Notification';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { EventForm } from '~/modules/events/components/EventForm';
import { EventCalendarPanel } from '~/modules/events/components/EventCalendarPanel';
import { SessionQuickModal } from '~/modules/events/components/SessionQuickModal';
import type { CalendarState } from '~/modules/events/components/EventCalendarPanel';
import type { SessionQuickModalData } from '~/modules/events/components/SessionQuickModal';

// ── Helpers ──────────────────────────────────────────

function toIso(localDT: string): string {
    if (!localDT) return '';
    try { return new Date(localDT).toISOString(); } catch { return ''; }
}

/**
 * Format a Date to datetime-local string using LOCAL timezone.
 * getHours()/getMinutes() trả local time; không dùng toISOString() (UTC).
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

/** Convert ISO (UTC) string → datetime-local in local timezone. */
function toLocal(iso: string | undefined | null): string {
    if (!iso) return '';
    try { return dateToLocal(new Date(iso)); } catch { return ''; }
}

/** Format datetime-local value → "DD/MM/YYYY HH:mm" */
function formatViDate(localDT: string): string {
    if (!localDT) return '';
    try {
        const d = new Date(localDT);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return localDT; }
}

/** Wrapper hiển thị format Việt Nam, click mở native date-time picker */
function DTPicker({ value, onChange, placeholder = 'Chọn ngày giờ', isDark = false }: {
    value: string; onChange: (v: string) => void; placeholder?: string; isDark?: boolean;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const base = isDark ? 'bg-[#1a1d2e] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    return (
        <div className={`relative w-full rounded-lg border cursor-pointer ${base}`}
            onClick={() => ref.current?.showPicker?.()}>
            <div className={`px-3 py-2 text-sm select-none ${!value ? (isDark ? 'text-gray-500' : 'text-gray-400') : ''}`}>
                {value ? <><i className="fas fa-calendar-alt mr-1.5 text-blue-500" />{formatViDate(value)}</> : placeholder}
            </div>
            <input ref={ref} type="datetime-local" value={value}
                onChange={e => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" tabIndex={-1} />
        </div>
    );
}

let _nextSessionId = -1;
const nextTempId = () => _nextSessionId--;

// ── Types ─────────────────────────────────────────────

interface EditSession {
    id: number;            // positive = saved, negative = draft
    sessionName: string;
    startTime: string;     // datetime-local
    endTime: string;
    location: string;
    description: string;
    sessionType: 'main' | 'setup' | 'break';
}

interface FormState {
    eventName: string;
    description: string;
    location: string;
    meetLink: string;
    startDate: string;
    endDate: string;
    isOnline: boolean;
    isPublic: boolean;
    requiresApproval: boolean;
    regStart: string;
    regEnd: string;
    maxAttendees: string;
    sessions: EditSession[];
}

function deriveCalendarState(form: FormState, eventName: string): CalendarState {
    return {
        mainEvent: form.startDate && form.endDate ? {
            title: form.eventName || eventName || 'Sự kiện',
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
                title: s.sessionName || 'Phiên',
                start: toIso(s.startTime),
                end: toIso(s.endTime),
                sessionType: s.sessionType,
            })),
    };
}

// ── Component ─────────────────────────────────────────

export default function EditEventPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show: showNotification } = useNotification();

    const { data: event, isLoading: isLoadingEvent } = useGetEventByIdQuery(Number(id));
    const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
    const [createSession] = useCreateSessionMutation();
    const [updateSession] = useUpdateSessionMutation();
    const [deleteSession] = useDeleteSessionMutation();
    const [openRegistration] = useOpenRegistrationMutation();
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Per-event permission gate
    const { can, isLoading: isLoadingPerm } = useEventPermission(event?.clubId, Number(id));
    
    // Gating for canceled events
    useEffect(() => {
        if (event && event.status === 'CANCELED') {
            showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật sự kiện. Vui lòng thử lại.' });
            navigate(`/events/${id}`, { replace: true });
        }
    }, [event, navigate, id, showNotification]);

    /** IDs của sessions hiện có (id > 0) đã bị xóa khỏi UI — cần gọi DELETE */
    const [deletedSessionIds, setDeletedSessionIds] = useState<number[]>([]);

    // ── Confirmation modal ──
    const [confirmModal, setConfirmModal] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'time'>('info');

    // ── Session Quick Modal (tạo/sửa trực tiếp từ calendar) ──
    const [sessionModal, setSessionModal] = useState<{
        mode: 'create' | 'edit';
        sessionId?: number;
        start: string;
        end: string;
    } | null>(null);

    // ── FormState ──
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

    // Load existing event data once
    useEffect(() => {
        if (event && !initialized) {
            setForm({
                eventName: event.eventName ?? '',
                description: event.description ?? '',
                location: event.location ?? '',
                meetLink: event.meetLink ?? '',
                startDate: toLocal(event.startDate),
                endDate: toLocal(event.endDate),
                isOnline: event.isOnline ?? false,
                isPublic: event.isPublic ?? true,
                requiresApproval: event.requiresApproval ?? false,
                regStart: toLocal(event.registrationStartDate),
                regEnd: toLocal(event.registrationEndDate),
                maxAttendees: event.maxAttendees?.toString() ?? '',
                sessions: (event.sessions ?? []).map(s => ({
                    id: s.scheduleId,
                    sessionName: s.scheduleName ?? '',
                    startTime: toLocal(s.startTime),
                    endTime: toLocal(s.endTime),
                    location: s.location ?? '',
                    description: s.description ?? '',
                    sessionType: (s.sessionType as 'main' | 'setup' | 'break') ?? 'main',
                })),
            });
            setInitialized(true);
        }
    }, [event, initialized]);

    // Derive calendar state
    const calState: CalendarState = deriveCalendarState(form, event?.eventName ?? '');

    // ── Calendar → Form sync (state-only, KHÔNG gọi API) ──
    // Dùng dateToLocal(Date) vì Date.toISOString() trả UTC, không phải local time.
    const handleMainEventChange = useCallback((start: Date, end: Date, _revert: () => void) => {
        setForm(prev => {
            // Tính delta để dịch chuyển tất cả sessions cùng lúc
            const oldStartMs = prev.startDate ? new Date(prev.startDate).getTime() : null;
            const deltaMs = oldStartMs !== null ? start.getTime() - oldStartMs : 0;

            const shiftedSessions = deltaMs !== 0
                ? prev.sessions.map(s => ({
                    ...s,
                    startTime: dateToLocal(new Date(new Date(s.startTime).getTime() + deltaMs)),
                    endTime: dateToLocal(new Date(new Date(s.endTime).getTime() + deltaMs)),
                }))
                : prev.sessions;

            return {
                ...prev,
                startDate: dateToLocal(start),
                endDate: dateToLocal(end),
                sessions: shiftedSessions,
            };
        });
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

    const updateSessionLocal = (id: number, patch: Partial<EditSession>) => {
        setForm(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s.id === id ? { ...s, ...patch } : s),
        }));
    };

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
                sessionType: 'main' as const,
            }],
        }));
    };

    const removeSession = (id: number) => {
        if (id > 0) setDeletedSessionIds(prev => [...prev, id]);
        setForm(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
    };

    // ── Session Quick Modal handlers ──
    const handleSessionCreate = useCallback((start: Date, end: Date) => {
        setSessionModal({ mode: 'create', start: dateToLocal(start), end: dateToLocal(end) });
    }, []);

    const handleSessionClick = useCallback((sessionId: number) => {
        const s = form.sessions.find(x => x.id === sessionId);
        if (!s) return;
        setSessionModal({ mode: 'edit', sessionId, start: s.startTime, end: s.endTime });
    }, [form.sessions]);

    const handleSessionModalConfirm = useCallback(async (data: SessionQuickModalData) => {
        if (!sessionModal) return;
        if (sessionModal.mode === 'create') {
            // Chỉ thêm vào local state với temp ID — API sẽ gọi khi bấm Lưu
            setForm(prev => ({
                ...prev,
                sessions: [...prev.sessions, {
                    id: nextTempId(),
                    sessionName: data.sessionName,
                    startTime: data.start,
                    endTime: data.end,
                    location: data.location,
                    description: data.description,
                    sessionType: data.sessionType,
                }],
            }));
        } else if (sessionModal.mode === 'edit' && sessionModal.sessionId != null) {
            const sid = sessionModal.sessionId;
            // Chỉ update local state — API sẽ gọi khi bấm Lưu
            setForm(prev => ({
                ...prev,
                sessions: prev.sessions.map(s => s.id === sid ? {
                    ...s,
                    sessionName: data.sessionName,
                    startTime: data.start,
                    endTime: data.end,
                    location: data.location,
                    description: data.description,
                    sessionType: data.sessionType,
                } : s),
            }));
        }
        setSessionModal(null);
    }, [sessionModal]);

    const handleSessionModalDelete = useCallback(async () => {
        if (!sessionModal?.sessionId) return;
        const sid = sessionModal.sessionId;
        if (sid > 0) {
            // Đánh dấu để xoá khi bấm Lưu — chỉ remove khỏi local state
            setDeletedSessionIds(prev => [...prev, sid]);
        }
        removeSession(sid);
        setSessionModal(null);
    }, [sessionModal]);

    // ── Submit: nhận data từ EventForm, lưu vào pending rồi mở modal xác nhận ──
    const handleSubmit = (submitData: any) => {
        setPendingSubmitData(submitData);
        setConfirmModal(true);
    };

    // ── Thực thi save sau khi user xác nhận trong modal ──
    const handleConfirmSave = async () => {
        if (!event || !pendingSubmitData) return;
        const clubId = event.clubId ?? 0;
        const eventId = event.eventId;
        setIsSaving(true);
        setError(null);
        try {
            // 1️⃣ Update event chính
            await updateEvent({ ...pendingSubmitData, eventId, clubId }).unwrap();

            // 2️⃣ Đăng ký (optional, không block navigate)
            if (form.regStart && form.regEnd) {
                try {
                    await openRegistration({
                        clubId, eventId,
                        registrationStartDate: toIso(form.regStart),
                        registrationEndDate: toIso(form.regEnd),
                        ...(form.maxAttendees ? { maxAttendees: Number(form.maxAttendees) } : {}),
                    }).unwrap();
                } catch (e) { console.warn('[Edit] openRegistration:', e); }
            }

            // 3️⃣ Xóa sessions đã bị remove (id > 0)
            if (deletedSessionIds.length) {
                await Promise.allSettled(
                    deletedSessionIds.map(scheduleId =>
                        deleteSession({ clubId, eventId, scheduleId })
                    )
                );
            }

            // 4️⃣ Update sessions hiện có (id > 0)
            const existingSessions = form.sessions.filter(s => s.id > 0);
            if (existingSessions.length) {
                await Promise.allSettled(
                    existingSessions.map(s => updateSession({
                        clubId, eventId,
                        scheduleId: s.id,
                        sessionName: s.sessionName,
                        startTime: toIso(s.startTime),
                        endTime: toIso(s.endTime),
                        location: s.location || undefined,
                        description: s.description || undefined,
                        sessionType: s.sessionType,
                    }))
                );
            }

            // 5️⃣ Tạo sessions mới (id < 0)
            const newSessions = form.sessions.filter(
                s => s.id < 0 && s.sessionName && s.startTime && s.endTime
            );
            if (newSessions.length) {
                const results = await Promise.allSettled(
                    newSessions.map(s => createSession({
                        clubId, eventId,
                        sessionName: s.sessionName,
                        startTime: toIso(s.startTime),
                        endTime: toIso(s.endTime),
                        location: s.location || undefined,
                        description: s.description || undefined,
                        sessionType: s.sessionType,
                    }))
                );
                const failed = results
                    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                    .map(r => r.reason?.data?.error || r.reason?.message || 'Lỗi không xác định');
                if (failed.length) {
                    setError(`Cập nhật thành công, nhưng ${failed.length} phiên bị lỗi: ${failed.join('; ')}`);
                    setConfirmModal(false);
                    navigate(`/events/${id}`);
                    return;
                }
            }

            navigate(`/events/${id}`);
        } catch (err: any) {
            setError(err?.data?.error || 'Không thể cập nhật sự kiện. Vui lòng thử lại.');
        }
    };


    const bg = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const card = isDark ? 'bg-[#242838]' : 'bg-white';
    const text = isDark ? 'text-white' : 'text-gray-900';
    const sub = isDark ? 'text-gray-400' : 'text-gray-500';
    const inputCls = isDark
        ? 'bg-[#1a1d2e] border-gray-600 text-white'
        : 'bg-white border-gray-300 text-gray-900';
    const borderCls = isDark ? 'border-gray-700' : 'border-gray-200';

    if (isLoadingEvent) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar title="Sửa sự kiện" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bg} min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="animate-pulse space-y-4 max-w-[1400px] mx-auto">
                        <div className="h-12 bg-gray-300 rounded" />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="h-96 bg-gray-300 rounded-xl" />
                                <div className="h-32 bg-gray-300 rounded-xl" />
                            </div>
                            <div className="h-96 bg-gray-300 rounded-xl" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar title="Sửa sự kiện" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bg} min-h-screen`}>
                    <div className="bg-red-50 border border-red-200 rounded p-4 max-w-xl mx-auto">
                        <p className="text-red-700 font-medium">Không tìm thấy sự kiện.</p>
                    </div>
                </main>
            </div>
        );
    }

    // Redirect if user doesn't have editevent permission
    if (!isLoadingPerm && !can('editevent')) {
        navigate(`/events/${id}`);
        return null;
    }

    return (
        <>
            <div className="min-h-screen">
                <ApiStatusButton
                    apiStatuses={[
                        { name: 'Tải dữ liệu', isLoading: isLoadingEvent },
                        { name: 'Cập nhật', isLoading: isUpdating },
                    ]}
                    isDark={isDark}
                    onThemeToggle={toggleTheme}
                    position="bottom-right"
                />
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar
                    title="Sửa sự kiện"
                    breadcrumb={`Sự kiện / ${event.eventName} / Sửa`}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />

                <main className={`pt-24 p-6 ${bg} min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="max-w-[1400px] mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => navigate(`/events/${id}`)}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                <i className={`fas fa-arrow-left ${text}`} />
                            </button>
                            <h1 className={`text-2xl font-bold ${text}`}>Sửa sự kiện</h1>
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
                                        ...event,
                                        startDate: form.startDate ? toIso(form.startDate) : event.startDate,
                                        endDate: form.endDate ? toIso(form.endDate) : event.endDate,
                                    }}
                                    onChange={(data) => setForm(prev => ({ ...prev, ...data }))}
                                    onSubmit={handleSubmit}
                                    onCancel={() => navigate(`/events/${id}`)}
                                    isLoading={isSaving}
                                    isDark={isDark}
                                    mode="edit"
                                    formId="event-edit-form"
                                    hideActions={true}
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
                                                onChange={v => setForm(prev => ({ ...prev, regStart: v }))}
                                                placeholder="Chọn ngày bắt đầu"
                                                isDark={isDark}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kết thúc đăng ký</label>
                                            <DTPicker
                                                value={form.regEnd}
                                                onChange={v => setForm(prev => ({ ...prev, regEnd: v }))}
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

                        {/* ── Nút Lưu tất cả thay đổi — cuối trang ── */}
                        <div className={`mt-6 p-5 rounded-xl ${card} shadow-sm border-2 ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className={`font-semibold ${text}`}>
                                        <i className="fas fa-save mr-2 text-blue-500" />
                                        Lưu tất cả thay đổi
                                    </p>
                                    <p className={`text-xs mt-0.5 ${sub}`}>
                                        Cập nhật thông tin sự kiện, {form.sessions.filter(s => s.id > 0).length} phiên hiện có, {form.sessions.filter(s => s.id < 0).length} phiên mới
                                        {deletedSessionIds.length > 0 && ` và xóa ${deletedSessionIds.length} phiên`}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/events/${id}`)}
                                        className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!event) return;
                                            // Build submitData trực tiếp từ form state — không phụ thuộc EventForm
                                            const submitData = {
                                                eventName: form.eventName || event.eventName,
                                                description: form.description || event.description,
                                                location: form.location || event.location,
                                                meetLink: form.meetLink || event.meetLink || '',
                                                startDate: form.startDate ? toIso(form.startDate) : event.startDate,
                                                endDate: form.endDate ? toIso(form.endDate) : event.endDate,
                                                isOnline: form.isOnline,
                                                isPublic: form.isPublic,
                                                requiresApproval: form.requiresApproval,
                                                imageUrl: event.imageUrl,
                                            };
                                            setPendingSubmitData(submitData);
                                            setConfirmModal(true);
                                        }}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                                    >
                                        {isSaving
                                            ? <><i className="fas fa-spinner fa-spin mr-2" />Đang lưu...</>
                                            : <><i className="fas fa-check-circle mr-2" />Lưu tất cả</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* ── Confirmation Modal ── */}
                {confirmModal && pendingSubmitData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${card} overflow-hidden`}>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <i className="fas fa-clipboard-check" />
                                    Xác nhận cập nhật
                                </h3>
                                <button
                                    onClick={() => setConfirmModal(false)}
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    <i className="fas fa-times text-lg" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Event info */}
                                <div className={`rounded-lg p-4 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                                        <i className="fas fa-calendar-alt mr-1.5" />Thông tin sự kiện
                                    </p>
                                    <p className={`font-semibold ${text}`}>{pendingSubmitData.eventName}</p>
                                    <p className={`text-sm mt-1 ${sub}`}>
                                        {form.startDate ? formatViDate(form.startDate) : '—'} → {form.endDate ? formatViDate(form.endDate) : '—'}
                                    </p>
                                    {form.isOnline ? (
                                        <p className={`text-sm mt-0.5 ${sub}`}>
                                            Sự kiện trực tuyến: <span className="font-medium text-blue-500">{form.meetLink || '(WebRTC tự động)'}</span>
                                        </p>
                                    ) : (
                                        form.location && (
                                            <p className={`text-sm mt-0.5 ${sub}`}> Địa điểm: {form.location}</p>
                                        )
                                    )}
                                </div>


                                {/* Registration */}
                                {(form.regStart || form.regEnd) && (
                                    <div className={`rounded-lg p-4 ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                                        <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">
                                            <i className="fas fa-user-plus mr-1.5" />Đăng ký
                                        </p>
                                        <p className={`text-sm ${sub}`}>
                                            {form.regStart ? formatViDate(form.regStart) : '—'} → {form.regEnd ? formatViDate(form.regEnd) : '—'}
                                        </p>
                                        {form.maxAttendees && <p className={`text-sm mt-0.5 ${sub}`}>Tối đa {form.maxAttendees} người</p>}
                                    </div>
                                )}

                                {/* Sessions */}
                                {form.sessions.length > 0 && (
                                    <div className={`rounded-lg p-4 ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
                                        <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">
                                            <i className="fas fa-layer-group mr-1.5" />Phiên ({form.sessions.length})
                                        </p>
                                        <div className="space-y-1">
                                            {form.sessions.map(s => (
                                                <div key={s.id} className="flex items-center gap-2">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.id > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                        {s.id > 0 ? 'Cập nhật' : 'Mới'}
                                                    </span>
                                                    <span className={`text-sm ${text}`}>{s.sessionName || '(chưa đặt tên)'}</span>
                                                    {s.startTime && <span className={`text-xs ${sub}`}>{formatViDate(s.startTime)}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Deleted sessions */}
                                {deletedSessionIds.length > 0 && (
                                    <div className={`rounded-lg p-4 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                                            <i className="fas fa-trash mr-1.5" />Xóa {deletedSessionIds.length} phiên
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className={`flex justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <button
                                    onClick={() => setConfirmModal(false)}
                                    disabled={isSaving}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-arrow-left mr-1.5" />Quay lại sửa
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                                >
                                    {isSaving
                                        ? <><i className="fas fa-spinner fa-spin" />Đang lưu...</>
                                        : <><i className="fas fa-check-circle" />Xác nhận lưu</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
                        sessionType: sessionModal.mode === 'edit'
                            ? (form.sessions.find(s => s.id === sessionModal.sessionId)?.sessionType ?? 'main')
                            : 'main',
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
        </>
    );
}
