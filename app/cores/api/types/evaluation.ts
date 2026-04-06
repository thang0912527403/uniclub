// ═══════════════════════════════════════════════════════════════
//  EVALUATION CRITERIA
// ═══════════════════════════════════════════════════════════════

export type DecisionResult = 'Accept' | 'Reject' | 'Waitlist';
export type PublishStatus = 'Draft' | 'Scheduled' | 'Published' | 'Revoked';

export interface EvaluationCriterionResponse {
  id: number;
  campaignId: number;
  name: string;
  description?: string | null;
  weight: number;
  displayOrder: number;
  isDefault: boolean;
}

export interface CreateEvaluationCriterionDto {
  name: string;
  description?: string | null;
  weight: number;
  displayOrder?: number;
}

export interface UpdateEvaluationCriterionDto {
  name?: string | null;
  description?: string | null;
  weight?: number | null;
  displayOrder?: number | null;
}

// ═══════════════════════════════════════════════════════════════
//  CRITERIA ASSIGNMENT & SCORING
// ═══════════════════════════════════════════════════════════════

export interface AssignCriteriaDto {
  criteriaIds: number[];
}

export interface CriteriaScoreItemDto {
  criterionId: number;
  score: number; // 1–5
  note?: string | null;
}

export interface SubmitCriteriaFeedbackDto {
  scores: CriteriaScoreItemDto[];
  feedbackNotes?: string | null;
  result: string; // Pass | Fail | OnHold | NoShow
}

export interface CriteriaScoreResult {
  criterionId: number;
  criterionName: string;
  weight: number;
  score: number;
  note?: string | null;
  interviewerUserId: string;
  interviewerRole: string;
}

export interface CriteriaSummaryItem {
  criterionId: number;
  criterionName: string;
  weight: number;
  averageScore: number;
  individualScores: CriteriaScoreResult[];
}

export interface EvaluationSummaryResponse {
  interviewScheduleId: number;
  title: string;
  candidateUserId: string;
  campaignId: number;
  criteriaSummaries: CriteriaSummaryItem[];
  totalScore: number;
  suggestedResult: string;
  feedbacks: import('./interview').InterviewAssignmentResponse[];
}

// ═══════════════════════════════════════════════════════════════
//  CANDIDATE COMPARISON
// ═══════════════════════════════════════════════════════════════

export interface CandidateComparisonItem {
  interviewScheduleId: number;
  candidateUserId: string;
  title: string;
  criteriaScores: Record<number, number>; // criterionId → avgScore
  totalScore: number;
  rank: number;
  suggestedResult: string;
}

// ═══════════════════════════════════════════════════════════════
//  DECISIONS & PUBLISH
// ═══════════════════════════════════════════════════════════════

export interface CampaignDecisionItemDto {
  interviewScheduleId: number;
  candidateUserId: string;
  decision: string; // Accept | Reject | Waitlist
}

export interface SubmitDecisionsDto {
  decidedByUserId: string;
  decisions: CampaignDecisionItemDto[];
}

export interface PublishResultDto {
  mode: 'Now' | 'Schedule';
  scheduledAt?: string | null;
  notificationChannels?: string | null;
}

export interface CampaignDecisionResponse {
  id: number;
  campaignId: number;
  interviewScheduleId: number;
  candidateUserId: string;
  decision: string;
  decidedByUserId: string;
  decidedAt: string;
  publishStatus: string;
  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
}

export interface PublishStatusResponse {
  campaignId: number;
  overallStatus: string;
  totalDecisions: number;
  acceptCount: number;
  rejectCount: number;
  waitlistCount: number;
  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
  decisions: CampaignDecisionResponse[];
}
