import { baseApi } from "./baseApi";
import {
  type Club,
  type ApiResponse,
  type ClubPostResponseDto,
  type ClubMember,
} from "./types";

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubs: builder.query<
      { data: Club[]; totalPage: number; totalCount: number },
      { pageIndex: string; searchQuery: string; pageSize: string }
    >({
      query: ({ pageIndex, searchQuery, pageSize }) =>
        `/Club?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ["Club"],
    }),

    getActiveClubs: builder.query<
      { data: Club[]; totalPage: number; totalCount: number },
      { pageIndex: string; searchQuery: string; pageSize: string }
    >({
      query: ({ pageIndex, searchQuery, pageSize }) =>
        `/Club/active?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ["Club"],
    }),
    getClubById: builder.query<Club, number>({
      query: (id) => `/Club/${id}`,
      transformResponse: (response: ApiResponse<Club>) => response.data,
      providesTags: (result, error, id) => [{ type: "Club", id }],
    }),
    getClubMembers: builder.query<ClubMember[], number>({
      query: (clubId) => `/clubs/${clubId}/members`,
      transformResponse: (response: ApiResponse<ClubMember[]>) => response.data,
      providesTags: (result, error, clubId) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    createClub: builder.mutation<Club, Partial<Club>>({
      query: (club) => ({
        url: `/Club`,
        method: "POST",
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: ["Club"],
    }),
    updateClub: builder.mutation<Club, { id: number; club: Partial<Club> }>({
      query: ({ id, club }) => ({
        url: `/Club/${id}`,
        method: "PUT",
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: "Club", id }],
    }),
    deleteClub: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Club/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Club"],
    }),
    toggleClubStatus: builder.mutation<Club, { id: number; isActive: boolean }>(
      {
        query: ({ id }) => ({
          url: `/Club/ChangeStatus/${id}`,
          method: "PUT",
        }),
        transformResponse: (response: ApiResponse<Club>) => response.data,
        invalidatesTags: (result, error, { id }) => [
          { type: "Club", id },
          "Club",
        ],
      },
    ),
    getClubPosts: builder.query<ClubPostResponseDto[], void>({
      query: () => `/ClubPost`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) =>
        response.data,
      providesTags: ["ClubPost"],
    }),
    getClubPostById: builder.query<ClubPostResponseDto, number>({
      query: (id) => `/ClubPost/${id}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "ClubPost", id }],
    }),
    getClubPostsByClubId: builder.query<ClubPostResponseDto[], number>({
      query: (clubId) => `/ClubPost/club/${clubId}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) =>
        response.data,
      providesTags: ["ClubPost"],
    }),
    createClubPost: builder.mutation<ClubPostResponseDto, FormData>({
      query: (formData) => ({
        url: "/ClubPost",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: ["ClubPost"],
    }),

    updateClubPost: builder.mutation<
      ClubPostResponseDto,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/ClubPost/${id}`,
        method: "PUT",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "ClubPost", id },
        "ClubPost",
      ],
    }),

    deleteClubPost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/ClubPost/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClubPost"],
    }),
    // ─── Club Members ────────────────────────────────────────────────────
    getClubMemberById: builder.query<
      ClubMember,
      { clubId: number; memberId: number }
    >({
      query: ({ clubId, memberId }) => `/clubs/${clubId}/members/${memberId}`,
      transformResponse: (response: ApiResponse<ClubMember>) => response.data,
      providesTags: (_result, _error, { memberId }) => [
        { type: "Club", id: `member-${memberId}` },
      ],
    }),
    addMember: builder.mutation<
      ClubMember,
      { clubId: number; userId: string; clubRoleId?: number | null }
    >({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/members`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ClubMember>) => response.data,
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    addMembers: builder.mutation<void, { clubId: number; emails: string[] }>({
      query: ({ clubId, emails }) => ({
        url: `/Club/${clubId}/add-members`,
        method: "POST",
        body: emails,
      }),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    removeMember: builder.mutation<void, { clubId: number; memberId: number }>({
      query: ({ clubId, memberId }) => ({
        url: `/clubs/${clubId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    toggleMemberStatus: builder.mutation<
      void,
      { clubId: number; memberId: number; isActive: boolean }
    >({
      query: ({ clubId, memberId, isActive }) => ({
        url: `/clubs/${clubId}/members/${memberId}/status`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { clubId, memberId }) => [
        { type: "Club", id: `members-${clubId}` },
        { type: "Club", id: `member-${memberId}` },
      ],
    }),
    // ─── Member Departments ──────────────────────────────────────────────
    getMemberJoinedDepartments: builder.query<
      import("./types/department").Department[],
      { clubId: number; memberId: number }
    >({
      query: ({ clubId, memberId }) =>
        `/clubs/${clubId}/members/${memberId}/departments/joined`,
      transformResponse: (
        response: ApiResponse<import("./types/department").Department[]>,
      ) => response.data ?? [],
      providesTags: ["Department"],
    }),
    getMemberNotJoinedDepartments: builder.query<
      import("./types/department").Department[],
      { clubId: number; memberId: number }
    >({
      query: ({ clubId, memberId }) =>
        `/clubs/${clubId}/members/${memberId}/departments/not-joined`,
      transformResponse: (
        response: ApiResponse<import("./types/department").Department[]>,
      ) => response.data ?? [],
      providesTags: ["Department"],
    }),
    // ─── Member Roles ───────────────────────────────────────────────────
    updateMemberRole: builder.mutation<
      void,
      { clubId: number; memberId: number; clubRoleIds: number[] }
    >({
      query: ({ clubId, memberId, clubRoleIds }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: "PUT",
        body: { clubRoleIds },
      }),
      invalidatesTags: (_result, _error, { clubId, memberId }) => [
        { type: "Club", id: `members-${clubId}` },
        { type: "Club", id: `member-${memberId}` },
      ],
    }),

    // ─── Member Count ───────────────────────────────────────────────────
    getClubMemberCount: builder.query<number, number>({
      query: (clubId) => `/clubs/${clubId}/members/count`,
      transformResponse: (response: { success: boolean; data: number }) =>
        response.data,
      providesTags: (_result, _error, clubId) => [
        { type: "Member", id: `count-${clubId}` },
      ],
    }),
  }),
});


export const {
  useGetClubsQuery,
  useGetActiveClubsQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsQuery,
  useGetClubPostsByClubIdQuery,
  useGetClubPostByIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useGetClubMemberByIdQuery,
  useAddMemberMutation,
  useAddMembersMutation,
  useRemoveMemberMutation,
  useToggleMemberStatusMutation,
  useGetMemberJoinedDepartmentsQuery,
  useGetMemberNotJoinedDepartmentsQuery,
  useUpdateMemberRoleMutation,
  useGetClubMemberCountQuery,
} = clubApi;
