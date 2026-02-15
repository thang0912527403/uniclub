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

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

// --- Application Answer (phần trả lời đơn). Khớp backend DTOs. ---
export interface ApplicationAnswerItemDto {
  questionId: number;
  answerText?: string | null;
}

/** Body gửi khi nộp đơn. Khớp backend SubmitApplicationWithAnswersDto (FormId + UserId required). */
export interface SubmitApplicationDto {
  formId: number;
  userId: string;
  answers: ApplicationAnswerItemDto[];
}

/** Câu trả lời đã lưu (GET Application/{id}/answers). Khớp ApplicationAnswerResponseDto. */
export interface ApplicationAnswerResponseDto {
  answerId: number;
  applicationId: number;
  questionId: number;
  answerText?: string | null;
}
