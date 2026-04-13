import { baseApi } from './baseApi';
import type {
    EventRegistrationRequest,
    CheckInRequest,
    CheckInCodeResponse,
    EvaluateMemberRequest,
    AttendanceDetailDto,
    CheckInQrResponse,
    CheckInByQrRequest,
    CheckInByQrResponse,
} from './types/attendance';

// New response types for improved API
export interface BulkApproveResult {
    approved: number;
    total: number;
    skippedDueToSlot: number;
    remainingSlots: number;
    message: string;
}

export interface AttendeePagedResult {
    items: AttendanceDetailDto[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export const attendanceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ===== USER-FACING endpoints (api/events) =====

        // đăng ký tham gia event
        registerForEvent: builder.mutation<{ message: string }, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/register`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),

        // huỷ tham gia — user tự huỷ đăng ký của mình
        cancelRegistration: builder.mutation<{ message: string }, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),

        // điểm danh bằng mã 6 ký tự
        checkIn: builder.mutation<{ message: string }, CheckInRequest>({
            query: (request) => ({
                url: `/events/${request.eventId}/checkin`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // QR: lấy mã QR điểm danh của user hiện tại (participant mở để cho BTC quét)
        getMyCheckInQr: builder.query<CheckInQrResponse, number>({
            query: (eventId) => `/events/${eventId}/my-checkin-qr`,
            providesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),

        // ===== CLUB-SCOPED / MANAGER endpoints (api/club/{clubId}/events) =====

        // duyệt đăng ký (PENDING → REGISTERED) — Manager only
        approveRegistration: builder.mutation<{ message: string }, { clubId: number; eventId: number; userId: string }>({
            query: ({ clubId, eventId, userId }) => ({
                url: `/club/${clubId}/events/${eventId}/approve/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // từ chối đăng ký (PENDING → CANCELLED) — Manager only
        rejectRegistration: builder.mutation<{ message: string }, { clubId: number; eventId: number; userId: string }>({
            query: ({ clubId, eventId, userId }) => ({
                url: `/club/${clubId}/events/${eventId}/reject/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // duyệt hàng loạt (Bulk approve) — trả về chi tiết slot
        bulkApproveRegistrations: builder.mutation<BulkApproveResult, { clubId: number; eventId: number; userIds: string[] }>({
            query: ({ clubId, eventId, userIds }) => ({
                url: `/club/${clubId}/events/${eventId}/approve-bulk`,
                method: 'POST',
                body: userIds,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // tạo mã điểm danh — hết hạn sau 15 phút
        generateCheckInCode: builder.mutation<CheckInCodeResponse, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => ({
                url: `/club/${clubId}/events/${eventId}/checkin-code`,
                method: 'POST',
            }),
        }),

        // chấm điểm + nhận xét thành viên sau event
        evaluateMember: builder.mutation<{ message: string }, EvaluateMemberRequest & { clubId: number }>({
            query: ({ clubId, ...request }) => ({
                url: `/club/${clubId}/events/${request.eventId}/evaluate`,
                method: 'POST',
                body: request,
            }),
        }),

        // lấy danh sách người đăng ký — KHÔNG filter (backward compatible)
        getEventAttendees: builder.query<AttendanceDetailDto[], { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/attendees`,
            providesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // lấy danh sách theo status + phân trang — server-side
        getEventAttendeesPaged: builder.query<AttendeePagedResult, {
            clubId: number; eventId: number; status: string; page?: number; pageSize?: number
        }>({
            query: ({ clubId, eventId, status, page = 1, pageSize = 50 }) =>
                `/club/${clubId}/events/${eventId}/attendees?status=${status}&page=${page}&pageSize=${pageSize}`,
            providesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // QR: điểm danh bằng token đọc từ QR (organizer gọi sau khi quét mã của participant)
        checkInByQr: builder.mutation<CheckInByQrResponse, { clubId: number; eventId: number; token: string }>({
            query: ({ clubId, eventId, token }) => ({
                url: `/club/${clubId}/events/${eventId}/checkin-qr`,
                method: 'POST',
                body: { token },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // Manager thêm thành viên CLB vào sự kiện
        addAttendees: builder.mutation<{ message: string; addedCount: number }, { clubId: number; eventId: number; userIds: string[] }>({
            query: ({ clubId, eventId, userIds }) => ({
                url: `/club/${clubId}/events/${eventId}/add-attendees`,
                method: 'POST',
                body: userIds,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        // Cập nhật trạng thái (PENDING ↔ WAITLIST) — Manager only
        updateAttendeeStatus: builder.mutation<{ message: string }, {
            clubId: number; eventId: number; userId: string; status: string
        }>({
            query: ({ clubId, eventId, userId, status }) => ({
                url: `/club/${clubId}/events/${eventId}/attendees/${userId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),
    }),
});

export const {
    useRegisterForEventMutation,
    useApproveRegistrationMutation,
    useRejectRegistrationMutation,
    useBulkApproveRegistrationsMutation,
    useCancelRegistrationMutation,
    useGenerateCheckInCodeMutation,
    useCheckInMutation,
    useEvaluateMemberMutation,
    useGetEventAttendeesQuery,
    useGetEventAttendeesPagedQuery,
    useGetMyCheckInQrQuery,
    useCheckInByQrMutation,
    useAddAttendeesMutation,
    useUpdateAttendeeStatusMutation,
} = attendanceApi;
