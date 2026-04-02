import { baseApi } from "./baseApi";
import { type Department, type DepartmentCreateRequest, type ApiResponse } from "./types";

export const departmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDepartments: builder.query<Department[], void>({
            query: () => '/Department',
            transformResponse: (response: ApiResponse<Department[]>) => response.data,
            providesTags: ['Department'],
        }),
        getDepartmentById: builder.query<Department, number>({
            query: (id) => `/Department/${id}`,
            transformResponse: (response: ApiResponse<Department>) => response.data,
            providesTags: (result, error, id) => [{ type: 'Department', id }],
        }),
        createDepartment: builder.mutation<Department, DepartmentCreateRequest | Partial<DepartmentCreateRequest>>({
            query: (department) => ({
                url: '/Department',
                method: 'POST',
                body: department,
            }),
            transformResponse: (response: ApiResponse<Department>) => response.data,
            invalidatesTags: ['Department'],
        }),
        updateDepartment: builder.mutation<Department, { id: number; department: Partial<Department> }>({
            query: ({ id, department }) => ({
                url: `/Department/${id}`,
                method: 'PUT',
                body: department,
            }),
            transformResponse: (response: ApiResponse<Department>) => response.data,
            invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }],
        }),
        deleteDepartment: builder.mutation<void, number>({
            query: (id) => ({
                url: `/Department/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Department'],
        }),
        getDepartmentMembers: builder.query<import('./types/department').DepartmentMember[], { clubId: number; departmentId: number }>({
            query: ({ clubId, departmentId }) => `/club/${clubId}/Department/${departmentId}/all-members`,
            transformResponse: (response: ApiResponse<import('./types/department').DepartmentMember[]>) => response.data ?? [],
            providesTags: ['Member'],
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
} = departmentApi;