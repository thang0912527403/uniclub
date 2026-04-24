export interface ClubMemberDepartmentStat {
  departmentId: number;
  departmentName: string;
  memberCount: number;
}

export interface ClubNewMembersByMonthStat {
  year: number;
  month: number;
  newMembers: number;
}

export interface ClubMemberReport {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  membersByDepartment: ClubMemberDepartmentStat[];
  newMembersByMonth: ClubNewMembersByMonthStat[];
}

export interface ClubEventReport {
  totalOrganizedEvents: number;
  totalEventsInMonth: number;
  totalRegisteredButNotCheckedIn: number;
  overallAttendanceRatePercent: number;
  mostAttendedEvent: string | null;
  eventParticipants: unknown[];
}

export interface RecruitmentApplicantByRound {
  round: string;
  count: number;
}

export interface InterviewerEvaluationSummary {
  totalAssignments: number;
  feedbackSubmittedCount: number;
  passRecommendationCount: number;
  failRecommendationCount: number;
}

export interface ClubRecruitmentInterviewReport {
  totalApplicants: number;
  passCount: number;
  failCount: number;
  passRatePercent: number;
  failRatePercent: number;
  applicantsByRound: RecruitmentApplicantByRound[];
  interviewerEvaluationSummary: InterviewerEvaluationSummary;
}

export interface AnnouncementRecipientGroup {
  groupName: string;
  count: number;
}

export interface AnnouncementSendTimelineItem {
  date: string;
  count: number;
}

export interface ClubAnnouncementReport {
  totalAnnouncements: number;
  recipientGroups: AnnouncementRecipientGroup[];
  sendTimeline: AnnouncementSendTimelineItem[];
}

export interface ClubSummaryReportDto {
  clubId: number;
  year: number;
  month: number;
  totalMembers: number;
  activeMembers: number;
  totalRoles: number;
  totalDepartments: number;
  totalEventsInMonth: number;
  totalApprovedIncomeInMonth: number;
  totalApprovedExpenseInMonth: number;
  totalFundRefundRequestsInMonth: number;
  pendingFundRefundRequestsInMonth: number;
  memberReport: ClubMemberReport;
  eventReport: ClubEventReport;
  recruitmentInterviewReport: ClubRecruitmentInterviewReport;
  announcementReport: ClubAnnouncementReport;
}

export interface AdminSummaryReportDto {
  year: number;
  month: number;
  totalClubs: number | null;
}

export type ClubReportSummaryResponse =
  | {
      success: true;
      data: {
        clubReport: ClubSummaryReportDto;
        adminReport: AdminSummaryReportDto | null;
      };
    }
  | { success: false; message?: string; data?: unknown };

export interface MembershipGrowthPoint {
  month: number;
  newMembers: number;
}

export interface MembershipGrowthAnalytics {
  year: number;
  growthByMonth: MembershipGrowthPoint[];
  bestGrowthMonth: number | null;
  bestGrowthCount: number;
}

export interface RetentionAnalytics {
  totalMembers: number;
  activeMembers: number;
  inactiveAfter3Months: number;
  activeRetentionRatePercent: number;
}

export interface ClubAnalyticsDto {
  clubId: number;
  membershipGrowth: MembershipGrowthAnalytics;
  retention: RetentionAnalytics;
}

export type ClubAnalyticsResponse =
  | { success: true; data: ClubAnalyticsDto }
  | { success: false; message?: string; data?: unknown };
