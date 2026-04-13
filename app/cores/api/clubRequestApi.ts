import { baseApi } from "./baseApi";
import type { ApiResponse } from "./types";

export interface ClubCreationRequest {
    requestId: number;
    userId: string;
    clubName: string;
    description?: string;
    reason?: string;
    status: string;
    createdAt: string;
}

export interface CreateClubRequestDto {
    userId: string;
    clubName: string;
    description?: string;
    reason?: string;
}

export interface UpdateClubRequestDto {
    clubName: string;
    description?: string;
    reason?: string;
    status: string;
}

const clubRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // GET ALL REQUESTS
        getClubRequests: builder.query<ClubCreationRequest[], void>({
            query: () => "/ClubCreationRequest",
            transformResponse: (response: ApiResponse<ClubCreationRequest[]>) =>
                response.data,
            providesTags: ["ClubRequest"],
        }),

        // GET REQUEST BY ID
        getClubRequestById: builder.query<ClubCreationRequest, number>({
            query: (id) => `/ClubCreationRequest/${id}`,
            transformResponse: (response: ApiResponse<ClubCreationRequest>) =>
                response.data,
            providesTags: (result, error, id) => [{ type: "ClubRequest", id }],
        }),

        // GET REQUEST BY USER
        getClubRequestsByUserId: builder.query<ClubCreationRequest[], string>({
            query: (userId) => `/ClubCreationRequest/user/${userId}`,
            transformResponse: (response: ApiResponse<ClubCreationRequest[]>) =>
                response.data,
            providesTags: ["ClubRequest"],
        }),

        // CHECK PENDING REQUEST
        checkPendingRequest: builder.query<boolean, string>({
            query: (userId) => `/ClubCreationRequest/user/${userId}/has-pending`,
            transformResponse: (response: ApiResponse<boolean>) => response.data,
            providesTags: ["ClubRequest"],
        }),

        // CREATE REQUEST
        createClubRequest: builder.mutation<boolean, CreateClubRequestDto>({
            query: (body) => ({
                url: "/ClubCreationRequest",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<boolean>) => response.success,
            invalidatesTags: ["ClubRequest"],
        }),

        // UPDATE REQUEST
        updateClubRequest: builder.mutation<
            boolean,
            { id: number; request: UpdateClubRequestDto }
        >({
            query: ({ id, request }) => ({
                url: `/ClubCreationRequest/${id}`,
                method: "PUT",
                body: request,
            }),
            transformResponse: (response: ApiResponse<boolean>) => response.success,
            invalidatesTags: (result, error, { id }) => [
                { type: "ClubRequest", id },
                "ClubRequest",
            ],
        }),

        // DELETE REQUEST
        deleteClubRequest: builder.mutation<boolean, number>({
            query: (id) => ({
                url: `/ClubCreationRequest/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<boolean>) => response.success,
            invalidatesTags: ["ClubRequest"],
        }),

        updateClubRequestStatus: builder.mutation<
            any,
            { id: number; status: string; adminComment?: string }
        >({
            query: ({ id, status, adminComment }) => ({
                url: `/ClubCreationRequest/${id}/status`,
                method: 'PUT',
                body: {
                    status,
                    adminComment
                }
            }),
            invalidatesTags: ["ClubRequest"],
        }),
    }),

    overrideExisting: true,
});

export const {
    useGetClubRequestsQuery,
    useGetClubRequestByIdQuery,
    useGetClubRequestsByUserIdQuery,
    useCheckPendingRequestQuery,
    useCreateClubRequestMutation,
    useUpdateClubRequestMutation,
    useDeleteClubRequestMutation,
    useUpdateClubRequestStatusMutation
} = clubRequestApi;