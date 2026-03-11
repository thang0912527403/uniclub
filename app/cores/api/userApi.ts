import { baseApi } from './baseApi';
import type { ApiResponse, User, CreateUserDto, UpdateUserDto, Club } from "./types";

export interface GetUsersResult {
  items: User[];
  totalCount: number;
}

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
    getUsers: builder.query<GetUsersResult, { pageNumber?: number; pageSize?: number }>({
      query: ({ pageNumber = 1, pageSize = 10 } = {}) =>
        `/Users?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      transformResponse: (response: unknown): GetUsersResult => {
        let items: User[] = [];
        let totalCount = 0;

        const extractArray = (obj: Record<string, unknown>): User[] | null => {
          if (Array.isArray(obj.items)) return obj.items as User[];
          if (Array.isArray(obj.users)) return obj.users as User[];
          if (Array.isArray(obj.data)) return obj.data as User[];
          if (Array.isArray(obj.result)) return obj.result as User[];
          if (Array.isArray(obj.list)) return obj.list as User[];
          return null;
        };

        const extractTotal = (obj: Record<string, unknown>): number => {
          if (typeof obj.totalCount === 'number') return obj.totalCount;
          if (typeof obj.total === 'number') return obj.total;
          if (typeof obj.totalRecords === 'number') return obj.totalRecords;
          if (typeof obj.count === 'number') return obj.count;
          return 0;
        };

        if (Array.isArray(response)) {
          items = response as User[];
          totalCount = items.length;
          return { items, totalCount };
        }
        if (response && typeof response === 'object') {
          const r = response as Record<string, unknown>;
          if ('data' in r && r.data && typeof r.data === 'object') {
            const data = r.data as Record<string, unknown>;
            items = extractArray(data) ?? (Array.isArray(r.data) ? (r.data as User[]) : []);
            totalCount = extractTotal(data) || (items.length && !extractTotal(r) ? 0 : extractTotal(r));
          } else {
            items = extractArray(r) ?? [];
            totalCount = extractTotal(r);
          }
          if (totalCount === 0 && items.length > 0) totalCount = items.length;
        }
        return { items, totalCount };
      },
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
    uploadAvatar: builder.mutation<{ avatarUrl: string }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return {
          url: `/Users/${id}/avatar`,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: ApiResponse<{ avatarUrl: string }>) =>
        response && typeof response === 'object' && 'data' in response ? response.data : (response as { avatarUrl: string }),
      invalidatesTags: ['User'],
    }),
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
  useUploadAvatarMutation,
  useGetUserAllClubsQuery,
} = userApi;
