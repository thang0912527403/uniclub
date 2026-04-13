import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Footer } from '../home/components';
import Navbar from '../../components/Navbar';
import { useGetEventByIdQuery, useGetCurrentUserQuery, useRegisterForEventMutation, useCheckInMutation, useGetMyCheckInQrQuery } from '~/cores/api';
import { useGetMyEventsQuery } from '~/cores/api/eventApi';
import { useNotification } from '~/components/Notification';
import { QRCodeSVG } from 'qrcode.react';

function formatDate(dateStr?: string) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

function formatTime(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function isValidUrl(url?: string) {
    if (!url || url === 'string') return false;
    try { new URL(url); return true; } catch { return false; }
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'REGISTRATION_OPEN': return 'bg-green-100 text-green-700';
        case 'ONGOING': return 'bg-yellow-100 text-yellow-700';
        case 'COMPLETED': return 'bg-gray-100 text-gray-600';
        case 'CANCELED': return 'bg-red-100 text-red-700';
        case 'PLANNED': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}

const PublicEventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { show: showNotification } = useNotification();
    const eventId = Number(id);
    const { data: event, isLoading, error } = useGetEventByIdQuery(eventId);
    const { data: user } = useGetCurrentUserQuery();

    const [registerForEvent, { isLoading: isRegistering }] = useRegisterForEventMutation();
    const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();

    const [showCheckInForm, setShowCheckInForm] = React.useState(false);
    const [checkInCode, setCheckInCode] = React.useState('');
    const [checkInTab, setCheckInTab] = React.useState<'code' | 'qr'>('code');

    // Fetch QR token for participant check-in
    const { data: myCheckInQr, isLoading: isLoadingMyQr } = useGetMyCheckInQrQuery(eventId, {
        skip: !user || event?.status !== 'ONGOING',
    });

    // Lookup user's attendance status for this event
    const { data: myEventsData, refetch: refetchMyEvents } = useGetMyEventsQuery(
        { search: '', page: 1, pageSize: 100 },
        { skip: !user }
    );
    const myAttendance = myEventsData?.items?.find(e => e.eventId === eventId);
    const myStatus = myAttendance?.attendanceStatus;

    const attendanceStatusConfig: Record<string, { icon: string; label: string; cls: string }> = {
        PENDING:    { icon: 'fas fa-clock',         label: 'Đăng ký đang chờ duyệt',  cls: 'text-amber-700 bg-amber-50 border-amber-200' },
        REGISTERED: { icon: 'fas fa-check-circle',  label: 'Đã đăng ký thành công',    cls: 'text-green-700 bg-green-50 border-green-200' },
        WAITLIST:   { icon: 'fas fa-list-ol',       label: 'Đang trong danh sách chờ', cls: 'text-purple-700 bg-purple-50 border-purple-200' },
        CHECKED_IN: { icon: 'fas fa-map-marker-alt',label: 'Đã điểm danh',             cls: 'text-green-700 bg-green-50 border-green-200' },
        PRESENT:    { icon: 'fas fa-user-check',    label: 'Có mặt',                   cls: 'text-green-700 bg-green-50 border-green-200' },
        ABSENT:     { icon: 'fas fa-user-times',    label: 'Vắng mặt',                 cls: 'text-red-700 bg-red-50 border-red-200' },
        REJECTED:   { icon: 'fas fa-ban',           label: 'Đăng ký bị từ chối',       cls: 'text-red-700 bg-red-50 border-red-200' },
        CANCELLED:  { icon: 'fas fa-undo',          label: 'Đã huỷ đăng ký',           cls: 'text-gray-600 bg-gray-50 border-gray-200' },
    };

    const handleRegister = async () => {
        if (!user) {
            showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng đăng nhập để đăng ký sự kiện!' });
            return;
        }
        try {
            await registerForEvent(eventId).unwrap();
            refetchMyEvents();
            if (event?.requiresApproval) {
                showNotification({ type: 'info', title: 'Đã gửi đăng ký', message: 'Đăng ký của bạn đang chờ ban tổ chức duyệt.' });
            } else {
                showNotification({ type: 'success', title: 'Thành công', message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận vé.' });
            }
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Đăng ký thất bại', message: err?.data?.error ?? 'Sự kiện có thể đã đầy hoặc chưa mở.' });
        }
    };

    const handleCheckIn = async () => {
        if (!user) {
            showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng đăng nhập để điểm danh!' });
            return;
        }
        if (!checkInCode.trim()) {
            showNotification({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng nhập mã Check-in được cung cấp tại sự kiện.' });
            return;
        }
        try {
            await checkIn({ eventId, userId: user.userId, code: checkInCode.trim() }).unwrap();
            showNotification({ type: 'success', title: 'Thành công', message: 'Điểm danh thành công!' });
            setShowCheckInForm(false);
            setCheckInCode('');
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Điểm danh thất bại', message: err?.data?.error ?? 'Mã không đúng hoặc đã hết hạn.' });
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="pt-20 flex-1">
                {/* Loading */}
                {isLoading && (
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <div className="animate-pulse space-y-6">
                            <div className="h-72 bg-gray-200 rounded-2xl" />
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                        </div>
                    </div>
                )}

                {/* Error */}
                {(!isLoading && (error || !event)) && (
                    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">Không tìm thấy sự kiện</h3>
                        <button
                            onClick={() => navigate('/public/events')}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition"
                        >
                            ← Quay lại danh sách
                        </button>
                    </div>
                )}

                {!isLoading && event && (
                    <>
                        {/* Hero image */}
                        <div className="relative w-full h-72 md:h-96 bg-gradient-to-br from-orange-400 to-orange-600">
                            {isValidUrl(event.imageUrl) && (
                                <img
                                    src={event.imageUrl}
                                    alt={event.eventName}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getStatusStyle(event.status)}`}>
                                    {event.status}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow">
                                    {event.eventName}
                                </h1>
                            </div>
                        </div>

                        {/* Back button + Content */}
                        <div className="max-w-5xl mx-auto px-6 py-10">
                            <button
                                onClick={() => navigate('/public/events')}
                                className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium mb-8 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Quay lại danh sách sự kiện
                            </button>

                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Left: Description */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-800 mb-4">Giới thiệu sự kiện</h2>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {event.description && event.description !== 'string'
                                                ? event.description
                                                : 'Chưa có mô tả cho sự kiện này.'}
                                        </p>
                                    </div>

                                    {/* Sessions */}
                                    {event.sessions && event.sessions.length > 0 && (
                                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                                Lịch trình ({event.sessions.length} buổi)
                                            </h2>
                                            <div className="space-y-3">
                                                {event.sessions.map((s, idx) => (
                                                    <div key={s.scheduleId} className="flex gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{s.scheduleName}</p>
                                                            {s.startTime && (
                                                                <p className="text-sm text-gray-500">
                                                                    {formatDate(s.startTime)} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                                                                </p>
                                                            )}
                                                            {s.location && s.location !== 'string' && (
                                                                <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    {s.location}
                                                                </p>
                                                            )}
                                                            {s.description && s.description !== 'string' && (
                                                                <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Info card */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-24 space-y-4">
                                        <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Thông tin sự kiện</h3>

                                        <InfoRow icon="calendar" label="Bắt đầu" value={formatDate(event.startDate)} />
                                        <InfoRow icon="calendar" label="Kết thúc" value={formatDate(event.endDate)} />
                                        {event.location && event.location !== 'string' && (
                                            <InfoRow icon="location" label="Địa điểm" value={event.location} />
                                        )}
                                        <InfoRow
                                            icon="visibility"
                                            label="Loại"
                                            value={event.isPublic ? 'Sự kiện công khai' : 'Sự kiện nội bộ'}
                                        />

                                        {/* Online event badge */}
                                        {event.isOnline && (
                                            <div className="pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                                                    <i className="fas fa-video text-blue-500 text-sm" />
                                                    <span className="text-sm font-semibold text-blue-700">Sự kiện trực tuyến</span>
                                                </div>

                                                {/* Show meetLink only for registered users */}
                                                {user && myStatus && ['REGISTERED', 'PRESENT', 'CHECKED_IN'].includes(myStatus) ? (
                                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                                        <p className="text-xs text-green-600 font-medium mb-1">
                                                            <i className="fas fa-link mr-1" />Đường dẫn tham gia
                                                        </p>
                                                        {event.meetLink ? (
                                                            <a
                                                                href={event.meetLink.startsWith('http') ? event.meetLink : `/meeting/${event.meetLink}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                                                            >
                                                                {event.meetLink.startsWith('http') ? event.meetLink : `Phòng họp nội bộ: ${event.meetLink}`}
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Link chưa được cung cấp</span>
                                                        )}
                                                    </div>
                                                ) : user ? (
                                                    <p className="mt-2 text-xs text-gray-400 italic">
                                                        <i className="fas fa-lock mr-1" />Đăng ký để xem đường dẫn phòng họp
                                                    </p>
                                                ) : (
                                                    <p className="mt-2 text-xs text-gray-400 italic">
                                                        <i className="fas fa-lock mr-1" />Đăng nhập và đăng ký để xem đường dẫn
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Attendee count / slots */}
                                        {(event.status === 'REGISTRATION_OPEN' || event.status === 'ONGOING' || event.status === 'COMPLETED') && (
                                            <div className="pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                                                    <svg className="w-4 h-4 inline mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Người tham gia
                                                </p>
                                                {event.maxAttendees ? (
                                                    <>
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="font-bold text-gray-800">
                                                                {event.currentAttendees} / {event.maxAttendees}
                                                            </span>
                                                            <span className={`text-xs font-semibold ${event.currentAttendees >= event.maxAttendees ? 'text-red-500' : 'text-green-600'}`}>
                                                                {event.currentAttendees >= event.maxAttendees ? 'Đã đầy' : `Còn ${event.maxAttendees - event.currentAttendees} chỗ`}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${event.currentAttendees / event.maxAttendees >= 0.9 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {event.currentAttendees} người đã đăng ký
                                                        <span className="text-xs font-normal text-gray-400 ml-1">(không giới hạn)</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* User's registration status */}
                                        {user && myStatus && attendanceStatusConfig[myStatus] && (
                                            <div className={`flex items-center gap-2 p-3 rounded-xl border ${attendanceStatusConfig[myStatus].cls}`}>
                                                <i className={`${attendanceStatusConfig[myStatus].icon} text-sm`} />
                                                <span className="text-sm font-semibold">{attendanceStatusConfig[myStatus].label}</span>
                                            </div>
                                        )}

                                        {event.status === 'REGISTRATION_OPEN' && (!myStatus || myStatus === 'REJECTED' || myStatus === 'CANCELLED') && (
                                            <button onClick={handleRegister} disabled={isRegistering}
                                                className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                                                    event.maxAttendees != null && event.currentAttendees >= event.maxAttendees
                                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                }`}>
                                                {isRegistering ? 'Đang đăng ký...'
                                                    : event.maxAttendees != null && event.currentAttendees >= event.maxAttendees
                                                        ? 'Đăng ký chờ (Waitlist)'
                                                        : myStatus === 'REJECTED' ? 'Đăng ký lại' : 'Đăng ký nhận vé'}
                                            </button>
                                        )}

                                        {event.status === 'ONGOING' && myStatus === 'REGISTERED' && !showCheckInForm && (
                                            <button onClick={() => setShowCheckInForm(true)}
                                                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
                                                Điểm danh ngay
                                            </button>
                                        )}

                                        {showCheckInForm && (
                                            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-xl space-y-3">
                                                {/* Tab switcher */}
                                                <div className="flex gap-1 bg-green-100 rounded-lg p-1">
                                                    <button
                                                        onClick={() => setCheckInTab('code')}
                                                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                                                            checkInTab === 'code' ? 'bg-white text-green-700 shadow-sm' : 'text-green-600 hover:text-green-700'
                                                        }`}>
                                                        <i className="fas fa-keyboard mr-1.5" />Nhập mã
                                                    </button>
                                                    <button
                                                        onClick={() => setCheckInTab('qr')}
                                                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                                                            checkInTab === 'qr' ? 'bg-white text-green-700 shadow-sm' : 'text-green-600 hover:text-green-700'
                                                        }`}>
                                                        <i className="fas fa-qrcode mr-1.5" />Mã QR
                                                    </button>
                                                </div>

                                                {/* Tab: Nhập mã 6 ký tự */}
                                                {checkInTab === 'code' && (
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-green-800">Mã Check-in (6 ký tự)</label>
                                                        <p className="text-xs text-green-600">Nhập mã do ban tổ chức chia sẻ tại sự kiện.</p>
                                                        <input type="text" maxLength={6}
                                                            value={checkInCode} onChange={e => setCheckInCode(e.target.value.toUpperCase())}
                                                            placeholder="VD: CHK123"
                                                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl outline-none focus:border-green-500 uppercase tracking-[0.3em] font-mono text-center text-lg font-bold" />
                                                        <div className="flex gap-2">
                                                            <button onClick={handleCheckIn} disabled={isCheckingIn || checkInCode.length < 6}
                                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                                                                {isCheckingIn ? 'Đang gửi...' : 'Xác nhận điểm danh'}
                                                            </button>
                                                            <button onClick={() => setShowCheckInForm(false)}
                                                                className="px-4 py-2 border border-green-300 text-green-700 bg-white hover:bg-green-100 rounded-lg font-medium transition-colors">
                                                                Đóng
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tab: QR code */}
                                                {checkInTab === 'qr' && (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-green-800 font-medium">Đưa mã QR này cho ban tổ chức quét</p>
                                                        <p className="text-xs text-green-600">Mã QR đã được gửi qua email khi bạn đăng ký. Bạn cũng có thể dùng mã trên màn hình này.</p>
                                                        {isLoadingMyQr ? (
                                                            <div className="animate-pulse h-48 w-48 mx-auto bg-green-200 rounded-lg" />
                                                        ) : (myCheckInQr?.token ?? myCheckInQr?.qrContent) ? (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="rounded-xl border-2 border-green-300 p-3 bg-white">
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
                                                                    <p className="text-xs text-green-600">
                                                                        Hết hạn lúc {new Date(myCheckInQr.expiresAt).toLocaleTimeString('vi-VN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 text-center py-4">Không có mã QR. Vui lòng sử dụng mã 6 ký tự.</p>
                                                        )}
                                                        <button onClick={() => setShowCheckInForm(false)}
                                                            className="w-full px-4 py-2 border border-green-300 text-green-700 bg-white hover:bg-green-100 rounded-lg font-medium transition-colors">
                                                            Đóng
                                                        </button>
                                                    </div>
                                                )}
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
        </div>
    );
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    const icons: Record<string, React.ReactNode> = {
        calendar: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        location: (
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
        ),
        visibility: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
    };
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">{icons[icon]}</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-700 font-medium">{value}</p>
            </div>
        </div>
    );
}

export default PublicEventDetailPage;
