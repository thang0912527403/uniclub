import { baseApi } from './baseApi';
import { type ApiResponse } from './types';

export interface NotificationDto {
    notificationId: number;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const notificationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getNotificationsByUserId: builder.query<NotificationDto[], string>({
            query: (userId) => `/notifications/${userId}`,
            transformResponse: (response: ApiResponse<NotificationDto[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ notificationId }) => ({
                            type: 'Notification' as const,
                            id: notificationId,
                        })),
                        'Notification',
                      ]
                    : ['Notification'],
        }),

        markNotificationAsRead: builder.mutation<void, number>({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, notificationId) => [
                { type: 'Notification', id: notificationId },
                'Notification',
            ],
        }),

        markAllNotificationsAsRead: builder.mutation<void, string>({
            query: (userId) => ({
                url: `/notifications/${userId}/read-all`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notification'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetNotificationsByUserIdQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
} = notificationApi;
