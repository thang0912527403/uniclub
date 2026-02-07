import { baseApi, API_CONFIG } from './baseApi';
import type { User } from './types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<User, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        baseUrl: API_CONFIG.USER_SERVICE,
      }),
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    getUsers: builder.query<User[], void>({
      query: () => ({
        url: '/users',
        baseUrl: API_CONFIG.USER_SERVICE,
      }),
      providesTags: ['User'],
    }),

    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
        baseUrl: API_CONFIG.USER_SERVICE,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUserProfileQuery, useGetUsersQuery, useUpdateUserMutation } = userApi;
