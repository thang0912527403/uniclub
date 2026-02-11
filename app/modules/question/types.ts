export type QuestionType = 'text' | 'radio' | 'checkbox' | 'textarea';

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  placeholder?: string;
  required: boolean;
}