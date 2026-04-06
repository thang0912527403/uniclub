import React, { useState } from "react";
import { FormsTab } from "./components/FormsTab";
import { ApplicationsTab } from "./components/ApplicationsTab";

interface Props {
  campaignId: number;
  clubId: number;
  campaignName?: string;
}

const CampaignFormManager: React.FC<Props> = ({
  campaignId,
  clubId,
  campaignName,
}) => {
  const [tab, setTab] = useState<"forms" | "applications">("forms");

  const tabs = [
    {
      key: "forms" as const,
      label: "Biểu mẫu & Câu hỏi",
      icon: "fa-solid fa-clipboard-list",
    },
    {
      key: "applications" as const,
      label: "Đơn ứng tuyển & Phản hồi",
      icon: "fa-solid fa-inbox",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page title strip */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-file-lines text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quản lý biểu mẫu ứng tuyển
          </h2>
          {campaignName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {campaignName}
            </p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <i
              className={`${t.icon} text-xs ${tab === t.key ? "text-orange-500" : ""}`}
            />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "forms" && (
          <FormsTab campaignId={campaignId} clubId={clubId} />
        )}
        {tab === "applications" && (
          <ApplicationsTab campaignId={campaignId} clubId={clubId} />
        )}
      </div>
    </div>
  );
};

export default CampaignFormManager;
