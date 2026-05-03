import React from 'react';
import { Link } from 'react-router';
import type { MyEventItem } from '~/cores/api/eventApi';

interface Props {
    event: MyEventItem;
    onCheckIn: (e: MyEventItem) => void;
    onShowQr: (e: MyEventItem) => void;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    PLANNED: { label: 'Lên kế hoạch', bg: 'bg-blue-100', text: 'text-blue-700' },
    REGISTRATION_OPEN: { label: 'Mở đăng ký', bg: 'bg-green-100', text: 'text-green-700' },
    ONGOING: { label: 'Đang diễn ra', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    COMPLETED: { label: 'Đã kết thúc', bg: 'bg-gray-100', text: 'text-gray-600' },
    CANCELED: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-700' },
};

function hasPolicy(event: MyEventItem, policy: string): boolean {
    return event.policies.includes('*') || event.policies.includes(policy);
}

export function MyEventCard({ event, onCheckIn, onShowQr }: Props) {
    const status = statusConfig[event.status] || statusConfig.PLANNED;
    const isValidImage = event.imageUrl && event.imageUrl !== 'string';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            {/* Image / Gradient Header */}
            <div className="relative h-40 overflow-hidden">
                {isValidImage ? (
                    <img
                        src={event.imageUrl}
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Status badge */}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
                    {status.label}
                </span>

                {/* Role badges */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                    {event.isAttendee && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-orange-600 backdrop-blur-sm">
                            <i className="fas fa-ticket-alt mr-1" /> Người tham gia
                        </span>
                    )}
                    {event.isCollaborator && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-purple-600 backdrop-blur-sm">
                            <i className="fas fa-users mr-1" /> {event.roleName || 'Ban tổ chức'}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-bold text-gray-800 text-base leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {event.eventName}
                    </h3>
                    {event.clubName && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {event.clubName}
                        </p>
                    )}
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.startDate)} {formatTime(event.startDate)}
                    </div>
                    {event.location && event.location !== 'string' && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {/* Attendance status for attendees */}
                {event.isAttendee && event.attendanceStatus && (() => {
                    const statusMap: Record<string, { icon: string; label: string; cls: string }> = {
                        PENDING:    { icon: 'fas fa-clock',         label: 'Chờ duyệt',    cls: 'text-amber-600 bg-amber-50 border-amber-200' },
                        REGISTERED: { icon: 'fas fa-check-circle',  label: 'Đã đăng ký',    cls: 'text-green-600 bg-green-50 border-green-200' },
                        WAITLIST:   { icon: 'fas fa-list-ol',       label: 'Danh sách chờ', cls: 'text-purple-600 bg-purple-50 border-purple-200' },
                        CHECKED_IN: { icon: 'fas fa-map-marker-alt',label: 'Đã điểm danh', cls: 'text-green-700 bg-green-50 border-green-200' },
                        PRESENT:    { icon: 'fas fa-user-check',    label: 'Có mặt',        cls: 'text-green-700 bg-green-50 border-green-200' },
                        ABSENT:     { icon: 'fas fa-user-times',    label: 'Vắng mặt',      cls: 'text-red-600 bg-red-50 border-red-200' },
                        REJECTED:   { icon: 'fas fa-ban',           label: 'Bị từ chối',    cls: 'text-red-600 bg-red-50 border-red-200' },
                        CANCELLED:  { icon: 'fas fa-undo',          label: 'Đã huỷ',        cls: 'text-gray-500 bg-gray-50 border-gray-200' },
                    };
                    const s = statusMap[event.attendanceStatus];
                    if (!s) return null;
                    return (
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${s.cls}`}>
                            <i className={`${s.icon} text-[10px]`} />
                            {s.label}
                        </div>
                    );
                })()}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {/* Attendee actions */}
                    {event.isAttendee && event.status === 'ONGOING' && event.attendanceStatus !== 'CHECKED_IN' && (
                        <>
                            <button
                                onClick={() => onCheckIn(event)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-200 hover:shadow-md"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Nhập mã
                            </button>
                            <button
                                onClick={() => onShowQr(event)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Hiện QR
                            </button>
                        </>
                    )}

                    {/* Collaborator actions — gated by policy */}
                    {event.isCollaborator && (
                        <>
                            {hasPolicy(event, 'checkin') && event.status === 'ONGOING' && (
                                <Link
                                    to={`/events/${event.eventId}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Scan QR
                                </Link>
                            )}
                            {hasPolicy(event, 'viewattendance') && (
                                <Link
                                    to={`/events/${event.eventId}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    Điểm danh
                                </Link>
                            )}
                            {hasPolicy(event, 'editevent') && (
                                <Link
                                    to={`/events/${event.eventId}/edit`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Sửa
                                </Link>
                            )}
                            <Link
                                to={`/events/${event.eventId}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Quản lý
                            </Link>
                        </>
                    )}

                    {/* View detail link for all */}
                    <Link
                        to={`/public/events/${event.eventId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors ml-auto"
                    >
                        Chi tiết →
                    </Link>
                </div>
            </div>
        </div>
    );
}
