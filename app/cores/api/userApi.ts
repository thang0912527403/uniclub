import { baseApi } from './baseApi';
import type { UserResponseDto, CreateUserDto, UpdateUserDto } from './types/user';
import type { ApiResponse } from './types/recruitmentCampaign';

/** User CRUD - gọi MAIN_SERVICE (7237). Nếu backend User chạy ở USER_SERVICE (7238) thì đổi baseApi → userApi. */
export const userCrudApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserResponseDto[], void>({
      query: () => '/Users',
      transformResponse: (response: ApiResponse<UserResponseDto[]> | UserResponseDto[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['User'],
    }),

    getUserById: builder.query<UserResponseDto, string>({
      query: (id) => `/Users/${id}`,
      transformResponse: (response: ApiResponse<UserResponseDto> | UserResponseDto) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as UserResponseDto),
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<UserResponseDto, CreateUserDto>({
      query: (body) => ({
        url: '/Users',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<UserResponseDto> | UserResponseDto) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as UserResponseDto),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<UserResponseDto, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/Users/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<UserResponseDto> | UserResponseDto) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as UserResponseDto),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
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
} = userCrudApi;
