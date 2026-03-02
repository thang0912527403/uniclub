interface SessionListProps {
    sessions: Array<{
        scheduleId: number;
        scheduleName: string;
        startTime?: string;
        endTime?: string;
        location?: string;
        description?: string;
    }>;
    isDark?: boolean;
}

export function SessionList({ sessions, isDark = false }: SessionListProps) {
    const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-gray-900';
    const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-600';

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    if (sessions.length === 0) {
        return (
            <div className={`${cardClass} rounded-lg p-8 text-center`}>
                <i className="fas fa-calendar-times text-4xl text-gray-400 mb-3"></i>
                <p className={textSecondaryClass}>No sessions scheduled yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session, index) => (
                <div
                    key={session.scheduleId}
                    className={`${cardClass} rounded-lg shadow-md p-4 border-l-4 border-blue-500`}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">{index + 1}</span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>
                                {session.scheduleName}
                            </h3>

                            {session.description && session.description !== 'string' && (
                                <p className={`text-sm mb-3 ${textSecondaryClass}`}>
                                    {session.description}
                                </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <i className={`fas fa-clock ${textSecondaryClass}`}></i>
                                    <div>
                                        <div className={textSecondaryClass}>Start</div>
                                        <div className={textClass}>{formatDateTime(session.startTime)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <i className={`fas fa-clock ${textSecondaryClass}`}></i>
                                    <div>
                                        <div className={textSecondaryClass}>End</div>
                                        <div className={textClass}>{formatDateTime(session.endTime)}</div>
                                    </div>
                                </div>
                            </div>

                            {session.location && session.location !== 'string' && (
                                <div className={`flex items-center gap-2 mt-3 text-sm ${textSecondaryClass}`}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{session.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
