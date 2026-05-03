import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useGetAllEventsQuery } from '~/cores/api';

function formatDay(dateStr?: string) {
    if (!dateStr) return '--';
    return new Date(dateStr).getDate().toString().padStart(2, '0');
}

function formatMonth(dateStr?: string) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short' });
}

function formatTime(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = {
        Active: 'Đang mở',
        Upcoming: 'Sắp diễn ra',
        Completed: 'Đã kết thúc',
    };
    return map[status] ?? status;
}

const UpcomingEvents: React.FC = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useGetAllEventsQuery({ pageNumber: 1, pageSize: 20 });
    const allEvents = Array.isArray(data) ? data : (data?.items ?? []);

    // Show only Upcoming / Active events, max 4
    const events = allEvents
        .filter((ev) => ev.status === 'Upcoming' || ev.status === 'Active')
        .slice(0, 4);

    // Skeleton
    if (isLoading) {
        return (
            <section className="py-10 sm:py-16 px-4 sm:px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sự kiện sắp diễn ra</h2>
                        <p className="text-gray-600 text-lg">Đăng ký tham gia các sự kiện hấp dẫn sắp tới</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row animate-pulse">
                                <div className="h-[60px] sm:h-auto sm:w-[100px] bg-orange-200" />
                                <div className="flex-1 p-6 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-9 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Fallback: show placeholder message if no events
    if (events.length === 0) {
        return (
            <section className="py-10 sm:py-16 px-4 sm:px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sự kiện sắp diễn ra</h2>
                    <p className="text-gray-500">Hiện chưa có sự kiện sắp diễn ra. Hãy quay lại sau!</p>
                    <Link
                        to="/public/events"
                        className="mt-6 inline-block text-orange-500 hover:text-orange-600 font-medium"
                    >
                        Xem tất cả sự kiện →
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="py-10 sm:py-16 px-4 sm:px-6 md:px-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Sự kiện sắp diễn ra
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Đăng ký tham gia các sự kiện hấp dẫn sắp tới
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {events.map((event) => (
                        <div
                            key={event.eventId}
                            onClick={() => navigate(`/public/events/${event.eventId}`)}
                            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row cursor-pointer hover:scale-[1.02]"
                        >
                            {/* Date Badge */}
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-center sm:min-w-[100px] gap-2 sm:gap-0">
                                <div className="text-3xl font-bold">{formatDay(event.startDate)}</div>
                                <div className="text-sm uppercase font-medium">{formatMonth(event.startDate)}</div>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 p-4 sm:p-6">
                                <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                    {getStatusLabel(event.status)}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors line-clamp-1">
                                    {event.eventName}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600">
                                    {event.location && event.location !== 'string' && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="line-clamp-1">{event.location}</span>
                                        </div>
                                    )}

                                    {event.startDate && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <span>{formatTime(event.startDate)} – {formatTime(event.endDate)}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/public/events/${event.eventId}`); }}
                                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg cursor-pointer"
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        to="/public/events"
                        className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group cursor-pointer"
                    >
                        Xem tất cả sự kiện
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default UpcomingEvents;
