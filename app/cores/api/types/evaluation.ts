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
  displayOrder: number;
  isDefault: boolean;
}

export interface CreateEvaluationCriterionDto {
  name: string;
  description?: string | null;
  displayOrder?: number;
}

export interface UpdateEvaluationCriterionDto {
  name?: string | null;
  description?: string | null;
  displayOrder?: number | null;
}

// ═══════════════════════════════════════════════════════════════
//  CRITERIA ASSIGNMENT & NOTES
// ═══════════════════════════════════════════════════════════════

export interface AssignCriteriaDto {
  criteriaIds: number[];
}

export interface CriteriaScoreResponse {
  id: number;
  interviewAssignmentId?: number;
  evaluationCriterionId: number;
  note?: string | null;
  createdAt: string;
}

export interface CriteriaNoteItemDto {
  criterionId: number;
  note?: string | null;
}

export interface SubmitCriteriaFeedbackDto {
  notes: CriteriaNoteItemDto[];
  feedbackNotes?: string | null;
  result: string; // Pass | Fail | OnHold | NoShow
}

export interface CriteriaNoteResult {
  criterionId: number;
  criterionName: string;
  note?: string | null;
  interviewerUserId: string;
  interviewerRole: string;
}

export interface CriteriaSummaryItem {
  criterionId: number;
  criterionName: string;
  individualNotes: CriteriaNoteResult[];
}

export interface EvaluationSummaryResponse {
  interviewScheduleId: number;
  title: string;
  candidateUserId: string;
  campaignId: number;
  criteriaSummaries: CriteriaSummaryItem[];
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
  decisionIds?: number[] | null;
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

// ═══════════════════════════════════════════════════════════════
//  AI ANALYSIS & SEARCH
// ═══════════════════════════════════════════════════════════════

export interface AiCriteriaEvaluation {
  criterionId: number;
  criterionName: string;
  result: 'Pass' | 'Fail' | 'Hold';
  reason?: string;
}

export interface AiCandidateAnalysis {
  interviewScheduleId: number;
  candidateUserId: string;
  candidateName: string;
  result: 'Pass' | 'Fail' | 'Hold';
  criteriaEvaluations: AiCriteriaEvaluation[];
  strengths: string[];
  weaknesses: string[];
}

export interface AiAnalysisResponse {
  campaignId: number;
  analyzedAt: string;
  candidates: AiCandidateAnalysis[];
}

export interface AiSearchRequest {
  query: string;
}

export interface AiSearchCandidate {
  interviewScheduleId: number;
  candidateUserId: string;
  candidateName: string;
  matchScore: number;
  reason: string;
}

export interface AiSearchResponse {
  query: string;
  results: AiSearchCandidate[];
}
