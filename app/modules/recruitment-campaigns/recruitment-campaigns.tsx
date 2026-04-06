import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { SettingButton } from "~/components/SettingButton";
import { Loading } from "~/components/Loading";
import { Error } from "~/components/Error";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import {
  useGetRecruitmentCampaignsQuery,
  useGetRecruitmentCampaignsByClubIdQuery,
} from "~/cores/api";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useClubRole } from "~/hooks/useClubRole";

import {
  ITEMS_PER_PAGE,
  STATUS_TABS,
  type StatusTabKey,
  StatCard,
  CampaignCard,
  CampaignTableRow,
  Pagination,
} from "./components";

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function RecruitmentCampaignsModule() {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin } = useCurrentUser();
  const { clubManagerMembership } = useClubRole();
  const clubId = clubManagerMembership?.clubId ?? 0;

  // ── API ──
  const {
    data: adminCampaigns,
    isLoading: adminLoading,
    error: adminError,
  } = useGetRecruitmentCampaignsQuery(undefined, { skip: !isAdmin });
  const {
    data: clubCampaigns,
    isLoading: clubLoading,
    error: clubError,
  } = useGetRecruitmentCampaignsByClubIdQuery(clubId, {
    skip: isAdmin || clubId === 0,
  });

  const campaigns = isAdmin ? adminCampaigns : clubCampaigns;
  const isLoading = isAdmin ? adminLoading : clubLoading;
  const error = isAdmin ? adminError : clubError;

  // ── Local state ──
  const [activeTab, setActiveTab] = useState<StatusTabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // ── Derived data ──
  const statusCounts = useMemo(() => {
    if (!campaigns) return { all: 0, active: 0, upcoming: 0, completed: 0 };
    return {
      all: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
      upcoming: campaigns.filter((c) => c.status === "upcoming").length,
      completed: campaigns.filter((c) => c.status === "completed").length,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    let result = [...campaigns];
    if (activeTab !== "all") {
      result = result.filter((c) => c.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.campaignName.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [campaigns, activeTab, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedCampaigns = filteredCampaigns.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // ── Handlers ──
  const handleTabChange = useCallback((tab: StatusTabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleNavigate = useCallback(
    (id: number) => {
      navigate(`/recruitment-campaigns/${id}/campaign-forms`);
    },
    [navigate],
  );

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/recruitment-campaigns" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Quản lý Chiến dịch Tuyển dụng"
        breadcrumb="Pages / Recruitment Campaigns"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        {/* Loading */}
        {isLoading && <Loading />}

        {/* Error */}
        {error && (
          <Error
            title="Lỗi khi tải danh sách chiến dịch tuyển dụng."
            error={error}
          />
        )}

        {/* Content */}
        {!isLoading && campaigns && (
          <>
            {/* ────── Stats Cards ────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="fa-bullhorn"
                label="Tổng chiến dịch"
                value={statusCounts.all}
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />
              <StatCard
                icon="fa-circle-check"
                label="Đang hoạt động"
                value={statusCounts.active}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                icon="fa-clock"
                label="Sắp diễn ra"
                value={statusCounts.upcoming}
                gradient="bg-gradient-to-br from-violet-500 to-violet-600"
              />
              <StatCard
                icon="fa-flag-checkered"
                label="Đã hoàn thành"
                value={statusCounts.completed}
                gradient="bg-gradient-to-br from-slate-500 to-slate-600"
              />
            </div>

            {/* ────── Action Bar ────── */}
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 mb-6">
              {/* Top row: tabs + view toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.key
                          ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <i className={`fas ${tab.icon} text-[10px]`} />
                      {tab.label}
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          activeTab === tab.key
                            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {statusCounts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title="Xem dạng lưới"
                  >
                    <i className="fas fa-grid-2 text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title="Xem dạng bảng"
                  >
                    <i className="fas fa-list text-sm" />
                  </button>
                </div>
              </div>

              {/* Bottom row: search + count */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chiến dịch..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <i className="fas fa-times text-xs" />
                    </button>
                  )}
                </div>

                {/* Results count */}
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block">
                  {filteredCampaigns.length} kết quả
                </span>
              </div>
            </div>

            {/* ────── Campaigns Grid View ────── */}
            {viewMode === "grid" && pagedCampaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pagedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}

            {/* ────── Campaigns Table View ────── */}
            {viewMode === "table" && pagedCampaigns.length > 0 && (
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chiến dịch
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Bắt đầu
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kết thúc
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCampaigns.map((campaign) => (
                        <CampaignTableRow
                          key={campaign.campaignId}
                          campaign={campaign}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ────── Empty State ────── */}
            {filteredCampaigns.length === 0 && (
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bullhorn text-2xl text-gray-400 dark:text-gray-500" />
                </div>
                {searchQuery || activeTab !== "all" ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Không tìm thấy chiến dịch
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("all");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <i className="fas fa-arrow-rotate-left text-xs" />
                      Xóa bộ lọc
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Chưa có chiến dịch tuyển dụng nào
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tạo chiến dịch tuyển dụng đầu tiên để bắt đầu
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ────── Pagination ────── */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>
    </div>
  );
}
