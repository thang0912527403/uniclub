import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { SettingButton } from "~/components/SettingButton";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useClubRole } from "~/hooks/useClubRole";
import { useGetRecruitmentCampaignsByClubIdQuery } from "~/cores/api/recruitmentCampaignApi";
import CandidateComparisonPage from "~/modules/interview/components/CandidateComparisonPage";

const CampaignSelection = () => {
  const navigate = useNavigate();
  const { currentClub } = useClubRole();
  const clubId = currentClub?.clubId;

  const { data: myCampaigns = [], isLoading: campaignsLoading } =
    useGetRecruitmentCampaignsByClubIdQuery(clubId || 0, { skip: !clubId });

  const [search, setSearch] = useState("");
  const [directId, setDirectId] = useState("");

  const filteredCampaigns = myCampaigns.filter((c) =>
    c.campaignName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (id: number) => {
    navigate(`/interview/comparison?campaignId=${id}`);
  };

  const handleGoDirectly = (e: React.FormEvent) => {
    e.preventDefault();
    if (directId && !isNaN(Number(directId))) {
      navigate(`/interview/comparison?campaignId=${directId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-users-viewfinder text-2xl" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
          So sánh & công bố kết quả
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Vui lòng chọn hoặc nhập ID của chiến dịch tuyển dụng để xem kết quả
          đánh giá.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Nhập ID trực tiếp */}
        <form onSubmit={handleGoDirectly} className="flex gap-2">
          <input
            type="number"
            value={directId}
            onChange={(e) => setDirectId(e.target.value)}
            placeholder="Nhập ID chiến dịch..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
          <button
            type="submit"
            disabled={!directId}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Đi tới
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              HOẶC CHỌN TỪ DANH SÁCH
            </span>
          </div>
        </div>

        {/* Cửa sổ chọn */}
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm chiến dịch của CLB..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
          {campaignsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-6 text-gray-500 italic">
              Không tìm thấy chiến dịch nào.
            </div>
          ) : (
            filteredCampaigns.map((c) => {
              const isActive = c.status === "Active" || c.status === "Open";
              return (
                <div
                  key={c.campaignId}
                  onClick={() => handleSelect(c.campaignId)}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all group"
                >
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      {c.campaignName}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {isActive ? "Đang mở" : c.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ngày kết thúc:{" "}
                      {new Date(c.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default function InterviewComparison() {
  const [searchParams] = useSearchParams();
  const campaignId = Number(searchParams.get("campaignId"));

  const { isOpen, toggle } = useSidebarToggle();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <SettingButton />
      <Sidebar
        currentPath="/interview/comparison"
        isOpen={isOpen}
        onClose={toggle}
      />
      <HeaderBar
        title="So sánh & công bố kết quả"
        breadcrumb="Lịch phỏng vấn / So sánh & công bố kết quả"
        isSidebarOpen={isOpen}
        onToggleSidebar={toggle}
      />

      <main
        className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isOpen ? "md:ml-64" : "ml-0"}`}
      >
        {!campaignId ? (
          <CampaignSelection />
        ) : (
          <CandidateComparisonPage campaignId={campaignId} />
        )}
      </main>
    </div>
  );
}
