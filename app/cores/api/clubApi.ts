import { baseApi, API_CONFIG } from './baseApi';
import type { Club, CreateClubRequest } from './types';

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubs: builder.query<Club[], void>({
      query: () => ({
        url: '/clubs',
        baseUrl: API_CONFIG.CLUB_SERVICE,
      }),
      providesTags: ['Club'],
    }),

    getClub: builder.query<Club, string>({
      query: (id) => ({
        url: `/clubs/${id}`,
        baseUrl: API_CONFIG.CLUB_SERVICE,
      }),
      providesTags: ['Club'],
    }),

    createClub: builder.mutation<Club, CreateClubRequest>({
      query: (club) => ({
        url: '/clubs',
        method: 'POST',
        body: club,
        baseUrl: API_CONFIG.CLUB_SERVICE,
      }),
      invalidatesTags: ['Club'],
    }),

    updateClub: builder.mutation<Club, { id: string; data: Partial<Club> }>({
      query: ({ id, data }) => ({
        url: `/clubs/${id}`,
        method: 'PATCH',
        body: data,
        baseUrl: API_CONFIG.CLUB_SERVICE,
      }),
      invalidatesTags: ['Club'],
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetClubQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
} = clubApi;
