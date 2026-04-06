import React, { useState, useMemo, useRef, useEffect } from "react";
import { message } from "antd";
import type { InterviewScheduleResponse } from "~/cores/api";
import {
  useGetUserByIdQuery,
  useConfirmAssignmentMutation,
  useGetClubMembersQuery,
} from "~/cores/api";
import { useGetCriteriaScoresQuery } from "~/cores/api/interviewApi";
import FeedbackForm from "./FeedbackForm";
import CriteriaFeedbackForm from "./CriteriaFeedbackForm";
import EvaluationSummary from "./EvaluationSummary";
import CriteriaAssignment from "./CriteriaAssignment";

import type { ClubRole } from "~/cores/api/types";
import type { ClubMember } from "~/cores/api/types";

/** Small badge showing assigned criteria count from CriteriaScore API */
const CriteriaBadge: React.FC<{ scheduleId: number; assignmentId: number }> = ({ scheduleId, assignmentId }) => {
  const { data: scores } = useGetCriteriaScoresQuery({ scheduleId, assignmentId });
  const count = scores?.length || 0;
  if (count === 0) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
      <i className="fa-solid fa-clipboard-list text-[8px]" />
      {count} tiêu chí
    </span>
  );
};

interface InterviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewScheduleResponse | null;
  currentUserId: string;
  clubId: number;
  clubRoles?: ClubRole[];
  onUpdateStatus?: (id: number, status: string) => void;
  onAssignInterviewer?: (
    scheduleId: number,
    userId: string,
    role: string,
  ) => void;
  onRemoveAssignment?: (scheduleId: number, assignmentId: number) => void;
  onNavigateToRoom?: (roomCode: string) => void;
}

const roleOptions = [
  {
    value: "Interviewer",
    label: "Interviewer",
    icon: "fa-solid fa-microphone",
    color: "text-orange-500",
  },
  {
    value: "Lead",
    label: "Lead",
    icon: "fa-solid fa-crown",
    color: "text-yellow-500",
  },
  {
    value: "Observer",
    label: "Observer",
    icon: "fa-regular fa-eye",
    color: "text-blue-500",
  },
  {
    value: "HRRepresentative",
    label: "HR",
    icon: "fa-solid fa-clipboard-user",
    color: "text-green-500",
  },
];

const statusActions: Record<
  string,
  { label: string; nextStatus: string; color: string; icon: string }[]
> = {
  Scheduled: [
    {
      label: "Xác nhận",
      nextStatus: "Confirmed",
      color: "bg-emerald-500 hover:bg-emerald-600",
      icon: "fa-solid fa-check",
    },
    {
      label: "Hủy",
      nextStatus: "Cancelled",
      color: "bg-red-500 hover:bg-red-600",
      icon: "fa-solid fa-xmark",
    },
  ],
  Confirmed: [
    {
      label: "Bắt đầu PV",
      nextStatus: "InProgress",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: "fa-solid fa-play",
    },
    {
      label: "Dời lịch",
      nextStatus: "Rescheduled",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: "fa-solid fa-calendar-days",
    },
    {
      label: "Hủy",
      nextStatus: "Cancelled",
      color: "bg-red-500 hover:bg-red-600",
      icon: "fa-solid fa-xmark",
    },
  ],
  InProgress: [
    {
      label: "Hoàn thành",
      nextStatus: "Completed",
      color: "bg-green-500 hover:bg-green-600",
      icon: "fa-solid fa-flag-checkered",
    },
  ],
};

// ─── User Display ────────────────────────────────────────────────
const UserDisplay: React.FC<{ userId: string; showId?: boolean }> = ({
  userId,
  showId = false,
}) => {
  const { data: user, isFetching } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  if (isFetching)
    return (
      <span className="text-gray-400 text-xs animate-pulse">Đang tải...</span>
    );
  return (
    <span>
      {user?.fullName || (
        <span className="font-mono text-xs">{userId.slice(0, 12)}...</span>
      )}
      {showId && user?.fullName && (
        <span className="text-gray-400 text-xs ml-1">
          ({userId.slice(0, 8)})
        </span>
      )}
    </span>
  );
};

const InterviewDetailDrawer: React.FC<InterviewDetailDrawerProps> = ({
  isOpen,
  onClose,
  interview,
  currentUserId,
  clubId,
  clubRoles,
  onUpdateStatus,
  onAssignInterviewer,
  onRemoveAssignment,
  onNavigateToRoom,
}) => {
  const [activeTab, setActiveTab] = useState<
    "info" | "assignments" | "feedback" | "evaluation"
  >("info");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState(
    clubRoles?.[0]?.roleName || "Interviewer",
  );
  const [feedbackForAssignment, setFeedbackForAssignment] = useState<
    number | null
  >(null);
  const [criteriaForAssignment, setCriteriaForAssignment] = useState<
    number | null
  >(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  // Fetch club members for interviewer selection
  const { data: clubMembers = [] } = useGetClubMembersQuery(clubId, {
    skip: !clubId,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter & sort members: Interviewer role first, exclude already assigned
  const assignedUserIds = useMemo(
    () =>
      new Set(interview?.assignments?.map((a) => a.interviewerUserId) || []),
    [interview?.assignments],
  );

  const filteredMembers = useMemo(() => {
    let members = clubMembers.filter(
      (m) => m.status === "ACTIVE" && !assignedUserIds.has(m.userId),
    );
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      members = members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.studentId && m.studentId.toLowerCase().includes(q)),
      );
    }
    // Sort: Interviewer-role members first
    return members.sort((a, b) => {
      const aIsInterviewer = a.roleName?.toLowerCase().includes("interviewer")
        ? 0
        : 1;
      const bIsInterviewer = b.roleName?.toLowerCase().includes("interviewer")
        ? 0
        : 1;
      return aIsInterviewer - bIsInterviewer;
    });
  }, [clubMembers, memberSearch, assignedUserIds]);

  const [confirmAssignment] = useConfirmAssignmentMutation();

  const { data: candidateInfo } = useGetUserByIdQuery(
    interview?.candidateUserId ?? "",
    { skip: !interview?.candidateUserId },
  );
  const { data: creatorInfo } = useGetUserByIdQuery(
    interview?.createdByUserId ?? "",
    { skip: !interview?.createdByUserId },
  );

  // ─── Resolve proposed time slots ───────────────
  const unifiedSlots = useMemo(() => {
    if (!interview) return [];
    if (interview.proposedTimeSlots && interview.proposedTimeSlots.length > 0) {
        return interview.proposedTimeSlots.map(s => {
          const d = new Date(s.proposedAt);
          return {
            id: s.id,
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().slice(0, 5),
            isSelected: s.isSelected
          };
        });
    }
    return [];
  }, [interview]);

  const cleanDescription = interview?.description?.trim() || "";

  if (!interview) return null;

  const isReadOnly = ["Completed", "Cancelled"].includes(interview.status);
  const actions = statusActions[interview.status] || [];
  const hasRoom = !!interview.meetingRoom;

  // Check if current user is an assigned interviewer
  const myAssignment = interview.assignments?.find(
    (a) => a.interviewerUserId === currentUserId,
  );
  const canConfirmSchedule =
    myAssignment && !myAssignment.hasConfirmed && !isReadOnly;

  const handleConfirmSchedule = async () => {
    if (!myAssignment) return;
    try {
      await confirmAssignment({
        scheduleId: interview.id,
        assignmentId: myAssignment.id,
      }).unwrap();
      message.success("Đã xác nhận tham gia");
    } catch (err) {
      message.error("Xác nhận thất bại");
    }
  };

  const feedbackDone =
    interview.assignments?.filter((a) => a.feedbackSubmittedAt).length || 0;
  const feedbackTotal = interview.assignments?.length || 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-bold text-white line-clamp-2">
                  {interview.title}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {interview.status}
                  </span>
                  <span className="text-orange-100 text-sm">
                    {new Date(interview.scheduledAt).toLocaleDateString(
                      "vi-VN",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                {/* Interviewer confirm banner */}
                {canConfirmSchedule && (
                  <button
                    onClick={handleConfirmSchedule}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all w-full justify-center"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Xác nhận tham gia buổi phỏng vấn này
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 flex-shrink-0 mt-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 px-6 flex-shrink-0">
            {[
              {
                key: "info" as const,
                label: "Thông tin",
                icon: "fa-regular fa-file-lines",
              },
              {
                key: "assignments" as const,
                label: `PV viên (${interview.assignments?.length || 0})`,
                icon: "fa-solid fa-users",
              },
              {
                key: "feedback" as const,
                label: `Đánh giá`,
                icon: "fa-solid fa-star",
                badge:
                  feedbackTotal > 0
                    ? `${feedbackDone}/${feedbackTotal}`
                    : undefined,
              },
              {
                key: "evaluation" as const,
                label: "Tổng hợp",
                icon: "fa-solid fa-chart-bar",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <i className={tab.icon} />
                {tab.label}
                {"badge" in tab && tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      feedbackDone === feedbackTotal && feedbackTotal > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ──── INFO TAB ──── */}
            {activeTab === "info" && (
              <div className="space-y-5">
                {cleanDescription && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Mô tả
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      {cleanDescription}
                    </p>
                  </div>
                )}

                {/* Candidate Confirmed Banner */}
                {interview.status === "Confirmed" && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-check text-white text-xs" />
                      </div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        Candidate đã xác nhận lịch
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 ml-9">
                      <i className="fa-regular fa-calendar text-xs" />
                      {new Date(interview.scheduledAt).toLocaleDateString(
                        "vi-VN",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Proposed Time Slots — READ-ONLY for admin/interviewer */}
                {unifiedSlots.length > 0 &&
                  interview.status === "Scheduled" && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-orange-500" />
                        Khung giờ đề xuất (
                        {unifiedSlots.length})
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                        Candidate sẽ chọn một trong các khung giờ dưới đây.
                      </p>
                      <div className="space-y-2">
                        {unifiedSlots.map((slot, idx) => {
                          const slotDate = new Date(
                            `${slot.date}T${slot.time}`,
                          );
                          const isCurrentSlot =
                            new Date(interview.scheduledAt).getTime() ===
                            slotDate.getTime();
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-3 rounded-xl border ${
                                isCurrentSlot
                                  ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700"
                                  : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  isCurrentSlot
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {isCurrentSlot ? (
                                  <i className="fa-solid fa-check text-xs" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    isCurrentSlot
                                      ? "text-orange-700 dark:text-orange-300"
                                      : "text-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  {slotDate.toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </p>
                                <p
                                  className={`text-xs flex items-center gap-1 ${
                                    isCurrentSlot
                                      ? "text-orange-500 dark:text-orange-400"
                                      : "text-gray-400 dark:text-gray-500"
                                  }`}
                                >
                                  <i className="fa-regular fa-clock" />
                                  {slot.time}
                                  {isCurrentSlot && (
                                    <span className="ml-1 font-semibold">
                                      (Đang được chọn)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-3">
                  <InfoCard
                    label="Thời lượng"
                    value={`${interview.durationMinutes} phút`}
                  />
                  <InfoCard
                    label="Application"
                    value={`#${interview.applicationId}`}
                  />
                  <InfoCard
                    label="Ứng viên"
                    value={
                      candidateInfo?.fullName ||
                      interview.candidateUserId.slice(0, 12) + "..."
                    }
                  />
                  <InfoCard
                    label="Tạo bởi"
                    value={
                      creatorInfo?.fullName ||
                      interview.createdByUserId.slice(0, 12) + "..."
                    }
                  />
                </div>

                {/* Meeting Room */}
                {hasRoom && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">
                          Phòng họp
                        </p>
                        <p className="text-lg font-mono font-bold text-green-800 dark:text-green-300">
                          {interview.meetingRoom!.roomCode}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {isReadOnly
                            ? "Đã đóng"
                            : interview.meetingRoom!.status}{" "}
                          • Max {interview.meetingRoom!.maxParticipants} người
                        </p>
                      </div>
                      {!isReadOnly ? (
                        <button
                          onClick={() =>
                            onNavigateToRoom?.(interview.meetingRoom!.roomCode)
                          }
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md"
                        >
                          Vào phòng
                        </button>
                      ) : (
                        <span className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-xl text-sm font-medium cursor-not-allowed">
                          Đã đóng
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                {actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Thao tác
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.nextStatus}
                          onClick={() =>
                            onUpdateStatus?.(interview.id, action.nextStatus)
                          }
                          className={`flex items-center gap-1.5 px-4 py-2 ${action.color} text-white rounded-xl text-sm font-medium transition-all hover:shadow-md`}
                        >
                          <i className={action.icon} />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──── ASSIGNMENTS TAB ──── */}
            {activeTab === "assignments" && (
              <div className="space-y-4">
                {/* Add interviewer */}
                {!isReadOnly && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Thêm người phỏng vấn
                    </h4>

                    {/* Member Search Dropdown */}
                    <div className="relative mb-3" ref={dropdownRef}>
                      <div
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-sm transition-all cursor-pointer ${
                          showMemberDropdown
                            ? "border-orange-400 ring-2 ring-orange-100 dark:ring-orange-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() => setShowMemberDropdown(true)}
                      >
                        {selectedMember ? (
                          <>
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {selectedMember.avatar ? (
                                <img
                                  src={selectedMember.avatar}
                                  className="w-7 h-7 rounded-full object-cover"
                                  alt=""
                                />
                              ) : (
                                selectedMember.fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {selectedMember.fullName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {selectedMember.roleName || "Member"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(null);
                                setNewUserId("");
                                setMemberSearch("");
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                            <input
                              type="text"
                              value={memberSearch}
                              onChange={(e) => {
                                setMemberSearch(e.target.value);
                                setShowMemberDropdown(true);
                              }}
                              onFocus={() => setShowMemberDropdown(true)}
                              placeholder="Tìm kiếm thành viên CLB..."
                              className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </>
                        )}
                      </div>

                      {/* Dropdown List */}
                      {showMemberDropdown && !selectedMember && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-xl max-h-60 overflow-y-auto">
                          {filteredMembers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">
                              <svg
                                className="w-8 h-8 mx-auto mb-2 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"
                                />
                                <circle
                                  cx="9"
                                  cy="7"
                                  r="4"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M23 21v-2a4 4 0 00-3-3.87"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M16 3.13a4 4 0 010 7.75"
                                />
                              </svg>
                              Không tìm thấy thành viên
                            </div>
                          ) : (
                            <>
                              {/* Interviewer section header */}
                              {filteredMembers.some((m) =>
                                m.roleName
                                  ?.toLowerCase()
                                  .includes("interviewer"),
                              ) && (
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-50 dark:bg-orange-900/20 sticky top-0">
                                  ⭐ Interviewer
                                </div>
                              )}
                              {filteredMembers.map((member, idx) => {
                                const isInterviewer = member.roleName
                                  ?.toLowerCase()
                                  .includes("interviewer");
                                const firstNonInterviewer =
                                  idx > 0 &&
                                  !isInterviewer &&
                                  filteredMembers[idx - 1]?.roleName
                                    ?.toLowerCase()
                                    .includes("interviewer");
                                return (
                                  <React.Fragment key={member.clubMemberId}>
                                    {firstNonInterviewer && (
                                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                        Thành viên khác
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors text-left"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setNewUserId(member.userId);
                                        setMemberSearch("");
                                        setShowMemberDropdown(false);
                                      }}
                                    >
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                          isInterviewer
                                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                                        }`}
                                      >
                                        {member.avatar ? (
                                          <img
                                            src={member.avatar}
                                            className="w-8 h-8 rounded-full object-cover"
                                            alt=""
                                          />
                                        ) : (
                                          member.fullName
                                            .charAt(0)
                                            .toUpperCase()
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                          {member.fullName}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                          {member.email}{" "}
                                          {member.studentId
                                            ? `• ${member.studentId}`
                                            : ""}
                                        </p>
                                      </div>
                                      {isInterviewer && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex-shrink-0">
                                          Interviewer
                                        </span>
                                      )}
                                      {!isInterviewer && member.roleName && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">
                                          {member.roleName}
                                        </span>
                                      )}
                                    </button>
                                  </React.Fragment>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Add button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (newUserId.trim()) {
                            onAssignInterviewer?.(
                              interview.id,
                              newUserId.trim(),
                              "Interviewer",
                            );
                            setNewUserId("");
                            setSelectedMember(null);
                            setMemberSearch("");
                          } else {
                            message.warning("Vui lòng chọn thành viên");
                          }
                        }}
                        disabled={!newUserId.trim()}
                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Thêm
                      </button>
                    </div>
                  </div>
                )}

                {/* Assignment list */}
                {interview.assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fa-solid fa-users text-3xl mb-3 block" />
                    <p className="text-sm">Chưa có người phỏng vấn nào.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interview.assignments.map((a) => (
                      <div key={a.id} className="space-y-0">
                        <div
                          className="flex items-center justify-between bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                a.hasConfirmed
                                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                  : "bg-gradient-to-br from-blue-400 to-blue-600"
                              }`}
                            >
                              {a.interviewerUserId.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                <UserDisplay userId={a.interviewerUserId} />
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <i
                                    className={`${roleOptions.find((r) => r.value === a.role)?.icon} ${roleOptions.find((r) => r.value === a.role)?.color}`}
                                  />
                                  {a.role}
                                </span>
                                {a.hasConfirmed ? (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <i className="fa-solid fa-check-circle" /> Đã
                                    xác nhận
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                    <i className="fa-solid fa-clock" /> Chờ xác
                                    nhận
                                  </span>
                                )}
                                <CriteriaBadge scheduleId={interview.id} assignmentId={a.id} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Criteria assignment button */}
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  setCriteriaForAssignment(
                                    criteriaForAssignment === a.id
                                      ? null
                                      : a.id,
                                  )
                                }
                                className={`p-2 rounded-lg transition-all ${
                                  criteriaForAssignment === a.id
                                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                }`}
                                title="Phân tiêu chí"
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
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                  />
                                </svg>
                              </button>
                            )}
                            {/* Confirm button for current user */}
                            {a.interviewerUserId === currentUserId &&
                              !a.hasConfirmed &&
                              !isReadOnly && (
                                <button
                                  onClick={() =>
                                    confirmAssignment({
                                      scheduleId: interview.id,
                                      assignmentId: a.id,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-all mr-1"
                                  title="Xác nhận lịch"
                                >
                                  Xác nhận
                                </button>
                              )}
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  onRemoveAssignment?.(interview.id, a.id)
                                }
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                title="Xóa"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable CriteriaAssignment */}
                        {criteriaForAssignment === a.id && (
                          <div className="ml-4 mt-1 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 animate-fadeIn">
                            <CriteriaAssignment
                              scheduleId={interview.id}
                              assignmentId={a.id}
                              campaignId={interview.campaignId}
                              readOnly={isReadOnly}
                              onSuccess={() => {}}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Confirmation progress */}
                    {!isReadOnly && interview.assignments.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 dark:text-blue-400 font-medium">
                            Tiến độ xác nhận lịch
                          </span>
                          <span className="text-blue-600 dark:text-blue-300 font-bold">
                            {
                              interview.assignments.filter(
                                (a) => a.hasConfirmed,
                              ).length
                            }
                            /{interview.assignments.length}
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${(interview.assignments.filter((a) => a.hasConfirmed).length / interview.assignments.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ──── FEEDBACK TAB ──── */}
            {activeTab === "feedback" && (
              <div className="space-y-4">
                {/* Pending feedback banner */}
                {interview.status === "Completed" &&
                  feedbackDone < feedbackTotal && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                        <i className="fa-solid fa-bell" />
                        Còn {feedbackTotal - feedbackDone} người chưa đánh giá
                      </p>
                    </div>
                  )}

                {interview.assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fa-solid fa-star text-3xl mb-3 block" />
                    <p className="text-sm">Chưa có đánh giá nào.</p>
                  </div>
                ) : (
                  interview.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              a.feedbackSubmittedAt
                                ? "bg-gradient-to-br from-green-400 to-green-600"
                                : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}
                          >
                            {a.interviewerUserId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              <UserDisplay userId={a.interviewerUserId} />
                              <span className="text-gray-400 font-normal ml-1">
                                ({a.role})
                              </span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {a.feedbackSubmittedAt
                                ? `Đã đánh giá: ${new Date(a.feedbackSubmittedAt).toLocaleString("vi-VN")}`
                                : "Chưa đánh giá"}
                            </p>
                          </div>
                        </div>

                        {/* Results — chỉ hiện trạng thái, không hiện điểm */}
                        {a.feedbackSubmittedAt && a.result && (
                          <span
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                              a.result === "Pass"
                                ? "bg-green-100 text-green-700"
                                : a.result === "Fail"
                                  ? "bg-red-100 text-red-700"
                                  : a.result === "OnHold"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {a.result}
                          </span>
                        )}
                      </div>

                      {/* Feedback notes */}
                      {a.feedbackNotes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                          {a.feedbackNotes}
                        </p>
                      )}

                      {/* Show criteria feedback form for current user if not yet submitted */}
                      {!a.feedbackSubmittedAt &&
                        a.interviewerUserId === currentUserId &&
                        interview.status === "Completed" && (
                          <>
                            {feedbackForAssignment === a.id ? (
                              <CriteriaFeedbackForm
                                scheduleId={interview.id}
                                assignmentId={a.id}
                                campaignId={interview.campaignId}
                                onSuccess={() => setFeedbackForAssignment(null)}
                                onCancel={() => setFeedbackForAssignment(null)}
                              />
                            ) : (
                              <button
                                onClick={() => setFeedbackForAssignment(a.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors w-full justify-center border border-orange-200 dark:border-orange-800"
                              >
                                <i className="fa-solid fa-pen-to-square" />
                                Đánh giá theo tiêu chí
                              </button>
                            )}
                          </>
                        )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ──── EVALUATION TAB ──── */}
            {activeTab === "evaluation" && (
              <div className="space-y-4">
                {interview.status === "Completed" ? (
                  <>
                    <EvaluationSummary scheduleId={interview.id} />

                    {/* Link to comparison page */}
                    <a
                      href={`/interview/comparison?campaignId=${interview.campaignId}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.01] transition-all"
                    >
                      <i className="fa-solid fa-code-compare" />
                      So sánh tất cả ứng viên trong campaign
                    </a>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fa-solid fa-chart-bar text-3xl mb-3 block" />
                    <p className="text-sm">
                      Phỏng vấn cần hoàn thành trước khi xem tổng hợp đánh giá.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Info Card Helper ────────────────────────────────────────────
const InfoCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
      {label}
    </p>
    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
      {value}
    </p>
  </div>
);

export default InterviewDetailDrawer;
