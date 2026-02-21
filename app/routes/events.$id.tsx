import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    useGetEventByIdQuery,
    useCreateSessionMutation,
    useOpenRegistrationMutation
} from '~/cores/api';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { SessionList } from '~/modules/events/components/SessionList';
import { SessionForm } from '~/modules/events/components/SessionForm';
import { RegistrationForm } from '~/modules/events/components/RegistrationForm';

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [isSidebarDark, setIsSidebarDark] = useState(true);
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);

    const { data: event, isLoading, error } = useGetEventByIdQuery(Number(id));
    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [openRegistration, { isLoading: isOpeningRegistration }] = useOpenRegistrationMutation();

    const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
    const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-gray-900';
    const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-600';

    const apiStatuses = [
        { name: 'Event Details', isLoading },
    ];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('ongoing')) {
            return 'bg-green-100 text-green-800';
        } else if (statusLower.includes('upcoming') || statusLower.includes('planned')) {
            return 'bg-blue-100 text-blue-800';
        } else if (statusLower.includes('completed') || statusLower.includes('finished')) {
            return 'bg-gray-100 text-gray-800';
        } else if (statusLower.includes('cancelled')) {
            return 'bg-red-100 text-red-800';
        }
        return 'bg-gray-100 text-gray-800';
    };

    const handleCreateSession = async (data: any) => {
        try {
            await createSession(data).unwrap();
            setShowSessionForm(false);
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const handleOpenRegistration = async (data: any) => {
        try {
            await openRegistration(data).unwrap();
            setShowRegistrationForm(false);
        } catch (err) {
            console.error('Failed to open registration:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Sidebar isDark={isSidebarDark} currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar isDark={isDark} title="Event Details" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bgClass} min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                    <div className="animate-pulse space-y-4">
                        <div className="h-64 bg-gray-300 rounded"></div>
                        <div className="h-48 bg-gray-300 rounded"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen">
                <Sidebar isDark={isSidebarDark} currentPath="/events" isOpen={isSidebarOpen} />
                <HeaderBar isDark={isDark} title="Event Details" isSidebarOpen={isSidebarOpen} />
                <main className={`pt-24 p-6 ${bgClass} min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                        <h3 className="text-red-800 font-semibold">Error loading event</h3>
                        <p className="text-red-600 text-sm mt-2">Event not found or failed to load</p>
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
                isDark={isSidebarDark}
                currentPath="/events"
                onToggleSidebarTheme={() => setIsSidebarDark(!isSidebarDark)}
                isOpen={isSidebarOpen}
            />

            <HeaderBar
                isDark={isDark}
                title="Event Details"
                breadcrumb={`Pages / Events / ${event.eventName}`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                }`}>
                <div className="max-w-6xl mx-auto">
                    {/* Back button */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate('/events')}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                } transition-colors`}
                        >
                            <i className={`fas fa-arrow-left ${textClass}`}></i>
                        </button>
                    </div>

                    {/* Event Header */}
                    <div className={`${cardClass} rounded-lg shadow-md overflow-hidden mb-6`}>
                        {event.imageUrl && event.imageUrl !== 'string' && (
                            <img
                                src={event.imageUrl}
                                alt={event.eventName}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>{event.eventName}</h1>
                                    <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusColor(event.status)}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/events/${event.eventId}/edit`)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                    >
                                        <i className="fas fa-edit"></i>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowRegistrationForm(true)}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                                    >
                                        <i className="fas fa-door-open"></i>
                                        Open Registration
                                    </button>
                                </div>
                            </div>

                            <p className={`text-lg mb-6 ${textSecondaryClass}`}>{event.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {event.location && event.location !== 'string' && (
                                    <div className="flex items-center gap-3">
                                        <i className={`fas fa-map-marker-alt text-xl ${textSecondaryClass}`}></i>
                                        <div>
                                            <div className={`text-xs ${textSecondaryClass}`}>Location</div>
                                            <div className={textClass}>{event.location}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <i className={`fas fa-calendar-check text-xl ${textSecondaryClass}`}></i>
                                    <div>
                                        <div className={`text-xs ${textSecondaryClass}`}>Start Date</div>
                                        <div className={textClass}>{formatDate(event.startDate)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <i className={`fas fa-calendar-times text-xl ${textSecondaryClass}`}></i>
                                    <div>
                                        <div className={`text-xs ${textSecondaryClass}`}>End Date</div>
                                        <div className={textClass}>{formatDate(event.endDate)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sessions Section */}
                    <div className={`${cardClass} rounded-lg shadow-md p-6 mb-6`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-bold ${textClass}`}>
                                Sessions ({event.sessions?.length || 0})
                            </h2>
                            <button
                                onClick={() => setShowSessionForm(!showSessionForm)}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                            >
                                <i className={`fas fa-${showSessionForm ? 'times' : 'plus'}`}></i>
                                {showSessionForm ? 'Cancel' : 'Add Session'}
                            </button>
                        </div>

                        {showSessionForm && (
                            <div className="mb-6 p-4 border border-gray-300 rounded-lg">
                                <SessionForm
                                    eventId={event.eventId}
                                    onSubmit={handleCreateSession}
                                    onCancel={() => setShowSessionForm(false)}
                                    isLoading={isCreatingSession}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        <SessionList sessions={event.sessions || []} isDark={isDark} />
                    </div>

                    {/* Registration Form Modal */}
                    {showRegistrationForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className={`${cardClass} rounded-lg shadow-xl p-6 max-w-2xl w-full`}>
                                <h2 className={`text-2xl font-bold mb-4 ${textClass}`}>Open Registration</h2>
                                <RegistrationForm
                                    eventId={event.eventId}
                                    onSubmit={handleOpenRegistration}
                                    onCancel={() => setShowRegistrationForm(false)}
                                    isLoading={isOpeningRegistration}
                                    isDark={isDark}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
