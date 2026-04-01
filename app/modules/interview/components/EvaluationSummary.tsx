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

  const getBarColor = (score: number) => {
    if (score >= 3.5) return 'bg-green-500';
    if (score >= 2.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fa-star text-sm ${
              star <= Math.round(score) ? 'fa-solid text-amber-400' : 'fa-regular text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-chart-bar text-blue-500" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Tổng hợp đánh giá</h3>
      </div>

      {/* Score overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-xs">Điểm tổng (trọng số)</p>
            <p className="text-4xl font-extrabold mt-1">{summary.totalScore.toFixed(1)}</p>
            <p className="text-white/60 text-xs">/100 điểm</p>
          </div>
          <div className="text-center">
            <i className="fa-solid fa-arrow-trend-up text-3xl text-white/70" />
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getResultColor(summary.suggestedResult)}`}>
              {getResultLabel(summary.suggestedResult)}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria breakdown */}
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chi tiết theo tiêu chí</p>

      <div className="space-y-3">
        {summary.criteriaSummaries.map((cs) => (
          <div key={cs.criterionId} className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{cs.criterionName}</p>
                <p className="text-xs text-gray-500">Trọng số: {cs.weight}%</p>
              </div>
              <div className="text-right">
                {renderStars(cs.averageScore)}
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {cs.averageScore.toFixed(1)}/5
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getBarColor(cs.averageScore)} transition-all`}
                style={{ width: `${(cs.averageScore / 5) * 100}%` }}
              />
            </div>

            {/* Individual scores */}
            {cs.individualScores.length > 0 && (
              <div className="mt-2 space-y-1">
                {cs.individualScores.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-gray-700/50">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium">
                      {s.interviewerRole}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`fa-star text-[10px] ${star <= s.score ? 'fa-solid text-amber-400' : 'fa-regular text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 truncate flex-1">
                      {s.note || '—'}
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
