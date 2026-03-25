import { useSearchParams } from 'react-router';
import CandidateComparisonPage from '~/modules/interview/components/CandidateComparisonPage';

export default function InterviewComparison() {
  const [searchParams] = useSearchParams();
  const campaignId = Number(searchParams.get('campaignId'));

  if (!campaignId) {
    return (
      <div className="p-6">
        <div className="px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          Vui lòng chọn campaign để so sánh ứng viên
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CandidateComparisonPage campaignId={campaignId} />
    </div>
  );
}
