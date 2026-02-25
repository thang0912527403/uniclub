// ═══════════════════════════════════════════════════════════════
//  ENUMS
// ═══════════════════════════════════════════════════════════════

export type InterviewStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled';

export type InterviewResult = 'Pass' | 'Fail' | 'OnHold' | 'NoShow';

export type InterviewerRole =
  | 'Interviewer'
  | 'Lead'
  | 'Observer'
  | 'HRRepresentative';

export type RoomStatus = 'Idle' | 'Waiting' | 'Active' | 'Closed';

// ═══════════════════════════════════════════════════════════════
//  INTERVIEW SCHEDULE
// ═══════════════════════════════════════════════════════════════

export interface CreateInterviewScheduleDto {
  applicationId: number;
  candidateUserId: string;
  campaignId: number;
  createdByUserId: string;
  title: string;
  description?: string | null;
  scheduledAt: string; // ISO date
  durationMinutes?: number;
  interviewers?: AssignInterviewerItemDto[];
}

export interface UpdateInterviewScheduleDto {
  title?: string | null;
  description?: string | null;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
}

export interface UpdateInterviewStatusDto {
  status: string; // Confirmed | Cancelled | Rescheduled
  cancelReason?: string | null;
}

export interface InterviewScheduleResponse {
  id: number;
  applicationId: number;
  candidateUserId: string;
  campaignId: number;
  createdByUserId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: InterviewStatus;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  assignments: InterviewAssignmentResponse[];
  meetingRoom?: MeetingRoomResponse | null;
}

// ═══════════════════════════════════════════════════════════════
//  INTERVIEWER ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

export interface AssignInterviewerItemDto {
  interviewerUserId: string;
  role?: string;
}

export interface AssignInterviewersDto {
  interviewers: AssignInterviewerItemDto[];
}

export interface InterviewAssignmentResponse {
  id: number;
  interviewScheduleId: number;
  interviewerUserId: string;
  role: string;
  hasConfirmed: boolean;
  feedbackNotes?: string | null;
  result?: string | null;
  score?: number | null;
  assignedAt: string;
  feedbackSubmittedAt?: string | null;
}

// ═══════════════════════════════════════════════════════════════
//  MEETING ROOM
// ═══════════════════════════════════════════════════════════════

export interface MeetingRoomResponse {
  id: number;
  interviewScheduleId: number;
  roomCode: string;
  stunServerUri?: string | null;
  turnServerUri?: string | null;
  turnUsername?: string | null;
  turnCredential?: string | null;
  turnCredentialExpiresAt?: string | null;
  isRecordingEnabled: boolean;
  isWaitingRoomEnabled: boolean;
  maxParticipants: number;
  status: RoomStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
}

export interface JoinRoomDto {
  userId: string;
  displayName: string;
  role?: string; // "Interviewer" | "Candidate" | "Observer"
}

export interface JoinRoomResponse {
  roomCode: string;
  peerId?: string | null;
  stunServerUri?: string | null;
  turnServerUri?: string | null;
  turnUsername?: string | null;
  turnCredential?: string | null;
  turnCredentialExpiresAt?: string | null;
  roomStatus: string;
  currentParticipants: RoomParticipantResponse[];
}

export interface LeaveRoomDto {
  userId: string;
}

export interface RoomParticipantResponse {
  id: number;
  userId: string;
  displayName: string;
  role: string;
  peerId?: string | null;
  connectionState: string;
  joinedAt: string;
  leftAt?: string | null;
}

export interface RoomEventResponse {
  id: number;
  meetingRoomId: number;
  actorUserId?: string | null;
  eventType: string;
  payload?: string | null;
  occurredAt: string;
}

// ═══════════════════════════════════════════════════════════════
//  FEEDBACK
// ═══════════════════════════════════════════════════════════════

export interface SubmitFeedbackDto {
  feedbackNotes?: string | null;
  result: string; // Pass | Fail | OnHold | NoShow
  score?: number | null; // 0–100
}

export interface FeedbackSummaryResponse {
  interviewScheduleId: number;
  title: string;
  feedbacks: InterviewAssignmentResponse[];
}

// ═══════════════════════════════════════════════════════════════
//  QUERY PARAMS
// ═══════════════════════════════════════════════════════════════

export interface GetInterviewsParams {
  campaignId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}
