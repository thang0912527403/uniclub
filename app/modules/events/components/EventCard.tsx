interface EventCardProps {
    event: {
        eventId: number;
        eventName: string;
        description: string;
        imageUrl?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        status: string;
    };
    isDark?: boolean;
    onClick?: () => void;
}

export function EventCard({ event, isDark = false, onClick }: EventCardProps) {
    const isValidUrl = (url?: string) => {
        if (!url || url === 'string' || url.trim() === '') return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            PLANNED: 'bg-blue-100 text-blue-800',
            REGISTRATION_OPEN: 'bg-green-100 text-green-800',
            REGISTRATION_CLOSED: 'bg-gray-200 text-gray-700',
            ONGOING: 'bg-yellow-100 text-yellow-800',
            ENDED: 'bg-gray-100 text-gray-600',
            CANCELED: 'bg-red-100 text-red-800',
        };
        return map[status] ?? 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PLANNED: 'Sắp diễn ra',
            REGISTRATION_OPEN: 'Đang mở đăng ký',
            REGISTRATION_CLOSED: 'Đã đóng đăng ký',
            ONGOING: 'Đang diễn ra',
            ENDED: 'Đã kết thúc',
            CANCELED: 'Đã huỷ',
        };
        return labels[status] ?? status;
    };

    const cardBg = isDark ? 'bg-[#242838]' : 'bg-white';
    const titleColor = isDark ? 'text-white' : 'text-gray-900';
    const descColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const metaColor = isDark ? 'text-gray-400' : 'text-gray-500';

    return (
        <div
            onClick={onClick}
            className={`${cardBg} rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer`}
        >
            {isValidUrl(event.imageUrl) ? (
                <img
                    src={event.imageUrl}
                    alt={event.eventName}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-white text-4xl opacity-50"></i>
                </div>
            )}

            <div className="p-4">
                <h2 className={`text-xl font-semibold mb-2 line-clamp-1 ${titleColor}`}>{event.eventName}</h2>
                <p className={`${descColor} text-sm mb-3 line-clamp-2`}>
                    {event.description && event.description !== 'string'
                        ? event.description
                        : 'No description available'}
                </p>

                <div className="space-y-2 text-sm">
                    {event.location && event.location !== 'string' && (
                        <div className={`flex items-center ${metaColor}`}>
                            <i className="fas fa-map-marker-alt mr-2 w-4"></i>
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}

                    <div className={`flex items-center ${metaColor}`}>
                        <i className="fas fa-calendar mr-2 w-4"></i>
                        <span>
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </span>
                    </div>

                    <div className="flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(event.status)}`}>
                            {event.status && event.status !== 'string' ? getStatusLabel(event.status) : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
