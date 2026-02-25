import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Footer } from '../home/components';
import Navbar from '../../components/Navbar';
import { useGetAllEventsQuery } from '~/cores/api';
import type { EventDetailDto } from '~/cores/api/types';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function formatDate(dateStr?: string) {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDay(dateStr?: string) {
    if (!dateStr) return '--';
    return new Date(dateStr).getDate().toString().padStart(2, '0');
}

function getMonth(dateStr?: string) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { month: 'short' });
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = {
        Active: 'Đang mở',
        Upcoming: 'Sắp diễn ra',
        Completed: 'Đã kết thúc',
        Cancelled: 'Đã hủy',
    };
    return map[status] ?? status;
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

function isValidUrl(url?: string) {
    if (!url || url === 'string') return false;
    try { new URL(url); return true; } catch { return false; }
}

/* ─── EventCardPublic ──────────────────────────────────────────────────────── */
function EventCardPublic({ event, onClick }: { event: EventDetailDto; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col"
        >
            {/* Image / Gradient Placeholder */}
            {isValidUrl(event.imageUrl) ? (
                <img
                    src={event.imageUrl}
                    alt={event.eventName}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Date badge strip */}
            <div className="bg-orange-500 text-white px-4 py-2 flex items-center gap-3">
                <div className="text-center min-w-[44px]">
                    <div className="text-2xl font-bold leading-none">{getDay(event.startDate)}</div>
                    <div className="text-xs uppercase tracking-wide">{getMonth(event.startDate)}</div>
                </div>
                <span className="text-orange-200 text-sm">→</span>
                <div className="text-sm text-orange-100">{formatDate(event.endDate)}</div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col gap-2">
                <span className={`self-start px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(event.status)}`}>
                    {getStatusLabel(event.status)}
                </span>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                    {event.eventName}
                </h3>

                {event.description && event.description !== 'string' && (
                    <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                )}

                {event.location && event.location !== 'string' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto">
                        <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg"
                >
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function EventSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="h-10 bg-orange-200" />
            <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
                <div className="h-10 bg-gray-200 rounded-xl mt-4" />
            </div>
        </div>
    );
}

/* ─── FILTER BAR ───────────────────────────────────────────────────────────── */
const STATUS_FILTERS = ['Tất cả', 'Upcoming', 'Active', 'Completed'];

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const PublicEventsPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 12;

    const { data: events = [], isLoading, error } = useGetAllEventsQuery({
        pageNumber: page,
        pageSize: PAGE_SIZE,
    });

    const filtered = events.filter((ev) => {
        const matchSearch = !search ||
            ev.eventName.toLowerCase().includes(search.toLowerCase()) ||
            (ev.location ?? '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Tất cả' || ev.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            {/* ── Hero Banner ── */}
            <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 pt-28 pb-12 px-6 md:px-12 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
                    <div className="absolute bottom-0 right-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                </div>
                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Sự kiện nổi bật
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                        Khám phá <span className="text-orange-500">Sự kiện</span> của UNI
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Tham gia các sự kiện hấp dẫn, kết nối với cộng đồng sinh viên và tạo nên những kỷ niệm đáng nhớ.
                    </p>
                </div>
            </section>

            {/* ── Filters ── */}
            <section className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 md:px-12 py-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm sự kiện, địa điểm..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                        />
                    </div>

                    {/* Status tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${statusFilter === s
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                                    }`}
                            >
                                {s === 'Upcoming' ? 'Sắp diễn ra' : s === 'Active' ? 'Đang mở' : s === 'Completed' ? 'Đã kết thúc' : s}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Event Grid ── */}
            <section className="flex-1 py-12 px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    {/* Count */}
                    {!isLoading && !error && (
                        <p className="text-sm text-gray-500 mb-6">
                            Tìm thấy <span className="font-semibold text-orange-500">{filtered.length}</span> sự kiện
                        </p>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <EventSkeleton key={i} />)}
                        </div>
                    )}

                    {/* Error */}
                    {error && !isLoading && (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tải được dữ liệu</h3>
                            <p className="text-gray-500 text-sm">Vui lòng thử lại sau.</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && filtered.length === 0 && (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có sự kiện nào</h3>
                            <p className="text-gray-500 text-sm">Hãy thử tìm kiếm khác hoặc xóa bộ lọc.</p>
                        </div>
                    )}

                    {/* Grid */}
                    {!isLoading && !error && filtered.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map((ev) => (
                                <EventCardPublic
                                    key={ev.eventId}
                                    event={ev}
                                    onClick={() => navigate(`/public/events/${ev.eventId}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && !error && events.length === PAGE_SIZE && (
                        <div className="flex justify-center gap-3 mt-12">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                ← Trang trước
                            </button>
                            <span className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium">
                                {page}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Trang sau →
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PublicEventsPage;
