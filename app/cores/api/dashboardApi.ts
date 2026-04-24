import { baseApi } from './baseApi';
import {
  type ClubReportSummaryResponse,
  type ClubAnalyticsResponse,
} from './types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubReportSummary: builder.query<
      ClubReportSummaryResponse,
      { clubId: number; year: number; month: number }
    >({
      query: ({ clubId, year, month }) => ({
        url: `/clubs/${clubId}/reports/summary`,
        params: { year, month },
      }),
      providesTags: (_r, _e, { clubId }) => [{ type: 'Dashboard', id: `summary-${clubId}` }],
    }),
    getClubReportAnalytics: builder.query<
      ClubAnalyticsResponse,
      { clubId: number; year: number }
    >({
      query: ({ clubId, year }) => ({
        url: `/clubs/${clubId}/reports/analytics`,
        params: { year },
      }),
      providesTags: (_r, _e, { clubId }) => [{ type: 'Dashboard', id: `analytics-${clubId}` }],
    }),
  }),
});

export const {
  useGetClubReportSummaryQuery,
  useGetClubReportAnalyticsQuery,
} = dashboardApi;
