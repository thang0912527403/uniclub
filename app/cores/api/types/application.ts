export interface CreateApplicationDto {
  formId: number;
  userId: string;
  status?: string | null;
  reviewedAt?: string | null;
}

export interface ApplicationResponseDto {
  applicationId: number;
  formId: number;
  userId: string;
  submissionDate: string;
  status: string;
  reviewedAt?: string | null;
}

export interface CreateApplicationFormDto {
  campaignId: number;
  formName: string;
  formTitle?: string | null;
  description?: string | null;
}

export interface ApplicationFormResponseDto {
  formId: number;
  campaignId: number;
  formName: string;
  formTitle?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface CreateApplicationQuestionDto {
  formId: number;
  questionText: string;
  questionType?: string | null;
  isRequired?: boolean;
  displayOrder?: number | null;
}

export interface ApplicationQuestionResponseDto {
  questionId: number;
  formId: number;
  questionText: string;
  questionType?: string | null;
  isRequired: boolean;
  displayOrder?: number | null;
}

export interface CreateApplicationAnswerDto {
  applicationId: number;
  questionId: number;
  answerText?: string | null;
}

export interface ApplicationAnswerResponseDto {
  answerId: number;
  applicationId: number;
  questionId: number;
  answerText?: string | null;
}

export interface ApplicationAnswerItemDto {
  questionId: number;
  answerText?: string | null;
}

export interface SubmitApplicationDto {
  formId: number;
  userId: string;
  answers: ApplicationAnswerItemDto[];
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUCCESS';

export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUCCESS: 'SUCCESS',
} as const;

export interface UpdateApplicationStatusDto {
  status: string;
}
