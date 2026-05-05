import { useEffect, useRef } from 'react';
import { HubConnectionBuilder, type HubConnection, LogLevel } from '@microsoft/signalr';
import { useDispatch } from 'react-redux';
import { useNotification } from '~/components/Notification';
import { baseApi } from '~/cores/api/baseApi';
import { getAccessToken, getUserId, isLoggedIn } from '~/utils/auth';
import type { NotificationDto } from '~/cores/api/notificationApi';

function toToastType(type: string): 'success' | 'error' | 'warning' | 'info' {
    const upper = (type ?? '').toUpperCase();
    if (upper.includes('SUCCESS')) return 'success';
    if (upper.includes('ERROR')) return 'error';
    if (upper.includes('WARN')) return 'warning';
    return 'info';
}

export function useNotificationHub() {
    const dispatch = useDispatch();
    const { show } = useNotification();
    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {
        let cancelled = false;

        const connect = async () => {
            if (!isLoggedIn()) return;

            const userId = getUserId();
            const rawEnv = import.meta.env.VITE_BACKEND_URL as string | undefined;
            // Khi chạy local mà không có env → dùng localhost; trên production → dùng origin gốc (proxy /api)
            const origin = window.location.origin;
            const isLocal =
                origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1');
            const backendUrl = rawEnv ?? (isLocal ? 'https://localhost:7237' : 'https://chuyencongnhan.io.vn');

            const conn = new HubConnectionBuilder()
                .withUrl(`${backendUrl}/notifications`, {
                    accessTokenFactory: () => getAccessToken() ?? '',
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Warning)
                .build();

            conn.on('ReceiveNotification', (notification: NotificationDto) => {
                show({
                    type: toToastType(notification.type),
                    title: notification.title,
                    message: notification.message,
                });
                dispatch(baseApi.util.invalidateTags(['Notification']));
            });

            try {
                await conn.start();
                if (cancelled) { conn.stop(); return; }
                await conn.invoke('RegisterUser', userId);
                connectionRef.current = conn;
            } catch {
                // silent — withAutomaticReconnect handles retries
            }
        };

        connect();

        return () => {
            cancelled = true;
            connectionRef.current?.stop();
            connectionRef.current = null;
        };
    }, []);
}