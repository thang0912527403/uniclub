import { baseApi } from './baseApi';
import { type Club, type ClubMember, type ApiResponse } from './types';

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
    getClubMembers: builder.query<ClubMember[], number>({
      query: (clubId) => `/clubs/${clubId}/members`,
      transformResponse: (response: ApiResponse<ClubMember[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'Club', id: `members-${clubId}` }],
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
      query: ({ id }) => ({
        url: `/Club/ChangeStatus/${id}`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Club', id }, 'Club'],
    }),
    updateMemberRole: builder.mutation<void, { clubId: number; memberId: number; clubRoleId: number | null }>({
      query: ({ clubId, memberId, clubRoleId }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: 'PUT',
        body: { clubRoleId },
      }),
      invalidatesTags: (result, error, { clubId }) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useUpdateMemberRoleMutation,
} = clubApi;
