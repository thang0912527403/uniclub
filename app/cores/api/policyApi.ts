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
    title:string;
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
    }),
    overrideExisting: false,
});

export const {
    useGetPolicyGroupsQuery,
    useGetPoliciesByGroupQuery,
} = policyApi;
