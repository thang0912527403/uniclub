import { baseApi, API_CONFIG } from './baseApi';
import type { Notification } from './types';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], string>({
      query: (userId) => ({
        url: `/notifications?userId=${userId}`,
        baseUrl: API_CONFIG.NOTIFICATION_SERVICE,
      }),
      providesTags: ['Notification'],
    }),

    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
        baseUrl: API_CONFIG.NOTIFICATION_SERVICE,
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
        baseUrl: API_CONFIG.NOTIFICATION_SERVICE,
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
