import { baseApi } from './baseApi';
import type {
    EventRegistrationRequest,
    CheckInRequest,
    CheckInCodeResponse,
    EvaluateMemberRequest,
    AttendanceDetailDto,
} from './types/attendance';

export const attendanceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // đăng ký tham gia event
        registerForEvent: builder.mutation<{ message: string }, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/register`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),

        // tạo mã điểm danh — hết hạn sau 15 phút
        generateCheckInCode: builder.mutation<CheckInCodeResponse, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/checkin-code`,
                method: 'POST',
            }),
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

        // chấm điểm + nhận xét thành viên sau event
        evaluateMember: builder.mutation<{ message: string }, EvaluateMemberRequest>({
            query: (request) => ({
                url: `/events/${request.eventId}/evaluate`,
                method: 'POST',
                body: request,
            }),
        }),

        // lấy danh sách người đăng ký
        getEventAttendees: builder.query<AttendanceDetailDto[], number>({
            query: (eventId) => `/events/${eventId}/attendees`,
            providesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),
    }),
});

export const {
    useRegisterForEventMutation,
    useGenerateCheckInCodeMutation,
    useCheckInMutation,
    useEvaluateMemberMutation,
    useGetEventAttendeesQuery,
} = attendanceApi;
