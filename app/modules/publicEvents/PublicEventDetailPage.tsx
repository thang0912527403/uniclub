import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { decodeId } from '~/utils/hashId';
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
function CalendarCard({ label, dateStr, color = 'orange', icon = 'fa-calendar-alt' }: { label: string; dateStr?: string; color?: 'orange' | 'blue'; icon?: string }) {
    const bg = color === 'blue' ? 'bg-blue-500' : 'bg-orange-500';
    const accent = color === 'blue' ? 'text-blue-500' : 'text-orange-500';
    return (
        <div className="flex flex-col items-center">
            <p className={`text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5`}>
                <i className={`fas ${icon} ${accent}`} /> {label}
            </p>
            <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden w-32">
                <div className={`${bg} text-white text-center text-sm font-bold py-1.5 uppercase`}>
                    {fmtMonth(dateStr)}
                </div>
                <div className="text-4xl font-black text-slate-800 text-center py-3">
                    {fmtDay(dateStr)}
                </div>
                <div className={`flex justify-center items-center ${accent} text-sm font-medium pb-3`}>
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
    const eventId = Number(id) || decodeId(id ?? '');
    const { show: showNotification } = useNotification();
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
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-8 shadow-md group">
                            {isValidUrl(event.imageUrl) ? (
                                <img src={event.imageUrl} alt={event.eventName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-500" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2.5 rounded-full transition-colors">
                                <i className="fas fa-chevron-left text-lg" />
                            </button>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{event.eventName}</h1>
                            </div>
                        </div>
                        </div>

                        {/* ── TITLE + ORGANIZER ── */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                            <h1 className="text-3xl font-black text-slate-800 uppercase leading-snug mb-3">{event.eventName}</h1>
                            {event.clubName && (
                                <p className="flex items-center text-gray-600">
                                    <i className="fas fa-users mr-2 text-orange-500" />
                                    Tổ chức bởi <strong className="text-orange-500 ml-1">{event.clubName}</strong>
                                </p>
                            )}
                        </div>

                        {/* ── FULL-WIDTH INFO CARD ── */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                            <div className="space-y-3 border-b border-gray-100 pb-6 mb-6">
                                {event.location && event.location !== 'string' && (
                                    <div className="flex items-start">
                                        <i className="fas fa-map-marker-alt text-orange-500 mt-0.5 mr-3" />
                                        <div><span className="text-gray-500 mr-2">Địa điểm:</span><span className="text-orange-500 font-medium">{event.location}</span></div>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <i className="fas fa-info-circle text-orange-500 mr-3" />
                                    <span className="text-gray-500 mr-2">Trạng thái sự kiện:</span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                                </div>
                                {event.isOnline && event.meetLink && (
                                    <div className="flex items-center">
                                        <i className="fas fa-video text-orange-500 mr-3" />
                                        <span className="text-gray-500 mr-2">Online:</span>
                                        <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline truncate max-w-[250px]">{event.meetLink}</a>
                                    </div>
                                )}
                            </div>
                            {/* 4 Calendar Cards (centered) */}
                            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
                                {event.registrationStartDate && <CalendarCard label="Mở đăng ký" dateStr={event.registrationStartDate} color="blue" icon="fa-ticket-alt" />}
                                {event.registrationEndDate && <CalendarCard label="Đóng đăng ký" dateStr={event.registrationEndDate} color="blue" icon="fa-ticket-alt" />}
                                <CalendarCard label="Ngày bắt đầu" dateStr={event.startDate} />
                                <CalendarCard label="Ngày kết thúc" dateStr={event.endDate} />
                            </div>
                            <div>
                                <button onClick={() => { navigator.clipboard.writeText(window.location.href); showNotification({ type: 'success', title: 'Đã sao chép', message: 'Link sự kiện đã được sao chép!' }); }}
                                    className="bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold py-2 px-6 rounded-lg flex items-center shadow-md shadow-orange-500/20">
                                    <i className="fas fa-share-alt mr-2" /> Chia sẻ
                                </button>
                            </div>
                        </div>
                        </div>
                        {/* ── MAIN GRID ── */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* LEFT (2/3) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                                        <i className="fas fa-align-left mr-2 text-orange-500" /> Chi tiết sự kiện
                                    </h2>
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {event.description && event.description !== 'string' ? event.description : 'Chưa có mô tả cho sự kiện này.'}
                                    </div>
                                </div>

                                {/* Sessions — Timeline */}
                                {event.sessions && event.sessions.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                            <i className="fas fa-list-ol mr-2 text-orange-500" /> Lịch trình ({event.sessions.length} buổi)
                                        </h2>
                                        <div>
                                            {[...event.sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((s) => (
                                                <div key={s.scheduleId} className="flex relative pl-8 py-4 border-b border-gray-50 last:border-0">
                                                    <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                                                        <div className="w-px h-5 bg-gray-200" />
                                                        <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white ring-2 ring-orange-100 z-10" />
                                                        <div className="w-px flex-1 bg-gray-200" />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-start w-full gap-1">
                                                        <div className="text-orange-500 font-bold w-40 shrink-0 font-mono text-sm">
                                                            {fmtTime(s.startTime)}{s.endTime ? ` – ${fmtTime(s.endTime)}` : ''}
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-700 font-medium">{s.scheduleName}</p>
                                                            {s.startTime && <p className="text-xs text-gray-400">{fmtFullDate(s.startTime)}</p>}
                                                            {s.location && s.location !== 'string' && (
                                                                <p className="text-sm text-orange-600 flex items-center gap-1 mt-1"><i className="fas fa-map-marker-alt text-xs" /> {s.location}</p>
                                                            )}
                                                            {s.description && s.description !== 'string' && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT SIDEBAR (1/3) */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 sticky top-24">
                                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-gray-100 pb-4">
                                        <i className="fas fa-ticket-alt mr-2 text-orange-500" /> Đăng ký tham gia
                                    </h2>
                                    {/* Sidebar content */}
                                    <div className="space-y-5">
                                        {/* Attendee count */}
                                        {(event.status === 'REGISTRATION_OPEN' || event.status === 'ONGOING' || event.status === 'COMPLETED') && (
                                            <div>
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-xs font-bold text-gray-400 flex items-center uppercase tracking-wider">
                                                        <i className="fas fa-users mr-1" /> NGƯỜI THAM GIA
                                                    </span>
                                                </div>
                                                {event.maxAttendees ? (
                                                    <>
                                                        <div className="flex items-baseline justify-between mb-2">
                                                            <span className="text-xl font-black text-slate-800">
                                                                {event.currentAttendees} <span className="text-sm font-medium text-gray-500">/ {event.maxAttendees}</span>
                                                            </span>
                                                            <span className={`text-sm font-medium ${event.currentAttendees >= event.maxAttendees ? 'text-red-500' : 'text-green-600'}`}>
                                                                {event.currentAttendees >= event.maxAttendees ? 'Đã đầy' : `Còn ${event.maxAttendees - event.currentAttendees} chỗ`}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${event.currentAttendees / event.maxAttendees >= 0.9 ? 'bg-red-500' : 'bg-orange-500'}`}
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
                                                    className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'}`}>
                                                    {isRegistering ? 'Đang đăng ký...' : isFull ? 'Danh sách đã đầy' : 'Đăng Ký Ngay'}
                                                </button>
                                            );
                                        })()}

                                        {/* Registered status + actions */}
                                        {isRegistered && !isCheckedIn && (
                                            <>
                                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                                                    <p className="text-orange-600 font-medium text-sm">Bạn đã đăng ký thành công!</p>
                                                </div>
                                                {event.status === 'ONGOING' && myStatus === 'REGISTERED' && !showCheckInForm && (
                                                    <button onClick={() => setShowCheckInForm(true)} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg">
                                                        <i className="fas fa-qrcode mr-2" /> Điểm danh (Check-in)
                                                    </button>
                                                )}
                                                {['REGISTRATION_OPEN', 'PLANNED'].includes(event.status) && (
                                                    <button onClick={() => setShowCancelModal(true)} disabled={isCancelling}
                                                        className="w-full py-3 bg-white border-2 border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500 rounded-xl font-bold transition-all">
                                                        <i className="fas fa-times-circle mr-2" /> Hủy đăng ký
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Checked-in state */}
                                        {isCheckedIn && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                                <i className="fas fa-check-double text-green-500 text-3xl mb-3" />
                                                <h3 className="text-green-800 font-bold text-lg mb-1">Đã điểm danh</h3>
                                                <p className="text-green-600 text-sm">Chúc bạn có một buổi trải nghiệm thú vị!</p>
                                            </div>
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
