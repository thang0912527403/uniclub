import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number; // ms, default 4000
}

/* ─────────── Context ─────────── */
interface NotificationContextValue {
    show: (item: Omit<NotificationItem, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>');
    return ctx;
}

/* ─────────── Single Toast ─────────── */
const ICONS: Record<NotificationType, string> = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
};

const COLORS: Record<NotificationType, { bg: string; icon: string; bar: string }> = {
    success: {
        bg: 'bg-white dark:bg-gray-800 border-l-4 border-green-500',
        icon: 'text-green-500',
        bar: 'bg-green-500',
    },
    error: {
        bg: 'bg-white dark:bg-gray-800 border-l-4 border-red-500',
        icon: 'text-red-500',
        bar: 'bg-red-500',
    },
    warning: {
        bg: 'bg-white dark:bg-gray-800 border-l-4 border-yellow-500',
        icon: 'text-yellow-500',
        bar: 'bg-yellow-500',
    },
    info: {
        bg: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500',
        icon: 'text-blue-500',
        bar: 'bg-blue-500',
    },
};

function Toast({
    item,
    onRemove,
}: {
    item: NotificationItem;
    onRemove: (id: string) => void;
}) {
    const duration = item.duration ?? 4000;
    const color = COLORS[item.type];
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    // Slide-in
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Progress bar + auto-dismiss
    useEffect(() => {
        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const elapsed = now - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(pct);
            if (elapsed < duration) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                handleClose();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(() => onRemove(item.id), 300);
    }, [item.id, onRemove]);

    return (
        <div
            className={`
        ${color.bg} rounded-xl shadow-xl w-80 overflow-hidden
        transform transition-all duration-300 ease-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div className="flex items-start gap-3 p-4">
                <i className={`fas ${ICONS[item.type]} ${color.icon} text-xl mt-0.5`}></i>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    {item.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.message}</p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
                >
                    <i className="fas fa-times text-sm"></i>
                </button>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-700">
                <div
                    className={`h-full ${color.bar} transition-none`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

/* ─────────── Provider ─────────── */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<NotificationItem[]>([]);

    const show = useCallback((item: Omit<NotificationItem, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { ...item, id }]);
    }, []);

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ show }}>
            {children}
            {/* Toast container - fixed top-right */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast item={t} onRemove={remove} />
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}
