import React from 'react';
import { useGetEvaluationSummaryQuery } from '~/cores/api/interviewApi';

interface EvaluationSummaryProps {
  scheduleId: number;
}

const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ scheduleId }) => {
  const { data: summary, isLoading, error } = useGetEvaluationSummaryQuery(scheduleId);

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

  if (error) return <div className="text-red-500 text-sm">Không thể tải tổng hợp đánh giá</div>;
  if (!summary) return <div className="text-gray-500 text-sm">Chưa có dữ liệu đánh giá</div>;

  const getResultLabel = (r: string) => {
    switch (r) {
      case 'Pass': return 'Đạt';
      case 'OnHold': return 'Chờ xét';
      case 'Fail': return 'Không đạt';
      case 'NoShow': return 'Vắng mặt';
      default: return r;
    }
  };

  const getResultColor = (r: string) => {
    switch (r) {
      case 'Pass': return 'text-green-600 bg-green-50 border-green-200';
      case 'OnHold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Fail': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Lead': return 'bg-yellow-100 text-yellow-700';
      case 'Interviewer': return 'bg-orange-100 text-orange-700';
      case 'Observer': return 'bg-blue-100 text-blue-700';
      case 'HRRepresentative': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-clipboard-list text-blue-500" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Tổng hợp nhận xét</h3>
      </div>

      {/* Result overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-xs">Kết quả đề xuất</p>
            <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold border inline-block ${getResultColor(summary.suggestedResult)}`}>
              {getResultLabel(summary.suggestedResult)}
            </div>
          </div>
          <div className="text-center">
            <i className="fa-solid fa-users text-3xl text-white/70" />
            <p className="text-white/60 text-xs mt-1">
              {summary.feedbacks?.filter(f => f.feedbackSubmittedAt).length || 0} đánh giá
            </p>
          </div>
        </div>
      </div>

      {/* Criteria breakdown — chỉ hiện nhận xét, không hiện điểm */}
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chi tiết theo tiêu chí</p>

      <div className="space-y-3">
        {summary.criteriaSummaries.map((cs) => (
          <div key={cs.criterionId} className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 space-y-2">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{cs.criterionName}</p>
            </div>

            {/* Individual notes from each interviewer */}
            {cs.individualScores.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {cs.individualScores.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs px-3 py-2 rounded-lg bg-white dark:bg-gray-700/50">
                    <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getRoleBadge(s.interviewerRole)}`}>
                      {s.interviewerRole}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 flex-1">
                      {s.note || <span className="italic text-gray-400">Không có nhận xét</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvaluationSummary;
