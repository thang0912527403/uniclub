import { baseApi } from './baseApi';
import {
  type Club,
  type ApiResponse,
  type ClubPostResponseDto,
  type ClubFund,
  type CreateFundRequestDto,
  type ProcessFundRequestDto,
  type FundHistoryItem,
} from './types';

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
      query: ({ id, isActive }) => ({
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
      ClubPostResponseDto,
      FormData
    >({
      query: (formData) => ({
        url: '/ClubPost',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: [{ type: 'ClubPost' }],
    }),
    updateClubPost: builder.mutation<
      ClubPostResponseDto,
      { id: number; formData: FormData }
    >({
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
    getFundById: builder.query<ClubFund, number>({
      query: (fundId) => `/ClubFund/${fundId}`,
      transformResponse: (response: ApiResponse<ClubFund>) => response.data,
      providesTags: (result, error, fundId) => [{ type: 'ClubFund', id: fundId }],
    }),
    getFundsByClub: builder.query<ClubFund[], number>({
      query: (clubId) => `/ClubFund/club/${clubId}`,
      transformResponse: (response: ApiResponse<ClubFund[]>) => response.data ?? [],
      providesTags: (result, error, clubId) => [
        { type: 'ClubFund', id: `club-${clubId}` },
      ],
    }),
    createFundRequest: builder.mutation<unknown, CreateFundRequestDto>({
      query: (body) => ({
        url: '/ClubFund/request',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
      invalidatesTags: ['ClubFund'],
    }),
    processFundRequest: builder.mutation<void, ProcessFundRequestDto>({
      query: (body) => ({
        url: '/ClubFund/process',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ClubFund'],
    }),
    getFundHistory: builder.query<
      FundHistoryItem[],
      { fundId: number; status?: string }
    >({
      query: ({ fundId, status }) => {
        const params = status ? { status } : undefined;
        return {
          url: `/ClubFund/history/${fundId}`,
          params,
        };
      },
      transformResponse: (response: ApiResponse<FundHistoryItem[]>) =>
        response.data ?? [],
      providesTags: (result, error, { fundId }) => [
        { type: 'ClubFund', id: fundId },
      ],
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetClubByIdQuery,
  useGetFundByIdQuery,
  useGetFundsByClubQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsQuery,
  useGetClubPostByIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
  useGetFundHistoryQuery,
} = clubApi;
