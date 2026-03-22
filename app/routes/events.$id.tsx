import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    useGetEventByIdQuery,
    useCreateSessionMutation,
    useOpenRegistrationMutation,
    useRegisterForEventMutation,
    useGetEventAttendeesQuery,
    useGenerateCheckInCodeMutation,
    useStartEventMutation,
    useCompleteEventMutation,
    useGetMyCheckInQrQuery,
    useCheckInByQrMutation,
    useApproveRegistrationMutation,
    useRejectRegistrationMutation,
    useBulkApproveRegistrationsMutation,
    useCancelRegistrationMutation,
} from '~/cores/api';
import { useGetCurrentUserQuery } from '~/cores/api/authApi';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';
import { SessionList } from '~/modules/events/components/SessionList';
import { SessionForm } from '~/modules/events/components/SessionForm';
import { useNotification } from '~/components/Notification';
import { ConfirmDialog } from '~/components/ConfirmDialog';
import { QRScanner } from '~/components/QRScanner';
import { QRCodeSVG } from 'qrcode.react';

type Tab = 'sessions' | 'registration' | 'checkin' | 'pending';


export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show: showNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<Tab>('sessions');
    const [showSessionForm, setShowSessionForm] = useState(false);

    // Registration deadline countdown
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // open registration form state
    const [regForm, setRegForm] = useState({ startDate: '', endDate: '', maxAttendees: '' });
    const [regError, setRegError] = useState<string | null>(null);
    const [showRegForm, setShowRegForm] = useState(false);

    // register member state
    const [memberUserId, setMemberUserId] = useState('');
    const [memberError, setMemberError] = useState<string | null>(null);
    const [memberSuccess, setMemberSuccess] = useState(false);

    // check-in code state (Manager generates code to display)
    const [generatedCode, setGeneratedCode] = useState<{ code: string; expiresAt: string } | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);

    // QR check-in (organizer scans → paste token)
    const [qrToken, setQrToken] = useState('');
    const [qrError, setQrError] = useState<string | null>(null);
    const [qrSuccess, setQrSuccess] = useState<string | null>(null);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const qrScanCooldownRef = useRef<{ token: string; until: number } | null>(null);

    // confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'warning' as 'warning' | 'danger' | 'info', confirmText: 'Xác nhận' });

    const eventId = Number(id);

    const { data: event, isLoading, error } = useGetEventByIdQuery(eventId);
    const { user: currentUser, isAdmin: isGlobalAdmin } = useCurrentUser();
    const { memberships } = useClubRole();

    const isManager = isGlobalAdmin || memberships.some(
        role => role.clubId === event?.clubId && ['Club Manager', 'ClubManager', 'Manager', 'Admin'].includes(role.roleName || '')
    );

    const { data: attendees, isLoading: isLoadingAttendees, refetch: refetchAttendees } =
        useGetEventAttendeesQuery(
            { clubId: event?.clubId ?? 0, eventId },
            { skip: (activeTab !== 'registration' && activeTab !== 'pending') || !event?.clubId }
        );

    const { data: myCheckInQr, isLoading: isLoadingMyQr } = useGetMyCheckInQrQuery(eventId, {
        skip: !currentUser || event?.status !== 'ONGOING',
    });

    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [openRegistration, { isLoading: isOpeningReg }] = useOpenRegistrationMutation();
    const [registerForEvent, { isLoading: isRegistering }] = useRegisterForEventMutation();
    const [approveRegistration, { isLoading: isApproving }] = useApproveRegistrationMutation();
    const [rejectRegistration, { isLoading: isRejecting }] = useRejectRegistrationMutation();
    const [bulkApproveRegistrations, { isLoading: isBulkApproving }] = useBulkApproveRegistrationsMutation();
    const [cancelRegistration, { isLoading: isCancelling }] = useCancelRegistrationMutation();
    const [generateCheckInCode, { isLoading: isGeneratingCode }] = useGenerateCheckInCodeMutation();
    const [checkInByQr, { isLoading: isCheckingInByQr }] = useCheckInByQrMutation();
    const [startEvent, { isLoading: isStarting, error: startError }] = useStartEventMutation();
    const [completeEvent, { isLoading: isCompleting, error: completeError }] = useCompleteEventMutation();

    // State cho panel Chờ duyệt
    const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

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
            REGISTRATION_CLOSED: 'bg-gray-200 text-gray-600',
            ONGOING: 'bg-yellow-100 text-yellow-700',
            ENDED: 'bg-gray-100 text-gray-600',
            CANCELED: 'bg-red-100 text-red-700',
            CLOSED: 'bg-gray-100 text-gray-600',
        };
        return map[s] ?? 'bg-gray-100 text-gray-600';
    };

    const attendanceStatusBadge = (s: string) => {
        const map: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-700',
            WAITLIST: 'bg-purple-100 text-purple-700',
            REGISTERED: 'bg-blue-100 text-blue-700',
            PRESENT: 'bg-green-100 text-green-700',
            ABSENT: 'bg-red-100 text-red-700',
            CANCELLED: 'bg-gray-100 text-gray-500',
        };
        return map[s] ?? 'bg-gray-100 text-gray-600';
    };

    const fmtDate = (d?: string) => {
        if (!d) return 'Chưa có';
        return new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    // --- Registration deadline helpers (client-side live check) ---
    const regDeadline = event?.registrationEndDate ? new Date(event.registrationEndDate).getTime() : null;
    const regStart = event?.registrationStartDate ? new Date(event.registrationStartDate).getTime() : null;
    const isRegDeadlinePassed = regDeadline !== null && now >= regDeadline;
    const isRegNotStarted = regStart !== null && now < regStart;
    // Registration is truly open only if: backend status AND within the time window
    const isRegOpen = event?.status === 'REGISTRATION_OPEN' && !isRegDeadlinePassed && !isRegNotStarted;

    const fmtCountdown = (targetMs: number): string => {
        const diff = Math.max(0, targetMs - now);
        const totalSec = Math.floor(diff / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) return `${h} giờ ${String(m).padStart(2, '0')} phút ${String(s).padStart(2, '0')} giây`;
        if (m > 0) return `${m} phút ${String(s).padStart(2, '0')} giây`;
        return `${s} giây`;
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
                clubId: event?.clubId ?? 0,
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
        try {
            await registerForEvent(eventId).unwrap();
            setMemberSuccess(true);
            refetchAttendees();
        } catch (e: any) {
            setMemberError(e?.data?.error ?? 'Đăng ký thất bại');
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await approveRegistration({ eventId, clubId: event?.clubId ?? 0, userId }).unwrap();
            showNotification({ type: 'success', title: 'Thành công', message: 'Đã duyệt đăng ký.' });
            refetchAttendees();
        } catch (e: any) {
            showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Không thể duyệt.' });
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await rejectRegistration({ eventId, clubId: event?.clubId ?? 0, userId }).unwrap();
            showNotification({ type: 'success', title: 'Đã từ chối', message: 'Đã từ chối đăng ký.' });
            refetchAttendees();
        } catch (e: any) {
            showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Không thể từ chối.' });
        }
    };

    const handleBulkApprove = async () => {
        if (selectedPendingIds.length === 0) return;
        try {
            const result = await bulkApproveRegistrations({
                eventId,
                clubId: event?.clubId ?? 0,
                userIds: selectedPendingIds,
            }).unwrap();
            showNotification({ type: 'success', title: 'Duyệt hàng loạt', message: result.message });
            setSelectedPendingIds([]);
            refetchAttendees();
        } catch (e: any) {
            showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Không thể duyệt hàng loạt.' });
        }
    };

    const handleCancelRegistration = async () => {
        try {
            await cancelRegistration(eventId).unwrap();
            showNotification({ type: 'success', title: 'Đã huỷ', message: 'Đã huỷ đăng ký tham gia sự kiện.' });
            refetchAttendees();
        } catch (e: any) {
            showNotification({ type: 'error', title: 'Lỗi', message: e?.data?.error ?? 'Không thể huỷ đăng ký.' });
        }
    };

    const handleGenerateCode = async () => {
        setCodeError(null);
        try {
            const res = await generateCheckInCode({ clubId: event?.clubId ?? 0, eventId }).unwrap();
            setGeneratedCode({ code: res.code, expiresAt: res.expiresAt });
        } catch (e: any) {
            setCodeError(e?.data?.error ?? 'Không thể tạo mã');
        }
    };

    const handleCheckInByQr = async (token?: string) => {
        let t = (token ?? qrToken).trim().replace(/\r?\n/g, '').replace(/\s+/g, ' ');
        const tokenMatch = t.match(/[?&]token=([^&]+)/);
        if (tokenMatch) t = decodeURIComponent(tokenMatch[1]);
        if (!t) {
            setQrError('Dán mã đã quét từ QR của người tham gia.');
            setQrSuccess(null);
            return;
        }
        // Tránh quét trùng: sau khi điểm danh thành công, bỏ qua cùng token trong 3 giây (scanner hay gọi onScan nhiều lần)
        const now = Date.now();
        const cooldown = qrScanCooldownRef.current;
        if (cooldown && cooldown.token === t && now < cooldown.until) return;

        setQrError(null);
        setQrSuccess(null);
        try {
            const res = await checkInByQr({ eventId, clubId: event?.clubId ?? 0, token: t }).unwrap();
            const msg = res.memberName ? `Đã điểm danh: ${res.memberName}` : 'Điểm danh thành công.';
            setQrSuccess(msg);
            setQrError(null);
            qrScanCooldownRef.current = { token: t, until: now + 3000 };
            if (!token) setQrToken('');
            refetchAttendees();
            showNotification({ type: 'success', title: 'Điểm danh', message: msg });
        } catch (e: any) {
            const errMsg = e?.data?.error ?? 'Mã QR không hợp lệ hoặc đã hết hạn.';
            setQrError(errMsg);
            setQrSuccess(null);
            showNotification({ type: 'error', title: 'Lỗi điểm danh', message: errMsg });
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
                const res = await startEvent({ clubId: event?.clubId ?? 0, eventId }).unwrap();
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
                await completeEvent({ clubId: event?.clubId ?? 0, eventId }).unwrap();
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

    const pendingCount = attendees?.filter(a => a.attendanceStatus === 'PENDING').length ?? 0;

    const tabs: { key: Tab; label: React.ReactNode }[] = [
        { key: 'sessions', label: 'Lịch trình' },
        { key: 'registration', label: 'Đăng ký' },
        ...(isManager && event.requiresApproval ? [{
            key: 'pending' as Tab,
            label: (
                <span className="flex items-center gap-1.5">
                    Chờ duyệt
                    {pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </span>
            ),
        }] : []),
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
                                        clubId={event.clubId ?? 0}
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

                                        {/* Countdown / deadline banner */}
                                        {event.status === 'REGISTRATION_OPEN' && regDeadline && (
                                            <div className={`mb-4 px-4 py-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${isRegDeadlinePassed
                                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                                : isRegNotStarted
                                                    ? 'bg-amber-50 border-amber-200'
                                                    : (regDeadline - now) < 30 * 60 * 1000
                                                        ? 'bg-orange-50 border-orange-200'
                                                        : 'bg-green-50 border-green-200'
                                                }`}>
                                                {isRegDeadlinePassed ? (
                                                    <span className="text-sm font-medium text-red-600">
                                                        ⏰ Đã hết thời gian đăng ký (kết thúc lúc {fmtDate(event.registrationEndDate)})
                                                    </span>
                                                ) : isRegNotStarted ? (
                                                    <>
                                                        <span className="text-sm font-medium text-amber-700">
                                                            ⏳ Chưa bắt đầu đăng ký — mở lúc {fmtDate(event.registrationStartDate)}
                                                        </span>
                                                        <span className="text-sm font-mono font-bold text-amber-700">
                                                            Còn {fmtCountdown(regStart!)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`text-sm font-medium ${(regDeadline - now) < 30 * 60 * 1000 ? 'text-orange-600' : 'text-green-700'
                                                            }`}>
                                                            🟢 Đăng ký đang mở — đóng lúc {fmtDate(event.registrationEndDate)}
                                                        </span>
                                                        <span className={`text-sm font-mono font-bold ${(regDeadline - now) < 30 * 60 * 1000 ? 'text-orange-600' : 'text-green-700'
                                                            }`}>
                                                            Còn {fmtCountdown(regDeadline)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Self-register / self-cancel section for non-managers */}
                                        {currentUser && !isManager && (
                                            <div className={`mb-4 p-3 rounded-lg border ${border} flex flex-wrap items-center justify-between gap-3`}>
                                                {(() => {
                                                    const myRow = attendees?.find(a => a.userId === currentUser?.userId);
                                                    if (!myRow) {
                                                        if (isRegOpen) {
                                                            return (
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-sm ${sub}`}>Bạn chưa đăng ký sự kiện này.</span>
                                                                    <button
                                                                        onClick={handleRegisterMember}
                                                                        disabled={isRegistering}
                                                                        className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        {isRegistering ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        if (isRegDeadlinePassed && event.status === 'REGISTRATION_OPEN') {
                                                            return <span className="text-sm text-red-500 font-medium">Đã hết hạn đăng ký.</span>;
                                                        }
                                                        return null;
                                                    }
                                                    if (myRow.attendanceStatus === 'CANCELLED') {
                                                        return <span className={`text-sm ${sub}`}>Bạn đã huỷ đăng ký.</span>;
                                                    }
                                                    if (myRow.attendanceStatus === 'PENDING') {
                                                        return <span className="text-sm text-amber-600 font-medium">Đăng ký của bạn đang chờ duyệt.</span>;
                                                    }
                                                    if (myRow.attendanceStatus === 'WAITLIST') {
                                                        return <span className="text-sm text-purple-600 font-medium">Bạn đang trong danh sách chờ.</span>;
                                                    }
                                                    return (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-green-600 font-medium">Bạn đã đăng ký ({myRow.attendanceStatus}).</span>
                                                            {['PENDING', 'REGISTERED', 'WAITLIST'].includes(myRow.attendanceStatus) && (
                                                                <button
                                                                    onClick={handleCancelRegistration}
                                                                    disabled={isCancelling}
                                                                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                                >
                                                                    {isCancelling ? 'Đang huỷ...' : 'Huỷ đăng ký'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

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
                                                            {['Họ tên', 'MSSV', 'Ngày đăng ký', 'Trạng thái', 'Check-in', 'Điểm', ...(isManager ? ['Hành động'] : [])].map(h => (
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
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${attendanceStatusBadge(a.attendanceStatus)}`}>
                                                                        {a.attendanceStatus}
                                                                    </span>
                                                                </td>
                                                                <td className={`px-3 py-2.5 ${sub}`}>
                                                                    {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                                                                </td>
                                                                <td className={`px-3 py-2.5 font-semibold ${a.score != null ? 'text-blue-500' : sub}`}>
                                                                    {a.score != null ? `${a.score}/100` : '—'}
                                                                </td>
                                                                {isManager && (
                                                                    <td className="px-3 py-2.5">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {a.attendanceStatus === 'PENDING' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleApprove(a.userId)}
                                                                                        disabled={isApproving}
                                                                                        className="px-2.5 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                                                                                    >
                                                                                        Duyệt
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleReject(a.userId)}
                                                                                        disabled={isRejecting}
                                                                                        className="px-2.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                                                                                    >
                                                                                        Từ chối
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {a.attendanceStatus === 'WAITLIST' && (
                                                                                <button
                                                                                    onClick={() => handleApprove(a.userId)}
                                                                                    disabled={isApproving}
                                                                                    className="px-2.5 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                                                                >
                                                                                    Thêm vào
                                                                                </button>
                                                                            )}
                                                                            {['PENDING', 'REGISTERED', 'WAITLIST'].includes(a.attendanceStatus) && (
                                                                                <button
                                                                                    onClick={() => handleReject(a.userId)}
                                                                                    disabled={isRejecting}
                                                                                    title="Huỷ đăng ký của thành viên này"
                                                                                    className={`px-2.5 py-1 text-xs border ${border} ${sub} rounded hover:opacity-70 transition-colors ${a.attendanceStatus === 'PENDING' ? 'hidden' : ''}`}
                                                                                >
                                                                                    Huỷ
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}

                            {/* ── PENDING APPROVALS ── */}
                            {activeTab === 'pending' && isManager && (
                                <div className="space-y-4">
                                    {/* Header + bulk action */}
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <h3 className={`font-semibold ${text}`}>
                                                <i className="fas fa-user-clock mr-2 text-amber-500" />
                                                Chờ duyệt đăng ký
                                            </h3>
                                            <p className={`text-xs mt-0.5 ${sub}`}>
                                                {pendingCount > 0
                                                    ? `${pendingCount} đơn đang chờ duyệt`
                                                    : 'Không có đơn nào đang chờ duyệt'}
                                            </p>
                                        </div>
                                        {selectedPendingIds.length > 0 && (
                                            <button
                                                onClick={handleBulkApprove}
                                                disabled={isBulkApproving}
                                                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                                            >
                                                {isBulkApproving
                                                    ? <><i className="fas fa-spinner fa-spin" /> Đang duyệt...</>
                                                    : <><i className="fas fa-check-double" /> Duyệt {selectedPendingIds.length} đã chọn</>}
                                            </button>
                                        )}
                                    </div>

                                    {isLoadingAttendees && (
                                        <div className="flex justify-center py-8">
                                            <i className={`fas fa-spinner fa-spin text-2xl ${sub}`} />
                                        </div>
                                    )}

                                    {!isLoadingAttendees && pendingCount === 0 && (
                                        <div className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                            <i className={`fas fa-check-circle text-3xl mb-3 text-green-400`} />
                                            <p className={`${sub} text-sm`}>Không có đơn chờ duyệt</p>
                                        </div>
                                    )}

                                    {!isLoadingAttendees && pendingCount > 0 && (() => {
                                        const pendingList = attendees?.filter(a => a.attendanceStatus === 'PENDING') ?? [];
                                        const allSelected = pendingList.length > 0 && selectedPendingIds.length === pendingList.length;
                                        const toggleAll = () => {
                                            if (allSelected) setSelectedPendingIds([]);
                                            else setSelectedPendingIds(pendingList.map(a => a.userId));
                                        };
                                        const toggleOne = (uid: string) => {
                                            setSelectedPendingIds(prev =>
                                                prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
                                            );
                                        };
                                        return (
                                            <div className={`rounded-xl border ${border} overflow-hidden`}>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                                            <th className="px-3 py-2.5 w-10">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allSelected}
                                                                    onChange={toggleAll}
                                                                    className="w-4 h-4 rounded text-blue-500"
                                                                />
                                                            </th>
                                                            <th className={`px-3 py-2.5 text-left font-medium ${sub}`}>Thành viên</th>
                                                            <th className={`px-3 py-2.5 text-left font-medium ${sub}`}>MSSV</th>
                                                            <th className={`px-3 py-2.5 text-left font-medium ${sub}`}>Đăng ký lúc</th>
                                                            <th className={`px-3 py-2.5 text-left font-medium ${sub}`}>Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pendingList.map(a => (
                                                            <tr key={a.attendId} className={`border-t ${border} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                                                                <td className="px-3 py-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedPendingIds.includes(a.userId)}
                                                                        onChange={() => toggleOne(a.userId)}
                                                                        className="w-4 h-4 rounded text-blue-500"
                                                                    />
                                                                </td>
                                                                <td className={`px-3 py-3 font-medium ${text}`}>{a.memberName}</td>
                                                                <td className={`px-3 py-3 ${sub}`}>{a.studentId || '—'}</td>
                                                                <td className={`px-3 py-3 ${sub}`}>
                                                                    {new Date(a.registrationDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td className="px-3 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleApprove(a.userId)}
                                                                            disabled={isApproving}
                                                                            className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                                                                        >
                                                                            <i className="fas fa-check mr-1" />Duyệt
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleReject(a.userId)}
                                                                            disabled={isRejecting}
                                                                            className="px-3 py-1 text-xs font-semibold border border-red-300 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                                                        >
                                                                            <i className="fas fa-times mr-1" />Từ chối
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()}
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

                                    {/* Participant: Mã QR điểm danh của tôi (để BTC quét) */}
                                    {currentUser && event?.status === 'ONGOING' && (
                                        <div className={`p-4 rounded-lg border ${border}`}>
                                            <h3 className={`font-semibold mb-2 ${text}`}>Mã QR điểm danh của tôi</h3>
                                            <p className={`text-xs mb-3 ${sub}`}>
                                                Mã QR cũng đã được gửi qua email khi bạn đăng ký. Bạn có thể dùng mã trên màn hình này hoặc trong email — đưa cho ban tổ chức quét để điểm danh.
                                            </p>
                                            {isLoadingMyQr ? (
                                                <div className="animate-pulse h-48 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                                            ) : (myCheckInQr?.token ?? myCheckInQr?.qrContent) ? (
                                                <div className="flex flex-col items-start gap-2">
                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-2 bg-white inline-block">
                                                        <QRCodeSVG
                                                            value={myCheckInQr.token ?? myCheckInQr.qrContent ?? ''}
                                                            size={200}
                                                            level="M"
                                                            bgColor="#ffffff"
                                                            fgColor="#000000"
                                                            title="QR điểm danh"
                                                        />
                                                    </div>
                                                    {myCheckInQr.expiresAt && (
                                                        <p className={`text-xs ${sub}`}>
                                                            Hết hạn lúc {new Date(myCheckInQr.expiresAt).toLocaleTimeString('vi-VN')}
                                                        </p>
                                                    )}
                                                    {/* Dev: copy token để test điểm danh QR khi không có máy quét */}
                                                    {import.meta.env.DEV && (
                                                        <details className={`mt-2 text-xs ${sub}`}>
                                                            <summary className="cursor-pointer hover:underline">Copy mã để test (chỉ hiện khi dev)</summary>
                                                            <code className="block mt-1 p-2 bg-black/10 rounded break-all select-all" title="Copy để dán vào ô Điểm danh bằng QR">
                                                                {myCheckInQr.token ?? myCheckInQr.qrContent}
                                                            </code>
                                                        </details>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className={`text-sm ${sub}`}>Bạn chưa đăng ký sự kiện này. Vui lòng đăng ký ở tab Đăng ký trước.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Organizer: Điểm danh bằng QR (camera hoặc dán token) */}
                                    {isManager && (
                                        <div className={`p-4 rounded-lg border ${border}`}>
                                            <h3 className={`font-semibold mb-2 ${text}`}>Điểm danh bằng QR</h3>
                                            <p className={`text-xs mb-3 ${sub}`}>
                                                Quét mã QR của người tham gia bằng camera, hoặc dán nội dung (token) đã quét từ thiết bị khác.
                                            </p>
                                            <div className={`text-xs mb-3 p-3 rounded-lg border ${border} ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                                                <p className={`font-medium ${text} mb-1`}>Điện thoại cần gì để quét và gửi lên server?</p>
                                                <p className={`${sub} mb-1`}>Chỉ mở camera / app quét QR mặc định của điện thoại <strong>không đủ</strong> — không gửi được lên server. Cần:</p>
                                                <ul className={`list-disc list-inside ${sub} space-y-0.5`}>
                                                    <li>Mở <strong>trình duyệt</strong> (Chrome, Safari…) trên điện thoại</li>
                                                    <li>Truy cập <strong>đúng trang web app</strong> (cùng địa chỉ với app này)</li>
                                                    <li><strong>Đăng nhập</strong> bằng tài khoản Manager/Admin của CLB</li>
                                                    <li>Vào sự kiện này → tab <strong>Điểm danh</strong> → bấm <strong>&quot;Quét bằng camera&quot;</strong></li>
                                                    <li>Cho phép camera khi trình duyệt yêu cầu</li>
                                                </ul>
                                                <p className={`${sub} mt-1`}>Sau đó hướng camera vào mã QR (trên màn hình máy tính hoặc điện thoại người tham gia). Quét xong app sẽ tự gửi lên server và điểm danh.</p>
                                            </div>

                                            {!showQrScanner ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowQrScanner(true)}
                                                        className="mb-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                                                    >
                                                        <i className="fas fa-camera" /> Quét bằng camera
                                                    </button>
                                                    <div className="flex flex-col sm:flex-row gap-2 max-w-md mt-2">
                                                        <input
                                                            type="text"
                                                            value={qrToken}
                                                            onChange={e => { setQrToken(e.target.value); setQrError(null); setQrSuccess(null); }}
                                                            placeholder="Hoặc dán mã đã quét từ QR..."
                                                            className={`flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg outline-none font-mono ${inputCls}`}
                                                        />
                                                        <button
                                                            onClick={() => handleCheckInByQr()}
                                                            disabled={isCheckingInByQr || !qrToken.trim()}
                                                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                        >
                                                            {isCheckingInByQr ? 'Đang xử lý...' : 'Điểm danh'}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <QRScanner
                                                    scannerId={`event-qr-${eventId}`}
                                                    onScan={(token) => handleCheckInByQr(token)}
                                                    onClose={() => setShowQrScanner(false)}
                                                    className="mt-2"
                                                />
                                            )}

                                            {qrError && <p className="text-sm text-red-500 mt-2">{qrError}</p>}
                                            {qrSuccess && <p className="text-sm text-green-600 font-medium mt-2">{qrSuccess}</p>}
                                        </div>
                                    )}

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
