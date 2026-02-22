import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse } from './types';

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruitmentCampaigns: builder.query<RecruitmentCampaign[], void>({
      query: () => '/recruitment-campaign',
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),

    getRecruitmentCampaign: builder.query<RecruitmentCampaign, number>({
      query: (id) => `/recruitment-campaign/${id}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      providesTags: ['RecruitmentCampaign'],
    }),

    createRecruitmentCampaign: builder.mutation<RecruitmentCampaign, Omit<RecruitmentCampaign, 'campaignId' | 'createdAt'>>({
      query: (campaign) => ({
        url: '/recruitment-campaign',
        method: 'POST',
        body: campaign,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    updateRecruitmentCampaign: builder.mutation<RecruitmentCampaign, { id: number; data: Partial<RecruitmentCampaign> }>({
      query: ({ id, data }) => ({
        url: `/recruitment-campaign/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    deleteRecruitmentCampaign: builder.mutation<void, number>({
      query: (id) => ({
        url: `/recruitment-campaign/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecruitmentCampaign'],
    }),
  }),
});

export const {
  useGetRecruitmentCampaignsQuery,
  useGetRecruitmentCampaignQuery,
  useCreateRecruitmentCampaignMutation,
  useUpdateRecruitmentCampaignMutation,
  useDeleteRecruitmentCampaignMutation,
} = recruitmentCampaignApi;
