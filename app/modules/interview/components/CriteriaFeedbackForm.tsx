import React, { useState } from 'react';
import type { CriteriaScoreItemDto } from '~/cores/api/types';
import { useGetCampaignCriteriaQuery, useSubmitCriteriaFeedbackMutation } from '~/cores/api/interviewApi';

interface CriteriaFeedbackFormProps {
  scheduleId: number;
  assignmentId: number;
  campaignId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const resultOptions = [
  { value: 'Pass', label: 'Đạt (Pass)', color: 'text-green-600', icon: 'fa-solid fa-circle-check' },
  { value: 'Fail', label: 'Không đạt (Fail)', color: 'text-red-600', icon: 'fa-solid fa-circle-xmark' },
  { value: 'OnHold', label: 'Chờ xem xét (OnHold)', color: 'text-yellow-600', icon: 'fa-solid fa-clock' },
  { value: 'NoShow', label: 'Vắng mặt (NoShow)', color: 'text-gray-500', icon: 'fa-solid fa-ban' },
];

const CriteriaFeedbackForm: React.FC<CriteriaFeedbackFormProps> = ({
  scheduleId, assignmentId, campaignId, onSuccess, onCancel,
}) => {
  const { data: criteria, isLoading } = useGetCampaignCriteriaQuery(campaignId);
  const [submitFeedback] = useSubmitCriteriaFeedbackMutation();

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [overallNotes, setOverallNotes] = useState('');
  const [result, setResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !criteria) return;

    setIsSubmitting(true);
    setError(null);

    const scoreItems: CriteriaScoreItemDto[] = criteria.map((c) => ({
      criterionId: c.id,
      score: 0,
      note: notes[c.id]?.trim() || null,
    }));

    try {
      await submitFeedback({
        scheduleId,
        assignmentId,
        dto: { scores: scoreItems, feedbackNotes: overallNotes.trim() || null, result },
      }).unwrap();
      onSuccess?.();
    } catch (err: unknown) {
      setError('Gửi đánh giá thất bại');
      console.error('Failed to submit criteria feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <i className="fa-solid fa-clipboard-list text-blue-500" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Đánh giá theo tiêu chí</h3>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Criteria cards — chỉ nhận xét, không chấm điểm */}
      <div className="space-y-3">
        {criteria?.map((criterion) => (
          <div
            key={criterion.id}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{criterion.name}</p>
                {criterion.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{criterion.description}</p>
                )}
              </div>
            </div>
            <textarea
              value={notes[criterion.id] || ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [criterion.id]: e.target.value }))}
              placeholder={`Nhận xét về ${criterion.name.toLowerCase()}...`}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all resize-none"
            />
          </div>
        ))}
      </div>

      {/* Separator */}
      <hr className="border-gray-200 dark:border-gray-600" />

      {/* Result */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Kết quả đánh giá <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {resultOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setResult(opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                result === opt.value
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <i className={`${opt.icon} ${opt.color}`} />
              <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

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
          disabled={!result || isSubmitting}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang gửi...
            </span>
          ) : (
            'Gửi đánh giá'
          )}
        </button>
      </div>
    </form>
  );
};

export default CriteriaFeedbackForm;
