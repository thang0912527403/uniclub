import React, { useState } from 'react';
import type { InterviewAssignmentResponse } from '~/cores/api';

interface ScoringPanelProps {
  scheduleId: number;
  assignment: InterviewAssignmentResponse | null;
  allAssignments: InterviewAssignmentResponse[];
  onSubmitFeedback: (data: {
    scheduleId: number;
    assignmentId: number;
    feedbackNotes: string;
    result: string;
    score: number;
  }) => void;
  isSubmitting?: boolean;
}

const resultOptions = [
  { value: 'Pass', label: 'Đạt', iconClass: 'fa-solid fa-circle-check', color: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100', activeRing: 'ring-green-300' },
  { value: 'Fail', label: 'Không đạt', iconClass: 'fa-solid fa-circle-xmark', color: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100', activeRing: 'ring-red-300' },
  { value: 'OnHold', label: 'Chờ xem xét', iconClass: 'fa-solid fa-clock', color: 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100', activeRing: 'ring-yellow-300' },
  { value: 'NoShow', label: 'Không đến', iconClass: 'fa-solid fa-ban', color: 'border-gray-400 bg-gray-50 text-gray-700 hover:bg-gray-100', activeRing: 'ring-gray-300' },
];

const getResultBadge = (r: string) => {
  switch (r) {
    case 'Pass': return 'bg-green-100 text-green-700';
    case 'Fail': return 'bg-red-100 text-red-700';
    case 'OnHold': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const ScoringPanel: React.FC<ScoringPanelProps> = ({
  scheduleId,
  assignment,
  allAssignments,
  onSubmitFeedback,
  isSubmitting = false,
}) => {
  const [result, setResult] = useState('Pass');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'score' | 'others'>('score');

  const hasSubmitted = !!assignment?.feedbackSubmittedAt;
  const otherFeedbacks = allAssignments.filter(a => a.feedbackSubmittedAt && a.id !== assignment?.id);

  const handleSubmit = () => {
    if (!assignment) return;
    onSubmitFeedback({
      scheduleId,
      assignmentId: assignment.id,
      feedbackNotes,
      result,
      score: 0,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <i className="fa-solid fa-clipboard-check text-white text-sm" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base leading-tight">Đánh giá phỏng vấn</h3>
          <p className="text-orange-100 text-xs mt-0.5">Nhận xét & đánh dấu trạng thái ứng viên</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('score')}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'score'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="fa-solid fa-pen-to-square text-xs" />
          Đánh giá
        </button>
        <button
          onClick={() => setActiveTab('others')}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'others'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="fa-solid fa-users text-xs" />
          Đánh giá khác ({otherFeedbacks.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'score' && (
          <div className="space-y-6">
            {hasSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fa-solid fa-check text-green-500 text-2xl" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">Đã gửi đánh giá</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Kết quả: <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getResultBadge(assignment?.result || '')}`}>{assignment?.result}</span>
                </p>
                {assignment?.feedbackNotes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-3 text-left">
                    {assignment.feedbackNotes}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Result */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-clipboard-check text-blue-400 text-xs" />
                    Kết quả
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {resultOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setResult(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          result === opt.value
                            ? `${opt.color} ring-2 ring-offset-1 ${opt.activeRing} scale-[1.02]`
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <i className={`${opt.iconClass} text-xs`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-comment-dots text-purple-400 text-xs" />
                    Nhận xét
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Nhận xét chi tiết về ứng viên..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !assignment}
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

        {activeTab === 'others' && (
          <div className="space-y-3">
            {otherFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fa-solid fa-inbox text-3xl mb-3 block" />
                <p className="text-sm">Chưa có đánh giá nào từ người khác.</p>
              </div>
            ) : (
              otherFeedbacks.map((a) => (
                <div key={a.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        <i className="fa-solid fa-user text-xs" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.role}</p>
                        <p className="text-[10px] text-gray-400">
                          {a.feedbackSubmittedAt ? new Date(a.feedbackSubmittedAt).toLocaleString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                    {a.result && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getResultBadge(a.result)}`}>
                        {a.result}
                      </span>
                    )}
                  </div>
                  {a.feedbackNotes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{a.feedbackNotes}</p>
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
