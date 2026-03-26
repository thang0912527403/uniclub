import { baseApi } from './baseApi';
import { type Club, type ClubPostResponseDto, type CreateClubPostDto, type ClubMember } from './types';
import { type ApiResponse } from 'app/cores/api/types/club';

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubs: builder.query<{ data: Club[]; totalPage: number; totalCount: number }, { pageIndex: string; searchQuery: string; pageSize: string }>({
      query: ({ pageIndex, searchQuery, pageSize }) => `/Club?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ['Club'],
    }),

    getActiveClubs: builder.query<{ data: Club[]; totalPage: number; totalCount: number }, { pageIndex: string; searchQuery: string; pageSize: string }>({
      query: ({ pageIndex, searchQuery, pageSize }) => `/Club/active?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ['Club'],
    }),
    getClubById: builder.query<Club, number>({
      query: (id) => `/Club/${id}`,
      transformResponse: (response: ApiResponse<Club>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Club', id }],
    }),
    getClubMembers: builder.query<ClubMember[], number>({
      query: (clubId) => `/clubs/${clubId}/members`,
      transformResponse: (response: ApiResponse<ClubMember[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
    createClub: builder.mutation<Club, Partial<Club>>({
      query: (club) => ({
        url: '/Club',
        method: 'POST',
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: ['Club'],
    }),
    updateClub: builder.mutation<Club, { id: number; club: Partial<Club> }>({
      query: ({ id, club }) => ({
        url: `/Club/${id}`,
        method: 'PUT',
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Club', id }],
    }),
    deleteClub: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Club/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Club'],
    }),
    toggleClubStatus: builder.mutation<Club, { id: number; isActive: boolean }>({
      query: ({ id }) => ({
        url: `/Club/ChangeStatus/${id}`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Club', id }, 'Club'],
    }),
    // ─── ClubPost endpoints ─────────────────────────────────────────────
    getClubPosts: builder.query<ClubPostResponseDto[], void>({
      query: () => '/ClubPost',
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) => response.data,
      providesTags: ['ClubPost'],
    }),
    getClubPostById: builder.query<ClubPostResponseDto, number>({
      query: (id) => `/ClubPost/${id}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) => response.data,
      providesTags: (result, error, id) => [{ type: 'ClubPost', id }],
    }),
    createClubPost: builder.mutation<
      CreateClubPostDto,
      FormData
    >({
      query: (formData) => ({
        url: '/ClubPost',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<CreateClubPostDto>) =>
        response.data,
      invalidatesTags: [{ type: 'ClubPost' }],
    }),
    updateClubPost: builder.mutation<ClubPostResponseDto, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/ClubPost/${id}`,
        method: 'PUT',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'ClubPost', id },
        'ClubPost',
      ],
    }),
    deleteClubPost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/ClubPost/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClubPost'],
    }),
    updateMemberRole: builder.mutation<void, { clubId: number; memberId: number; clubRoleId: number | null }>({
      query: ({ clubId, memberId, clubRoleId }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: 'PUT',
        body: { clubRoleId },
      }),
      invalidatesTags: (result, error, { clubId }) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetActiveClubsQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsQuery,
  useGetClubPostByIdQuery,
  // useGetClubPostByClubIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useUpdateMemberRoleMutation,
} = clubApi;
