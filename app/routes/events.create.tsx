import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateEventMutation } from '~/cores/api';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { EventForm } from '~/modules/events/components/EventForm';
import { useClubRole } from '~/hooks/useClubRole';

export default function CreateEventPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [isSidebarDark, setIsSidebarDark] = useState(true);
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { clubManagerMembership } = useClubRole();

    const [createEvent, { isLoading }] = useCreateEventMutation();
    const [error, setError] = useState<string | null>(null);

    const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-gray-900';

    const apiStatuses = [
        { name: 'Create Event', isLoading },
    ];

    const handleSubmit = async (data: any) => {
        try {
            setError(null);
            const result = await createEvent(data).unwrap();
            // Navigate to the created event's detail page
            navigate(`/events/${result.eventId}`);
        } catch (err: any) {
            console.error('Failed to create event:', err);
            setError(err?.data?.error || err?.error || 'Failed to create event');
        }
    };

    const handleCancel = () => {
        navigate('/events');
    };

    return (
        <div className="min-h-screen">
            <ApiStatusButton
                apiStatuses={apiStatuses}
                isDark={isDark}
                onThemeToggle={toggleTheme}
                position="bottom-right"
            />

            <Sidebar
                isDark={isSidebarDark}
                currentPath="/events/create"
                onToggleSidebarTheme={() => setIsSidebarDark(!isSidebarDark)}
                isOpen={isSidebarOpen}
            />

            <HeaderBar
                isDark={isDark}
                title="Create Event"
                breadcrumb="Pages / Events / Create Event"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                }`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate('/events')}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                } transition-colors`}
                        >
                            <i className={`fas fa-arrow-left ${textClass}`}></i>
                        </button>
                        <h1 className={`text-3xl font-bold ${textClass}`}>Create New Event</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-exclamation-circle text-red-500"></i>
                                <p className="text-red-800 font-semibold">Error creating event</p>
                            </div>
                            <p className="text-red-600 text-sm mt-2">{error}</p>
                        </div>
                    )}

                    <div className={`${cardClass} rounded-lg shadow-md p-6`}>
                        <EventForm
                            initialData={{ clubId: clubManagerMembership?.clubId }}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            isDark={isDark}
                            mode="create"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
