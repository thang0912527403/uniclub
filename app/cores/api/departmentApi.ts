import { baseApi } from "./baseApi";
import { type Department, type DepartmentCreateRequest, type ApiResponse } from "./types";
import type { DepartmentMember, UserDepartment } from "./types/department";

export const departmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDepartments: builder.query<UserDepartment[], number>({
            query: (clubId) => `/club/${clubId}/Department`,
            transformResponse: (response: ApiResponse<Record<string, unknown>[]>) =>
                (response.data ?? []).map(d => ({
                    departmentId: (d.departmentId ?? d.DepartmentId) as number,
                    departmentName: (d.departmentName ?? d.Name ?? '') as string,
                    description: (d.description ?? d.Description ?? '') as string,
                    departmentRole: (d.departmentRole ?? null) as string | null,
                    roles: (d.roles ?? []) as UserDepartment['roles'],
                    memberCount: (d.memberCount ?? 0) as number,
                    roleCount: (d.roleCount ?? 0) as number,
                })),
            providesTags: ['Department'],
        }),
        getDepartmentById: builder.query<Department, { clubId: number; id: number }>({
            query: ({ clubId, id }) => `/club/${clubId}/Department/${id}`,
            transformResponse: (response: ApiResponse<Department>) => response.data,
            providesTags: (_result, _error, { id }) => [{ type: 'Department', id }],
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
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Department', id }, 'Department'],
        }),
        deleteDepartment: builder.mutation<void, { clubId: number; id: number }>({
            query: ({ clubId, id }) => ({
                url: `/club/${clubId}/Department/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Department'],
        }),
        getDepartmentMembers: builder.query<DepartmentMember[], { clubId: number; departmentId: number }>({
            query: ({ clubId, departmentId }) => `/club/${clubId}/Department/${departmentId}/all-members`,
            transformResponse: (response: ApiResponse<DepartmentMember[]>) => response.data ?? [],
            providesTags: ['Member'],
        }),
        // Lấy club members chưa thuộc department (dùng cho modal thêm thành viên)
        getNonMembers: builder.query<DepartmentMember[], { clubId: number; departmentId: number }>({
            query: ({ clubId, departmentId }) => `/club/${clubId}/Department/${departmentId}/non-members`,
            transformResponse: (response: ApiResponse<DepartmentMember[]>) => response.data ?? [],
            providesTags: ['Member'],
        }),
        addMemberToDepartment: builder.mutation<void, { clubId: number; departmentId: number; memberId: number }>({
            query: ({ clubId, departmentId, memberId }) => ({
                url: `/club/${clubId}/Department/${departmentId}/members/${memberId}/add`,
                method: 'POST',
            }),
            invalidatesTags: ['Member'],
        }),
        removeMemberFromDepartment: builder.mutation<void, { clubId: number; departmentId: number; memberId: number }>({
            query: ({ clubId, departmentId, memberId }) => ({
                url: `/club/${clubId}/Department/${departmentId}/members/${memberId}/remove`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Member'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetDepartmentsQuery,
    useGetDepartmentByIdQuery,
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
    useGetDepartmentMembersQuery,
    useGetNonMembersQuery,
    useAddMemberToDepartmentMutation,
    useRemoveMemberFromDepartmentMutation,
} = departmentApi;
