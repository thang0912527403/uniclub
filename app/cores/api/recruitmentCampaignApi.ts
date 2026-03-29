import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse } from './types';

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruitmentCampaigns: builder.query<RecruitmentCampaign[], void>({
      query: () => '/RecruitmentCampaign',
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),
    
    getRecruitmentCampaignsByClubId: builder.query<RecruitmentCampaign[], number>({
      query: (clubId) => `/RecruitmentCampaign/club/${clubId}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'RecruitmentCampaign', id: `club-${clubId}` }],
    }),

    getRecruitmentCampaign: builder.query<RecruitmentCampaign, number>({
      query: (id) => `/RecruitmentCampaign/${id}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),

    createRecruitmentCampaign: builder.mutation<RecruitmentCampaign, Omit<RecruitmentCampaign, 'campaignId' | 'createdAt'>>({
      query: (campaign) => ({
        url: '/RecruitmentCampaign',
        method: 'POST',
        body: campaign,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    updateRecruitmentCampaign: builder.mutation<RecruitmentCampaign, { id: number; data: Partial<RecruitmentCampaign> }>({
      query: ({ id, data }) => ({
        url: `/RecruitmentCampaign/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    deleteRecruitmentCampaign: builder.mutation<void, number>({
      query: (id) => ({
        url: `/RecruitmentCampaign/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),
  }),
});

export const {
  useGetRecruitmentCampaignsQuery,
  useGetRecruitmentCampaignsByClubIdQuery,
  useGetRecruitmentCampaignQuery,
  useCreateRecruitmentCampaignMutation,
  useUpdateRecruitmentCampaignMutation,
  useDeleteRecruitmentCampaignMutation,
} = recruitmentCampaignApi;
