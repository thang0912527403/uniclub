import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import Navbar from '~/components/Navbar';
import { Footer } from '~/modules/home/components';
import { useGetMyEventsQuery, type MyEventItem } from '~/cores/api/eventApi';
import { MyEventCard } from './components/MyEventCard';
import { CheckInModal } from './components/CheckInModal';
import { QrCodeModal } from './components/QrCodeModal';

const STATUS_FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'ONGOING', label: 'Đang diễn ra' },
    { key: 'REGISTRATION_OPEN', label: 'Mở đăng ký' },
    { key: 'PLANNED', label: 'Sắp tới' },
    { key: 'COMPLETED', label: 'Đã kết thúc' },
];

const REGISTRATION_STATUS_FILTERS = [
    { key: 'all', label: 'Tất cả', icon: '' },
    { key: 'PENDING', label: 'Chờ duyệt', icon: 'fas fa-clock' },
    { key: 'REGISTERED', label: 'Đã đăng ký', icon: 'fas fa-check-circle' },
    { key: 'WAITLIST', label: 'Danh sách chờ', icon: 'fas fa-list-ol' },
    { key: 'CHECKED_IN', label: 'Đã điểm danh', icon: 'fas fa-map-marker-alt' },
    { key: 'REJECTED', label: 'Bị từ chối', icon: 'fas fa-ban' },
];

const PAGE_SIZE = 9;

export default function MyEventsPage() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [regStatusFilter, setRegStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Check-in modal state
    const [checkInEvent, setCheckInEvent] = useState<MyEventItem | null>(null);
    // QR modal state
    const [qrEvent, setQrEvent] = useState<MyEventItem | null>(null);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isFetching } = useGetMyEventsQuery({
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
    });

    const events = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Client-side status + registration status filter
    const filteredEvents = useMemo(() => {
        let result = events;
        if (statusFilter !== 'all') {
            result = result.filter((e) => e.status === statusFilter);
        }
        if (regStatusFilter !== 'all') {
            result = result.filter((e) => e.attendanceStatus === regStatusFilter);
        }
        return result;
    }, [events, statusFilter, regStatusFilter]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="pt-24 pb-16 flex-1">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            📅 Sự kiện của tôi
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Xem tất cả sự kiện bạn tham gia hoặc quản lý — thực hiện nhanh các tác vụ điểm danh, check-in.
                        </p>
                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm sự kiện theo tên..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Status filter tabs */}
                        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => { setStatusFilter(f.key); }}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                                        statusFilter === f.key
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Registration status filter */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="text-xs text-gray-400 font-medium self-center mr-1">Trạng thái đăng ký:</span>
                        {REGISTRATION_STATUS_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setRegStatusFilter(f.key); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                                    regStatusFilter === f.key
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                                }`}
                            >
                                {f.icon && <i className={`${f.icon} mr-1 text-[10px]`} />}{f.label}
                            </button>
                        ))}
                    </div>
                    {/* Loading */}
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                    <div className="h-40 bg-gray-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && filteredEvents.length === 0 && (
                        <div className="flex flex-col items-center py-20">
                            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">
                                {debouncedSearch ? 'Không tìm thấy sự kiện' : 'Chưa có sự kiện nào'}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                                {debouncedSearch
                                    ? `Không có kết quả cho "${debouncedSearch}". Hãy thử từ khóa khác.`
                                    : 'Bạn chưa đăng ký hoặc tham gia sự kiện nào. Khám phá các sự kiện đang diễn ra!'
                                }
                            </p>
                            <Link
                                to="/public/events"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
                            >
                                Xem sự kiện công khai →
                            </Link>
                        </div>
                    )}

                    {/* Event grid */}
                    {!isLoading && filteredEvents.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-400">
                                    Hiển thị {filteredEvents.length} / {total} sự kiện
                                    {isFetching && <span className="ml-2 text-orange-400">đang tải...</span>}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((event) => (
                                    <MyEventCard
                                        key={event.eventId}
                                        event={event}
                                        onCheckIn={setCheckInEvent}
                                        onShowQr={setQrEvent}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Trước
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                        .map((p, idx, arr) => (
                                            <React.Fragment key={p}>
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="px-2 text-gray-300">…</span>
                                                )}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={`w-10 h-10 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                                        p === page
                                                            ? 'bg-orange-500 text-white shadow-md'
                                                            : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        ))}

                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CheckInModal
                eventId={checkInEvent?.eventId ?? 0}
                eventName={checkInEvent?.eventName ?? ''}
                isOpen={!!checkInEvent}
                onClose={() => setCheckInEvent(null)}
            />
            <QrCodeModal
                eventId={qrEvent?.eventId ?? 0}
                eventName={qrEvent?.eventName ?? ''}
                isOpen={!!qrEvent}
                onClose={() => setQrEvent(null)}
            />

            <Footer />
        </div>
    );
}
