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
import { getClubId } from '~/utils/auth';
import { EventCard } from '~/modules/events/components/EventCard';

export default function EventsPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { isAdmin } = useCurrentUser();
    const { isClubManager } = useClubRole();
    const cookieClubId = getClubId();

    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 12;
    const [selectedClubId, setSelectedClubId] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: allEvents, isLoading, error } = useGetAllEventsQuery({ pageNumber, pageSize: 100 });
    const { data: clubs } = useGetClubsQuery(undefined, { skip: !isAdmin });

    // Filter events based on role
    const filteredEvents = useMemo(() => {
        if (!allEvents) return [];

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

    // Apply text search
    const searchFiltered = useMemo(() => {
        if (!searchTerm.trim()) return filteredEvents;
        const q = searchTerm.toLowerCase();
        return filteredEvents.filter(e =>
            e.eventName.toLowerCase().includes(q) ||
            (e.location ?? '').toLowerCase().includes(q) ||
            (e.description ?? '').toLowerCase().includes(q)
        );
    }, [filteredEvents, searchTerm]);

    // Paginate the filtered results
    const paginatedEvents = useMemo(() => {
        const start = (pageNumber - 1) * pageSize;
        return searchFiltered.slice(start, start + pageSize);
    }, [searchFiltered, pageNumber, pageSize]);

    const totalPages = Math.ceil(searchFiltered.length / pageSize);

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
                            {isClubManager && !isAdmin ? 'Sự kiện CLB' : 'All Events'}
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

                        {/* Show club badge for manager */}
                        {isClubManager && !isAdmin && cookieClubId > 0 && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                Club ID: {cookieClubId}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/events/create')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        Create Event
                    </button>
                </div>

                {/* Search bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(1); }}
                            placeholder="Tìm kiếm sự kiện..."
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDark
                                ? 'bg-[#242838] border-gray-600 text-white focus:border-blue-500 placeholder-gray-500'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400'
                            }`}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        )}
                    </div>
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
                                : 'No events found'}
                        </p>
                        <button
                            onClick={() => navigate('/events/create')}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Hiển thị {paginatedEvents.length} / {searchFiltered.length} sự kiện
                            {searchTerm && <span> · tìm kiếm: "{searchTerm}"</span>}
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
                            <div className="flex justify-center gap-2 mt-8 items-center">
                                <button
                                    onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                    disabled={pageNumber === 1}
                                    className={`px-4 py-2 rounded-lg ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                        } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span className={`px-4 py-2 ${textClass}`}>
                                    Trang {pageNumber} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                                    disabled={pageNumber >= totalPages}
                                    className={`px-4 py-2 rounded-lg ${isDark
                                        ? 'bg-[#242838] text-white hover:bg-[#2c3e50]'
                                        : 'bg-white text-gray-900 hover:bg-gray-100'
                                        } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
