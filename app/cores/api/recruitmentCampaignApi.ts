import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse } from './types';

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /RecruitmentCampaign  (admin: all campaigns)
    getRecruitmentCampaigns: builder.query<RecruitmentCampaign[], void>({
      query: () => '/RecruitmentCampaign',
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]> | RecruitmentCampaign[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['RecruitmentCampaign'],
    }),

    // GET /club/{clubId}/RecruitmentCampaign
    getRecruitmentCampaignsByClubId: builder.query<RecruitmentCampaign[], number>({
      query: (clubId) => `/club/${clubId}/RecruitmentCampaign`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]> | RecruitmentCampaign[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: (result, error, clubId) => [{ type: 'RecruitmentCampaign', id: `club-${clubId}` }],
    }),

    // GET /club/{clubId}/RecruitmentCampaign/{id}
    getRecruitmentCampaign: builder.query<RecruitmentCampaign, { clubId: number; id: number }>({
      query: ({ clubId, id }) => `/club/${clubId}/RecruitmentCampaign/${id}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) =>
        'data' in response ? response.data : response,
      providesTags: (result, error, { id }) => [{ type: 'RecruitmentCampaign', id }],
    }),

    // POST /club/{clubId}/RecruitmentCampaign
    createRecruitmentCampaign: builder.mutation<
      RecruitmentCampaign,
      Omit<RecruitmentCampaign, 'campaignId' | 'createdAt'>
    >({
      query: (campaign) => ({
        url: `/club/${campaign.clubId}/RecruitmentCampaign`,
        method: 'POST',
        body: campaign,
      }),
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) =>
        'data' in response ? response.data : response,
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    // PUT /club/{clubId}/RecruitmentCampaign/{id}
    updateRecruitmentCampaign: builder.mutation<
      RecruitmentCampaign,
      { clubId: number; id: number; data: Partial<RecruitmentCampaign> }
    >({
      query: ({ clubId, id, data }) => ({
        url: `/club/${clubId}/RecruitmentCampaign/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) =>
        'data' in response ? response.data : response,
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    // DELETE /club/{clubId}/RecruitmentCampaign/{id}
    deleteRecruitmentCampaign: builder.mutation<void, { clubId: number; id: number }>({
      query: ({ clubId, id }) => ({
        url: `/club/${clubId}/RecruitmentCampaign/${id}`,
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
