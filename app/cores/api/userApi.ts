import { baseApi } from "./baseApi";
import { type User, type ApiResponse } from "./types";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
        query: () => '/User',
        transformResponse: (response: ApiResponse<User[]>) => response.data,
        providesTags: ['User'],
    }),
    getUserById: builder.query<User, string>({
        query: (id) => `/User/${id}`,
        transformResponse: (response: ApiResponse<User>) => response.data,
        providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
} = userApi;