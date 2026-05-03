import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Footer } from '../home/components';
import Navbar from '../../components/Navbar';
import { useGetEventByIdQuery, useGetCurrentUserQuery, useRegisterForEventMutation, useCheckInMutation, useGetMyRegistrationQuery, useCancelRegistrationMutation } from '~/cores/api';
import { useNotification } from '~/components/Notification';

/* ── helpers ── */
function fmtFullDate(dateStr?: string) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDay(d?: string) { return d ? new Date(d).getDate().toString().padStart(2, '0') : '--'; }
function fmtMonth(d?: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'long' }) : '--'; }
function fmtTime(d?: string) { return d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''; }
function isValidUrl(url?: string) { if (!url || url === 'string') return false; try { new URL(url); return true; } catch { return false; } }

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    REGISTRATION_OPEN: { label: 'Đang mở đăng ký', cls: 'bg-green-500 text-white' },
    ONGOING: { label: 'Đang diễn ra', cls: 'bg-yellow-500 text-white' },
    COMPLETED: { label: 'Đã kết thúc', cls: 'bg-gray-400 text-white' },
    CANCELED: { label: 'Đã hủy', cls: 'bg-red-500 text-white' },
    PLANNED: { label: 'Sắp diễn ra', cls: 'bg-orange-500 text-white' },
};

function getMyStatusLabel(status: string) {
    switch (status) {
        case 'PENDING': return { icon: 'fas fa-clock', text: 'Đang chờ duyệt', color: 'bg-amber-100 text-amber-700 border-amber-300' };
        case 'REGISTERED': return { icon: 'fas fa-check-circle', text: 'Đã đăng ký', color: 'bg-green-100 text-green-700 border-green-300' };
        case 'WAITLIST': return { icon: 'fas fa-list-alt', text: 'Trong danh sách chờ', color: 'bg-purple-100 text-purple-700 border-purple-300' };
        case 'PRESENT': case 'CHECKED_IN': return { icon: 'fas fa-check-double', text: 'Đã điểm danh', color: 'bg-green-100 text-green-700 border-green-300' };
        case 'ABSENT': return { icon: 'fas fa-times-circle', text: 'Vắng mặt', color: 'bg-red-100 text-red-700 border-red-300' };
        case 'CANCELLED': return { icon: 'fas fa-ban', text: 'Đã huỷ đăng ký', color: 'bg-gray-100 text-gray-500 border-gray-300' };
        case 'REJECTED': return { icon: 'fas fa-ban', text: 'Đã bị từ chối', color: 'bg-red-100 text-red-600 border-red-300' };
        default: return { icon: 'fas fa-info-circle', text: status, color: 'bg-gray-100 text-gray-600 border-gray-300' };
    }
}

/* ── Calendar Card ── */
function CalendarCard({ label, dateStr }: { label: string; dateStr?: string }) {
    return (
        <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <i className="fas fa-calendar-alt text-orange-500" /> {label}
            </p>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden w-32">
                <div className="bg-orange-500 text-white text-xs font-bold py-1.5 uppercase tracking-wider">
                    {fmtMonth(dateStr)}
                </div>
                <div className="py-4">
                    <span className="text-4xl font-black text-gray-800">{fmtDay(dateStr)}</span>
                </div>
                <div className="pb-3 text-sm text-orange-600 font-medium">
                    <i className="fas fa-clock mr-1 text-xs" /> {fmtTime(dateStr) || '--:--'}
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ── */
const PublicEventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { show: showNotification } = useNotification();
    const eventId = Number(id);
    const { data: event, isLoading, error } = useGetEventByIdQuery(eventId);
    const { data: user } = useGetCurrentUserQuery();
    const { data: myRegistration } = useGetMyRegistrationQuery(eventId, { skip: !user });

    const [registerForEvent, { isLoading: isRegistering }] = useRegisterForEventMutation();
    const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
    const [cancelRegistration, { isLoading: isCancelling }] = useCancelRegistrationMutation();

    const [showCheckInForm, setShowCheckInForm] = React.useState(false);
    const [checkInCode, setCheckInCode] = React.useState('');
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    const [myStatus, setMyStatus] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (myRegistration?.attendanceStatus) setMyStatus(myRegistration.attendanceStatus);
    }, [myRegistration]);

    const handleRegister = async () => {
        if (!user) { showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng đăng nhập để đăng ký sự kiện!' }); return; }
        try {
            const res = await registerForEvent(eventId).unwrap();
            setMyStatus(res.attendanceStatus);
            if (res.attendanceStatus === 'PENDING') showNotification({ type: 'info', title: 'Chờ duyệt', message: 'Đăng ký của bạn đang chờ ban tổ chức duyệt.' });
            else if (res.attendanceStatus === 'WAITLIST') showNotification({ type: 'warning', title: 'Danh sách chờ', message: 'Sự kiện đã hết chỗ. Bạn đã được thêm vào danh sách chờ.' });
            else showNotification({ type: 'success', title: 'Thành công', message: 'Đăng ký thành công!' });
        } catch (err: any) { showNotification({ type: 'error', title: 'Đăng ký thất bại', message: err?.data?.error ?? 'Sự kiện có thể đã đầy hoặc chưa mở.' }); }
    };

    const handleCheckIn = async () => {
        if (!user) { showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng đăng nhập để điểm danh!' }); return; }
        if (!checkInCode.trim()) { showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng nhập mã Check-in.' }); return; }
        try {
            const res = await checkIn({ eventId, userId: user.userId, code: checkInCode.trim() }).unwrap();
            if (res.alreadyCheckedIn) showNotification({ type: 'info', title: 'Thông báo', message: 'Bạn đã điểm danh trước đó rồi.' });
            else showNotification({ type: 'success', title: 'Thành công', message: 'Điểm danh thành công!' });
            setMyStatus('PRESENT'); setShowCheckInForm(false); setCheckInCode('');
        } catch (err: any) { showNotification({ type: 'error', title: 'Điểm danh thất bại', message: err?.data?.error ?? 'Mã không đúng hoặc đã hết hạn.' }); }
    };

    const handleCancelRegistration = async () => {
        if (!user) return;
        try {
            await cancelRegistration(eventId).unwrap();
            setMyStatus('CANCELLED'); setShowCancelModal(false);
            showNotification({ type: 'success', title: 'Thành công', message: 'Đã hủy đăng ký sự kiện.' });
        } catch (err: any) { setShowCancelModal(false); showNotification({ type: 'error', title: 'Lỗi', message: err?.data?.error ?? 'Không thể hủy đăng ký.' }); }
    };

    const isCheckedIn = myStatus === 'PRESENT' || myStatus === 'CHECKED_IN';
    const isRegistered = myStatus != null && !['CANCELLED', 'REJECTED'].includes(myStatus);
    const st = STATUS_MAP[event?.status ?? ''] ?? { label: event?.status ?? '', cls: 'bg-gray-400 text-white' };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="pt-20 flex-1">
                {/* Loading */}
                {isLoading && (
                    <div className="max-w-5xl mx-auto px-6 py-12">
                        <div className="animate-pulse space-y-6">
                            <div className="h-80 bg-gray-200 rounded-2xl" />
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                    </div>
                )}

                {/* Error */}
                {!isLoading && (error || !event) && (
                    <div className="max-w-5xl mx-auto px-6 py-24 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle text-red-500 text-2xl" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">Không tìm thấy sự kiện</h3>
                        <button onClick={() => navigate(-1)} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition">
                            ← Quay lại
                        </button>
                    </div>
                )}

                {!isLoading && event && (
                    <>
                        {/* ── HERO BANNER ── */}
                        <div className="relative w-full h-72 md:h-[400px] bg-gradient-to-br from-orange-600 to-orange-500 overflow-hidden">
                            {isValidUrl(event.imageUrl) && (
                                <img src={event.imageUrl} alt={event.eventName} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            {/* Back button overlay */}
                            <button onClick={() => navigate(-1)} className="absolute top-24 left-6 z-10 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg">
                                <i className="fas fa-arrow-left" /> Quay lại
                            </button>
                        </div>

                        {/* ── EVENT INFO SECTION ── */}
                        <div className="max-w-5xl mx-auto px-6 pt-8 pb-2">
                            {/* Event name */}
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
                                {event.eventName}
                            </h1>
                            {event.clubName && (
                                <p className="mt-2 mb-5 text-sm text-gray-500 flex items-center gap-2">
                                    <i className="fas fa-users text-orange-500" />
                                    Tổ chức bởi <span className="font-semibold text-orange-600">{event.clubName}</span>
                                </p>
                            )}
                            {!event.clubName && <div className="mb-5" />}

                        </div>

                        {/* ── CONTENT: Info + Details + Sidebar ── */}
                        <div className="max-w-5xl mx-auto px-6 pb-12">
                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Left column: Info card + Description + Sessions */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Info card */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex flex-wrap items-start gap-6 md:gap-8">
                                            {/* Left info */}
                                            <div className="space-y-2 flex-shrink-0">
                                                {event.location && event.location !== 'string' && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        <i className="fas fa-map-marker-alt text-orange-500" />
                                                        <span className="font-medium">Địa điểm:</span>
                                                        <span className="text-orange-600 font-medium">{event.location}</span>
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <i className="fas fa-info-circle text-orange-500" />
                                                    <span className="font-medium">Trạng thái sự kiện:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                                                </p>
                                                {event.isOnline && event.meetLink && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        <i className="fas fa-video text-orange-500" />
                                                        <span className="font-medium">Online:</span>
                                                        <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline truncate max-w-[200px]">{event.meetLink}</a>
                                                    </p>
                                                )}
                                            </div>
                                            {/* Calendar cards */}
                                            <div className="flex gap-4 ml-auto">
                                                <CalendarCard label="Ngày bắt đầu" dateStr={event.startDate} />
                                                <CalendarCard label="Ngày kết thúc" dateStr={event.endDate} />
                                            </div>
                                        </div>
                                        {/* Share */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(window.location.href); showNotification({ type: 'success', title: 'Đã sao chép', message: 'Link sự kiện đã được sao chép!' }); }}
                                                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg flex items-center gap-2"
                                            >
                                                <i className="fas fa-share-alt" /> Chia sẻ
                                            </button>
                                        </div>
                                    </div>
                                    {/* Description */}
                                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <i className="fas fa-align-left text-orange-500" /> Chi tiết sự kiện
                                        </h2>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {event.description && event.description !== 'string' ? event.description : 'Chưa có mô tả cho sự kiện này.'}
                                        </p>
                                    </div>

                                    {/* Sessions */}
                                    {event.sessions && event.sessions.length > 0 && (
                                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <i className="fas fa-list-ol text-orange-500" /> Lịch trình ({event.sessions.length} buổi)
                                            </h2>
                                            <div className="space-y-3">
                                                {event.sessions.map((s, idx) => (
                                                    <div key={s.scheduleId} className="flex gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{idx + 1}</div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{s.scheduleName}</p>
                                                            {s.startTime && <p className="text-sm text-gray-500">{fmtFullDate(s.startTime)} · {fmtTime(s.startTime)} – {fmtTime(s.endTime)}</p>}
                                                            {s.location && s.location !== 'string' && (
                                                                <p className="text-sm text-orange-600 flex items-center gap-1 mt-1"><i className="fas fa-map-marker-alt text-xs" /> {s.location}</p>
                                                            )}
                                                            {s.description && s.description !== 'string' && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Sidebar card */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-24 space-y-5">
                                        <h3 className="text-lg font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
                                            <i className="fas fa-ticket-alt text-orange-500" /> Đăng ký tham gia
                                        </h3>

                                        {/* Attendee count */}
                                        {(event.status === 'REGISTRATION_OPEN' || event.status === 'ONGOING' || event.status === 'COMPLETED') && (
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                                                    <i className="fas fa-users mr-1 text-orange-500" /> Người tham gia
                                                </p>
                                                {event.maxAttendees ? (
                                                    <>
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="font-bold text-gray-800">{event.currentAttendees} / {event.maxAttendees}</span>
                                                            <span className={`text-xs font-semibold ${event.currentAttendees >= event.maxAttendees ? 'text-red-500' : 'text-green-600'}`}>
                                                                {event.currentAttendees >= event.maxAttendees ? 'Đã đầy' : `Còn ${event.maxAttendees - event.currentAttendees} chỗ`}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className={`h-2 rounded-full transition-all ${event.currentAttendees / event.maxAttendees >= 0.9 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)}%` }} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-sm font-semibold text-gray-800">{event.currentAttendees} người <span className="text-xs font-normal text-gray-400">(không giới hạn)</span></p>
                                                )}
                                            </div>
                                        )}

                                        {/* My status */}
                                        {myStatus && (
                                            <div className={`p-3 rounded-xl border text-center ${getMyStatusLabel(myStatus).color}`}>
                                                <p className="text-sm font-semibold flex items-center justify-center gap-2">
                                                    <i className={getMyStatusLabel(myStatus).icon} /> {getMyStatusLabel(myStatus).text}
                                                </p>
                                            </div>
                                        )}

                                        {/* Register */}
                                        {event.status === 'REGISTRATION_OPEN' && !isRegistered && (() => {
                                            const isFull = event.maxAttendees != null && event.currentAttendees >= event.maxAttendees;
                                            return (
                                                <button onClick={handleRegister} disabled={isRegistering}
                                                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${isFull ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                                                    {isRegistering ? 'Đang đăng ký...' : isFull ? 'Đăng ký chờ (Waitlist)' : 'Đăng ký nhận vé'}
                                                </button>
                                            );
                                        })()}

                                        {/* Check-in */}
                                        {event.status === 'ONGOING' && myStatus === 'REGISTERED' && !isCheckedIn && !showCheckInForm && (
                                            <button onClick={() => setShowCheckInForm(true)} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg">
                                                <i className="fas fa-qrcode mr-2" /> Điểm danh ngay
                                            </button>
                                        )}

                                        {/* Cancel */}
                                        {isRegistered && !isCheckedIn && ['REGISTRATION_OPEN', 'PLANNED'].includes(event.status) && (
                                            <button onClick={() => setShowCancelModal(true)} disabled={isCancelling}
                                                className="w-full py-3 rounded-xl font-semibold transition-all hover:shadow-lg disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200">
                                                <i className="fas fa-times-circle mr-2" /> Hủy đăng ký
                                            </button>
                                        )}

                                        {/* Check-in form */}
                                        {showCheckInForm && (
                                            <div className="p-4 border border-green-200 bg-green-50 rounded-xl space-y-3">
                                                <label className="block text-sm font-medium text-green-800">Mã Check-in (6 ký tự)</label>
                                                <input type="text" maxLength={6} value={checkInCode} onChange={e => setCheckInCode(e.target.value.toUpperCase())}
                                                    placeholder="VD: CHK123" className="w-full px-4 py-2 border border-green-300 rounded-lg outline-none focus:border-green-500 uppercase tracking-widest font-mono text-center" />
                                                <div className="flex gap-2">
                                                    <button onClick={handleCheckIn} disabled={isCheckingIn} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition-colors">
                                                        {isCheckingIn ? 'Đang gửi...' : 'Xác nhận'}
                                                    </button>
                                                    <button onClick={() => setShowCheckInForm(false)} className="px-4 py-2 border border-green-300 text-green-700 bg-white hover:bg-green-100 rounded-lg font-medium transition-colors">Hủy</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                )}
            </div>

            <Footer />

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <i className="fas fa-exclamation-triangle text-red-500 text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận hủy đăng ký</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Bạn có chắc muốn hủy đăng ký sự kiện <strong className="text-gray-700">{event?.eventName}</strong> không? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Quay lại</button>
                                <button onClick={handleCancelRegistration} disabled={isCancelling} className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50">
                                    {isCancelling ? 'Đang hủy...' : 'Hủy đăng ký'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicEventDetailPage;
