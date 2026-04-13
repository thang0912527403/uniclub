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
  EvaluationCriterionResponse,
  CreateEvaluationCriterionDto,
  UpdateEvaluationCriterionDto,
  AssignCriteriaDto,
  CriteriaScoreResponse,
  SubmitCriteriaFeedbackDto,
  EvaluationSummaryResponse,
  CandidateComparisonItem,
  SubmitDecisionsDto,
  CampaignDecisionResponse,
  PublishResultDto,
  PublishStatusResponse,
  AiAnalysisResponse,
  AiSearchRequest,
  AiSearchResponse,
  ConfirmTimeSlotDto,
  ProposedTimeSlotResponse,
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
    //  Proposed Time Slots
    // ═══════════════════════════════════════════════════════════

    getTimeSlots: builder.query<ProposedTimeSlotResponse[], number>({
      query: (scheduleId) => `/interviews/${scheduleId}/time-slots`,
      transformResponse: (response: ApiResponse<ProposedTimeSlotResponse[]>) => response.data,
      providesTags: (result, error, scheduleId) => [{ type: 'Interview', id: scheduleId }],
    }),

    confirmTimeSlot: builder.mutation<InterviewScheduleResponse, { scheduleId: number; dto: ConfirmTimeSlotDto }>({
      query: ({ scheduleId, dto }) => ({
        url: `/interviews/${scheduleId}/confirm-time-slot`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<InterviewScheduleResponse>) => response.data,
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }, { type: 'Interview', id: 'LIST' }],
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

    // ═══════════════════════════════════════════════════════════
    //  Evaluation Criteria
    // ═══════════════════════════════════════════════════════════

    getCampaignCriteria: builder.query<EvaluationCriterionResponse[], number>({
      query: (campaignId) => `/interviews/campaign/${campaignId}/criteria`,
      transformResponse: (response: ApiResponse<EvaluationCriterionResponse[]>) => response.data,
      providesTags: (result, error, campaignId) => [{ type: 'Interview' as const, id: `CRITERIA_${campaignId}` }],
    }),

    createCriterion: builder.mutation<EvaluationCriterionResponse, { campaignId: number; dto: CreateEvaluationCriterionDto }>({
      query: ({ campaignId, dto }) => ({
        url: `/interviews/campaign/${campaignId}/criteria`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<EvaluationCriterionResponse>) => response.data,
      invalidatesTags: (result, error, { campaignId }) => [{ type: 'Interview', id: `CRITERIA_${campaignId}` }],
    }),

    updateCriterion: builder.mutation<EvaluationCriterionResponse, { criterionId: number; dto: UpdateEvaluationCriterionDto; campaignId: number }>({
      query: ({ criterionId, dto }) => ({
        url: `/interviews/criteria/${criterionId}`,
        method: 'PUT',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<EvaluationCriterionResponse>) => response.data,
      invalidatesTags: (result, error, { campaignId }) => [{ type: 'Interview', id: `CRITERIA_${campaignId}` }],
    }),

    deleteCriterion: builder.mutation<void, { criterionId: number; campaignId: number }>({
      query: ({ criterionId }) => ({
        url: `/interviews/criteria/${criterionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { campaignId }) => [{ type: 'Interview', id: `CRITERIA_${campaignId}` }],
    }),

    assignCriteria: builder.mutation<void, { scheduleId: number; assignmentId: number; dto: AssignCriteriaDto }>({
      query: ({ scheduleId, assignmentId, dto }) => ({
        url: `/interviews/${scheduleId}/assignments/${assignmentId}/criteria`,
        method: 'PUT',
        body: dto,
      }),
      invalidatesTags: (result, error, { scheduleId, assignmentId }) => [
        { type: 'Interview', id: scheduleId },
        { type: 'Interview', id: `SCORES_${scheduleId}_${assignmentId}` },
      ],
    }),

    getCriteriaScores: builder.query<CriteriaScoreResponse[], { scheduleId: number; assignmentId: number }>({
      query: ({ scheduleId, assignmentId }) => `/interviews/${scheduleId}/assignments/${assignmentId}/criteria-scores`,
      transformResponse: (response: ApiResponse<CriteriaScoreResponse[]>) => response.data,
      providesTags: (result, error, { scheduleId, assignmentId }) => [
        { type: 'Interview', id: `SCORES_${scheduleId}_${assignmentId}` },
        { type: 'Interview', id: scheduleId },
      ],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Criteria-based Feedback & Evaluation
    // ═══════════════════════════════════════════════════════════

    submitCriteriaFeedback: builder.mutation<void, { scheduleId: number; assignmentId: number; dto: SubmitCriteriaFeedbackDto }>({
      query: ({ scheduleId, assignmentId, dto }) => ({
        url: `/interviews/${scheduleId}/assignments/${assignmentId}/criteria-feedback`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [{ type: 'Interview', id: scheduleId }],
    }),

    getEvaluationSummary: builder.query<EvaluationSummaryResponse, number>({
      query: (scheduleId) => `/interviews/${scheduleId}/evaluation-summary`,
      transformResponse: (response: ApiResponse<EvaluationSummaryResponse>) => response.data,
      providesTags: (result, error, scheduleId) => [{ type: 'Interview', id: scheduleId }],
    }),

    getCampaignComparison: builder.query<CandidateComparisonItem[], number>({
      query: (campaignId) => `/interviews/campaign/${campaignId}/comparison`,
      transformResponse: (response: ApiResponse<CandidateComparisonItem[]>) => response.data,
      providesTags: (result, error, campaignId) => [{ type: 'Interview' as const, id: `COMPARISON_${campaignId}` }],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Decisions & Publish
    // ═══════════════════════════════════════════════════════════

    submitDecisions: builder.mutation<CampaignDecisionResponse[], { campaignId: number; dto: SubmitDecisionsDto }>({
      query: ({ campaignId, dto }) => ({
        url: `/interviews/campaign/${campaignId}/decisions`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<CampaignDecisionResponse[]>) => response.data,
      invalidatesTags: (result, error, { campaignId }) => [{ type: 'Interview' as const, id: `COMPARISON_${campaignId}` }],
    }),

    publishResults: builder.mutation<PublishStatusResponse, { campaignId: number; dto: PublishResultDto }>({
      query: ({ campaignId, dto }) => ({
        url: `/interviews/campaign/${campaignId}/publish`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<PublishStatusResponse>) => response.data,
    }),

    getPublishStatus: builder.query<PublishStatusResponse, number>({
      query: (campaignId) => `/interviews/campaign/${campaignId}/publish-status`,
      transformResponse: (response: ApiResponse<PublishStatusResponse>) => response.data,
    }),

    // ═══════════════════════════════════════════════════════════
    //  AI Analysis & Search
    // ═══════════════════════════════════════════════════════════

    getAiAnalysis: builder.query<AiAnalysisResponse, number>({
      query: (campaignId) => `/interviews/campaign/${campaignId}/ai-analysis`,
      transformResponse: (response: ApiResponse<AiAnalysisResponse>) => response.data,
      providesTags: (result, error, campaignId) => [{ type: 'Interview' as const, id: `AI_ANALYSIS_${campaignId}` }],
    }),

    aiSearch: builder.mutation<AiSearchResponse, { campaignId: number; dto: AiSearchRequest }>({
      query: ({ campaignId, dto }) => ({
        url: `/interviews/campaign/${campaignId}/ai-search`,
        method: 'POST',
        body: dto,
      }),
      transformResponse: (response: ApiResponse<AiSearchResponse>) => response.data,
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetInterviewsQuery,
  useGetInterviewByIdQuery,
  useCreateInterviewMutation,
  useUpdateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useDeleteInterviewMutation,
  useGetTimeSlotsQuery,
  useConfirmTimeSlotMutation,
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
  // Evaluation
  useGetCampaignCriteriaQuery,
  useCreateCriterionMutation,
  useUpdateCriterionMutation,
  useDeleteCriterionMutation,
  useAssignCriteriaMutation,
  useGetCriteriaScoresQuery,
  useSubmitCriteriaFeedbackMutation,
  useGetEvaluationSummaryQuery,
  useGetCampaignComparisonQuery,
  useSubmitDecisionsMutation,
  usePublishResultsMutation,
  useGetPublishStatusQuery,
  // AI
  useGetAiAnalysisQuery,
  useAiSearchMutation,
} = interviewApi;

