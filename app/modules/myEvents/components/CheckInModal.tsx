import React, { useState } from 'react';
import { useCheckInEventMutation } from '~/cores/api/eventApi';
import { useNotification } from '~/components/Notification';

interface Props {
    eventId: number;
    eventName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CheckInModal({ eventId, eventName, isOpen, onClose }: Props) {
    const { show: notify } = useNotification();
    const [checkIn, { isLoading }] = useCheckInEventMutation();
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!code.trim()) {
            notify({ type: 'warning', title: 'Vui lòng nhập mã check-in.' });
            return;
        }
        try {
            await checkIn({ eventId, checkInCode: code.trim() }).unwrap();
            notify({ type: 'success', title: 'Điểm danh thành công!' });
            setCode('');
            onClose();
        } catch (err: any) {
            notify({ type: 'error', title: 'Thất bại', message: err?.data?.error ?? 'Mã không đúng hoặc đã hết hạn.' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Điểm danh sự kiện</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{eventName}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã Check-in (6 ký tự)</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="VD: CHK123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 uppercase tracking-[0.3em] font-mono text-center text-xl transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !code.trim()}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 hover:shadow-lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Đang gửi...
                                </span>
                            ) : 'Xác nhận điểm danh'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
