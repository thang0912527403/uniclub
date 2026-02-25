import { baseApi } from './baseApi';
import { type ApiResponse, type ClubRole } from './types';



export interface CreateClubRoleDto {
    roleName: string;
    description?: string;
}

export interface UpdateClubRoleDto {
    roleName: string;
    description?: string;
}

const clubRoleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getClubRoles: builder.query<ClubRole[], void>({
            query: () => '/ClubRole',
            transformResponse: (response: ApiResponse<ClubRole[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [...result.map(({ clubRoleId }) => ({ type: 'ClubRole' as const, id: clubRoleId })), 'ClubRole']
                    : ['ClubRole'],
        }),

        getClubRoleById: builder.query<ClubRole, number>({
            query: (id) => `/ClubRole/${id}`,
            transformResponse: (response: ApiResponse<ClubRole>) => response.data,
            providesTags: (result, error, id) => [{ type: 'ClubRole', id }],
        }),

        /** Get policy IDs assigned to a role */
        getClubRolePolicies: builder.query<number[], number>({
            query: (roleId) => `/ClubRole/${roleId}/policies`,
            transformResponse: (response: ApiResponse<{ id: number }[]>) =>
                response.data.map((p) => p.id),
            providesTags: (result, error, roleId) => [{ type: 'ClubRole', id: `policies-${roleId}` }],
        }),

        /** Replace all policies assigned to a role */
        updateClubRolePolicies: builder.mutation<void, { roleId: number; policyIds: number[] }>({
            query: ({ roleId, policyIds }) => ({
                url: `/ClubRole/${roleId}/policies`,
                method: 'PUT',
                body:  policyIds ,
            }),
            invalidatesTags: (result, error, { roleId }) => [{ type: 'ClubRole', id: `policies-${roleId}` }],
        }),

        createClubRole: builder.mutation<ClubRole, CreateClubRoleDto>({
            query: (body) => ({
                url: '/ClubRole',
                method: 'POST',
                body,
            }),
            transformResponse: (response: ApiResponse<ClubRole>) => response.data,
            invalidatesTags: ['ClubRole'],
        }),

        updateClubRole: builder.mutation<ClubRole, { id: number; body: UpdateClubRoleDto }>({
            query: ({ id, body }) => ({
                url: `/ClubRole/${id}`,
                method: 'PUT',
                body,
            }),
            transformResponse: (response: ApiResponse<ClubRole>) => response.data,
            invalidatesTags: (result, error, { id }) => [{ type: 'ClubRole', id }, 'ClubRole'],
        }),

        deleteClubRole: builder.mutation<void, number>({
            query: (id) => ({
                url: `/ClubRole/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'ClubRole', id }, 'ClubRole'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetClubRolesQuery,
    useGetClubRoleByIdQuery,
    useGetClubRolePoliciesQuery,
    useUpdateClubRolePoliciesMutation,
    useCreateClubRoleMutation,
    useUpdateClubRoleMutation,
    useDeleteClubRoleMutation,
} = clubRoleApi;
