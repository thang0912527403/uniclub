import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse } from './types';

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruitmentCampaigns: builder.query<RecruitmentCampaign[], void>({
      query: () => '/recruitment-campaign',
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),
    
    getRecruitmentCampaignsByClubId: builder.query<RecruitmentCampaign[], number>({
      query: (clubId) => `/club/${clubId}/recruitment-campaign`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'RecruitmentCampaign', id: `club-${clubId}` }],
    }),

    getRecruitmentCampaign: builder.query<RecruitmentCampaign, number>({
      query: (id) => `/recruitment-campaign/${id}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),

    createRecruitmentCampaign: builder.mutation<RecruitmentCampaign, Omit<RecruitmentCampaign, 'campaignId' | 'createdAt'>>({
      query: (campaign) => ({
        url: `/club/${campaign.clubId}/recruitment-campaign`,
        method: 'POST',
        body: campaign,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    updateRecruitmentCampaign: builder.mutation<RecruitmentCampaign, { id: number; data: Partial<RecruitmentCampaign> }>({
      query: ({ id, data }) => ({
        url: `/club/${data.clubId}/recruitment-campaign/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    deleteRecruitmentCampaign: builder.mutation<void, { id: number; clubId: number }>({
      query: ({ id, clubId }) => ({
        url: `/club/${clubId}/recruitment-campaign/${id}`,
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
