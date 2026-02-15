import { baseApi } from "./baseApi";
import {
  type ApplicationQuestionResponseDto,
  type CreateApplicationQuestionDto,
  type ApiResponse,
  type ApplicationResponseDto,
  type SubmitApplicationDto,
  type ApplicationAnswerResponseDto,
} from "./types";

export const applicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    // --- Danh sách đơn / chi tiết đơn (khớp backend) ---
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
  }),
});

export const {
  useGetQuestionsByFormQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useSubmitApplicationMutation,
  useGetApplicationsByFormQuery,
  useGetApplicationByIdQuery,
  useGetAnswersByApplicationQuery,
} = applicationApi;
