import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetRecruitmentCampaignsQuery, useGetRecruitmentCampaignsByClubIdQuery } from '~/cores/api';
import { useAuth } from '~/components/AuthProvider';
import type { RecruitmentCampaign } from '~/cores/api/types';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const ITEMS_PER_PAGE = 6;
const STATUS_TABS = [
  { key: 'all', label: 'Tất cả', icon: 'fa-layer-group' },
  { key: 'active', label: 'Đang hoạt động', icon: 'fa-circle-check' },
  { key: 'upcoming', label: 'Sắp diễn ra', icon: 'fa-clock' },
  { key: 'completed', label: 'Đã hoàn thành', icon: 'fa-flag-checkered' },
] as const;

type StatusTabKey = (typeof STATUS_TABS)[number]['key'];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getStatusConfig(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Đang hoạt động', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
    case 'upcoming':
      return { label: 'Sắp diễn ra', bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' };
    case 'completed':
      return { label: 'Đã hoàn thành', bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' };
    default:
      return { label: status, bg: 'bg-gray-500/15', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' };
  }
}

function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, gradient }: { icon: string; label: string; value: number; gradient: string }) {
  return (
    <div className="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <i className={`fas ${icon} text-white text-sm`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Card (Grid view) ── */
function CampaignCard({ campaign, onNavigate, onManageForm }: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
  onManageForm: (id: number, e: React.MouseEvent) => void;
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
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <div className="text-center text-white/80">
              <i className="fas fa-bullhorn text-4xl mb-2 opacity-60" />
              <p className="text-xs font-medium opacity-70 px-4 line-clamp-1">{campaign.campaignName}</p>
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
          {campaign.description || 'Chưa có mô tả'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <i className="far fa-calendar-alt" />
            <span>{formatDateVN(campaign.startDate)} – {formatDateVN(campaign.endDate)}</span>
          </div>
          <button
            onClick={(e) => onManageForm(campaign.campaignId, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors"
          >
            <i className="fa-solid fa-file-lines text-[10px]" />
            Form
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Table Row (Table view) ── */
function CampaignTableRow({ campaign, onNavigate, onManageForm }: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
  onManageForm: (id: number, e: React.MouseEvent) => void;
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
              <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
              {campaign.description || '—'}
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
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onManageForm(campaign.campaignId, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors"
          >
            <i className="fa-solid fa-file-lines text-[10px]" />
            Form
          </button>
          <button
            onClick={() => onNavigate(campaign.campaignId)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-lg transition-colors"
          >
            Chi tiết
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Pagination ── */
function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <i className="fas fa-chevron-left text-xs" />
      </button>
      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentPage === p
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <i className="fas fa-chevron-right text-xs" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function RecruitmentCampaignsModule() {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, clubManagerMembership } = useAuth();
  const clubId = clubManagerMembership?.clubId ?? 0;

  // ── API ──
  const { data: adminCampaigns, isLoading: adminLoading, error: adminError } = useGetRecruitmentCampaignsQuery(undefined, { skip: !isAdmin });
  const { data: clubCampaigns, isLoading: clubLoading, error: clubError } = useGetRecruitmentCampaignsByClubIdQuery(clubId, { skip: isAdmin || clubId === 0 });

  const campaigns = isAdmin ? adminCampaigns : clubCampaigns;
  const isLoading = isAdmin ? adminLoading : clubLoading;
  const error = isAdmin ? adminError : clubError;

  // ── Local state ──
  const [activeTab, setActiveTab] = useState<StatusTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // ── Derived data ──
  const statusCounts = useMemo(() => {
    if (!campaigns) return { all: 0, active: 0, upcoming: 0, completed: 0 };
    return {
      all: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      upcoming: campaigns.filter(c => c.status === 'upcoming').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    let result = [...campaigns];
    // Status filter
    if (activeTab !== 'all') {
      result = result.filter(c => c.status === activeTab);
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.campaignName.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [campaigns, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedCampaigns = filteredCampaigns.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // ── Handlers ──
  const handleTabChange = useCallback((tab: StatusTabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleNavigate = useCallback((id: number) => {
    navigate(`/recruitment-campaigns/${id}`);
  }, [navigate]);

  const handleManageForm = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/campaign-forms/${id}`);
  }, [navigate]);

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

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Loading */}
        {isLoading && <Loading />}

        {/* Error */}
        {error && <Error title="Lỗi khi tải danh sách chiến dịch tuyển dụng." error={error} />}

        {/* Content */}
        {!isLoading && campaigns && (
          <>
            {/* ────── Stats Cards ────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon="fa-bullhorn" label="Tổng chiến dịch" value={statusCounts.all} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
              <StatCard icon="fa-circle-check" label="Đang hoạt động" value={statusCounts.active} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
              <StatCard icon="fa-clock" label="Sắp diễn ra" value={statusCounts.upcoming} gradient="bg-gradient-to-br from-violet-500 to-violet-600" />
              <StatCard icon="fa-flag-checkered" label="Đã hoàn thành" value={statusCounts.completed} gradient="bg-gradient-to-br from-slate-500 to-slate-600" />
            </div>

            {/* ────── Action Bar ────── */}
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 mb-6">
              {/* Top row: tabs + view toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto">
                  {STATUS_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <i className={`fas ${tab.icon} text-[10px]`} />
                      {tab.label}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        activeTab === tab.key
                          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}>
                        {statusCounts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title="Xem dạng lưới"
                  >
                    <i className="fas fa-grid-2 text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title="Xem dạng bảng"
                  >
                    <i className="fas fa-list text-sm" />
                  </button>
                </div>
              </div>

              {/* Bottom row: search + create */}
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
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
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
            {viewMode === 'grid' && pagedCampaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pagedCampaigns.map(campaign => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    onNavigate={handleNavigate}
                    onManageForm={handleManageForm}
                  />
                ))}
              </div>
            )}

            {/* ────── Campaigns Table View ────── */}
            {viewMode === 'table' && pagedCampaigns.length > 0 && (
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chiến dịch</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bắt đầu</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kết thúc</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCampaigns.map(campaign => (
                        <CampaignTableRow
                          key={campaign.campaignId}
                          campaign={campaign}
                          onNavigate={handleNavigate}
                          onManageForm={handleManageForm}
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
                {searchQuery || activeTab !== 'all' ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Không tìm thấy chiến dịch</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    <button
                      onClick={() => { setActiveTab('all'); setSearchQuery(''); setCurrentPage(1); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <i className="fas fa-arrow-rotate-left text-xs" />
                      Xóa bộ lọc
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Chưa có chiến dịch tuyển dụng nào</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tạo chiến dịch tuyển dụng đầu tiên để bắt đầu</p>
                  </>
                )}
              </div>
            )}

            {/* ────── Pagination ────── */}
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </main>
    </div>
  );
}
