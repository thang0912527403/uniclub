import { baseApi } from "./baseApi";
import {
  type ApplicationResponseDto,
  type ApplicationFormResponseDto,
  type CreateApplicationFormDto,
  type ApplicationQuestionResponseDto,
  type CreateApplicationQuestionDto,
  type ApiResponse,
  type ApplicationResponseDto,
  type SubmitApplicationDto,
  type ApplicationAnswerResponseDto,
  type UpdateApplicationStatusDto,
} from "./types";

export const applicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ═══════════════════════════════════════════════════════════
    //  Applications
    // ═══════════════════════════════════════════════════════════

    getApplications: builder.query<ApplicationResponseDto[], void>({
      query: () => '/Application',
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data,
      providesTags: ['Application'],
    }),

    getApplicationById: builder.query<ApplicationResponseDto, number>({
      query: (id) => `/Application/${id}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Application' as const, id }],
    }),

    getApplicationsByStatus: builder.query<ApplicationResponseDto[], string>({
      query: (status) => `/Application/status/${status}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data,
      providesTags: ['Application'],
    }),

    getApplicationsByForm: builder.query<ApplicationResponseDto[], number>({
      query: (formId) => `/Application/form/${formId}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data,
      providesTags: ['Application'],
    }),

    getApplicationsByUser: builder.query<ApplicationResponseDto[], string>({
      query: (userId) => `/Application/user/${userId}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data,
      providesTags: ['Application'],
    }),

    updateApplication: builder.mutation<ApplicationResponseDto, { id: number; application: ApplicationResponseDto }>({
      query: ({ id, application }) => ({ url: `/Application/${id}`, method: 'PUT', body: application }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) => response.data,
      invalidatesTags: ['Application'],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Forms
    // ═══════════════════════════════════════════════════════════

    getForms: builder.query<ApplicationFormResponseDto[], void>({
      query: () => '/Application/forms',
      transformResponse: (response: ApiResponse<ApplicationFormResponseDto[]>) => response.data,
      providesTags: ['Application'],
    }),

    getFormById: builder.query<ApplicationFormResponseDto, number>({
      query: (id) => `/Application/forms/${id}`,
      transformResponse: (response: ApiResponse<ApplicationFormResponseDto>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Application' as const, id: `FORM_${id}` }],
    }),

    createForm: builder.mutation<ApplicationFormResponseDto, CreateApplicationFormDto>({
      query: (form) => ({ url: '/Application/forms', method: 'POST', body: form }),
      transformResponse: (response: ApiResponse<ApplicationFormResponseDto>) => response.data,
      invalidatesTags: ['Application'],
    }),

    // ═══════════════════════════════════════════════════════════
    //  Questions
    // ═══════════════════════════════════════════════════════════

    getQuestionsByForm: builder.query<ApplicationQuestionResponseDto[], number>({
      queryFn: async (formId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/forms/${formId}/questions` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationQuestionResponseDto[]> | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result, error, formId) =>
        result
          ? result.map((q) => ({ type: 'Application' as const, id: q.questionId }))
          : [{ type: 'Application' as const, id: `FORM_${formId}` }],
    }),

    getQuestionById: builder.query<ApplicationQuestionResponseDto, number>({
      query: (id) => `/Application/questions/${id}`,
      transformResponse: (response: ApiResponse<ApplicationQuestionResponseDto>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Application' as const, id }],
    }),

    createQuestion: builder.mutation<ApplicationQuestionResponseDto, CreateApplicationQuestionDto>({
      query: (question) => ({ url: '/Application/questions', method: 'POST', body: question }),
      transformResponse: (response: ApiResponse<ApplicationQuestionResponseDto>) => response.data,
      invalidatesTags: ['Application'],
    }),

    updateQuestion: builder.mutation<ApplicationQuestionResponseDto, { id: number; question: ApplicationQuestionResponseDto }>({
      query: ({ id, question }) => ({ url: `/Application/questions/${id}`, method: 'PUT', body: question }),
      transformResponse: (response: ApiResponse<ApplicationQuestionResponseDto>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Application' as const, id }],
    }),

    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({ url: `/Application/questions/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Application' as const, id }],
    }),
    // --- Application Answer: nộp đơn kèm câu trả lời ---
    submitApplication: builder.mutation<ApplicationResponseDto, SubmitApplicationDto>({
      query: (body) => ({ url: '/Application/submit', method: 'POST', body }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) => response.data,
      invalidatesTags: ['Application'],
    }),
    // --- Danh sách đơn / chi tiết đơn ---
    getApplicationsByForm: builder.query<ApplicationResponseDto[], number>({
      queryFn: async (formId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/form/${formId}` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationResponseDto[]> | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result, _, formId) =>
        result?.length
          ? [...result.map((a) => ({ type: 'Application' as const, id: a.applicationId })), { type: 'Application' as const, id: `FORM_${formId}` }]
          : [{ type: 'Application' as const, id: `FORM_${formId}` }],
    }),
    getApplicationById: builder.query<ApplicationResponseDto, number>({
      query: (id) => `Application/${id}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) => response.data,
      providesTags: (result, _, id) => [{ type: 'Application' as const, id }],
    }),
    getAnswersByApplication: builder.query<ApplicationAnswerResponseDto[], number>({
      queryFn: async (applicationId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/${applicationId}/answers` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationAnswerResponseDto[]> | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (_, __, applicationId) => [{ type: 'Application' as const, id: applicationId }],
    }),

    // --- Đơn theo user ---
    getApplicationsByUser: builder.query<ApplicationResponseDto[], string>({
      queryFn: async (userId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/user/${userId}` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationResponseDto[]> | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result) =>
        result?.length
          ? [...result.map((a) => ({ type: 'Application' as const, id: a.applicationId })), { type: 'Application' as const, id: 'USER_APPLICATIONS' }]
          : [{ type: 'Application' as const, id: 'USER_APPLICATIONS' }],
    }),
    getApplicationByUserAndForm: builder.query<ApplicationResponseDto | null, { userId: string; formId: number }>({
      queryFn: async ({ userId, formId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/user/${userId}/form/${formId}` });
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationResponseDto> | undefined;
        return { data: raw?.data ?? null };
      },
      providesTags: (result, _, { formId }) =>
        result ? [{ type: 'Application' as const, id: result.applicationId }, { type: 'Application' as const, id: `FORM_${formId}` }] : [],
    }),
    getApplicationsByCampaign: builder.query<ApplicationResponseDto[], { campaignId: number; status?: string }>({
      query: ({ campaignId, status }) => ({
        url: `Application/campaign/${campaignId}/applications`,
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data ?? [],
      providesTags: (result, _, { campaignId }) =>
        result?.length
          ? [...result.map((a) => ({ type: 'Application' as const, id: a.applicationId })), { type: 'Application' as const, id: `CAMPAIGN_${campaignId}` }]
          : [{ type: 'Application' as const, id: `CAMPAIGN_${campaignId}` }],
    }),
    getApplicationsByClub: builder.query<ApplicationResponseDto[], { clubId: number; status?: string }>({
      query: ({ clubId, status }) => ({
        url: `Application/club/${clubId}/applications`,
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) => response.data ?? [],
      providesTags: (result, _, { clubId }) =>
        result?.length
          ? [...result.map((a) => ({ type: 'Application' as const, id: a.applicationId })), { type: 'Application' as const, id: `CLUB_${clubId}` }]
          : [{ type: 'Application' as const, id: `CLUB_${clubId}` }],
    }),
    getApplicationsByStatus: builder.query<ApplicationResponseDto[], string>({
      queryFn: async (status, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/status/${encodeURIComponent(status)}` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as ApiResponse<ApplicationResponseDto[]> | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result) =>
        result?.length
          ? [...result.map((a) => ({ type: 'Application' as const, id: a.applicationId })), { type: 'Application' as const, id: 'BY_STATUS' }]
          : [{ type: 'Application' as const, id: 'BY_STATUS' }],
    }),
    updateApplicationStatus: builder.mutation<ApplicationResponseDto, { id: number; body: UpdateApplicationStatusDto }>({
      query: ({ id, body }) => ({ url: `Application/${id}/status`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Application' as const, id }, 'Application'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetApplicationsQuery,
  useGetApplicationByIdQuery,
  useGetApplicationsByStatusQuery,
  useGetApplicationsByFormQuery,
  useGetApplicationsByUserQuery,
  useUpdateApplicationMutation,
  useGetFormsQuery,
  useGetFormByIdQuery,
  useCreateFormMutation,
  useGetQuestionsByFormQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useSubmitApplicationMutation,
  useGetApplicationsByFormQuery,
  useGetApplicationByIdQuery,
  useGetAnswersByApplicationQuery,
  useGetApplicationsByUserQuery,
  useGetApplicationByUserAndFormQuery,
  useGetApplicationsByCampaignQuery,
  useGetApplicationsByClubQuery,
  useGetApplicationsByStatusQuery,
  useUpdateApplicationStatusMutation,
} = applicationApi;
