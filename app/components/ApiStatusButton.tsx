import { useState, useRef, useEffect } from 'react';

interface ApiStatus {
    name: string;
    isLoading: boolean;
}

interface ApiStatusButtonProps {
    apiStatuses: ApiStatus[];
    isDark: boolean;
    onThemeToggle: () => void;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positionClasses: Record<NonNullable<ApiStatusButtonProps['position']>, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
};

export function ApiStatusButton({
    apiStatuses,
    isDark,
    onThemeToggle,
    position = 'bottom-right',
}: ApiStatusButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const isAnyLoading = apiStatuses.some((s) => s.isLoading);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className={`fixed ${positionClasses[position]} z-50`} ref={ref}>
            {/* Popup */}
            {isOpen && (
                <div
                    className={`absolute bottom-16 right-0 w-72 rounded-lg shadow-2xl border overflow-hidden ${isDark
                        ? 'bg-[#242838] border-gray-700 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    {/* Header */}
                    <div
                        className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
                            }`}
                    >
                        <h3 className="text-sm font-bold">
                            <i className="fas fa-server mr-2" />
                            API Status
                        </h3>
                    </div>

                    {/* Status list */}
                    <div className="py-2">
                        {apiStatuses.map((status) => (
                            <div
                                key={status.name}
                                className={`flex items-center justify-between px-4 py-2 text-sm ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <span>{status.name}</span>
                                {status.isLoading ? (
                                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                        <i className="fas fa-spinner fa-spin" />
                                        Loading…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-green-400 text-xs">
                                        <i className="fas fa-check-circle" />
                                        Ready
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Theme toggle */}
                    <div
                        className={`px-4 py-3 border-t flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'
                            }`}
                    >
                        <span className="text-xs font-medium">
                            <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'} mr-2`} />
                            {isDark ? 'Dark mode' : 'Light mode'}
                        </span>
                        <button
                            onClick={onThemeToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                            aria-label="Toggle theme"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating button */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                title="API Status"
                aria-label="API Status"
                className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer ${isAnyLoading
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
            >
                <i className={`fas ${isAnyLoading ? 'fa-spinner fa-spin' : 'fa-server'} text-lg`} />
                {isAnyLoading && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                )}
            </button>
        </div>
    );
}
