import React, { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useGetCampaignCriteriaQuery, useAssignCriteriaMutation, useGetCriteriaScoresQuery } from '~/cores/api/interviewApi';

interface CriteriaAssignmentProps {
  scheduleId: number;
  assignmentId: number;
  campaignId: number;
  interviewerName?: string;
  readOnly?: boolean;
  onSuccess?: () => void;
}

const CriteriaAssignment: React.FC<CriteriaAssignmentProps> = ({
  scheduleId, assignmentId, campaignId, interviewerName, readOnly, onSuccess,
}) => {
  const { data: criteria, isLoading: isLoadingCriteria } = useGetCampaignCriteriaQuery(campaignId);
  const { data: criteriaScores, isLoading: isLoadingScores, isFetching } = useGetCriteriaScoresQuery({ scheduleId, assignmentId });
  const [assignCriteria] = useAssignCriteriaMutation();

  // Derive assigned IDs from CriteriaScore API response
  const assignedIds = useMemo(
    () => (criteriaScores || []).map(s => s.evaluationCriterionId),
    [criteriaScores],
  );

  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const isDisabled = readOnly || savedSuccessfully;
  const isLoading = isLoadingCriteria || isLoadingScores;

  // ── Sync selected state when API data arrives or changes ──
  useEffect(() => {
    // Only sync when data is fully loaded (not fetching)
    if (!isLoadingScores && !isFetching && criteriaScores) {
      setSelected(assignedIds);
    }
  }, [criteriaScores, isLoadingScores, isFetching]);

  const hasChanges = useMemo(() => {
    if (selected.length !== assignedIds.length) return true;
    const sorted1 = [...selected].sort();
    const sorted2 = [...assignedIds].sort();
    return sorted1.some((v, i) => v !== sorted2[i]);
  }, [selected, assignedIds]);

  const toggle = (criterionId: number) => {
    if (isDisabled) return;
    setSelected((prev) =>
      prev.includes(criterionId) ? prev.filter((id) => id !== criterionId) : [...prev, criterionId]
    );
  };

  const selectAll = () => {
    if (isDisabled || !criteria) return;
    setSelected(criteria.map(c => c.id));
  };

  const deselectAll = () => {
    if (isDisabled) return;
    setSelected([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignCriteria({ scheduleId, assignmentId, dto: { criteriaIds: selected } }).unwrap();
      message.success(`Đã cập nhật ${selected.length} tiêu chí`);
      setSavedSuccessfully(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError('Phân tiêu chí thất bại');
      console.error('Failed to assign criteria:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <i className="fa-solid fa-list-check text-xl mb-2 block" />
        <p className="text-sm">Chưa có tiêu chí nào trong campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`fa-solid fa-list-check ${savedSuccessfully ? 'text-green-500' : 'text-blue-500'}`} />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {readOnly ? 'Tiêu chí được phân' : savedSuccessfully ? 'Đã lưu tiêu chí' : `Phân tiêu chí cho ${interviewerName || 'PV viên'}`}
          </h3>
        </div>
        {!isDisabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selected.length === criteria.length ? deselectAll : selectAll}
              className="text-[11px] text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {selected.length === criteria.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        )}
      </div>

      {!isDisabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chọn tiêu chí mà PV viên này chịu trách nhiệm đánh giá. Không chọn = đánh giá tất cả.
        </p>
      )}

      {/* Success banner with re-edit */}
      {savedSuccessfully && !readOnly && (
        <div className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-xs" />
            Đã lưu {selected.length} tiêu chí thành công
          </span>
          <button
            type="button"
            onClick={() => setSavedSuccessfully(false)}
            className="text-xs font-medium text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Chỉnh sửa lại
          </button>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <i className="fa-solid fa-circle-exclamation text-xs" />
          {error}
        </div>
      )}

      {/* Criteria list */}
      <div className="space-y-1.5">
        {criteria.map((c) => {
          const isSelected = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? savedSuccessfully
                    ? 'border-green-300 bg-green-50/50 dark:bg-green-900/20'
                    : 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : isDisabled
                    ? 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isDisabled ? 'cursor-default opacity-75' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2.5">
                <i className={`fa-${isSelected ? `solid fa-square-check ${savedSuccessfully ? 'text-green-500' : 'text-blue-500'}` : 'regular fa-square text-gray-400'} text-base`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
                </div>
              </div>

            </button>
          );
        })}
      </div>

      {/* Save button — only when not read-only and not saved */}
      {!readOnly && !savedSuccessfully && (
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`w-full px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasChanges
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-[1.01]'
              : 'bg-gray-400'
          }`}
        >
          {saving
            ? 'Đang lưu...'
            : hasChanges
              ? `Lưu thay đổi (${selected.length} tiêu chí)`
              : `Đã lưu (${selected.length} tiêu chí)`}
        </button>
      )}
    </div>
  );
};

export default CriteriaAssignment;
