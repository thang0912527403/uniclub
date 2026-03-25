import React, { useState } from 'react';
import {
  useGetCampaignComparisonQuery,
  useGetCampaignCriteriaQuery,
  useSubmitDecisionsMutation,
} from '~/cores/api/interviewApi';
import { getUserId } from '~/utils/auth';
import PublishResultModal from './PublishResultModal';

interface CandidateComparisonPageProps {
  campaignId: number;
}

const CandidateComparisonPage: React.FC<CandidateComparisonPageProps> = ({ campaignId }) => {
  const { data: comparison, isLoading, error } = useGetCampaignComparisonQuery(campaignId);
  const { data: criteria } = useGetCampaignCriteriaQuery(campaignId);
  const [submitDecisions] = useSubmitDecisionsMutation();

  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-8 h-8 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) return <div className="text-red-500 text-sm px-4 py-3 rounded-xl bg-red-50 border border-red-200">Không thể tải dữ liệu so sánh</div>;
  if (!comparison || comparison.length === 0) return <div className="text-gray-500 text-sm px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">Chưa có ứng viên nào được phỏng vấn</div>;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <i className="fa-solid fa-trophy text-xl text-amber-400" />;
    if (rank === 2) return <i className="fa-solid fa-medal text-lg text-gray-400" />;
    if (rank === 3) return <i className="fa-solid fa-medal text-lg text-amber-700" />;
    return <span className="font-bold text-gray-500">#{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'Pass': return 'bg-green-100 text-green-700 border-green-200';
      case 'OnHold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Fail': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'Pass': return 'Đạt';
      case 'OnHold': return 'Chờ xét';
      case 'Fail': return 'Không đạt';
      default: return result;
    }
  };

  const handleSubmitDecisions = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitting(true);

    const decisionItems = Object.entries(decisions).map(([scheduleIdStr, decision]) => {
      const scheduleId = Number(scheduleIdStr);
      const candidate = comparison!.find((c) => c.interviewScheduleId === scheduleId);
      return {
        interviewScheduleId: scheduleId,
        candidateUserId: candidate?.candidateUserId || '',
        decision,
      };
    });

    if (decisionItems.length === 0) {
      setSubmitError('Chưa có quyết định nào');
      setSubmitting(false);
      return;
    }

    try {
      await submitDecisions({
        campaignId,
        dto: { decidedByUserId: getUserId(), decisions: decisionItems },
      }).unwrap();
      setSubmitSuccess(true);
    } catch (err: unknown) {
      setSubmitError('Gửi quyết định thất bại');
      console.error('Failed to submit decisions:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`fa-star text-xs ${star <= Math.round(score) ? 'fa-solid text-amber-400' : 'fa-regular text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-code-compare text-blue-500 text-lg" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">So sánh ứng viên</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmitDecisions}
            disabled={submitting || Object.keys(decisions).length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang gửi...' : 'Gửi quyết định'}
          </button>
          <button
            onClick={() => setPublishOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-bullhorn text-xs" /> Công bố
          </button>
        </div>
      </div>

      {submitError && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{submitError}</div>
      )}
      {submitSuccess && (
        <div className="px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">Quyết định đã được gửi thành công!</div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 text-xs">#</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 text-xs min-w-[160px]">Ứng viên</th>
              {criteria?.map((c) => (
                <th key={c.id} className="px-3 py-3 text-center font-bold text-gray-700 dark:text-gray-300 text-xs min-w-[110px]">
                  {c.name}
                  <span className="block text-[10px] text-gray-400 font-medium">({c.weight}%)</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300 text-xs">Tổng</th>
              <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300 text-xs">Đề xuất</th>
              <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300 text-xs min-w-[130px]">Quyết định</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((candidate) => (
              <tr
                key={candidate.interviewScheduleId}
                className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${
                  candidate.rank === 1 ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                }`}
              >
                <td className="px-4 py-3">{getRankIcon(candidate.rank)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{candidate.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ID: {candidate.candidateUserId.slice(0, 8)}…</p>
                </td>
                {criteria?.map((c) => {
                  const score = candidate.criteriaScores[c.id] ?? 0;
                  return (
                    <td key={c.id} className="px-3 py-3 text-center">
                      {renderStars(score)}
                      <p className={`text-xs font-bold mt-0.5 ${getScoreColor(score)}`}>{score.toFixed(1)}</p>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-extrabold ${
                    candidate.totalScore >= 70 ? 'bg-green-100 text-green-700' :
                    candidate.totalScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {candidate.totalScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getResultBadge(candidate.suggestedResult)}`}>
                    {getResultLabel(candidate.suggestedResult)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={decisions[candidate.interviewScheduleId] || ''}
                    onChange={(e) =>
                      setDecisions((prev) => ({ ...prev, [candidate.interviewScheduleId]: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  >
                    <option value="">Chọn...</option>
                    <option value="Accept">✅ Nhận</option>
                    <option value="Reject">❌ Từ chối</option>
                    <option value="Waitlist">⏳ Chờ</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PublishResultModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        campaignId={campaignId}
        onSuccess={() => setPublishOpen(false)}
      />
    </div>
  );
};

export default CandidateComparisonPage;
