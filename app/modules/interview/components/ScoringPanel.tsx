import React, { useState } from "react";
import type { InterviewAssignmentResponse } from "~/cores/api";
import type {
  CriteriaNoteItemDto,
  EvaluationCriterionResponse,
} from "~/cores/api/types";
import {
  useGetCampaignCriteriaQuery,
  useSubmitCriteriaFeedbackMutation,
  useCreateCriterionMutation,
} from "~/cores/api/interviewApi";

interface ScoringPanelProps {
  scheduleId: number;
  assignment: InterviewAssignmentResponse | null;
  allAssignments: InterviewAssignmentResponse[];
  campaignId: number;
  isClubManager?: boolean;
  onSubmitFeedback: (data: {
    scheduleId: number;
    assignmentId: number;
    feedbackNotes: string;
    result: string;
  }) => void;
  isSubmitting?: boolean;
}

const ScoringPanel: React.FC<ScoringPanelProps> = ({
  scheduleId,
  assignment,
  allAssignments,
  campaignId,
  isClubManager = false,
  onSubmitFeedback,
  isSubmitting: isSubmittingLegacy = false,
}) => {
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [criteriaNotes, setCriteriaNotes] = useState<Record<number, string>>(
    {},
  );
  const [activeTab, setActiveTab] = useState<"evaluate" | "others">("evaluate");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Add-criteria form state
  const [isAddingCriteria, setIsAddingCriteria] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaDesc, setNewCriteriaDesc] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Fetch campaign criteria
  const { data: criteria, isLoading: isCriteriaLoading } =
    useGetCampaignCriteriaQuery(campaignId, {
      skip: !campaignId,
    });
  const [submitCriteriaFeedback, { isLoading: isSubmittingCriteria }] =
    useSubmitCriteriaFeedbackMutation();
  const [createCriterion, { isLoading: isCreatingCriterion }] =
    useCreateCriterionMutation();

  const hasCriteria = criteria && criteria.length > 0;
  const hasSubmitted = !!assignment?.feedbackSubmittedAt;
  const otherFeedbacks = allAssignments.filter(
    (a) => a.feedbackSubmittedAt && a.id !== assignment?.id,
  );
  const isSubmitting = isSubmittingLegacy || isSubmittingCriteria;

  // ── Add new criterion ──────────────────────────────────────────
  const handleAddCriteria = async () => {
    if (!newCriteriaName.trim()) return;
    setAddError(null);

    try {
      await createCriterion({
        campaignId,
        dto: {
          name: newCriteriaName.trim(),
          description: newCriteriaDesc.trim() || null,
          displayOrder: (criteria?.length || 0) + 1,
        },
      }).unwrap();
      setNewCriteriaName("");
      setNewCriteriaDesc("");
      setIsAddingCriteria(false);
    } catch (err) {
      console.error("Failed to add criterion:", err);
      setAddError("Thêm tiêu chí thất bại.");
    }
  };

  // ── Submit feedback ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!assignment) return;
    setSubmitError(null);

    if (hasCriteria) {
      const noteItems: CriteriaNoteItemDto[] = criteria.map((c) => ({
        criterionId: c.id,
        note: criteriaNotes[c.id]?.trim() || null,
      }));

      try {
        await submitCriteriaFeedback({
          scheduleId,
          assignmentId: assignment.id,
          dto: {
            notes: noteItems,
            feedbackNotes: feedbackNotes.trim() || null,
            result: "OnHold",
          },
        }).unwrap();
        setSubmitSuccess(true);
      } catch (err) {
        console.error("Failed to submit criteria feedback:", err);
        setSubmitError("Gửi đánh giá thất bại. Vui lòng thử lại.");
      }
    } else {
      onSubmitFeedback({
        scheduleId,
        assignmentId: assignment.id,
        feedbackNotes,
        result: "OnHold",
      });
      setSubmitSuccess(true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("evaluate")}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "evaluate"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-pen-to-square text-xs" />
          Đánh giá
        </button>
        <button
          onClick={() => setActiveTab("others")}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "others"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-users text-xs" />
          Đánh giá khác ({otherFeedbacks.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "evaluate" && (
          <div className="space-y-5">
            {hasSubmitted || submitSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fa-solid fa-check text-green-500 text-2xl" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                  Đã gửi đánh giá
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Club Manager sẽ ghi nhận và so sánh đánh giá của bạn.
                </p>
                {assignment?.feedbackNotes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-3 text-left">
                    {assignment.feedbackNotes}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Error message */}
                {submitError && (
                  <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-xs" />
                    {submitError}
                  </div>
                )}

                {/* Criteria loading */}
                {isCriteriaLoading && (
                  <div className="flex items-center justify-center py-4">
                    <svg
                      className="w-5 h-5 animate-spin text-orange-500"
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
                    <span className="ml-2 text-sm text-gray-500">
                      Đang tải tiêu chí...
                    </span>
                  </div>
                )}

                {/* Criteria Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <i className="fa-solid fa-clipboard-list text-blue-400 text-xs" />
                      Tiêu chí đánh giá
                      {hasCriteria && (
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({criteria.length})
                        </span>
                      )}
                    </label>
                    {!isAddingCriteria && isClubManager && (
                      <button
                        onClick={() => setIsAddingCriteria(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all hover:scale-[1.02]"
                      >
                        <i className="fa-solid fa-plus text-[10px]" />
                        Thêm tiêu chí
                      </button>
                    )}
                  </div>

                  {/* Add criteria form */}
                  {isAddingCriteria && (
                    <div className="mb-3 p-3.5 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 space-y-2 animate-fadeIn">
                      <input
                        type="text"
                        value={newCriteriaName}
                        onChange={(e) => setNewCriteriaName(e.target.value)}
                        placeholder="Tên tiêu chí mới..."
                        className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newCriteriaDesc}
                        onChange={(e) => setNewCriteriaDesc(e.target.value)}
                        placeholder="Mô tả (tùy chọn)..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      />
                      {addError && (
                        <p className="text-xs text-red-500">{addError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsAddingCriteria(false);
                            setNewCriteriaName("");
                            setNewCriteriaDesc("");
                            setAddError(null);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleAddCriteria}
                          disabled={
                            !newCriteriaName.trim() || isCreatingCriterion
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {isCreatingCriterion ? (
                            <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                          ) : (
                            <i className="fa-solid fa-check text-[10px]" />
                          )}
                          Thêm
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Criteria cards */}
                  {hasCriteria ? (
                    <div className="space-y-3">
                      {criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 space-y-2 transition-all hover:border-orange-200 hover:bg-orange-50/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                {criterion.name}
                              </p>
                              {criterion.description && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  {criterion.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={criteriaNotes[criterion.id] || ""}
                            onChange={(e) =>
                              setCriteriaNotes((prev) => ({
                                ...prev,
                                [criterion.id]: e.target.value,
                              }))
                            }
                            placeholder={`Nhận xét về ${criterion.name.toLowerCase()}...`}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  ) : !isCriteriaLoading ? (
                    <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      <i className="fa-solid fa-list-check text-2xl mb-2 block" />
                      <p className="text-sm">Chưa có tiêu chí nào.</p>
                      <p className="text-xs mt-0.5">
                        Hãy thêm tiêu chí để bắt đầu đánh giá.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Overall notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    Nhận xét chung
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Nhận xét chung về ứng viên..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !assignment ||
                    (!hasCriteria && !feedbackNotes.trim())
                  }
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-sm" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane text-sm" />
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "others" && (
          <div className="space-y-3">
            {otherFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fa-solid fa-inbox text-3xl mb-3 block" />
                <p className="text-sm">Chưa có đánh giá nào từ người khác.</p>
              </div>
            ) : (
              otherFeedbacks.map((a) => (
                <div
                  key={a.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        <i className="fa-solid fa-user text-xs" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {a.role}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {a.feedbackSubmittedAt
                            ? new Date(a.feedbackSubmittedAt).toLocaleString(
                                "vi-VN",
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  {a.feedbackNotes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {a.feedbackNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoringPanel;
