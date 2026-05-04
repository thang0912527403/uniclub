import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../../components/Navbar';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';
import type { RecruitmentCampaign } from '~/cores/api';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  X,
  Calendar,
  Clock,
  Megaphone,
  Sparkles,
  Filter,
} from 'lucide-react';
import Footer from '../home/components/Footer';

/* ── Helpers ─────────────────────────────────── */
function daysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type StatusFilter = 'all' | 'open' | 'close';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Tất cả',
  open: 'Đang mở',
  close: 'Đã đóng'
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500 text-white',
  active: 'bg-green-500 text-white',
  close: 'bg-gray-400 text-white',
  closed: 'bg-gray-400 text-white',
  draft: 'bg-yellow-500 text-white',
};

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

/* ── Campaign Card ───────────────────────────── */
function CampaignCard({ campaign }: { campaign: RecruitmentCampaign }) {
  const statusKey = campaign.status?.toLowerCase();
  const isOpen = statusKey === 'open' || statusKey === 'active';
  const remaining = daysLeft(campaign.endDate);

  return (
    <Link
      to={`/campaign/${campaign.campaignId}`}
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-rose-500 flex items-center justify-center">
            <Megaphone size={56} className="text-white/30" strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${STATUS_COLORS[statusKey] ?? 'bg-gray-500 text-white'}`}>
            {isOpen && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            {isOpen ? 'Đang mở' : statusKey === 'draft' ? 'Nháp' : 'Đã đóng'}
          </span>

          {isOpen && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${remaining <= 3 ? 'bg-red-500/90 text-white' : remaining <= 7 ? 'bg-amber-500/90 text-white' : 'bg-black/40 text-white'
              }`}>
              <Clock size={9} />
              {remaining === 0 ? 'Hôm nay' : `Còn ${remaining} ngày`}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <p className="text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1.5">
          Tuyển thành viên
        </p>

        <h3 className="font-extrabold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors duration-200 mb-3">
          {campaign.campaignName}
        </h3>

        {campaign.description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
            {campaign.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <Calendar size={12} className="text-orange-400" />
            <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
          </div>

          <span className="text-orange-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
            Chi tiết <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton Card ───────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 overflow-hidden">
      <div className="h-52 bg-gray-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-100 rounded-full w-24 animate-pulse" />
        <div className="h-5 bg-gray-100 rounded-xl w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-50 rounded-lg w-full animate-pulse" />
        <div className="h-3 bg-gray-50 rounded-lg w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════ */
const RecruitmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allCampaigns = [], isLoading, isFetching } = useGetRecruitmentCampaignsQuery();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* ── Client-side filter & search ──────────── */
  const filtered = useMemo(() => {
    let list = allCampaigns;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(c => {
        const s = c.status?.toLowerCase();
        if (statusFilter === 'open') return s === 'open' || s === 'active';
        if (statusFilter === 'close') return s === 'close' || s === 'closed';
        return s === statusFilter;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.campaignName?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allCampaigns, statusFilter, searchQuery]);

  /* ── Pagination ────────────────────────────── */
  const totalPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const triggerSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') triggerSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPage <= 7) return Array.from({ length: totalPage }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPage - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPage - 2) pages.push('...');
    pages.push(totalPage);
    return pages;
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <Navbar />

      {/* Hero Header */}
      <div className="pt-32 pb-16 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={16} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
              Recruitment Campaigns
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Chiến dịch <span className="text-orange-500 italic">Tuyển dụng</span>
          </h2>
          <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-6"></div>
          <p className="max-w-2xl mx-auto text-gray-500 font-medium">
            Khám phá các chiến dịch tuyển thành viên từ các câu lạc bộ. Nộp hồ sơ trước khi hết hạn!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold mb-8 transition-colors group"
        >
          <div className="p-2 rounded-full group-hover:bg-orange-50">
            <ChevronLeft size={20} />
          </div>
          Quay lại
        </button>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:justify-between">
          {/* Search Input */}
          <div className="relative flex items-center w-full sm:w-96">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm chiến dịch..."
              className="w-full pl-4 pr-20 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />

            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-12 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            )}

            <button
              onClick={triggerSearch}
              className="absolute right-2 p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-3 sm:ml-auto">
            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border bg-white font-semibold text-sm shadow-sm hover:border-orange-400 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all whitespace-nowrap ${statusFilter !== 'all' ? 'border-orange-400 text-orange-500' : 'border-gray-200 text-gray-600'
                  }`}
              >
                <Filter size={14} />
                {STATUS_LABELS[statusFilter]}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(key => (
                      <button
                        key={key}
                        onClick={() => handleStatusFilter(key)}
                        className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${statusFilter === key
                          ? 'bg-orange-50 text-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                          }`}
                      >
                        {STATUS_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Page Size Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm shadow-sm hover:border-orange-400 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all whitespace-nowrap"
              >
                Hiển thị: <span className="text-orange-500">{pageSize}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <button
                        key={size}
                        onClick={() => handlePageSizeChange(size)}
                        className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${pageSize === size
                          ? 'bg-orange-50 text-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                          }`}
                      >
                        {size} chiến dịch / trang
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Result count */}
        {searchQuery && (
          <p className="text-sm text-gray-400 font-medium mb-6">
            Tìm thấy <span className="text-orange-500 font-bold">{filtered.length}</span> kết quả cho "{searchQuery}"
          </p>
        )}

        {/* Grid */}
        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map(c => (
              <CampaignCard key={c.campaignId} campaign={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">
              {searchQuery || statusFilter !== 'all'
                ? 'Không tìm thấy chiến dịch phù hợp.'
                : 'Chưa có chiến dịch tuyển dụng nào.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-orange-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="w-10 text-center text-gray-400 font-medium select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    disabled={isFetching}
                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 ${currentPage === page
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200 scale-110'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500'
                      }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPage || isFetching}
                className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-orange-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <p className="text-gray-400 text-sm">
              Trang {currentPage} / {totalPage}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default RecruitmentPage;
