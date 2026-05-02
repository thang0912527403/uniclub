import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllEventsQuery } from '~/cores/api';
import { useGetClubsQuery } from '~/cores/api/clubApi';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';
import { useClubPolicy } from '~/hooks/useClubPolicy';
import { getClubId } from '~/utils/auth';
import { EventCard } from '~/modules/events/components/EventCard';

export default function EventsPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { isAdmin } = useCurrentUser();
    const { isClubManager, currentClub } = useClubRole();
    const { canCreateEvent } = useClubPolicy();
    const cookieClubId = getClubId();

    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const pageSizeOptions = [6, 12, 24, 48];
    const [selectedClubId, setSelectedClubId] = useState<number | 'all'>('all');

    const { data: rawEvents, isLoading, error } = useGetAllEventsQuery({ pageNumber: 1, pageSize: 100 });
    const { data: clubsData } = useGetClubsQuery({ pageIndex: '1', searchQuery: '', pageSize: '100' }, { skip: !isAdmin });
    const clubs = clubsData?.data;
    const allEvents = Array.isArray(rawEvents) ? rawEvents : (rawEvents?.items ?? []);

    // Filter events based on role
    const filteredEvents = useMemo(() => {
        if (!allEvents.length) return [];

        // Club Manager → only their club's events (clubId from cookie set by /manage-clubs)
        if (isClubManager && !isAdmin && cookieClubId) {
            return allEvents.filter(e => e.clubId === cookieClubId);
        }

        // Admin with club filter
        if (isAdmin && selectedClubId !== 'all') {
            return allEvents.filter(e => e.clubId === selectedClubId);
        }

        // Admin with 'all' → show everything
        return allEvents;
    }, [allEvents, isAdmin, isClubManager, cookieClubId, selectedClubId]);

    // Paginate the filtered results
    const paginatedEvents = useMemo(() => {
        const start = (pageNumber - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, pageNumber, pageSize]);

    const totalPages = Math.ceil(filteredEvents.length / pageSize);

    const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-gray-900';

    const apiStatuses = [
        { name: 'Events', isLoading },
    ];

    if (error) {
        console.error('API Error:', error);
    }

    return (
        <div className="min-h-screen">
            <ApiStatusButton
                apiStatuses={apiStatuses}
                isDark={isDark}
                onThemeToggle={toggleTheme}
                position="bottom-right"
            />

            <Sidebar
                currentPath="/events"
                isOpen={isSidebarOpen}
                onClose={toggleSidebar}
            />

            <HeaderBar
                title="Events"
                breadcrumb="Pages / Events / All Events"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'
                }`}>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h1 className={`text-3xl font-bold ${textClass}`}>
                            {isClubManager && !isAdmin ? `Sự kiện ${currentClub?.clubName || 'CLB'}` : 'All Events'}
                        </h1>

                        {/* Admin club filter dropdown */}
                        {isAdmin && clubs && clubs.length > 0 && (
                            <select
                                value={selectedClubId}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setSelectedClubId(v === 'all' ? 'all' : Number(v));
                                    setPageNumber(1);
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm ${isDark
                                    ? 'bg-[#242838] text-white border-gray-600'
                                    : 'bg-white text-gray-900 border-gray-300'
                                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                            >
                                <option value="all">Tất cả CLB</option>
                                {clubs.map(club => (
                                    <option key={club.clubId} value={club.clubId}>
                                        {club.clubName}
                                    </option>
                                ))}
                            </select>
                        )}

                    </div>

                    {canCreateEvent && (
                        <button
                            onClick={() => navigate('/events/create')}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Tạo sự kiện
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`${cardClass} rounded-lg shadow-md overflow-hidden animate-pulse`}>
                                <div className="w-full h-48 bg-gray-300"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                        <h3 className="text-red-800 font-semibold">Error loading events</h3>
                        <p className="text-red-600 text-sm mt-2">
                            {error && 'status' in error ? `Error ${error.status}` : 'Error PARSING_ERROR'}
                        </p>
                    </div>
                ) : paginatedEvents.length === 0 ? (
                    <div className={`${cardClass} rounded-lg p-12 text-center`}>
                        <i className="fas fa-calendar-times text-6xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500 text-lg mb-4">
                            {isAdmin && selectedClubId !== 'all'
                                ? 'Câu lạc bộ này chưa có sự kiện nào'
                                : 'Chưa có sự kiện nào'}
                        </p>
                        {canCreateEvent && (
                            <button
                                onClick={() => navigate('/events/create')}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Tạo sự kiện đầu tiên
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Event count badge */}
                        <div className={`mb-4 text-sm flex items-center justify-between ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>Hiển thị {Math.min((pageNumber - 1) * pageSize + 1, filteredEvents.length)}-{Math.min(pageNumber * pageSize, filteredEvents.length)} / {filteredEvents.length} sự kiện</span>
                            <div className="flex items-center gap-2">
                                <span>Hiển thị:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
                                    className={`px-2 py-1 rounded border text-sm ${isDark
                                        ? 'bg-[#242838] text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'
                                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                                >
                                    {pageSizeOptions.map(size => (
                                        <option key={size} value={size}>{size} / trang</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedEvents.map((event) => (
                                <EventCard
                                    key={event.eventId}
                                    event={event}
                                    isDark={isDark}
                                    onClick={() => navigate(`/events/${event.eventId}`)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-1 mt-8 items-center">
                                <button
                                    onClick={() => setPageNumber(1)}
                                    disabled={pageNumber === 1}
                                    className={`px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-angles-left"></i>
                                </button>
                                <button
                                    onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                    disabled={pageNumber === 1}
                                    className={`px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 1)
                                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        typeof p === 'string' ? (
                                            <span key={`dots-${i}`} className={`px-2 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>...</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPageNumber(p)}
                                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    pageNumber === p
                                                        ? 'bg-blue-500 text-white font-semibold'
                                                        : isDark
                                                            ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                                            : 'bg-white text-gray-900 hover:bg-gray-100'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                                    disabled={pageNumber >= totalPages}
                                    className={`px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                                <button
                                    onClick={() => setPageNumber(totalPages)}
                                    disabled={pageNumber >= totalPages}
                                    className={`px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-angles-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
