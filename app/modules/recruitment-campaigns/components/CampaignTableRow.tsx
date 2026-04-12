import type { RecruitmentCampaign } from "~/cores/api/types";
import { StatusBadge } from "./StatusBadge";
import { formatDateVN } from "./constants";

export function CampaignTableRow({
  campaign,
  onNavigate,
}: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
}) {
  return (
    <tr
      className="group border-b border-gray-100 dark:border-gray-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer transition-colors duration-150"
      onClick={() => onNavigate(campaign.campaignId)}
    >
      {/* Name + image */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500">
            {campaign.imageUrl ? (
              <img
                src={campaign.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-bullhorn text-white text-xs opacity-70" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {campaign.campaignName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[240px]">
              {campaign.description || "—"}
            </p>
          </div>
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={campaign.status} />
      </td>
      {/* Dates */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDateVN(campaign.startDate)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDateVN(campaign.endDate)}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-lg transition-colors">
            Chi tiết
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}
