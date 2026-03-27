import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { message } from "antd";
import {
  useGetInterviewsQuery,
  useConfirmAssignmentMutation,
  useGetUserByIdQuery,
  useUpdateInterviewStatusMutation,
} from "~/cores/api";
import type {
  InterviewScheduleResponse,
  InterviewAssignmentResponse,
} from "~/cores/api";
import FeedbackForm from "~/modules/interview/components/FeedbackForm";
import CriteriaFeedbackForm from "~/modules/interview/components/CriteriaFeedbackForm";
import { useGetEvaluationSummaryQuery } from "~/cores/api/interviewApi";

interface InterviewerInterviewsSectionProps {
  userId: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  Scheduled: {
    label: "Đã lên lịch",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
  },
  Confirmed: {
    label: "Đã xác nhận",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100 border-emerald-200",
  },
  InProgress: {
    label: "Đang phỏng vấn",
    color: "text-amber-700",
    bgColor: "bg-amber-100 border-amber-200",
  },
  Completed: {
    label: "Hoàn thành",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
  },
  Cancelled: {
    label: "Đã hủy",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
  },
  Rescheduled: {
    label: "Đã dời lịch",
    color: "text-purple-700",
    bgColor: "bg-purple-100 border-purple-200",
  },
};

// ─── User Name Display ─────────────────────────────────────────
const UserName: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: user, isFetching } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  if (isFetching)
    return <span className="text-gray-400 text-xs animate-pulse">...</span>;
  return <>{user?.fullName || userId.slice(0, 12) + "..."}</>;
};

// ─── Criteria Score Breakdown (per-interviewer) ─────────────────
const CriteriaScoreBreakdown: React.FC<{
  scheduleId: number;
  interviewerUserId: string;
}> = ({ scheduleId, interviewerUserId }) => {
  const { data: summary } = useGetEvaluationSummaryQuery(scheduleId);
  const [expanded, setExpanded] = useState(false);

  if (!summary?.criteriaSummaries?.length) return null;

  const myScores = summary.criteriaSummaries
    .map((cs) => {
      const myScore = cs.individualScores.find(
        (s) => s.interviewerUserId === interviewerUserId,
      );
      return myScore
        ? {
            name: cs.criterionName,
            weight: cs.weight,
            score: myScore.score,
            note: myScore.note,
          }
        : null;
    })
    .filter(Boolean) as {
    name: string;
    weight: number;
    score: number;
    note?: string | null;
  }[];

  if (myScores.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
      >
        <i
          className={`fa-solid fa-chevron-${expanded ? "up" : "down"} text-[9px]`}
        />
        <i className="fa-solid fa-star text-amber-400" />
        Điểm theo tiêu chí ({myScores.length})
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 animate-fadeIn">
          {myScores.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-green-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    ({item.weight}%)
                  </span>
                </div>
                {item.note && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {item.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fa-star text-[11px] ${
                      star <= item.score
                        ? "fa-solid text-amber-400"
                        : "fa-regular text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-gray-700 w-7 text-right">
                  {item.score}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InterviewerInterviewsSection: React.FC<
  InterviewerInterviewsSectionProps
> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: allInterviews = [], isLoading } = useGetInterviewsQuery();
  const [confirmAssignment] = useConfirmAssignmentMutation();
  const [updateStatus] = useUpdateInterviewStatusMutation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [feedbackFormId, setFeedbackFormId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Filter interviews where current user is assigned as interviewer
  const myAssignedInterviews = useMemo(() => {
    return allInterviews
      .filter((iv) =>
        iv.assignments?.some((a) => a.interviewerUserId === userId),
      )
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
  }, [allInterviews, userId]);

  // Get my assignment for a given interview
  const getMyAssignment = (
    iv: InterviewScheduleResponse,
  ): InterviewAssignmentResponse | undefined =>
    iv.assignments?.find((a) => a.interviewerUserId === userId);

  const handleConfirm = async (scheduleId: number, assignmentId: number) => {
    setConfirmingId(assignmentId);
    try {
      await confirmAssignment({ scheduleId, assignmentId }).unwrap();
      message.success("Đã xác nhận tham gia phỏng vấn!");
    } catch {
      message.error("Xác nhận thất bại, vui lòng thử lại.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCompleteInterview = async (interviewId: number) => {
    setCompletingId(interviewId);
    try {
      await updateStatus({
        id: interviewId,
        dto: { status: "Completed" },
      }).unwrap();
      message.success("Đã đánh dấu cuộc phỏng vấn hoàn thành!");
    } catch {
      message.error("Cập nhật trạng thái thất bại.");
    } finally {
      setCompletingId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/5" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state — don't render anything if user has no interviewer assignments
  if (myAssignedInterviews.length === 0) return null;

  // Stats
  const stats = {
    total: myAssignedInterviews.length,
    needConfirm: myAssignedInterviews.filter((iv) => {
      const a = getMyAssignment(iv);
      return (
        a && !a.hasConfirmed && !["Completed", "Cancelled"].includes(iv.status)
      );
    }).length,
    upcoming: myAssignedInterviews.filter((iv) =>
      ["Scheduled", "Confirmed", "Rescheduled"].includes(iv.status),
    ).length,
    completed: myAssignedInterviews.filter((iv) => iv.status === "Completed")
      .length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-50 bg-gradient-to-r from-violet-50 to-purple-50">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 text-violet-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Phỏng vấn được phân công
          <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            {stats.total}
          </span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Các buổi phỏng vấn bạn được phân công làm interviewer
        </p>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex gap-4">
          {[
            {
              label: "Chờ xác nhận",
              value: stats.needConfirm,
              color: "text-amber-600 bg-amber-50",
            },
            {
              label: "Sắp tới",
              value: stats.upcoming,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Hoàn thành",
              value: stats.completed,
              color: "text-green-600 bg-green-50",
            },
          ]
            .filter((s) => s.value > 0)
            .map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${stat.color}`}
              >
                <span className="text-base font-bold">{stat.value}</span>
                {stat.label}
              </div>
            ))}
        </div>
      </div>

      {/* Interview List */}
      <div className="divide-y divide-gray-50">
        {myAssignedInterviews.map((interview) => {
          const cfg = statusConfig[interview.status] || statusConfig.Scheduled;
          const myAssignment = getMyAssignment(interview)!;
          const isExpanded = expandedId === interview.id;
          const isReadOnly = ["Completed", "Cancelled"].includes(
            interview.status,
          );
          const canConfirm = !myAssignment.hasConfirmed && !isReadOnly;
          const hasRoom = !!interview.meetingRoom;
          const cleanDescription = interview.description
            ?.replace(/\n*<!--PROPOSED_SLOTS:.*?-->/, "")
            .trim();

          return (
            <div
              key={interview.id}
              className={`px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                canConfirm ? "bg-amber-50/30" : ""
              }`}
              onClick={() => setExpandedId(isExpanded ? null : interview.id)}
            >
              {/* Main row */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-violet-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {interview.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-violet-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(interview.scheduledAt).toLocaleDateString(
                        "vi-VN",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {interview.durationMinutes} phút
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {/* Confirmation badge */}
                  {canConfirm && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full border border-amber-200 animate-pulse">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Chờ xác nhận
                    </span>
                  )}
                  {myAssignment.hasConfirmed && !isReadOnly && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full border border-emerald-200">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã xác nhận
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${cfg.bgColor} ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  className="mt-4 pt-3 border-t border-gray-100 space-y-3 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Description */}
                  {cleanDescription && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {cleanDescription}
                    </p>
                  )}

                  {/* Candidate info */}
                  <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                    <p className="text-[11px] font-semibold text-violet-500 uppercase mb-1">
                      Ứng viên
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      <UserName userId={interview.candidateUserId} />
                    </p>
                  </div>

                  {/* My role & confirm button */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-0.5">
                          Vai trò của bạn
                        </p>
                        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {myAssignment.role.charAt(0).toUpperCase()}
                          </span>
                          {myAssignment.role}
                        </p>
                      </div>
                      {canConfirm && (
                        <button
                          onClick={() =>
                            handleConfirm(interview.id, myAssignment.id)
                          }
                          disabled={confirmingId === myAssignment.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-wait"
                        >
                          {confirmingId === myAssignment.id ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          Xác nhận tham gia
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Other interviewers */}
                  {interview.assignments &&
                    interview.assignments.length > 1 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">
                          Interviewer khác ({interview.assignments.length - 1})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {interview.assignments
                            .filter((a) => a.interviewerUserId !== userId)
                            .map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100"
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                                    a.hasConfirmed
                                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                      : "bg-gradient-to-br from-blue-400 to-blue-600"
                                  }`}
                                >
                                  {a.interviewerUserId
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">
                                  {a.role}
                                </span>
                                {a.hasConfirmed && (
                                  <svg
                                    className="w-3 h-3 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Feedback info if completed */}
                  {interview.status === "Completed" &&
                    myAssignment.feedbackSubmittedAt && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-600 mb-1">
                          Đã đánh giá
                        </p>
                        <div className="flex items-center gap-3">
                          {myAssignment.score != null && (
                            <span
                              className={`text-sm font-bold ${
                                myAssignment.score >= 70
                                  ? "text-green-600"
                                  : myAssignment.score >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {myAssignment.score}/100
                            </span>
                          )}
                          {myAssignment.result && (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                myAssignment.result === "Pass"
                                  ? "bg-green-100 text-green-700"
                                  : myAssignment.result === "Fail"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {myAssignment.result}
                            </span>
                          )}
                        </div>
                        {myAssignment.feedbackNotes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {myAssignment.feedbackNotes}
                          </p>
                        )}
                        {/* Per-criterion scores breakdown */}
                        <CriteriaScoreBreakdown
                          scheduleId={interview.id}
                          interviewerUserId={userId}
                        />
                      </div>
                    )}

                  {interview.status === "Completed" &&
                    !myAssignment.feedbackSubmittedAt && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            Bạn chưa đánh giá ứng viên này
                          </p>
                          {feedbackFormId !== interview.id && (
                            <button
                              onClick={() => setFeedbackFormId(interview.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:scale-[1.02] transition-all"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Đánh giá theo tiêu chí
                            </button>
                          )}
                        </div>
                        {feedbackFormId === interview.id && (
                          <CriteriaFeedbackForm
                            scheduleId={interview.id}
                            assignmentId={myAssignment.id}
                            campaignId={interview.campaignId}
                            onSuccess={() => {
                              setFeedbackFormId(null);
                              message.success("Đã gửi đánh giá thành công!");
                            }}
                            onCancel={() => setFeedbackFormId(null)}
                          />
                        )}
                      </div>
                    )}

                  {/* Complete interview button for InProgress */}
                  {interview.status === "InProgress" && (
                    <button
                      onClick={() => handleCompleteInterview(interview.id)}
                      disabled={completingId === interview.id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-wait"
                    >
                      {completingId === interview.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      Kết thúc cuộc phỏng vấn
                    </button>
                  )}

                  {/* Room access */}
                  {hasRoom &&
                    ["Confirmed", "InProgress"].includes(interview.status) && (
                      <div
                        className={`rounded-xl border p-4 ${
                          interview.status === "InProgress"
                            ? "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200"
                            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-xs font-semibold uppercase mb-1 ${
                                interview.status === "InProgress"
                                  ? "text-violet-600"
                                  : "text-blue-600"
                              }`}
                            >
                              Phòng phỏng vấn
                            </p>
                            <p className="font-mono font-bold text-gray-800 text-base">
                              {interview.meetingRoom!.roomCode}
                            </p>
                          </div>
                          {interview.status === "InProgress" ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/interview/room/${interview.meetingRoom!.roomCode}`,
                                )
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Vào phòng
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Chờ bắt đầu
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Cancel reason */}
                  {interview.status === "Cancelled" &&
                    interview.cancelReason && (
                      <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-100">
                        <span className="font-semibold">Lý do hủy:</span>{" "}
                        {interview.cancelReason}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default InterviewerInterviewsSection;
