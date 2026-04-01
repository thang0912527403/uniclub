import React, { useState } from 'react';
import { useGetCampaignCriteriaQuery, useAssignCriteriaMutation } from '~/cores/api/interviewApi';

interface CriteriaAssignmentProps {
  scheduleId: number;
  assignmentId: number;
  campaignId: number;
  currentCriteriaIds?: string | null;
  interviewerName?: string;
  onSuccess?: () => void;
}

const CriteriaAssignment: React.FC<CriteriaAssignmentProps> = ({
  scheduleId, assignmentId, campaignId, currentCriteriaIds, interviewerName, onSuccess,
}) => {
  const { data: criteria, isLoading } = useGetCampaignCriteriaQuery(campaignId);
  const [assignCriteria] = useAssignCriteriaMutation();

  const currentIds = currentCriteriaIds
    ? currentCriteriaIds.split(',').map(Number).filter(Boolean)
    : [];

  const [selected, setSelected] = useState<number[]>(currentIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggle = (criterionId: number) => {
    setSelected((prev) =>
      prev.includes(criterionId) ? prev.filter((id) => id !== criterionId) : [...prev, criterionId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await assignCriteria({ scheduleId, assignmentId, dto: { criteriaIds: selected } }).unwrap();
      setSuccess(true);
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
        <svg className="w-5 h-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="flex items-center gap-2 mb-1">
        <i className="fa-solid fa-list-check text-blue-500" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
          Phân tiêu chí cho {interviewerName || 'PV viên'}
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Chọn tiêu chí mà PV viên này chịu trách nhiệm đánh giá. Không chọn = đánh giá tất cả.
      </p>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
          Phân tiêu chí thành công!
        </div>
      )}

      <div className="space-y-2">
        {criteria?.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
              selected.includes(c.id)
                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className={`fa-${selected.includes(c.id) ? 'solid fa-square-check text-blue-500' : 'regular fa-square text-gray-400'} text-lg`} />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
              {c.weight}%
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Đang lưu...' : `Lưu (${selected.length} tiêu chí)`}
      </button>
    </div>
  );
};

export default CriteriaAssignment;
