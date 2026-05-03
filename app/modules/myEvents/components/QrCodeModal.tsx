import React from 'react';
import { useGetMyCheckInQrQuery } from '~/cores/api/attendanceApi';

interface Props {
    eventId: number;
    eventName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function QrCodeModal({ eventId, eventName, isOpen, onClose }: Props) {
    const { data: qrData, isLoading, error } = useGetMyCheckInQrQuery(eventId, { skip: !isOpen });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">QR Điểm danh</h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-4">{eventName}</p>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="py-6 text-center">
                            <p className="text-red-500 text-sm">Không thể tải QR. Bạn có thể chưa đăng ký sự kiện này.</p>
                        </div>
                    )}

                    {qrData && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block">
                                <img
                                    src={`/api/events/qr/${qrData.token}`}
                                    alt="QR Check-in"
                                    className="w-48 h-48 mx-auto"
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                Đưa mã QR này cho ban tổ chức để được điểm danh
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}
