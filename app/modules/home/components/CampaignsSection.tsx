import React from 'react';
import { Link } from 'react-router';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';
import type { RecruitmentCampaign } from '~/cores/api';

function CampaignCard({ campaign }: { campaign: RecruitmentCampaign }) {
  return (
    <Link
      to={`/campaign/${campaign.campaignId}`}
      className="group flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-700 dark:to-gray-600">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-bullhorn text-5xl text-orange-300 dark:text-orange-500/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold">
          Chiến dịch
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-orange-500 transition-colors">
          {campaign.campaignName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {campaign.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-calendar-alt text-orange-500" />
          <span>
            {new Date(campaign.startDate).toLocaleDateString('vi-VN')} – {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CampaignsSection() {
  const { data: campaigns = [], isLoading, error } = useGetRecruitmentCampaignsQuery();
  const activeCampaigns = campaigns.filter(
    (c) => c.status?.toLowerCase() === 'open' || c.status?.toLowerCase() === 'active'
  );

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chiến dịch tuyển dụng
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Đang tải...</p>
        </div>
        <div className="flex justify-center py-8">
          <i className="fas fa-spinner fa-spin text-4xl text-orange-500" />
        </div>
      </section>
    );
  }

  if (activeCampaigns.length === 0) {
    return (
      <section className="py-14 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chiến dịch tuyển dụng
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
            Hiện tại chưa có chiến dịch tuyển dụng nào đang mở từ các câu lạc bộ.
          </p>
          <div className="mt-8">
            <i className="fas fa-folder-open text-6xl text-gray-300 dark:text-gray-600" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Chiến dịch tuyển dụng
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Các chiến dịch đang mở từ các câu lạc bộ — bấm vào để xem chi tiết và ứng tuyển
        </p>
      </div>

      <div className="relative">
        <div className="overflow-hidden">
          <div className="flex flex-nowrap animate-marquee gap-6 py-2" style={{ width: 'max-content' }}>
            {activeCampaigns.map((c) => (
              <CampaignCard key={`a-${c.campaignId}`} campaign={c} />
            ))}
            {activeCampaigns.map((c) => (
              <CampaignCard key={`b-${c.campaignId}`} campaign={c} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
