import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    useGetEventByIdQuery,
    useCreateSessionMutation,
    useOpenRegistrationMutation,
    useRegisterForEventMutation,
    useGetEventAttendeesQuery,
    useGenerateCheckInCodeMutation,
    useCheckInMutation,
    useEvaluateMemberMutation,
    useStartEventMutation,
    useCompleteEventMutation,
} from '~/cores/api';
import { useGetCurrentUserQuery } from '~/cores/api/authApi';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { SessionList } from '~/modules/events/components/SessionList';
import { SessionForm } from '~/modules/events/components/SessionForm';
import { useNotification } from '~/components/Notification';
import { ConfirmDialog } from '~/components/ConfirmDialog';

type Tab = 'sessions' | 'registration' | 'checkin';

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show: showNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<Tab>('sessions');
    const [showSessionForm, setShowSessionForm] = useState(false);

    // open registration form state
    const [regForm, setRegForm] = useState({ startDate: '', endDate: '', maxAttendees: '' });
    const [regError, setRegError] = useState<string | null>(null);
    const [showRegForm, setShowRegForm] = useState(false);

    // register member state
    const [memberUserId, setMemberUserId] = useState('');
    const [memberError, setMemberError] = useState<string | null>(null);
    const [memberSuccess, setMemberSuccess] = useState(false);

    // check-in code state
    const [generatedCode, setGeneratedCode] = useState<{ code: string; expiresAt: string } | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);

    // checkin state
    const [ciUserId, setCiUserId] = useState('');
    const [ciCode, setCiCode] = useState('');
    const [ciError, setCiError] = useState<string | null>(null);
    const [ciSuccess, setCiSuccess] = useState(false);

    // evaluate state
    const [evUserId, setEvUserId] = useState('');
    const [evScore, setEvScore] = useState(100);
    const [evComment, setEvComment] = useState('');
    const [evError, setEvError] = useState<string | null>(null);
    const [evSuccess, setEvSuccess] = useState(false);

    // confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'warning' as 'warning' | 'danger' | 'info', confirmText: 'Xác nhận' });

    const eventId = Number(id);

    const { data: event, isLoading, error } = useGetEventByIdQuery(eventId);
    const { data: currentUser } = useGetCurrentUserQuery();

    const isGlobalAdmin = currentUser?.roles?.includes('Admin');
    const isManager = isGlobalAdmin || currentUser?.clubRoles?.some(
        role => role.clubId === event?.clubId && (role.roleName === 'Manager' || role.roleName === 'Admin')
    );

    const { data: attendees, isLoading: isLoadingAttendees, refetch: refetchAttendees } =
        useGetEventAttendeesQuery(eventId, { skip: activeTab !== 'registration' });

    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [openRegistration, { isLoading: isOpeningReg }] = useOpenRegistrationMutation();
    const [registerForEvent, { isLoading: isRegistering }] = useRegisterForEventMutation();
    const [generateCheckInCode, { isLoading: isGeneratingCode }] = useGenerateCheckInCodeMutation();
    const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
    const [evaluateMember, { isLoading: isEvaluating }] = useEvaluateMemberMutation();
    const [startEvent, { isLoading: isStarting, error: startError }] = useStartEventMutation();
    const [completeEvent, { isLoading: isCompleting, error: completeError }] = useCompleteEventMutation();

    const bg = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const card = isDark ? 'bg-[#242838]' : 'bg-white';
    const text = isDark ? 'text-white' : 'text-gray-900';
    const sub = isDark ? 'text-gray-400' : 'text-gray-500';
    const border = isDark ? 'border-gray-700' : 'border-gray-200';
    const inputCls = isDark
        ? 'bg-[#1a1d2e] border-gray-600 text-white placeholder-gray-500'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            PLANNED: 'bg-blue-100 text-blue-700',
            REGISTRATION_OPEN: 'bg-green-100 text-green-700',
            ONGOING: 'bg-yellow-100 text-yellow-700',
            ENDED: 'bg-gray-100 text-gray-600',
            CANCELED: 'bg-red-100 text-red-700',
            CLOSED: 'bg-gray-100 text-gray-600',
        };
        return map[s] ?? 'bg-gray-100 text-gray-600';
    };

    const fmtDate = (d?: string) => {
        if (!d) return 'Chưa có';
        return new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    // handlers
    const handleCreateSession = async (data: any) => {
        try { await createSession(data).unwrap(); setShowSessionForm(false); }
        catch (e: any) { console.error(e); }
    };

    const handleOpenRegistration = async () => {
        setRegError(null);
        if (!regForm.startDate || !regForm.endDate) {
            setRegError('Vui lòng điền ngày bắt đầu và kết thúc đăng ký');
            return;
        }
        if (new Date(regForm.endDate) <= new Date(regForm.startDate)) {
            setRegError('Ngày kết thúc phải sau ngày bắt đầu');
            return;
        }
        try {
            await openRegistration({
                eventId,
                registrationStartDate: new Date(regForm.startDate).toISOString(),
                registrationEndDate: new Date(regForm.endDate).toISOString(),
                maxAttendees: regForm.maxAttendees ? parseInt(regForm.maxAttendees) : undefined,
            }).unwrap();
            setShowRegForm(false);
            setRegForm({ startDate: '', endDate: '', maxAttendees: '' });
        } catch (e: any) {
            setRegError(e?.data?.error ?? 'Mở đăng ký thất bại');
        }
    };

    const handleRegisterMember = async () => {
        setMemberError(null);
        setMemberSuccess(false);
        if (!memberUserId.trim()) { setMemberError('Nhập User ID'); return; }
        try {
            await registerForEvent(eventId).unwrap();
            setMemberSuccess(true);
            setMemberUserId('');
            refetchAttendees();
        } catch (e: any) {
            setMemberError(e?.data?.error ?? 'Đăng ký thất bại');
        }
    };

    const handleGenerateCode = async () => {
        setCodeError(null);
        try {
            const res = await generateCheckInCode(eventId).unwrap();
            setGeneratedCode({ code: res.code, expiresAt: res.expiresAt });
        } catch (e: any) {
            setCodeError(e?.data?.error ?? 'Không thể tạo mã');
        }
    };

    const handleCheckIn = async () => {
        setCiError(null);
        setCiSuccess(false);
        if (!ciUserId.trim() || !ciCode.trim()) { setCiError('Nhập đủ User ID và mã điểm danh'); return; }
        try {
            await checkIn({ eventId, userId: ciUserId.trim(), code: ciCode.trim().toUpperCase() }).unwrap();
            setCiSuccess(true);
            setCiCode('');
            refetchAttendees();
        } catch (e: any) {
            setCiError(e?.data?.error ?? 'Điểm danh thất bại');
        }
    };

    const handleEvaluate = async () => {
        setEvError(null);
        setEvSuccess(false);
        if (!evUserId.trim()) { setEvError('Nhập User ID'); return; }
        try {
            await evaluateMember({ eventId, userId: evUserId.trim(), score: evScore, comment: evComment }).unwrap();
            setEvSuccess(true);
            setEvUserId('');
            setEvComment('');
            refetchAttendees();
        } catch (e: any) {
            setEvError(e?.data?.error ?? 'Đánh giá thất bại');
        }
    };

    const handleStartEvent = async () => {
        setConfirmConfig({
            title: 'Bắt đầu sự kiện',
            message: 'Bạn có chắc muốn bắt đầu sự kiện này? Hệ thống sẽ tự động tạo mã check-in.',
            type: 'info',
            confirmText: 'Bắt đầu',
        });
        setConfirmAction(() => async () => {
            try {
                const res = await startEvent(eventId).unwrap();
                setGeneratedCode({ code: res.checkInCode, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() });
                setActiveTab('checkin');
                showNotification({ type: 'success', title: 'Thành công', message: 'Sự kiện đã bắt đầu thành công!' });
            } catch (e: any) {
                showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Có lỗi khi bắt đầu sự kiện.' });
            } finally {
                setConfirmOpen(false);
            }
        });
        setConfirmOpen(true);
    };

    const handleCompleteEvent = async () => {
        setConfirmConfig({
            title: 'Kết thúc sự kiện',
            message: 'Chốt kết thúc sự kiện? Những thành viên chưa check-in sẽ bị đánh vắng mặt!',
            type: 'danger',
            confirmText: 'Kết thúc',
        });
        setConfirmAction(() => async () => {
            try {
                await completeEvent(eventId).unwrap();
                refetchAttendees();
                showNotification({ type: 'success', title: 'Thành công', message: 'Sự kiện đã kết thúc!' });
            } catch (e: any) {
                showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Có lỗi khi kết thúc sự kiện.' });
            } finally {
                setConfirmOpen(false);
            }
        });
        setConfirmOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar title="Chi tiết sự kiện" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bg} min-h-screen`}>
                    <div className="animate-pulse max-w-5xl mx-auto space-y-4">
                        <div className="h-56 bg-gray-300 rounded-xl" />
                        <div className="h-32 bg-gray-200 rounded-xl" />
                    </div>
                </main>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar title="Chi tiết sự kiện" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bg} min-h-screen`}>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xl mx-auto">
                        <p className="text-red-700 font-medium">Không tìm thấy sự kiện.</p>
                    </div>
                </main>
            </div>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'sessions', label: 'Sessions' },
        { key: 'registration', label: 'Đăng ký' },
        { key: 'checkin', label: 'Điểm danh' },
    ];

    return (
        <div className="min-h-screen">
            <ApiStatusButton
                apiStatuses={[{ name: 'Event', isLoading }]}
                isDark={isDark}
                onThemeToggle={toggleTheme}
                position="bottom-right"
            />
            <Sidebar currentPath="/events" isOpen={isSidebarOpen} />
            <HeaderBar
                title="Chi tiết sự kiện"
                breadcrumb={`Events / ${event.eventName}`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bg} min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-5xl mx-auto space-y-5">
                    {/* back */}
                    <button onClick={() => navigate('/events')}
                        className={`flex items-center gap-2 text-sm ${sub} hover:${text} transition-colors`}>
                        <i className="fas fa-arrow-left" /> Quay lại danh sách
                    </button>

                    {/* header card */}
                    <div className={`${card} rounded-xl shadow-sm overflow-hidden`}>
                        {event.imageUrl && event.imageUrl !== 'string' && (
                            <img src={event.imageUrl} alt={event.eventName}
                                className="w-full h-52 object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <h1 className={`text-2xl font-bold ${text} mb-2`}>{event.eventName}</h1>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(event.status)}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {isManager && (
                                        <>
                                            <button onClick={() => navigate(`/events/${event.eventId}/edit`)}
                                                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                                Chỉnh sửa
                                            </button>
                                            {event.status === 'PLANNED' && (
                                                <button onClick={() => { setShowRegForm(true); setActiveTab('registration'); }}
                                                    className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                                    Mở đăng ký
                                                </button>
                                            )}
                                            {event.status === 'REGISTRATION_OPEN' && (
                                                <button onClick={handleStartEvent} disabled={isStarting}
                                                    className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">
                                                    {isStarting ? 'Đang bật...' : 'Bắt đầu sự kiện'}
                                                </button>
                                            )}
                                            {event.status === 'ONGOING' && (
                                                <button onClick={handleCompleteEvent} disabled={isCompleting}
                                                    className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors">
                                                    {isCompleting ? 'Đang chốt...' : 'Kết thúc sự kiện'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className={`mt-3 text-sm ${sub}`}>{event.description}</p>

                            <div className={`mt-4 pt-4 border-t ${border} grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm`}>
                                <div>
                                    <span className={sub}>Địa điểm</span>
                                    <p className={`${text} font-medium mt-0.5`}>{event.location || '—'}</p>
                                </div>
                                <div>
                                    <span className={sub}>Bắt đầu</span>
                                    <p className={`${text} font-medium mt-0.5`}>{fmtDate(event.startDate)}</p>
                                </div>
                                <div>
                                    <span className={sub}>Kết thúc</span>
                                    <p className={`${text} font-medium mt-0.5`}>{fmtDate(event.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* tabs */}
                    <div className={`${card} rounded-xl shadow-sm overflow-hidden`}>
                        <div className={`flex border-b ${border}`}>
                            {tabs.map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key
                                        ? 'border-blue-500 text-blue-600'
                                        : `border-transparent ${sub} hover:text-blue-500`}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">

                            {/* ── SESSIONS ── */}
                            {activeTab === 'sessions' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className={`font-semibold ${text}`}>
                                            Sessions ({event.sessions?.length ?? 0})
                                        </h2>
                                        {isManager && (
                                            <button onClick={() => setShowSessionForm(v => !v)}
                                                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                                                {showSessionForm ? 'Hủy' : 'Thêm session'}
                                            </button>
                                        )}
                                    </div>
                                    {showSessionForm && isManager && (
                                        <div className={`mb-4 p-4 border ${border} rounded-lg`}>
                                            <SessionForm eventId={event.eventId}
                                                onSubmit={handleCreateSession}
                                                onCancel={() => setShowSessionForm(false)}
                                                isLoading={isCreatingSession}
                                                isDark={isDark} />
                                        </div>
                                    )}
                                    <SessionList sessions={event.sessions ?? []} isDark={isDark} />
                                </div>
                            )}

                            {/* ── REGISTRATION ── */}
                            {activeTab === 'registration' && (
                                <div className="space-y-6">

                                    {/* Registration management */}
                                    {isManager && (
                                        <div className={`p-4 rounded-lg border ${border}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className={`font-semibold ${text}`}>Quản lý đăng ký</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(event.status)}`}>
                                                    {event.status}
                                                </span>
                                            </div>

                                            {/* Current registration info when REGISTRATION_OPEN */}
                                            {event.status === 'REGISTRATION_OPEN' && !showRegForm && (
                                                <div className="space-y-3">
                                                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                                                        <div>
                                                            <p className={`text-xs ${sub}`}>Bắt đầu đăng ký</p>
                                                            <p className={`text-sm font-medium ${text}`}>
                                                                {event.registrationStartDate ? fmtDate(event.registrationStartDate) : 'Chưa đặt'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs ${sub}`}>Kết thúc đăng ký</p>
                                                            <p className={`text-sm font-medium ${text}`}>
                                                                {event.registrationEndDate ? fmtDate(event.registrationEndDate) : 'Chưa đặt'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs ${sub}`}>Số lượng tối đa</p>
                                                            <p className={`text-sm font-medium ${text}`}>
                                                                {event.maxAttendees ? `${event.currentAttendees}/${event.maxAttendees}` : 'Không giới hạn'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => {
                                                        setShowRegForm(true);
                                                        // Pre-fill with current values
                                                        setRegForm({
                                                            startDate: event.registrationStartDate ? new Date(event.registrationStartDate).toISOString().slice(0, 16) : '',
                                                            endDate: event.registrationEndDate ? new Date(event.registrationEndDate).toISOString().slice(0, 16) : '',
                                                            maxAttendees: event.maxAttendees?.toString() ?? '',
                                                        });
                                                    }}
                                                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                                        Chỉnh sửa thời gian đăng ký
                                                    </button>
                                                </div>
                                            )}

                                            {/* Non-editable states */}
                                            {event.status !== 'PLANNED' && event.status !== 'REGISTRATION_OPEN' && (
                                                <p className={`text-sm ${sub}`}>
                                                    Không thể chỉnh sửa đăng ký khi event ở trạng thái {event.status}.
                                                </p>
                                            )}

                                            {/* Open registration form (PLANNED) or Edit form (REGISTRATION_OPEN) */}
                                            {(event.status === 'PLANNED' && !showRegForm) && (
                                                <button onClick={() => setShowRegForm(true)}
                                                    className="mt-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                                    Mở đăng ký sự kiện
                                                </button>
                                            )}

                                            {showRegForm && (event.status === 'PLANNED' || event.status === 'REGISTRATION_OPEN') && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={`block text-xs mb-1 ${sub}`}>
                                                                Ngày bắt đầu đăng ký <span className="text-red-500">*</span>
                                                            </label>
                                                            <input type="datetime-local"
                                                                value={regForm.startDate}
                                                                onChange={e => setRegForm(f => ({ ...f, startDate: e.target.value }))}
                                                                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs mb-1 ${sub}`}>
                                                                Ngày kết thúc đăng ký <span className="text-red-500">*</span>
                                                            </label>
                                                            <input type="datetime-local"
                                                                value={regForm.endDate}
                                                                onChange={e => setRegForm(f => ({ ...f, endDate: e.target.value }))}
                                                                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                        </div>
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <label className={`block text-xs mb-1 ${sub}`}>
                                                            Số lượng tối đa (để trống = không giới hạn)
                                                        </label>
                                                        <input type="number" min={1}
                                                            value={regForm.maxAttendees}
                                                            onChange={e => setRegForm(f => ({ ...f, maxAttendees: e.target.value }))}
                                                            placeholder="Không giới hạn"
                                                            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                    </div>
                                                    {regError && (
                                                        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
                                                            {regError}
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={handleOpenRegistration} disabled={isOpeningReg}
                                                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                                                            {isOpeningReg ? 'Đang xử lý...'
                                                                : event.status === 'REGISTRATION_OPEN' ? 'Cập nhật thời gian' : 'Xác nhận mở đăng ký'}
                                                        </button>
                                                        <button onClick={() => { setShowRegForm(false); setRegError(null); }}
                                                            className={`px-4 py-2 text-sm border ${border} rounded-lg ${sub} hover:opacity-80 transition-colors`}>
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* attendee table */}
                                    <div>
                                        <h3 className={`font-semibold mb-3 ${text}`}>
                                            Danh sách đăng ký {attendees ? `(${attendees.length})` : ''}
                                        </h3>
                                        {isLoadingAttendees ? (
                                            <div className="animate-pulse space-y-2">
                                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 rounded" />)}
                                            </div>
                                        ) : !attendees?.length ? (
                                            <p className={`text-sm ${sub}`}>Chưa có ai đăng ký.</p>
                                        ) : (
                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <table className="w-full text-sm">
                                                    <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                        <tr>
                                                            {['Họ tên', 'MSSV', 'Ngày đăng ký', 'Trạng thái', 'Check-in', 'Điểm'].map(h => (
                                                                <th key={h} className={`px-3 py-2 text-left text-xs font-semibold ${sub}`}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {attendees.map(a => (
                                                            <tr key={a.attendId} className={`border-t ${border} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                                                <td className={`px-3 py-2.5 font-medium ${text}`}>{a.memberName}</td>
                                                                <td className={`px-3 py-2.5 ${sub}`}>{a.studentId || '—'}</td>
                                                                <td className={`px-3 py-2.5 ${sub}`}>{new Date(a.registrationDate).toLocaleDateString('vi-VN')}</td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.attendanceStatus === 'PRESENT'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : a.attendanceStatus === 'CANCELLED'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-yellow-100 text-yellow-700'}`}>
                                                                        {a.attendanceStatus}
                                                                    </span>
                                                                </td>
                                                                <td className={`px-3 py-2.5 ${sub}`}>
                                                                    {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                                                                </td>
                                                                <td className={`px-3 py-2.5 font-semibold ${a.score != null ? 'text-blue-500' : sub}`}>
                                                                    {a.score != null ? `${a.score}/100` : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* evaluate */}
                                    {isManager && !!attendees?.some(a => a.attendanceStatus === 'PRESENT') && (
                                        <div className={`p-4 rounded-lg border ${border}`}>
                                            <h3 className={`font-semibold mb-3 ${text}`}>Đánh giá thành viên</h3>
                                            <div className="flex flex-wrap gap-2 items-end">
                                                <div className="flex-1 min-w-40">
                                                    <label className={`block text-xs mb-1 ${sub}`}>User ID</label>
                                                    <input type="text" value={evUserId}
                                                        onChange={e => { setEvUserId(e.target.value); setEvError(null); setEvSuccess(false); }}
                                                        placeholder="User ID..."
                                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                </div>
                                                <div className="w-20">
                                                    <label className={`block text-xs mb-1 ${sub}`}>Điểm</label>
                                                    <input type="number" min={0} max={100} value={evScore}
                                                        onChange={e => setEvScore(Number(e.target.value))}
                                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                </div>
                                                <div className="flex-1 min-w-40">
                                                    <label className={`block text-xs mb-1 ${sub}`}>Nhận xét</label>
                                                    <input type="text" value={evComment}
                                                        onChange={e => setEvComment(e.target.value)}
                                                        placeholder="Nhận xét..."
                                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                                </div>
                                                <button onClick={handleEvaluate} disabled={isEvaluating}
                                                    className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">
                                                    {isEvaluating ? '...' : 'Đánh giá'}
                                                </button>
                                            </div>
                                            {evError && <p className="text-sm text-red-500 mt-2">{evError}</p>}
                                            {evSuccess && <p className="text-sm text-green-600 mt-2 font-medium">Đánh giá thành công!</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── CHECKIN ── */}
                            {activeTab === 'checkin' && (
                                <div className="space-y-5">
                                    {/* generate code */}
                                    {isManager && (
                                        <div className={`p-4 rounded-lg border ${border}`}>
                                            <h3 className={`font-semibold mb-1 ${text}`}>Tạo mã điểm danh</h3>
                                            <p className={`text-xs mb-3 ${sub}`}>Mã có hiệu lực 15 phút. Chia sẻ cho thành viên để điểm danh.</p>
                                            <button onClick={handleGenerateCode} disabled={isGeneratingCode}
                                                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
                                                {isGeneratingCode ? 'Đang tạo...' : 'Tạo mã mới'}
                                            </button>
                                            {codeError && <p className="text-sm text-red-500 mt-2">{codeError}</p>}
                                            {generatedCode && (
                                                <div className="mt-4">
                                                    <div className="inline-block bg-orange-50 border-2 border-orange-300 rounded-xl px-8 py-4 text-center">
                                                        <p className="text-4xl font-black tracking-widest text-orange-600 font-mono">
                                                            {generatedCode.code}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${sub}`}>
                                                            Hết hạn lúc {new Date(generatedCode.expiresAt).toLocaleTimeString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* user check-in */}
                                    <div className={`p-4 rounded-lg border ${border}`}>
                                        <h3 className={`font-semibold mb-3 ${text}`}>Điểm danh thành viên</h3>
                                        <div className="space-y-2 max-w-md">
                                            <div>
                                                <label className={`block text-xs mb-1 ${sub}`}>User ID</label>
                                                <input type="text" value={ciUserId}
                                                    onChange={e => { setCiUserId(e.target.value); setCiError(null); setCiSuccess(false); }}
                                                    placeholder="User ID (GUID)..."
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`} />
                                            </div>
                                            <div>
                                                <label className={`block text-xs mb-1 ${sub}`}>Mã điểm danh</label>
                                                <input type="text" value={ciCode} maxLength={6}
                                                    onChange={e => { setCiCode(e.target.value); setCiError(null); setCiSuccess(false); }}
                                                    placeholder="Ví dụ: AB12CD"
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none font-mono uppercase tracking-widest ${inputCls}`} />
                                            </div>
                                            <button onClick={handleCheckIn} disabled={isCheckingIn}
                                                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                                                {isCheckingIn ? 'Đang xử lý...' : 'Điểm danh'}
                                            </button>
                                            {ciError && <p className="text-sm text-red-500">{ciError}</p>}
                                            {ciSuccess && <p className="text-sm text-green-600 font-medium">Điểm danh thành công!</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main >

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                confirmText={confirmConfig.confirmText}
                onConfirm={() => confirmAction?.()}
                onCancel={() => setConfirmOpen(false)}
            />
        </div >
    );
}
