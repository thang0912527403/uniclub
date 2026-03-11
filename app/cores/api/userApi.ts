import { baseApi } from './baseApi';
import type { ApiResponse, User, CreateUserDto, UpdateUserDto, Club } from "./types";

export interface ClubMembership {
  clubMemberId: number;
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  studentId: string | null;
  clubId: number;
  clubRoleId: number;
  roleName: string;
  joinDate: string;
  status: string;
  assignedBy: string | null;
  departments: unknown[];
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/Users',
      transformResponse: (response: ApiResponse<User[]> | User[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['User'],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/Users/${id}`,
      transformResponse: (response: ApiResponse<User> | User) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as User),
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({
        url: '/Users',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<User> | User) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as User),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<User, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/Users/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<User> | User) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as User),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Lấy danh sách CLB và vai trò CLB của user
    getUserClubInfo: builder.query<ClubMembership[], string>({
      query: (userId) => `/me/clubinfo?userId=${userId}`,
      transformResponse: (response: ApiResponse<ClubMembership[]>) => response.data ?? [],
      providesTags: ['User'],
    }),

    // Lấy tất cả CLB mà user tham gia (trả về Club[])
    getUserAllClubs: builder.query<Club[], string>({
      query: (userId) => `/Users/${userId}/all-clubs`,
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserClubInfoQuery,
  useGetUserAllClubsQuery,
} = userApi;
