import React, { useState } from 'react';
import { useSubmitFeedbackMutation } from '~/cores/api';

interface FeedbackFormProps {
  scheduleId: number;
  assignmentId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const resultOptions = [
  { value: 'Pass', label: 'Đạt (Pass)', color: 'text-green-600', icon: 'fa-solid fa-circle-check' },
  { value: 'Fail', label: 'Không đạt (Fail)', color: 'text-red-600', icon: 'fa-solid fa-circle-xmark' },
  { value: 'OnHold', label: 'Chờ xem xét (OnHold)', color: 'text-yellow-600', icon: 'fa-solid fa-clock' },
  { value: 'NoShow', label: 'Vắng mặt (NoShow)', color: 'text-gray-500', icon: 'fa-solid fa-ban' },
];

const FeedbackForm: React.FC<FeedbackFormProps> = ({ scheduleId, assignmentId, onSuccess, onCancel }) => {
  const [result, setResult] = useState('');
  const [score, setScore] = useState(70);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitFeedback] = useSubmitFeedbackMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        scheduleId,
        assignmentId,
        dto: {
          result,
          score,
          feedbackNotes: notes.trim() || null,
        },
      }).unwrap();
      onSuccess?.();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
      {/* Result */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Kết quả <span className="text-red-500">*</span>
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

      {/* Score */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Điểm số: <span className="text-orange-500 font-bold">{score}/100</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nhận xét
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nhận xét về ứng viên..."
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

export default FeedbackForm;
