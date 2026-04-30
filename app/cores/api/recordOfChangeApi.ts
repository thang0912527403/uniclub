import { baseApi } from './baseApi';
import type { RecordOfChange, RecordOfChangeParams, RecordOfChangeResult } from './types/recordOfChange';

export const recordOfChangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecordsOfChange: builder.query<RecordOfChangeResult, RecordOfChangeParams>({
      query: (params = {}) => {
        const {
          pageNumber = 1,
          pageSize = 10,
          search,
          entityName,
          changeType,
          clubId,
          changedBy,
          fromDate,
          toDate,
          oldValueSearch,
          newValueSearch,
        } = params;

        const q = new URLSearchParams();
        q.set('pageNumber', String(pageNumber));
        q.set('pageSize', String(pageSize));
        if (search) q.set('search', search);
        if (entityName) q.set('entityName', entityName);
        if (changeType) q.set('changeType', changeType);
        if (clubId !== undefined && clubId !== '') q.set('clubId', String(clubId));
        if (changedBy) q.set('changedBy', changedBy);
        if (fromDate) q.set('fromDate', fromDate);
        if (toDate) q.set('toDate', toDate);
        if (oldValueSearch) q.set('oldValueSearch', oldValueSearch);
        if (newValueSearch) q.set('newValueSearch', newValueSearch);

        return `/recordofchange?${q.toString()}`;
      },
      transformResponse: (response: unknown): RecordOfChangeResult => {
        // Backend: { success, data: RecordOfChange[], totalCount, totalPages, ... }
        if (Array.isArray(response)) {
          return { items: response as RecordOfChange[], totalCount: response.length };
        }
        if (response && typeof response === 'object') {
          const r = response as Record<string, unknown>;
          const totalCount = typeof r.totalCount === 'number' ? r.totalCount : 0;
          // data là array trực tiếp (không phải { items: [] })
          if (Array.isArray(r.data)) {
            return { items: r.data as RecordOfChange[], totalCount: totalCount || (r.data as unknown[]).length };
          }
          // fallback: data là object có items bên trong
          if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
            const d = r.data as Record<string, unknown>;
            const items = (Array.isArray(d.items) ? d.items : []) as RecordOfChange[];
            return { items, totalCount: typeof d.totalCount === 'number' ? d.totalCount : items.length };
          }
          if (Array.isArray(r.items)) {
            return { items: r.items as RecordOfChange[], totalCount: totalCount || (r.items as unknown[]).length };
          }
        }
        return { items: [], totalCount: 0 };
      },
      providesTags: ['RecordOfChange'],
    }),
  }),
});

export const { useGetRecordsOfChangeQuery } = recordOfChangeApi;
