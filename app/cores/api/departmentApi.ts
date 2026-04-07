import { baseApi } from "./baseApi";
import { type Department, type DepartmentCreateRequest, type ApiResponse } from "./types";

export const departmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDepartments: builder.query<Department[], number>({
            query: (clubId) => `/club/${clubId}/Department`,
            transformResponse: (response: ApiResponse<Department[]>) => response.data,
            providesTags: ['Department'],
        }),
        getDepartmentById: builder.query<Department, { clubId: number; id: number }>({
            query: ({ clubId, id }) => `/club/${clubId}/Department/${id}`,
            transformResponse: (response: ApiResponse<Department>) => response.data,
            providesTags: (result, error, { id }) => [{ type: 'Department', id }],
        }),
        createDepartment: builder.mutation<Department, { clubId: number; department: DepartmentCreateRequest | Partial<DepartmentCreateRequest> }>({
            query: ({ clubId, department }) => ({
                url: `/club/${clubId}/Department`,
                method: 'POST',
                body: department,
            }),
            transformResponse: (response: ApiResponse<Department>) => response.data,
            invalidatesTags: ['Department'],
        }),
        updateDepartment: builder.mutation<Department, { clubId: number; id: number; department: Partial<Department> }>({
            query: ({ clubId, id, department }) => ({
                url: `/club/${clubId}/Department/${id}`,
                method: 'PUT',
                body: department,
            }),
            transformResponse: (response: ApiResponse<Department>) => response.data,
            invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }],
        }),
        deleteDepartment: builder.mutation<void, { clubId: number; id: number }>({
            query: ({ clubId, id }) => ({
                url: `/club/${clubId}/Department/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Department'],
        }),
        getDepartmentMembers: builder.query<import('./types/department').DepartmentMember[], { clubId: number; departmentId: number }>({
            query: ({ clubId, departmentId }) => `/club/${clubId}/Department/${departmentId}/all-members`,
            transformResponse: (response: ApiResponse<import('./types/department').DepartmentMember[]>) => response.data ?? [],
            providesTags: ['Member'],
        }),
        addMemberToDepartment: builder.mutation<void, { clubId: number; departmentId: number; memberId: string }>({
            query: ({ clubId, departmentId, memberId }) => ({
                url: `/club/${clubId}/Department/${departmentId}/members/${memberId}/add`,
                method: 'POST',
            }),
            invalidatesTags: ['Member'],
        }),
        removeMemberFromDepartment: builder.mutation<void, { clubId: number; departmentId: number; memberId: string }>({
            query: ({ clubId, departmentId, memberId }) => ({
                url: `/club/${clubId}/Department/${departmentId}/members/${memberId}/remove`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Member'],
        }),
    }),
});

export const {
    useGetDepartmentsQuery,
    useGetDepartmentByIdQuery,
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
    useGetDepartmentMembersQuery,
    useAddMemberToDepartmentMutation,
    useRemoveMemberFromDepartmentMutation,
} = departmentApi;
