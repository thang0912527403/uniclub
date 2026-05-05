import type { RecruitmentCampaign } from "~/cores/api/types";
import { StatusBadge } from "./StatusBadge";
import { formatDateVN } from "./constants";

export function CampaignCard({
  campaign,
  onNavigate,
}: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
}) {
  return (
    <div
      className="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => onNavigate(campaign.campaignId)}
    >
      {/* Image / Fallback */}
      <div className="h-44 relative overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <div className="text-center text-white/80">
              <i className="fas fa-bullhorn text-4xl mb-2 opacity-60" />
              <p className="text-xs font-medium opacity-70 px-4 line-clamp-1">
                {campaign.campaignName}
              </p>
            </div>
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {campaign.campaignName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {campaign.description || "Chưa có mô tả"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <i className="far fa-calendar-alt" />
            <span>
              {formatDateVN(campaign.startDate)} –{" "}
              {formatDateVN(campaign.endDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
