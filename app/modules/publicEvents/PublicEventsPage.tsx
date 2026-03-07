import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Footer } from '../home/components';
import Navbar from '../../components/Navbar';
import { useGetAllEventsQuery } from '~/cores/api';
import { useGetClubsQuery } from '~/cores/api/clubApi';
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
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short' });
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = {
        PLANNED: 'Sắp diễn ra',
        REGISTRATION_OPEN: 'Đang mở đăng ký',
        ONGOING: 'Đang diễn ra',
        COMPLETED: 'Đã kết thúc',
        CANCELED: 'Đã hủy',
    };
    return map[status] ?? status;
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'PLANNED': return 'bg-blue-100 text-blue-700';
        case 'REGISTRATION_OPEN': return 'bg-green-100 text-green-700';
        case 'ONGOING': return 'bg-yellow-100 text-yellow-700';
        case 'COMPLETED': return 'bg-gray-100 text-gray-600';
        case 'CANCELED': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function isValidUrl(url?: string) {
    if (!url || url === 'string') return false;
    try { new URL(url); return true; } catch { return false; }
}

function isUpcomingWithin7Days(startDate?: string) {
    if (!startDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

/* ─── FILTER CONFIG ───────────────────────────────────────────────────────── */
type FilterKey = 'ALL' | 'UPCOMING_7D' | 'REGISTRATION_OPEN' | 'COMPLETED';

const STATUS_FILTERS: { key: FilterKey; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Tất cả', icon: 'fa-globe' },
    { key: 'UPCOMING_7D', label: 'Sắp diễn ra', icon: 'fa-clock' },
    { key: 'REGISTRATION_OPEN', label: 'Đang mở đăng ký', icon: 'fa-door-open' },
    { key: 'COMPLETED', label: 'Đã kết thúc', icon: 'fa-check-circle' },
];

/* ─── EventCardPublic ──────────────────────────────────────────────────────── */
function EventCardPublic({ event, clubName, onClick }: { event: EventDetailDto; clubName?: string; onClick: () => void }) {
    const canRegister = event.status === 'REGISTRATION_OPEN';

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col"
        >
            {/* Image / Gradient Placeholder */}
            <div className="relative">
                {isValidUrl(event.imageUrl) ? (
                    <img
                        src={event.imageUrl}
                        alt={event.eventName}
                        className="w-full h-48 object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <i className="fas fa-calendar-alt text-white text-4xl opacity-40" />
                    </div>
                )}
                {/* Status badge */}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(event.status)} shadow-sm`}>
                    {getStatusLabel(event.status)}
                </span>
                {/* Register badge */}
                {canRegister && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-sm animate-pulse">
                        <i className="fas fa-ticket-alt mr-1" />Đăng ký ngay
                    </span>
                )}
            </div>

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
                {clubName && (
                    <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
                        <i className="fas fa-building mr-1" />{clubName}
                    </span>
                )}

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                    {event.eventName}
                </h3>

                {event.description && event.description !== 'string' && (
                    <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                )}

                {event.location && event.location !== 'string' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto">
                        <i className="fas fa-map-marker-alt text-orange-500 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg ${canRegister
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                >
                    {canRegister ? 'Đăng ký tham gia' : 'Xem chi tiết'}
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
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
                <div className="h-10 bg-gray-200 rounded-xl mt-4" />
            </div>
        </div>
    );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const PublicEventsPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterKey>('ALL');
    const [clubFilter, setClubFilter] = useState<number | 'ALL'>('ALL');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 100; // fetch all for client-side filtering

    const { data: events = [], isLoading, error } = useGetAllEventsQuery({ pageNumber: 1, pageSize: PAGE_SIZE });
    const { data: clubs = [] } = useGetClubsQuery();

    // Build club id → name map
    const clubMap = useMemo(() => {
        const map: Record<number, string> = {};
        clubs.forEach((c: any) => { if (c.clubId && c.clubName) map[c.clubId] = c.clubName; });
        return map;
    }, [clubs]);

    // Get unique clubs that have events
    const clubsWithEvents = useMemo(() => {
        const ids = new Set<number>();
        events.forEach(ev => { if (ev.clubId) ids.add(ev.clubId); });
        return Array.from(ids).map(id => ({ id, name: clubMap[id] || `CLB #${id}` })).sort((a, b) => a.name.localeCompare(b.name));
    }, [events, clubMap]);

    // Filter events
    const filtered = useMemo(() => {
        return events.filter((ev) => {
            // search
            const matchSearch = !search ||
                ev.eventName.toLowerCase().includes(search.toLowerCase()) ||
                (ev.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (ev.description ?? '').toLowerCase().includes(search.toLowerCase());

            // status filter
            let matchStatus = true;
            switch (statusFilter) {
                case 'UPCOMING_7D':
                    matchStatus = (ev.status === 'PLANNED' || ev.status === 'REGISTRATION_OPEN') && isUpcomingWithin7Days(ev.startDate);
                    break;
                case 'REGISTRATION_OPEN':
                    matchStatus = ev.status === 'REGISTRATION_OPEN';
                    break;
                case 'COMPLETED':
                    matchStatus = ev.status === 'COMPLETED';
                    break;
                case 'ALL':
                default:
                    matchStatus = true;
            }

            // club filter
            const matchClub = clubFilter === 'ALL' || ev.clubId === clubFilter;

            return matchSearch && matchStatus && matchClub;
        });
    }, [events, search, statusFilter, clubFilter]);

    // Count per filter for badges
    const counts = useMemo(() => ({
        ALL: events.length,
        UPCOMING_7D: events.filter(ev => (ev.status === 'PLANNED' || ev.status === 'REGISTRATION_OPEN') && isUpcomingWithin7Days(ev.startDate)).length,
        REGISTRATION_OPEN: events.filter(ev => ev.status === 'REGISTRATION_OPEN').length,
        COMPLETED: events.filter(ev => ev.status === 'COMPLETED').length,
    }), [events]);

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
                        <i className="fas fa-calendar-alt" />
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
                <div className="max-w-7xl mx-auto space-y-3">
                    {/* Row 1: Search + Club dropdown */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sự kiện, địa điểm..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                            />
                        </div>

                        {/* Club filter */}
                        <div className="relative">
                            <i className="fas fa-building absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                            <select
                                value={clubFilter === 'ALL' ? 'ALL' : clubFilter}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setClubFilter(v === 'ALL' ? 'ALL' : Number(v));
                                    setPage(1);
                                }}
                                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 appearance-none cursor-pointer min-w-[200px]"
                            >
                                <option value="ALL">Tất cả câu lạc bộ</option>
                                {clubsWithEvents.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                        </div>
                    </div>

                    {/* Row 2: Status tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setStatusFilter(f.key); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${statusFilter === f.key
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                                    }`}
                            >
                                <i className={`fas ${f.icon} text-xs`} />
                                {f.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {counts[f.key]}
                                </span>
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
                            {statusFilter !== 'ALL' && <span> · {STATUS_FILTERS.find(f => f.key === statusFilter)?.label}</span>}
                            {clubFilter !== 'ALL' && <span> · {clubMap[clubFilter as number] || `CLB #${clubFilter}`}</span>}
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
                                <i className="fas fa-exclamation-circle text-red-500 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tải được dữ liệu</h3>
                            <p className="text-gray-500 text-sm">Vui lòng thử lại sau.</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && filtered.length === 0 && (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-calendar-times text-orange-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có sự kiện nào</h3>
                            <p className="text-gray-500 text-sm">Hãy thử tìm kiếm khác hoặc xóa bộ lọc.</p>
                            {(statusFilter !== 'ALL' || clubFilter !== 'ALL' || search) && (
                                <button
                                    onClick={() => { setStatusFilter('ALL'); setClubFilter('ALL'); setSearch(''); }}
                                    className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm transition"
                                >
                                    <i className="fas fa-times mr-1" />Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    )}

                    {/* Grid */}
                    {!isLoading && !error && filtered.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map((ev) => (
                                <EventCardPublic
                                    key={ev.eventId}
                                    event={ev}
                                    clubName={ev.clubId ? clubMap[ev.clubId] : undefined}
                                    onClick={() => navigate(`/public/events/${ev.eventId}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PublicEventsPage;
