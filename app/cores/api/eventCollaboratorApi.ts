import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface MyEventRole {
    role: string | null;
    policies: string[];
}

export interface EventRole {
    eventRoleId: number;
    roleName: string;
    description: string;
    level: number;
    policies: string[];
}

export interface EventMember {
    eventMemberId: number;
    userId: string;
    userName: string;
    userAvatar?: string;
    roleId?: number;
    roleName?: string;
    joinDate: string;
    status: number;
    rolePolicies: string[];
    customPolicies: string[];
}

export const eventCollaboratorApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        /** My Role */
        getMyEventRole: builder.query<MyEventRole, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/my-role`,
            providesTags: (r, e, arg) => [{ type: 'Event', id: `role-${arg.eventId}` }],
        }),

        /** Event Roles */
        getEventRoles: builder.query<EventRole[], { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/roles`,
            providesTags: (r, e, arg) => [{ type: 'EventRoles', id: arg.eventId }],
        }),
        createEventRole: builder.mutation<void, { clubId: number; eventId: number; roleName: string; description?: string }>({
            query: ({ clubId, eventId, ...body }) => ({
                url: `/club/${clubId}/events/${eventId}/roles`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventRoles', id: arg.eventId }],
        }),
        updateEventRole: builder.mutation<void, { clubId: number; eventId: number; roleId: number; roleName: string; description?: string }>({
            query: ({ clubId, eventId, roleId, ...body }) => ({
                url: `/club/${clubId}/events/${eventId}/roles/${roleId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventRoles', id: arg.eventId }],
        }),
        deleteEventRole: builder.mutation<void, { clubId: number; eventId: number; roleId: number }>({
            query: ({ clubId, eventId, roleId }) => ({
                url: `/club/${clubId}/events/${eventId}/roles/${roleId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventRoles', id: arg.eventId }],
        }),
        setEventRolePolicies: builder.mutation<void, { clubId: number; eventId: number; roleId: number; policies: string[] }>({
            query: ({ clubId, eventId, roleId, policies }) => ({
                url: `/club/${clubId}/events/${eventId}/roles/${roleId}/policies`,
                method: 'PUT',
                body: policies,
            }),
            invalidatesTags: (r, e, arg) => [
                { type: 'EventRoles', id: arg.eventId },
                { type: 'EventMembers', id: arg.eventId },
            ],
        }),

        /** Event Members */
        getEventMembers: builder.query<EventMember[], { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/members`,
            providesTags: (r, e, arg) => [{ type: 'EventMembers', id: arg.eventId }],
        }),
        addEventMember: builder.mutation<void, { clubId: number; eventId: number; userId: string; eventRoleId?: number }>({
            query: ({ clubId, eventId, ...body }) => ({
                url: `/club/${clubId}/events/${eventId}/members`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventMembers', id: arg.eventId }],
        }),
        updateEventMemberRole: builder.mutation<void, { clubId: number; eventId: number; memberId: number; roleId?: number }>({
            query: ({ clubId, eventId, memberId, roleId }) => ({
                url: `/club/${clubId}/events/${eventId}/members/${memberId}/role`,
                method: 'PUT',
                body: roleId,
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventMembers', id: arg.eventId }],
        }),
        removeEventMember: builder.mutation<void, { clubId: number; eventId: number; memberId: number }>({
            query: ({ clubId, eventId, memberId }) => ({
                url: `/club/${clubId}/events/${eventId}/members/${memberId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventMembers', id: arg.eventId }],
        }),
        setEventMemberPolicies: builder.mutation<void, { clubId: number; eventId: number; memberId: number; policies: string[] }>({
            query: ({ clubId, eventId, memberId, policies }) => ({
                url: `/club/${clubId}/events/${eventId}/members/${memberId}/policies`,
                method: 'PUT',
                body: policies,
            }),
            invalidatesTags: (r, e, arg) => [{ type: 'EventMembers', id: arg.eventId }],
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetMyEventRoleQuery,
    useGetEventRolesQuery,
    useCreateEventRoleMutation,
    useUpdateEventRoleMutation,
    useDeleteEventRoleMutation,
    useSetEventRolePoliciesMutation,
    useGetEventMembersQuery,
    useAddEventMemberMutation,
    useUpdateEventMemberRoleMutation,
    useRemoveEventMemberMutation,
    useSetEventMemberPoliciesMutation,
} = eventCollaboratorApi;

