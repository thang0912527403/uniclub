import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { encodeId } from '~/utils/hashId';
import { useGetAllEventsQuery } from '~/cores/api';

/* ── helpers ── */
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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    PLANNED: { label: 'Sắp tới', cls: 'bg-blue-100 text-blue-600' },
    REGISTRATION_OPEN: { label: 'Mở đăng ký', cls: 'bg-green-100 text-green-600' },
    ONGOING: { label: 'Đang diễn ra', cls: 'bg-yellow-100 text-yellow-700' },
};

const PAGE_SIZE = 3;
const ROTATE_INTERVAL = 10_000; // 10s

/* ── component ── */
const UpcomingEvents: React.FC = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useGetAllEventsQuery({ pageNumber: 1, pageSize: 30 });
    const allEvents = Array.isArray(data) ? data : (data?.items ?? []);

    // Only upcoming / active events
    const events = useMemo(
        () =>
            allEvents.filter(
                (ev) =>
                    ev.status === 'PLANNED' ||
                    ev.status === 'REGISTRATION_OPEN' ||
                    ev.status === 'ONGOING',
            ),
        [allEvents],
    );

    const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
    const [pageIndex, setPageIndex] = useState(0);
    const [fade, setFade] = useState(true);

    // Reset page index when events change
    useEffect(() => { setPageIndex(0); }, [events.length]);

    // Auto-rotate
    useEffect(() => {
        if (events.length <= PAGE_SIZE) return;
        const timer = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setPageIndex((p) => (p + 1) % totalPages);
                setFade(true);
            }, 300);
        }, ROTATE_INTERVAL);
        return () => clearInterval(timer);
    }, [events.length, totalPages]);

    const goTo = useCallback(
        (idx: number) => {
            setFade(false);
            setTimeout(() => {
                setPageIndex(idx);
                setFade(true);
            }, 300);
        },
        [],
    );

    const visibleEvents = events.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

    /* ── skeleton ── */
    if (isLoading) {
        return (
            <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            <i className="fas fa-calendar-alt mr-3 text-orange-500" />
                            Sự kiện sắp diễn ra
                        </h2>
                        <p className="text-gray-500 text-lg">Đăng ký tham gia các sự kiện hấp dẫn sắp tới</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                <div className="h-44 bg-gray-200" />
                                <div className="p-5 space-y-3">
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

    /* ── empty state ── */
    if (events.length === 0) {
        return (
            <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-calendar-alt mr-3 text-orange-500" />
                        Sự kiện sắp diễn ra
                    </h2>
                    <p className="text-gray-500 mt-2">Hiện chưa có sự kiện sắp diễn ra. Hãy quay lại sau!</p>
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

    /* ── main render ── */
    return (
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-calendar-alt mr-3 text-orange-500" />
                        Sự kiện sắp diễn ra
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Đăng ký tham gia các sự kiện hấp dẫn sắp tới
                    </p>
                </div>

                {/* Cards grid — fade transition */}
                <div
                    className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                >
                    {visibleEvents.map((event) => {
                        const sl = STATUS_LABELS[event.status] ?? { label: event.status, cls: 'bg-gray-100 text-gray-600' };
                        const hasImage = event.imageUrl && event.imageUrl !== 'string';

                        return (
                            <div
                                key={event.eventId}
                                onClick={() => navigate(`/public/events/${encodeId(event.eventId)}`)}
                                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
                            >
                                {/* Image / gradient */}
                                <div className="relative h-44 overflow-hidden">
                                    {hasImage ? (
                                        <img
                                            src={event.imageUrl}
                                            alt={event.eventName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                                    {/* Date badge */}
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 text-center shadow-sm">
                                        <div className="text-2xl font-black text-orange-500 leading-none">{formatDay(event.startDate)}</div>
                                        <div className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">{formatMonth(event.startDate)}</div>
                                    </div>

                                    {/* Status badge */}
                                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sl.cls}`}>
                                        {sl.label}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                                        {event.eventName}
                                    </h3>

                                    {event.clubName && (
                                        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                                            <i className="fas fa-users text-orange-400" />
                                            {event.clubName}
                                        </p>
                                    )}

                                    <div className="space-y-2 text-sm text-gray-500">
                                        {event.location && event.location !== 'string' && (
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-map-marker-alt text-orange-400 w-4 text-center" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        )}
                                        {event.startDate && (
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-clock text-orange-400 w-4 text-center" />
                                                <span>{formatTime(event.startDate)} – {formatTime(event.endDate)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/public/events/${encodeId(event.eventId)}`); }}
                                        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg"
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dots pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={`transition-all duration-300 rounded-full ${pageIndex === i
                                    ? 'w-8 h-3 bg-orange-500'
                                    : 'w-3 h-3 bg-gray-300 hover:bg-orange-300'
                                    }`}
                                aria-label={`Page ${i + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* View all link */}
                <div className="text-center mt-10">
                    <Link
                        to="/public/events"
                        className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group"
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
