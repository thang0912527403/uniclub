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

// --- Application Answer (phần trả lời đơn) ---
export interface ApplicationAnswerItemDto {
  questionId: number;
  answerText: string;
}

/** Body gửi khi nộp đơn (form + danh sách câu trả lời). */
export interface SubmitApplicationDto {
  formId: number;
  userId?: string;
  answers: ApplicationAnswerItemDto[];
}
