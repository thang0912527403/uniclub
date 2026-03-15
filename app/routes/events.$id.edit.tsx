import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useGetEventByIdQuery, useUpdateEventMutation } from '~/cores/api';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { EventForm } from '~/modules/events/components/EventForm';

export default function EditEventPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

    const { data: event, isLoading: isLoadingEvent } = useGetEventByIdQuery(Number(id));
    const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
    const [error, setError] = useState<string | null>(null);

    const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-gray-900';

    const apiStatuses = [
        { name: 'Event Details', isLoading: isLoadingEvent },
        { name: 'Update Event', isLoading: isUpdating },
    ];

    const handleSubmit = async (data: any) => {
        try {
            setError(null);
            await updateEvent(data).unwrap();
            navigate(`/events/${id}`);
        } catch (err: any) {
            console.error('Failed to update event:', err);
            setError(err?.data?.error || err?.error || 'Failed to update event');
        }
    };

    const handleCancel = () => {
        navigate(`/events/${id}`);
    };

    if (isLoadingEvent) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} onClose={toggleSidebar} />
                <HeaderBar title="Edit Event" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bgClass} min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
                        <div className="h-12 bg-gray-300 rounded"></div>
                        <div className="h-64 bg-gray-300 rounded"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen">
                <Sidebar currentPath="/events" isOpen={isSidebarOpen} onClose={toggleSidebar} />
                <HeaderBar title="Edit Event" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bgClass} min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                        <h3 className="text-red-800 font-semibold">Event not found</h3>
                    </div>
                </main>
            </div>
        );
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
                title="Edit Event"
                breadcrumb={`Pages / Events / ${event.eventName} / Edit`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'
                }`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate(`/events/${id}`)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                } transition-colors`}
                        >
                            <i className={`fas fa-arrow-left ${textClass}`}></i>
                        </button>
                        <h1 className={`text-3xl font-bold ${textClass}`}>Edit Event</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-exclamation-circle text-red-500"></i>
                                <p className="text-red-800 font-semibold">Error updating event</p>
                            </div>
                            <p className="text-red-600 text-sm mt-2">{error}</p>
                        </div>
                    )}

                    <div className={`${cardClass} rounded-lg shadow-md p-6`}>
                        <EventForm
                            initialData={event}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isUpdating}
                            isDark={isDark}
                            mode="edit"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
