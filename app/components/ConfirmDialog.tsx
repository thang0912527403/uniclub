import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    isLoading?: boolean;
}

const TYPE_CONFIG = {
    warning: {
        icon: 'fa-exclamation-triangle',
        iconBg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
        confirmBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
        ring: 'ring-yellow-500/30',
    },
    danger: {
        icon: 'fa-exclamation-circle',
        iconBg: 'bg-gradient-to-br from-red-400 to-rose-500',
        confirmBg: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
        ring: 'ring-red-500/30',
    },
    info: {
        icon: 'fa-info-circle',
        iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        confirmBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
        ring: 'ring-blue-500/30',
    },
};

export function ConfirmDialog({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'warning',
    isLoading = false,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const cfg = TYPE_CONFIG[type];

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, isLoading, onCancel]);

    // Focus trap
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
                onClick={() => !isLoading && onCancel()}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={`
                    relative w-full max-w-md
                    bg-white dark:bg-gray-800
                    rounded-2xl shadow-2xl
                    ring-1 ${cfg.ring}
                    animate-[scaleIn_200ms_ease-out]
                    outline-none
                `}
            >
                {/* Header */}
                <div className="flex flex-col items-center pt-8 pb-2 px-6">
                    <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center shadow-lg mb-4`}>
                        <i className={`fas ${cfg.icon} text-white text-2xl`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                        {title}
                    </h3>
                </div>

                {/* Body */}
                <div className="px-6 py-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6 pt-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold
                            text-gray-700 dark:text-gray-300
                            bg-gray-100 dark:bg-gray-700
                            hover:bg-gray-200 dark:hover:bg-gray-600
                            rounded-xl transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white
                            ${cfg.confirmBg}
                            rounded-xl transition-all duration-200
                            shadow-lg hover:shadow-xl
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2`}
                    >
                        {isLoading && <i className="fas fa-spinner fa-spin text-xs" />}
                        {confirmText}
                    </button>
                </div>
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
