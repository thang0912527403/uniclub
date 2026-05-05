import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse } from './types';

// Map backend uppercase status ("OPEN","CLOSED") to frontend lowercase ("open","close")
function normalizeStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case 'OPEN': return 'open';
    case 'CLOSED': return 'close';
    case 'DRAFT': return 'draft';
    default: return status?.toLowerCase() ?? status;
  }
}
function normalizeCampaign(c: RecruitmentCampaign): RecruitmentCampaign {
  return { ...c, status: normalizeStatus(c.status) };
}

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /RecruitmentCampaign  (admin: all campaigns)
    getRecruitmentCampaigns: builder.query<
      { items: RecruitmentCampaign[]; totalCount: number; totalPages: number },
      { page?: number; pageSize?: number; search?: string; filterBy?: string; ascending?: boolean } | void
    >({
      query: (params) => ({
        url: '/RecruitmentCampaign',
        params: params || {},
      }),
      transformResponse: (
        response: ApiResponse<{
          items: RecruitmentCampaign[];
          totalCount: number;
          totalPages: number;
        }>,
      ) => ({
        ...response.data,
        items: (response.data?.items ?? []).map(normalizeCampaign),
      }),
      providesTags: ['RecruitmentCampaign'],
    }),

    // GET /club/{clubId}/RecruitmentCampaign
    getRecruitmentCampaignsByClubId: builder.query<
      { items: RecruitmentCampaign[]; totalCount: number; totalPages: number },
      { clubId: number; page?: number; pageSize?: number; search?: string; filterBy?: string; ascending?: boolean }
    >({
      query: ({ clubId, ...params }) => ({
        url: `/club/${clubId}/RecruitmentCampaign`,
        params,
      }),
      transformResponse: (
        response: ApiResponse<{
          items: RecruitmentCampaign[];
          totalCount: number;
          totalPages: number;
        }>,
      ) => ({
        ...response.data,
        items: (response.data?.items ?? []).map(normalizeCampaign),
      }),
      providesTags: (result, error, { clubId }) => [{ type: 'RecruitmentCampaign', id: `club-${clubId}` }],
    }),

    // GET /club/{clubId}/RecruitmentCampaign/{id}
    getRecruitmentCampaign: builder.query<RecruitmentCampaign, { clubId: number; id: number }>({
      query: ({ clubId, id }) => `/club/${clubId}/RecruitmentCampaign/${id}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) => {
        const raw = ('data' in response ? response.data : response) as RecruitmentCampaign;
        return normalizeCampaign(raw);
      },
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
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) => {
        const raw = ('data' in response ? response.data : response) as RecruitmentCampaign;
        return normalizeCampaign(raw);
      },
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
      transformResponse: (response: ApiResponse<RecruitmentCampaign> | RecruitmentCampaign) => {
        const raw = ('data' in response ? response.data : response) as RecruitmentCampaign;
        return normalizeCampaign(raw);
      },
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
