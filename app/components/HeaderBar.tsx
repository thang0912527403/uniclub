import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getUserId, getAccessToken, logoutUser } from '~/utils/auth';
import {
    useGetNotificationsByUserIdQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
} from '~/cores/api/notificationApi';
import * as signalR from '@microsoft/signalr';
import { useDispatch } from 'react-redux';
import { baseApi } from '../cores/api/baseApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';

interface HeaderBarProps {
    title?: string;
    breadcrumb?: string;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    isDark?: boolean;
}

export function useSignalRNotifications() {
    const dispatch = useDispatch();
    const userId = getUserId();
    const token = getAccessToken();
    const { role } = useCurrentUser();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://localhost:7237';

    useEffect(() => {
        if (!userId || !token) return;
        if (role !== 'Club Manager') return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendUrl}/notifications`, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveNotification', () => {
            dispatch(baseApi.util.invalidateTags(['Notification']));
        });

        let cleanupCalled = false;

        connection
            .start()
            .then(() => {
                if (cleanupCalled) {
                    connection.stop().catch(() => {});
                    return;
                }
                return connection.invoke('RegisterUser', userId);
            })
            .catch((err) => {
                if (!cleanupCalled) console.error('SignalR error:', err);
            });

        return () => {
            cleanupCalled = true;

            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.stop().catch(() => {});
            }
        };
    }, [token, role]);
}

export function HeaderBar({
    title = 'Dashboard',
    breadcrumb = 'Pages / Dashboard',
    isSidebarOpen = true,
    onToggleSidebar,
}: HeaderBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const userId = getUserId();
    useSignalRNotifications();

    const handleLogout = () => {
        logoutUser();
        navigate('/auth/login', { replace: true });
    };

    const handleGoHome = () => {
        navigate('/home');
    };

    const { data: notifications = [] } = useGetNotificationsByUserIdQuery(userId!, {
        skip: !userId,
    });
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header
            className={`fixed top-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 backdrop-blur-sm bg-opacity-95 left-0 ${
                isSidebarOpen ? 'md:left-64' : 'md:left-0'
            }`}
        >
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                            aria-label="Toggle menu"
                        >
                            <i className="fas fa-bars text-gray-600 dark:text-gray-400 text-lg"></i>
                        </button>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{breadcrumb}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-3 shrink-0">
                    <input
                        type="text"
                        placeholder="Search here"
                        className="hidden md:block pl-4 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none w-64 text-sm"
                    />

                    {/* Nút quay về Trang chủ */}
                    <button
                        type="button"
                        onClick={handleGoHome}
                        className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        aria-label="Trang chủ"
                        title="Về Trang chủ"
                    >
                        <i className="fas fa-home text-gray-600 dark:text-gray-400" />
                        <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200">Trang chủ</span>
                    </button>

                    <button className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block" aria-label="Settings">
                        <i className="fas fa-cog text-gray-600 dark:text-gray-400"></i>
                    </button>

                    {/* Notification Bell */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen((prev) => !prev)}
                            className="relative p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Notifications"
                        >
                            <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        Thông báo
                                    </span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => userId && markAllAsRead(userId)}
                                            className="text-xs text-blue-500 hover:underline"
                                        >
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                    )}
                                </div>

                                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.length === 0 && (
                                        <li className="px-4 py-6 text-center text-sm text-gray-400">
                                            Không có thông báo
                                        </li>
                                    )}
                                    {notifications.map((n) => (
                                        <li
                                            key={n.notificationId}
                                            onClick={() => !n.isRead && markAsRead(n.notificationId)}
                                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                !n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                        >
                                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(n.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Nút Đăng xuất */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="p-2 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                        aria-label="Đăng xuất"
                        title="Đăng xuất"
                    >
                        <i className="fas fa-sign-out-alt" />
                        <span className="hidden md:inline text-sm font-semibold">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
