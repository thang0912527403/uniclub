import { baseApi } from "./baseApi";
import {
  type ApplicationQuestionResponseDto,
  type CreateApplicationQuestionDto,
  type ApiResponse,
} from "./types";

export const applicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
});

export const {
  useGetQuestionsByFormQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = applicationApi;
