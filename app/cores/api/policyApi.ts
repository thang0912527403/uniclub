import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface PolicyGroup {
    policyGroupId: number;
    name: string;
    title?: string;
}

export interface Policy {
    id: number;
    name: string;
    description?: string;
    policyGroupId: number;
    title: string;
}

const policyApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getPolicyGroups: builder.query<PolicyGroup[], void>({
            query: () => '/Policy',
            transformResponse: (response: ApiResponse<PolicyGroup[]>) => response.data,
            providesTags: ['Policy'],
        }),

        getPoliciesByGroup: builder.query<Policy[], number>({
            query: (groupId) => `/Policy/${groupId}`,
            transformResponse: (response: ApiResponse<Policy[]>) => response.data,
            providesTags: (result, error, groupId) => [{ type: 'Policy', id: groupId }],
        }),

        getUserPolicies: builder.query<Policy[], string>({
            query: (userId) => `/Policy/user/${userId}`,
            transformResponse: (response: ApiResponse<Policy[]>) => response.data,
            providesTags: ['Policy'],
        }),

        getUserDirectPolicies: builder.query<Policy[], string>({
            query: (userId) => `/Policy/user/${userId}/direct`,
            transformResponse: (response: ApiResponse<Policy[]>) => response.data,
            providesTags: ['Policy'],
        }),

        hasUserPolicy: builder.query<boolean, { userId: string; policyTitle: string }>({
            query: ({ userId, policyTitle }) => `/Policy/user/${userId}/check/${policyTitle}`,
            transformResponse: (response: ApiResponse<boolean>) => response.data,
        }),

        assignPoliciesToUser: builder.mutation<void, { userId: string; policyIds: number[] }>({
            query: ({ userId, policyIds }) => ({
                url: `/Policy/user/${userId}`,
                method: 'POST',
                body: policyIds,
            }),
            invalidatesTags: ['Policy'],
        }),

        revokePolicyFromUser: builder.mutation<void, { userId: string; policyId: number }>({
            query: ({ userId, policyId }) => ({
                url: `/Policy/user/${userId}/${policyId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Policy'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetPolicyGroupsQuery,
    useGetPoliciesByGroupQuery,
    useGetUserPoliciesQuery,
    useGetUserDirectPoliciesQuery,
    useHasUserPolicyQuery,
    useAssignPoliciesToUserMutation,
    useRevokePolicyFromUserMutation
} = policyApi;