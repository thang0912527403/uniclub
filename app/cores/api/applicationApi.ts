import { baseApi } from "./baseApi";
import {
  type ApplicationQuestionResponseDto,
  type CreateApplicationQuestionDto,
  type ApiResponse,
  type ApplicationResponseDto,
  type ApplicationFormResponseDto,
  type CreateApplicationFormDto,
  type SubmitApplicationDto,
  type ApplicationAnswerResponseDto,
  type UpdateApplicationStatusDto,
} from "./types";

export const applicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ══════════════════════════════════════════════════
    //  Application Forms
    // ══════════════════════════════════════════════════

    getFormsByCampaign: builder.query<
      ApplicationFormResponseDto[],
      { clubId: number; campaignId: number }
    >({
      queryFn: async ({ clubId, campaignId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/${clubId}/forms/campaign/${campaignId}`,
        });
        if (result.error) {
          if ((result.error as any).status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationFormResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result, _, { campaignId }) =>
        result?.length
          ? [
              ...result.map((f) => ({
                type: "Application" as const,
                id: `FORM_${f.formId}`,
              })),
              {
                type: "Application" as const,
                id: `CAMPAIGN_FORMS_${campaignId}`,
              },
            ]
          : [
              {
                type: "Application" as const,
                id: `CAMPAIGN_FORMS_${campaignId}`,
              },
            ],
    }),

    getFormById: builder.query<ApplicationFormResponseDto, { id: number }>({
      queryFn: async ({ id }, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/forms/${id}` });
        if (result.error) return result as { error: typeof result.error };
        const raw = result.data as
          | ApiResponse<ApplicationFormResponseDto>
          | undefined;
        return { data: raw?.data as ApplicationFormResponseDto };
      },
      providesTags: (result, _, { id }) => [
        { type: "Application" as const, id: `FORM_${id}` },
      ],
    }),

    createForm: builder.mutation<
      ApplicationFormResponseDto,
      CreateApplicationFormDto
    >({
      query: (body) => ({ url: "Application/forms", method: "POST", body }),
      transformResponse: (response: ApiResponse<ApplicationFormResponseDto>) =>
        response.data,
      invalidatesTags: (result) =>
        result
          ? [{ type: "Application", id: `CAMPAIGN_FORMS_${result.campaignId}` }]
          : ["Application"],
    }),

    updateForm: builder.mutation<
      ApplicationFormResponseDto,
      { clubId: number; id: number; body: ApplicationFormResponseDto }
    >({
      query: ({ clubId, id, body }) => ({
        url: `Application/${clubId}/forms/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<ApplicationFormResponseDto>) =>
        response.data,
      invalidatesTags: (result, _, { id }) => [
        { type: "Application", id: `FORM_${id}` },
        "Application",
      ],
    }),

    deleteForm: builder.mutation<void, { clubId: number; id: number }>({
      query: ({ clubId, id }) => ({
        url: `Application/${clubId}/forms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Application"],
    }),

    // ══════════════════════════════════════════════════
    //  Questions
    // ══════════════════════════════════════════════════

    getQuestionsByForm: builder.query<
      ApplicationQuestionResponseDto[],
      { formId: number }
    >({
      queryFn: async ({ formId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/forms/${formId}/questions`,
        });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationQuestionResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result, error, { formId }) =>
        result
          ? result.map((q) => ({
              type: "Application" as const,
              id: q.questionId,
            }))
          : [{ type: "Application" as const, id: `FORM_${formId}` }],
    }),
    getQuestionById: builder.query<
      ApplicationQuestionResponseDto,
      { clubId: number; id: number }
    >({
      query: ({ clubId, id }) => `Application/${clubId}/questions/${id}`,
      transformResponse: (
        response: ApiResponse<ApplicationQuestionResponseDto>,
      ) => response.data,
      providesTags: (result, error, { id }) => [
        { type: "Application" as const, id },
      ],
    }),
    createQuestion: builder.mutation<
      ApplicationQuestionResponseDto,
      CreateApplicationQuestionDto
    >({
      query: (question) => ({
        url: "/Application/questions",
        method: "POST",
        body: question,
      }),
      transformResponse: (
        response: ApiResponse<ApplicationQuestionResponseDto>,
      ) => response.data,
      invalidatesTags: ["Application"],
    }),
    updateQuestion: builder.mutation<
      ApplicationQuestionResponseDto,
      { clubId: number; id: number; question: ApplicationQuestionResponseDto }
    >({
      query: ({ clubId, id, question }) => ({
        url: `Application/${clubId}/questions/${id}`,
        method: "PUT",
        body: question,
      }),
      transformResponse: (
        response: ApiResponse<ApplicationQuestionResponseDto>,
      ) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Application" as const, id },
      ],
    }),
    deleteQuestion: builder.mutation<void, { clubId: number; id: number }>({
      query: ({ clubId, id }) => ({
        url: `Application/${clubId}/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Application" as const, id },
      ],
    }),
    // --- Application Answer: nộp đơn kèm câu trả lời ---
    submitApplication: builder.mutation<
      ApplicationResponseDto,
      SubmitApplicationDto
    >({
      query: (body) => ({ url: `Application/submit`, method: "POST", body }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) =>
        response.data,
      invalidatesTags: ["Application"],
    }),
    // --- Danh sách đơn / chi tiết đơn ---
    getApplicationsByForm: builder.query<
      ApplicationResponseDto[],
      { clubId: number; formId: number }
    >({
      queryFn: async ({ clubId, formId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/${clubId}/form/${formId}`,
        });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result, _, { formId }) =>
        result?.length
          ? [
              ...result.map((a) => ({
                type: "Application" as const,
                id: a.applicationId,
              })),
              { type: "Application" as const, id: `FORM_${formId}` },
            ]
          : [{ type: "Application" as const, id: `FORM_${formId}` }],
    }),
    getApplicationById: builder.query<
      ApplicationResponseDto,
      { clubId: number; id: number }
    >({
      query: ({ clubId, id }) => `Application/${clubId}/${id}`,
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) =>
        response.data,
      providesTags: (result, _, { id }) => [
        { type: "Application" as const, id },
      ],
    }),
    getAnswersByApplication: builder.query<
      ApplicationAnswerResponseDto[],
      { clubId: number; applicationId: number }
    >({
      queryFn: async ({ clubId, applicationId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/${clubId}/${applicationId}/answers`,
        });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationAnswerResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (_, __, { applicationId }) => [
        { type: "Application" as const, id: applicationId },
      ],
    }),

    // --- Đơn theo user ---
    getApplicationsByUser: builder.query<
      ApplicationResponseDto[],
      { userId: string }
    >({
      queryFn: async ({ userId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: `Application/user/${userId}` });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((a) => ({
                type: "Application" as const,
                id: a.applicationId,
              })),
              { type: "Application" as const, id: "USER_APPLICATIONS" },
            ]
          : [{ type: "Application" as const, id: "USER_APPLICATIONS" }],
    }),
    getApplicationByUserAndForm: builder.query<
      ApplicationResponseDto | null,
      { userId: string; formId: number }
    >({
      queryFn: async ({ userId, formId }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/user/${userId}/form/${formId}`,
        });
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationResponseDto>
          | undefined;
        return { data: raw?.data ?? null };
      },
      providesTags: (result, _, { formId }) =>
        result
          ? [
              { type: "Application" as const, id: result.applicationId },
              { type: "Application" as const, id: `FORM_${formId}` },
            ]
          : [],
    }),
    getApplicationsByCampaign: builder.query<
      ApplicationResponseDto[],
      { clubId: number; campaignId: number; status?: string }
    >({
      query: ({ clubId, campaignId, status }) => ({
        url: `Application/${clubId}/campaign/${campaignId}`,
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) =>
        response.data ?? [],
      providesTags: (result, _, { campaignId }) =>
        result?.length
          ? [
              ...result.map((a) => ({
                type: "Application" as const,
                id: a.applicationId,
              })),
              { type: "Application" as const, id: `CAMPAIGN_${campaignId}` },
            ]
          : [{ type: "Application" as const, id: `CAMPAIGN_${campaignId}` }],
    }),
    getApplicationsByClub: builder.query<
      ApplicationResponseDto[],
      { clubId: number; status?: string }
    >({
      query: ({ clubId, status }) => ({
        url: `Application/club/${clubId}`,
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto[]>) =>
        response.data ?? [],
      providesTags: (result, _, { clubId }) =>
        result?.length
          ? [
              ...result.map((a) => ({
                type: "Application" as const,
                id: a.applicationId,
              })),
              { type: "Application" as const, id: `CLUB_${clubId}` },
            ]
          : [{ type: "Application" as const, id: `CLUB_${clubId}` }],
    }),
    getApplicationsByStatus: builder.query<
      ApplicationResponseDto[],
      { clubId: number; status: string }
    >({
      queryFn: async ({ clubId, status }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `Application/${clubId}/status/${encodeURIComponent(status)}`,
        });
        if (result.error) {
          if (result.error.status === 404) return { data: [] };
          return result as { error: typeof result.error };
        }
        const raw = result.data as
          | ApiResponse<ApplicationResponseDto[]>
          | undefined;
        return { data: raw?.data ?? [] };
      },
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((a) => ({
                type: "Application" as const,
                id: a.applicationId,
              })),
              { type: "Application" as const, id: "BY_STATUS" },
            ]
          : [{ type: "Application" as const, id: "BY_STATUS" }],
    }),
    updateApplicationStatus: builder.mutation<
      ApplicationResponseDto,
      { clubId: number; id: number; body: UpdateApplicationStatusDto }
    >({
      query: ({ clubId, id, body }) => ({
        url: `Application/${clubId}/${id}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<ApplicationResponseDto>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Application" as const, id },
        "Application",
      ],
    }),
  }),
});

export const {
  useGetFormsByCampaignQuery,
  useGetFormByIdQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
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
