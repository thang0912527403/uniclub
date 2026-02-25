import { baseApi } from "./baseApi";
import {
  type ApplicationResponseDto,
  type ApplicationFormResponseDto,
  type CreateApplicationFormDto,
  type ApplicationQuestionResponseDto,
  type CreateApplicationQuestionDto,
  type ApiResponse,
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
      query: (formId) => `/Application/forms/${formId}/questions`,
      transformResponse: (response: ApiResponse<ApplicationQuestionResponseDto[]>) => response.data,
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
} = applicationApi;
