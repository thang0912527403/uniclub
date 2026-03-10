import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllEventsQuery } from '~/cores/api';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { EventCard } from '~/modules/events/components/EventCard';

export default function EventsPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 12;

    const { data: events, isLoading, error } = useGetAllEventsQuery({ pageNumber, pageSize });

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
            />

            <HeaderBar
                title="Events"
                breadcrumb="Pages / Events / All Events"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                }`}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className={`text-3xl font-bold ${textClass}`}>All Events</h1>
                    <button
                        onClick={() => navigate('/events/create')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        Create Event
                    </button>
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
                        {error && 'error' in error && (
                            <p className="text-red-500 text-xs mt-2">
                                {JSON.stringify(error.error)}
                            </p>
                        )}
                        <details className="mt-3 text-xs">
                            <summary className="cursor-pointer text-red-700 font-medium">Debug Info</summary>
                            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
                                {JSON.stringify(error, null, 2)}
                            </pre>
                        </details>
                    </div>
                ) : events && events.length === 0 ? (
                    <div className={`${cardClass} rounded-lg p-12 text-center`}>
                        <i className="fas fa-calendar-times text-6xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500 text-lg mb-4">No events found</p>
                        <button
                            onClick={() => navigate('/events/create')}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events?.map((event) => (
                                <EventCard
                                    key={event.eventId}
                                    event={event}
                                    isDark={isDark}
                                    onClick={() => navigate(`/events/${event.eventId}`)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {events && events.length >= pageSize && (
                            <div className="flex justify-center gap-2 mt-8">
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
                                    Page {pageNumber}
                                </span>
                                <button
                                    onClick={() => setPageNumber(prev => prev + 1)}
                                    disabled={events.length < pageSize}
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
