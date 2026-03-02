import { baseApi } from './baseApi';
import type {
  InterviewScheduleResponse,
  CreateInterviewScheduleDto,
  UpdateInterviewScheduleDto,
  UpdateInterviewStatusDto,
  InterviewAssignmentResponse,
  AssignInterviewersDto,
  MeetingRoomResponse,
  JoinRoomDto,
  JoinRoomResponse,
  LeaveRoomDto,
  RoomParticipantResponse,
  RoomEventResponse,
  SubmitFeedbackDto,
  FeedbackSummaryResponse,
  GetInterviewsParams,
  ApiResponse,
} from './types';

export const interviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ═══════════════════════════════════════════════════════════
    //  Interview Schedule CRUD
    // ═══════════════════════════════════════════════════════════

    getInterviews: builder.query<InterviewScheduleResponse[], GetInterviewsParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.campaignId) searchParams.set('campaignId', String(params.campaignId));
        if (params?.status) searchParams.set('status', params.status);
        if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
        if (params?.toDate) searchParams.set('toDate', params.toDate);
        const qs = searchParams.toString();
        return `/interviews${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: ApiResponse<InterviewScheduleResponse[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Interview' as const, id })),
              { type: 'Interview' as const, id: 'LIST' },
            ]
          : [{ type: 'Interview' as const, id: 'LIST' }],
    }),

    getInterviewById: builder.query<InterviewScheduleResponse, number>({
      query: (id) => `/interviews/${id}`,
      transformResponse: (response: ApiResponse<InterviewScheduleResponse>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Interview' as const, id }],
    }),

    createInterview: builder.mutation<InterviewScheduleResponse, CreateInterviewScheduleDto>({
      query: (dto) => ({
        url: '/interviews',
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<InterviewScheduleResponse>) => response.data,
      invalidatesTags: [{ type: 'Interview', id: 'LIST' }],
    }),

    updateInterview: builder.mutation<InterviewScheduleResponse, { id: number; dto: UpdateInterviewScheduleDto }>({
      query: ({ id, dto }) => ({
        url: `/interviews/${id}`,
        method: 'PUT',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<InterviewScheduleResponse>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Interview', id }, { type: 'Interview', id: 'LIST' }],
    }),

    updateInterviewStatus: builder.mutation<void, { id: number; dto: UpdateInterviewStatusDto }>({
      query: ({ id, dto }) => ({
        url: `/interviews/${id}/status`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Interview', id }, { type: 'Interview', id: 'LIST' }],
    }),

    deleteInterview: builder.mutation<void, number>({
      query: (id) => ({
        url: `/interviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Interview', id: 'LIST' }],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Interviewer Assignment
    // ═══════════════════════════════════════════════════════════

    assignInterviewers: builder.mutation<InterviewAssignmentResponse[], { scheduleId: number; dto: AssignInterviewersDto }>({
      query: ({ scheduleId, dto }) => ({
        url: `/interviews/${scheduleId}/assignments`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<InterviewAssignmentResponse[]>) => response.data,
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }],
    }),

    getAssignments: builder.query<InterviewAssignmentResponse[], number>({
      query: (scheduleId) => `/interviews/${scheduleId}/assignments`,
      transformResponse: (response: ApiResponse<InterviewAssignmentResponse[]>) => response.data,
      providesTags: (result, error, scheduleId) => [{ type: 'Interview', id: scheduleId }],
    }),

    removeAssignment: builder.mutation<void, { scheduleId: number; assignmentId: number }>({
      query: ({ scheduleId, assignmentId }) => ({
        url: `/interviews/${scheduleId}/assignments/${assignmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }],
    }),

    confirmAssignment: builder.mutation<void, { scheduleId: number; assignmentId: number }>({
      query: ({ scheduleId, assignmentId }) => ({
        url: `/interviews/${scheduleId}/assignments/${assignmentId}/confirm`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Meeting Room (by schedule)
    // ═══════════════════════════════════════════════════════════

    getRoomByScheduleId: builder.query<MeetingRoomResponse, number>({
      query: (scheduleId) => `/interviews/${scheduleId}/room`,
      transformResponse: (response: ApiResponse<MeetingRoomResponse>) => response.data,
      providesTags: (result, error, scheduleId) => [{ type: 'Interview', id: scheduleId }],
    }),

    joinRoom: builder.mutation<JoinRoomResponse, { roomCode: string; dto: JoinRoomDto }>({
      query: ({ roomCode, dto }) => ({
        url: `/rooms/${roomCode}/join`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<JoinRoomResponse>) => response.data,
    }),

    leaveRoom: builder.mutation<void, { roomCode: string; dto: LeaveRoomDto }>({
      query: ({ roomCode, dto }) => ({
        url: `/rooms/${roomCode}/leave`,
        method: 'POST',
        body: dto,
      }),
    }),

    getParticipants: builder.query<RoomParticipantResponse[], string>({
      query: (roomCode) => `/rooms/${roomCode}/participants`,
      transformResponse: (response: ApiResponse<RoomParticipantResponse[]>) => response.data,
    }),

    getRoomEvents: builder.query<RoomEventResponse[], string>({
      query: (roomCode) => `/rooms/${roomCode}/events`,
      transformResponse: (response: ApiResponse<RoomEventResponse[]>) => response.data,
    }),

    // Close a room (after interview completed)
    closeRoom: builder.mutation<void, string>({
      query: (roomCode) => ({
        url: `/rooms/${roomCode}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Interview', id: 'LIST' }],
    }),

    // Get room info by room code (for validation)
    getRoomByCode: builder.query<MeetingRoomResponse, string>({
      query: (roomCode) => `/rooms/${roomCode}`,
      transformResponse: (response: ApiResponse<MeetingRoomResponse>) => response.data,
    }),

    // ═══════════════════════════════════════════════════════════
    //  Feedback
    // ═══════════════════════════════════════════════════════════

    submitFeedback: builder.mutation<void, { scheduleId: number; assignmentId: number; dto: SubmitFeedbackDto }>({
      query: ({ scheduleId, assignmentId, dto }) => ({
        url: `/interviews/${scheduleId}/assignments/${assignmentId}/feedback`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }],
    }),

    getFeedbackSummary: builder.query<FeedbackSummaryResponse, number>({
      query: (scheduleId) => `/interviews/${scheduleId}/feedback`,
      transformResponse: (response: ApiResponse<FeedbackSummaryResponse>) => response.data,
      providesTags: (result, error, scheduleId) => [{ type: 'Interview', id: scheduleId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInterviewsQuery,
  useGetInterviewByIdQuery,
  useCreateInterviewMutation,
  useUpdateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useDeleteInterviewMutation,
  useAssignInterviewersMutation,
  useGetAssignmentsQuery,
  useRemoveAssignmentMutation,
  useConfirmAssignmentMutation,
  useGetRoomByScheduleIdQuery,
  useJoinRoomMutation,
  useLeaveRoomMutation,
  useGetParticipantsQuery,
  useGetRoomEventsQuery,
  useCloseRoomMutation,
  useGetRoomByCodeQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackSummaryQuery,
} = interviewApi;
