import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar, Footer } from '../home/components';
import { useGetEventByIdQuery } from '~/cores/api';

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
        case 'Active': return 'bg-green-100 text-green-700';
        case 'Upcoming': return 'bg-orange-100 text-orange-700';
        case 'Completed': return 'bg-gray-100 text-gray-600';
        case 'Cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}

const PublicEventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: event, isLoading, error } = useGetEventByIdQuery(Number(id));

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

                                        {event.status === 'Active' && (
                                            <button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
                                                Đăng ký tham gia
                                            </button>
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
