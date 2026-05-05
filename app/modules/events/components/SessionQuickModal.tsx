/**
 * SessionQuickModal — Mini popup để tạo/sửa session trực tiếp từ calendar.
 *
 * Features:
 *  - Compact, không có backdrop tối toàn màn hình
 *  - SessionType radio: Hoạt động / Setup / Nghỉ
 *  - Validation 2 lớp: thời gian hợp lệ + kiểm tra khung giờ event (Setup được vượt)
 *  - Đóng khi click ngoài hoặc Escape
 */

import { useState, useEffect, useRef } from 'react';
import type { SessionType } from './EventCalendarPanel';

// ─────────────────── Types ────────────────────────────────

export interface SessionQuickModalData {
    sessionName: string;
    start: string;       // datetime-local (YYYY-MM-DDTHH:mm)
    end: string;
    location: string;
    description: string;
    sessionType: SessionType;
}

interface SessionQuickModalProps {
    mode: 'create' | 'edit';
    initialData: SessionQuickModalData;
    onConfirm: (data: SessionQuickModalData) => void | Promise<void>;
    onDelete?: () => void;
    onClose: () => void;
    /** Khung giờ Event — validate khi type != 'setup' */
    eventBounds?: { start: string; end: string } | null;
    isDark?: boolean;
    isLoading?: boolean;
}

// ─────────────────── Helpers ──────────────────────────────

function dtLocalToDisplay(localDT: string) {
    if (!localDT) return '';
    try {
        const d = new Date(localDT);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return localDT; }
}

const SESSION_TYPES: { value: SessionType; label: string; icon: string; color: string }[] = [
    { value: 'main',  label: 'Hoạt động', icon: '🎯', color: 'text-purple-500 border-purple-500' },
    { value: 'setup', label: 'Setup',      icon: '🔧', color: 'text-orange-500 border-orange-500' },
    { value: 'break', label: 'Nghỉ',       icon: '☕', color: 'text-yellow-600 border-yellow-500' },
];

const TYPE_BAR: Record<SessionType, string> = {
    main:  'bg-purple-500',
    setup: 'bg-orange-400',
    break: 'bg-yellow-400',
};

// ─────────────────── Component ────────────────────────────

export function SessionQuickModal({
    mode,
    initialData,
    onConfirm,
    onDelete,
    onClose,
    eventBounds,
    isDark = false,
    isLoading = false,
}: SessionQuickModalProps) {
    const [data, setData] = useState<SessionQuickModalData>(initialData);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    // Auto-focus tên phiên khi mở
    useEffect(() => {
        setTimeout(() => nameRef.current?.focus(), 60);
    }, []);

    // Đóng khi nhấn Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const bg      = isDark ? 'bg-[#1e2235] border-gray-700'  : 'bg-white border-gray-200';
    const labelCl = isDark ? 'text-gray-400' : 'text-gray-500';
    const inputCl = isDark
        ? 'bg-[#242838] border-gray-600 text-white placeholder-gray-500 focus:border-purple-400'
        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500';

    const setField = (k: keyof SessionQuickModalData, v: string) => {
        setData(prev => ({ ...prev, [k]: v }));
        setError('');
    };

    const handleConfirm = async () => {
        // Validate: tên
        if (!data.sessionName.trim()) {
            setError('Vui lòng nhập tên phiên');
            nameRef.current?.focus();
            return;
        }
        // Validate: thời gian
        const s = new Date(data.start);
        const e = new Date(data.end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) {
            setError('Thời gian không hợp lệ');
            return;
        }
        if (e <= s) {
            setError('Giờ kết thúc phải sau giờ bắt đầu');
            return;
        }
        // Validate: khung giờ event (bỏ qua nếu type = setup)
        if (data.sessionType !== 'setup' && eventBounds) {
            const eStart = new Date(eventBounds.start);
            const eEnd   = new Date(eventBounds.end);
            if (s < eStart || e > eEnd) {
                setError('Phiên phải nằm trong khung giờ sự kiện. Chọn loại "Setup" nếu muốn vượt khung.');
                return;
            }
        }

        setSubmitting(true);
        try {
            await onConfirm(data);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        // Backdrop nhẹ — không toàn màn hình tối
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div
                className={`w-full max-w-md rounded-2xl border shadow-2xl ${bg}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-5 pt-5 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {mode === 'create' ? '📌 Tạo phiên mới' : '✏️ Chỉnh sửa phiên'}
                            </h3>
                            <p className={`text-xs mt-0.5 ${labelCl}`}>
                                {dtLocalToDisplay(data.start)} → {dtLocalToDisplay(data.end)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`text-lg leading-none p-1 rounded-lg transition-colors ${
                                isDark ? 'text-gray-500 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >×</button>
                    </div>
                    {/* Color indicator bar */}
                    <div className={`mt-3 h-1 rounded-full transition-all duration-200 ${TYPE_BAR[data.sessionType]}`} />
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Session Type */}
                    <div>
                        <p className={`text-xs font-medium mb-2 ${labelCl}`}>Loại phiên</p>
                        <div className="flex gap-2">
                            {SESSION_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setData(prev => ({ ...prev, sessionType: t.value }))}
                                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                                        data.sessionType === t.value
                                            ? `${t.color} ${isDark ? 'bg-opacity-10 bg-white' : 'bg-opacity-5 bg-black'} border-current`
                                            : isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                        {data.sessionType === 'setup' && (
                            <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                                <i className="fas fa-exclamation-triangle text-[10px]" />
                                Phiên Setup được phép nằm ngoài khung giờ sự kiện
                            </p>
                        )}
                    </div>

                    {/* Tên phiên */}
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${labelCl}`}>
                            Tên phiên <span className="text-red-400">*</span>
                        </label>
                        <input
                            ref={nameRef}
                            type="text"
                            value={data.sessionName}
                            onChange={e => setField('sessionName', e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                            placeholder="VD: Khai mạc, Phần thi, Trao giải..."
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${inputCl}`}
                        />
                    </div>

                    {/* Thời gian */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${labelCl}`}>Bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={data.start}
                                onChange={e => setField('start', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${inputCl}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${labelCl}`}>Kết thúc</label>
                            <input
                                type="datetime-local"
                                value={data.end}
                                onChange={e => setField('end', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${inputCl}`}
                            />
                        </div>
                    </div>

                    {/* Địa điểm */}
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${labelCl}`}>Địa điểm</label>
                        <input
                            type="text"
                            value={data.location}
                            onChange={e => setField('location', e.target.value)}
                            placeholder="VD: Hội trường A, Sân thể thao..."
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${inputCl}`}
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${labelCl}`}>Mô tả</label>
                        <textarea
                            rows={2}
                            value={data.description}
                            onChange={e => setField('description', e.target.value)}
                            placeholder="Chi tiết về phiên này..."
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none ${inputCl}`}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-500 text-xs flex items-center gap-1.5">
                            <i className="fas fa-exclamation-circle" />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-5 py-4 border-t flex items-center gap-2 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    {/* Xóa — chỉ edit mode */}
                    {mode === 'edit' && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={submitting || isLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                            <i className="fas fa-trash-alt mr-1" />Xóa
                        </button>
                    )}
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting || isLoading}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                            data.sessionType === 'setup'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : data.sessionType === 'break'
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        {submitting || isLoading
                            ? <><i className="fas fa-spinner fa-spin mr-1" />Đang lưu...</>
                            : mode === 'create' ? <><i className="fas fa-plus mr-1" />Tạo phiên</> : <><i className="fas fa-save mr-1" />Lưu</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
