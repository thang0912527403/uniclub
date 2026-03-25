import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import { type RecruitmentCampaign, type ApiResponse, type Club } from './types';

/** Base path: GET/POST /api/club/{clubId}/recruitment-campaign — không còn endpoint flat /recruitment-campaign */
const clubCampaignPath = (clubId: number) => `/club/${clubId}/recruitment-campaign`;

export const recruitmentCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Admin: gộp danh sách từ mỗi CLB (backend không còn GET flat toàn hệ thống). */
    getRecruitmentCampaigns: builder.query<RecruitmentCampaign[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const clubsRes = await baseQuery('/Club');
        if (clubsRes.error) {
          return { error: clubsRes.error as FetchBaseQueryError };
        }
        const raw = clubsRes.data as ApiResponse<Club[]>;
        const clubs = raw?.data ?? [];
        const all: RecruitmentCampaign[] = [];
        for (const club of clubs) {
          const r = await baseQuery(clubCampaignPath(club.clubId));
          if (!r.error && r.data) {
            const inner = r.data as ApiResponse<RecruitmentCampaign[]>;
            all.push(...(inner.data ?? []));
          }
        }
        return { data: all };
      },
      providesTags: ['RecruitmentCampaign'],
    }),

    getRecruitmentCampaignsByClubId: builder.query<RecruitmentCampaign[], number>({
      query: (clubId) => clubCampaignPath(clubId),
      transformResponse: (response: ApiResponse<RecruitmentCampaign[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'RecruitmentCampaign', id: `club-${clubId}` }],
    }),

    getRecruitmentCampaign: builder.query<
      RecruitmentCampaign,
      { clubId: number; campaignId: number }
    >({
      query: ({ clubId, campaignId }) => `${clubCampaignPath(clubId)}/${campaignId}`,
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      providesTags: (result, error, { campaignId }) => [
        { type: 'RecruitmentCampaign', id: campaignId },
      ],
    }),

    createRecruitmentCampaign: builder.mutation<
      RecruitmentCampaign,
      Omit<RecruitmentCampaign, 'campaignId' | 'createdAt'>
    >({
      query: (campaign) => ({
        url: clubCampaignPath(campaign.clubId),
        method: 'POST',
        body: campaign,
      }),
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      invalidatesTags: ['RecruitmentCampaign'],
    }),

    updateRecruitmentCampaign: builder.mutation<
      RecruitmentCampaign,
      { clubId: number; id: number; data: Partial<RecruitmentCampaign> }
    >({
      query: ({ clubId, id, data }) => ({
        url: `${clubCampaignPath(clubId)}/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<RecruitmentCampaign>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'RecruitmentCampaign', id },
        'RecruitmentCampaign',
      ],
    }),

    deleteRecruitmentCampaign: builder.mutation<void, { clubId: number; id: number }>({
      query: ({ clubId, id }) => ({
        url: `${clubCampaignPath(clubId)}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'RecruitmentCampaign', id },
        'RecruitmentCampaign',
      ],
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
