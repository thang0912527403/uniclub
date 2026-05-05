import React, { useState } from "react";
import type { CriteriaNoteItemDto } from "~/cores/api/types";
import {
  useGetCriteriaForAssignmentQuery,
  useSubmitCriteriaFeedbackMutation,
  useCreateCriterionMutation,
} from "~/cores/api/interviewApi";

interface CriteriaFeedbackFormProps {
  scheduleId: number;
  assignmentId: number;
  campaignId: number;
  isClubManager?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CriteriaFeedbackForm: React.FC<CriteriaFeedbackFormProps> = ({
  scheduleId,
  assignmentId,
  campaignId,
  isClubManager = false,
  onSuccess,
  onCancel,
}) => {
  const { data: criteria, isLoading } = useGetCriteriaForAssignmentQuery({ scheduleId, assignmentId });
  const [submitFeedback] = useSubmitCriteriaFeedbackMutation();
  const [createCriterion, { isLoading: isCreatingCriterion }] =
    useCreateCriterionMutation();

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add-criteria form state
  const [isAddingCriteria, setIsAddingCriteria] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaDesc, setNewCriteriaDesc] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const hasCriteria = criteria && criteria.length > 0;

  const handleAddCriteria = async () => {
    if (!newCriteriaName.trim()) return;
    setAddError(null);

    try {
      await createCriterion({
        campaignId,
        dto: {
          name: newCriteriaName.trim(),
          description: newCriteriaDesc.trim() || null,
          isDraft: true,
          assignmentId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteria || criteria.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    const noteItems: CriteriaNoteItemDto[] = criteria.map((c) => ({
      criterionId: c.id,
      note: notes[c.id]?.trim() || null,
    }));

    try {
      await submitFeedback({
        scheduleId,
        assignmentId,
        dto: {
          notes: noteItems,
          feedbackNotes: overallNotes.trim() || null,
          result: "OnHold",
        },
      }).unwrap();
      onSuccess?.();
    } catch (err: unknown) {
      setError("Gửi đánh giá thất bại");
      console.error("Failed to submit criteria feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg
          className="w-6 h-6 animate-spin text-orange-500"
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-clipboard-list text-blue-500" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            Đánh giá theo tiêu chí
          </h3>
        </div>
        {!isAddingCriteria && isClubManager && (
          <button
            type="button"
            onClick={() => setIsAddingCriteria(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all hover:scale-[1.02]"
          >
            <i className="fa-solid fa-plus text-[10px]" />
            Thêm tiêu chí
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add criteria form */}
      {isAddingCriteria && (
        <div className="p-3.5 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 space-y-2 animate-fadeIn">
          <input
            type="text"
            value={newCriteriaName}
            onChange={(e) => setNewCriteriaName(e.target.value)}
            placeholder="Tên tiêu chí mới..."
            className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            autoFocus
          />
          <input
            type="text"
            value={newCriteriaDesc}
            onChange={(e) => setNewCriteriaDesc(e.target.value)}
            placeholder="Mô tả (tùy chọn)..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
          />
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
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
              type="button"
              onClick={handleAddCriteria}
              disabled={!newCriteriaName.trim() || isCreatingCriterion}
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
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 space-y-2 transition-all hover:border-orange-200 hover:bg-orange-50/30"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {criterion.name}
                  </p>
                  {criterion.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {criterion.description}
                    </p>
                  )}
                </div>

              </div>
              <textarea
                value={notes[criterion.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({
                    ...prev,
                    [criterion.id]: e.target.value,
                  }))
                }
                placeholder={`Nhận xét về ${criterion.name.toLowerCase()}...`}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all resize-none"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
          <i className="fa-solid fa-list-check text-2xl mb-2 block" />
          <p className="text-sm">Chưa có tiêu chí nào.</p>
          <p className="text-xs mt-0.5">
            Hãy thêm tiêu chí để bắt đầu đánh giá.
          </p>
        </div>
      )}

      {/* Overall notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nhận xét tổng hợp
        </label>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="Nhận xét chung về ứng viên..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={!hasCriteria || isSubmitting}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              Đang gửi...
            </span>
          ) : (
            "Gửi đánh giá"
          )}
        </button>
      </div>
    </form>
  );
};

export default CriteriaFeedbackForm;
