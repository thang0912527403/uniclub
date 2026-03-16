import { baseApi } from './baseApi';
import {
  type Club,
  type ApiResponse,
  type ClubPostResponseDto,
  type ClubMember,
  type ClubFund,
  type ApproveFundDto,
  type CreateFundRequestDto,
  type ProcessFundRequestDto,
  type FundHistoryItem,
} from './types';

type ClubFundScoped = { clubId: number };
type FundScoped = { clubId: number; fundId: number };
type FundLocationResponse = { fundId: number; clubId: number };

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubs: builder.query<Club[], void>({
      query: () => '/Club',
      transformResponse: (response: ApiResponse<Club[]>) => response.data,
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
    getClubPostByClubId: builder.query<ClubPostResponseDto[], number>({
      query: (clubId) => `/ClubPost/club/${clubId}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'ClubPost', id: `club-${clubId}` }],
    }),
    createClubPost: builder.mutation<ClubPostResponseDto, FormData>({
      query: (formData) => ({
        url: '/ClubPost',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
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
    // ─── ClubFund endpoints ─────────────────────────────────────────────
    getFundById: builder.query<ClubFund, FundScoped>({
      query: ({ clubId, fundId }) => `/clubs/${clubId}/funds/${fundId}`,
      transformResponse: (response: ApiResponse<ClubFund>) => response.data,
      providesTags: (result, error, { fundId }) => [{ type: 'ClubFund', id: fundId }],
    }),
    getFundsByClub: builder.query<ClubFund[], number>({
      query: (clubId) => `/clubs/${clubId}/funds`,
      transformResponse: (response: ApiResponse<ClubFund[]>) => response.data ?? [],
      providesTags: (result, error, clubId) => [
        { type: 'ClubFund', id: `club-${clubId}` },
      ],
    }),
    createFund: builder.mutation<ClubFund, { clubId: number; fundName?: string; description?: string }>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<ClubFund>) => response.data,
      invalidatesTags: ['ClubFund'],
    }),
    getMyClubsForFunds: builder.query<Club[], void>({
      query: () => '/ClubFund/my-clubs',
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ['ClubFund', 'Club'],
    }),
    createFundRequest: builder.mutation<unknown, CreateFundRequestDto & ClubFundScoped>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/request`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
      invalidatesTags: ['ClubFund'],
    }),
    processFundRequest: builder.mutation<void, ProcessFundRequestDto & ClubFundScoped>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/process`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ClubFund'],
    }),
    getFundHistory: builder.query<
      FundHistoryItem[],
      { clubId: number; fundId: number; status?: string }
    >({
      query: ({ clubId, fundId, status }) => {
        const params = status ? { status } : undefined;
        return {
          url: `/clubs/${clubId}/funds/history/${fundId}`,
          params,
        };
      },
      transformResponse: (response: ApiResponse<FundHistoryItem[]>) =>
        response.data ?? [],
      providesTags: (result, error, { fundId }) => [
        { type: 'ClubFund', id: fundId },
      ],
    }),
    /** Duyệt/từ chối quỹ (chỉ Manager). POST /api/clubs/{clubId}/funds/approve */
    approveFund: builder.mutation<ClubFund, ApproveFundDto & ClubFundScoped>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/approve`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<ClubFund>) => response.data,
      invalidatesTags: ['ClubFund'],
    }),
    updateMemberRole: builder.mutation<void, { clubId: number; memberId: number; clubRoleId: number | null }>({
      query: ({ clubId, memberId, clubRoleId }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: 'PUT',
        body: { clubRoleId },
      }),
      invalidatesTags: (result, error, { clubId }) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
    getFundLocation: builder.query<FundLocationResponse, number>({
      query: (fundId) => `/funds/${fundId}/location`,
      transformResponse: (response: ApiResponse<FundLocationResponse>) => response.data,
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useGetFundByIdQuery,
  useGetFundsByClubQuery,
  useCreateFundMutation,
  useGetMyClubsForFundsQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsQuery,
  useGetClubPostByIdQuery,
  useGetClubPostByClubIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
  useGetFundHistoryQuery,
  useApproveFundMutation,
  useUpdateMemberRoleMutation,
  useGetFundLocationQuery,
} = clubApi;
