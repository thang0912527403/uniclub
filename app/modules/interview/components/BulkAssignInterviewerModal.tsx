import React, { useState, useMemo, useRef, useEffect } from "react";
import { message } from "antd";
import type { InterviewScheduleResponse } from "~/cores/api";
import {
  useGetUserByIdQuery,
  useGetClubMembersQuery,
  useAssignInterviewersMutation,
} from "~/cores/api";
import {
  useGetCampaignCriteriaQuery,
  useAssignCriteriaMutation,
} from "~/cores/api/interviewApi";
import type { ClubMember } from "~/cores/api/types";

/* ─── Sub-component: resolve candidate name per interview row ─── */
const InterviewRow: React.FC<{
  interview: InterviewScheduleResponse;
  index: number;
}> = ({ interview, index }) => {
  const { data: user, isLoading } = useGetUserByIdQuery(
    interview.candidateUserId,
    { skip: !interview.candidateUserId },
  );
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-xs text-gray-400 dark:text-gray-500 w-5 flex-shrink-0 font-medium">
        {index + 1}.
      </span>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {isLoading ? "…" : (user?.fullName?.charAt(0)?.toUpperCase() ?? "?")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {isLoading ? (
            <span className="inline-block w-24 h-3.5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          ) : (
            user?.fullName || interview.candidateUserId.slice(0, 12) + "…"
          )}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
          {interview.title}
        </p>
      </div>
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
        {interview.status}
      </span>
    </div>
  );
};

/* ─── Props ──────────────────────────────────────────────────── */
interface BulkAssignInterviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviews: InterviewScheduleResponse[];
  clubId: number;
  campaignId: number;
}

const BulkAssignInterviewerModal: React.FC<BulkAssignInterviewerModalProps> = ({
  isOpen,
  onClose,
  interviews,
  clubId,
  campaignId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [assignCriteria, setAssignCriteria] = useState(false);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // APIs
  const { data: clubMembers = [] } = useGetClubMembersQuery(clubId, {
    skip: !clubId,
  });
  const [assignInterviewers] = useAssignInterviewersMutation();
  const [assignCriteriaMut] = useAssignCriteriaMutation();
  const { data: criteria = [] } = useGetCampaignCriteriaQuery(campaignId, {
    skip: !campaignId || !assignCriteria,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMember(null);
      setMemberSearch("");
      setShowDropdown(false);
      setAssignCriteria(false);
      setSelectedCriteriaIds([]);
    }
  }, [isOpen]);

  // Filter members: exclude already assigned to ALL selected interviews, interviewer-role first
  const assignedUserIds = useMemo(() => {
    const sets = interviews.map(
      (iv) => new Set(iv.assignments?.map((a) => a.interviewerUserId) || []),
    );
    // Find users assigned to ALL selected interviews
    if (sets.length === 0) return new Set<string>();
    const intersection = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      for (const uid of intersection) {
        if (!sets[i].has(uid)) intersection.delete(uid);
      }
    }
    return intersection;
  }, [interviews]);

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
    return members.sort((a, b) => {
      const aI = a.roleName?.toLowerCase().includes("interviewer") ? 0 : 1;
      const bI = b.roleName?.toLowerCase().includes("interviewer") ? 0 : 1;
      return aI - bI;
    });
  }, [clubMembers, memberSearch, assignedUserIds]);

  const interviewerMembers = filteredMembers.filter((m) =>
    m.roleName?.toLowerCase().includes("interviewer"),
  );
  const otherMembers = filteredMembers.filter(
    (m) => !m.roleName?.toLowerCase().includes("interviewer"),
  );

  const toggleCriterion = (id: number) => {
    setSelectedCriteriaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      message.warning("Vui lòng chọn người phỏng vấn");
      return;
    }

    setIsSubmitting(true);
    let ok = 0;
    let failed = 0;

    for (const iv of interviews) {
      try {
        const result = await assignInterviewers({
          scheduleId: iv.id,
          dto: {
            interviewers: [
              { interviewerUserId: selectedMember.userId, role: "Interviewer" },
            ],
          },
        }).unwrap();

        // If criteria assignment is enabled and we have selected criteria
        if (assignCriteria && selectedCriteriaIds.length > 0) {
          // The assignInterviewers response should contain assignment IDs
          // We need the new assignment ID for criteria assignment
          try {
            // Get the assignment ID from the response or latest assignments
            const newAssignment = (result as any)?.find?.(
              (a: any) => a.interviewerUserId === selectedMember.userId,
            );
            if (newAssignment?.id) {
              await assignCriteriaMut({
                scheduleId: iv.id,
                assignmentId: newAssignment.id,
                dto: { criteriaIds: selectedCriteriaIds },
              }).unwrap();
            }
          } catch {
            // Criteria assignment failure is non-critical
          }
        }

        ok++;
      } catch {
        failed++;
      }
    }

    if (ok > 0) {
      const criteriaText =
        assignCriteria && selectedCriteriaIds.length > 0
          ? ` (+ ${selectedCriteriaIds.length} tiêu chí)`
          : "";
      message.success(
        `Đã phân công ${selectedMember.fullName} cho ${ok} lịch PV${criteriaText}`,
      );
    }
    if (failed > 0) {
      message.error(`${failed} lịch phân công thất bại`);
    }

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || interviews.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Phân interviewer
              </h2>
              <p className="text-purple-100 text-sm mt-0.5">
                {interviews.length} lịch phỏng vấn đã chọn
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
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

        {/* Scrollable content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* ── Selected interview list ── */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Lịch phỏng vấn đã chọn ({interviews.length})
            </p>
            <div className="space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin divide-y divide-gray-100 dark:divide-gray-600">
              {interviews.map((iv, idx) => (
                <InterviewRow key={iv.id} interview={iv} index={idx} />
              ))}
            </div>
          </div>

          {/* ── Member picker ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Chọn người phỏng vấn <span className="text-red-500">*</span>
            </label>

            <div className="relative" ref={dropdownRef}>
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-sm transition-all cursor-pointer ${
                  showDropdown
                    ? "border-purple-400 ring-2 ring-purple-100 dark:ring-purple-900/30"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setShowDropdown(true)}
              >
                {selectedMember ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
                        {selectedMember.roleName || "Member"}{" "}
                        {selectedMember.studentId
                          ? `• ${selectedMember.studentId}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(null);
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
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Tìm kiếm thành viên CLB..."
                      className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </>
                )}
              </div>

              {/* Dropdown List */}
              {showDropdown && !selectedMember && (
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
                      </svg>
                      Không tìm thấy thành viên
                    </div>
                  ) : (
                    <>
                      {interviewerMembers.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-50 dark:bg-purple-900/20 sticky top-0">
                          ⭐ Interviewer
                        </div>
                      )}
                      {interviewerMembers.map((member) => (
                        <button
                          key={member.clubMemberId}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left"
                          onClick={() => {
                            setSelectedMember(member);
                            setMemberSearch("");
                            setShowDropdown(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                className="w-8 h-8 rounded-full object-cover"
                                alt=""
                              />
                            ) : (
                              member.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {member.fullName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {member.email}{" "}
                              {member.studentId ? `• ${member.studentId}` : ""}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
                            Interviewer
                          </span>
                        </button>
                      ))}
                      {otherMembers.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                          Thành viên khác
                        </div>
                      )}
                      {otherMembers.map((member) => (
                        <button
                          key={member.clubMemberId}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left"
                          onClick={() => {
                            setSelectedMember(member);
                            setMemberSearch("");
                            setShowDropdown(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                className="w-8 h-8 rounded-full object-cover"
                                alt=""
                              />
                            ) : (
                              member.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {member.fullName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {member.email}{" "}
                              {member.studentId ? `• ${member.studentId}` : ""}
                            </p>
                          </div>
                          {member.roleName && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">
                              {member.roleName}
                            </span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Criteria assignment toggle ── */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAssignCriteria(!assignCriteria)}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                assignCriteria
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 ${assignCriteria ? "text-blue-500" : "text-gray-400"}`}
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
                <span
                  className={`text-sm font-semibold ${assignCriteria ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  Phân tiêu chí đánh giá
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  assignCriteria
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    assignCriteria ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`}
                />
              </div>
            </button>

            {/* Criteria list (expandable) */}
            {assignCriteria && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 space-y-2 animate-fadeIn">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Chọn tiêu chí PV viên chịu trách nhiệm đánh giá. Không chọn =
                  đánh giá tất cả.
                </p>
                {criteria.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-sm">
                      Chưa có tiêu chí nào trong campaign
                    </p>
                  </div>
                ) : (
                  criteria.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCriterion(c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-left transition-all text-sm ${
                        selectedCriteriaIds.includes(c.id)
                          ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                            selectedCriteriaIds.includes(c.id)
                              ? "bg-blue-500 text-white"
                              : "border-2 border-gray-300 dark:border-gray-500"
                          }`}
                        >
                          {selectedCriteriaIds.includes(c.id) && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {c.name}
                          </p>
                          {c.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Info banner ── */}
          <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Người được chọn sẽ được phân công cho tất cả {interviews.length}{" "}
              lịch PV
              {assignCriteria && selectedCriteriaIds.length > 0
                ? ` với ${selectedCriteriaIds.length} tiêu chí`
                : ""}
            </p>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedMember}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium text-sm hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
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
                  Đang phân công...
                </span>
              ) : (
                `Phân công (${interviews.length} lịch)`
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BulkAssignInterviewerModal;
