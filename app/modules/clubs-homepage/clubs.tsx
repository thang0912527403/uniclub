import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import ClubCard from './components/ClubCard';
import { useGetClubsQuery } from '~/cores/api';
import { ChevronLeft, ChevronRight, Search, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router';

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data, isFetching } = useGetClubsQuery({
    pageIndex: String(currentPage),
    searchQuery: searchQuery,
    pageSize: String(pageSize),
  });

  const clubs = data?.data ?? [];
  const totalPage = data?.totalPage ?? 1;

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
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Khám phá <span className="text-orange-500 italic">Câu lạc bộ</span>
          </h2>
          <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-6"></div>
          <p className="max-w-2xl mx-auto text-gray-500 font-medium">
            Nơi tổng hợp các câu lạc bộ trong hệ thống UNIC.
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
          {/* Search Input - Sát trái */}
          <div className="relative flex items-center w-full sm:w-96">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm câu lạc bộ..."
              className="w-full pl-4 pr-20 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />

            {/* Clear button */}
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-12 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {/* Search button */}
            <button
              onClick={triggerSearch}
              className="absolute right-2 p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Page Size Dropdown - Sát phải */}
          <div className="relative sm:ml-auto">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm shadow-sm hover:border-orange-400 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all whitespace-nowrap"
            >
              Hiển thị: <span className="text-orange-500">{pageSize}</span> club
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${pageSize === size
                          ? 'bg-orange-50 text-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                        }`}
                    >
                      {size} câu lạc bộ / trang
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Result count */}
        {searchQuery && (
          <p className="text-sm text-gray-400 font-medium mb-6">
            Tìm thấy <span className="text-orange-500 font-bold">{data?.totalCount ?? 0}</span> kết quả cho "{searchQuery}"
          </p>
        )}

        {/* Grid Posts */}
        {isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.map((club) => (
              <ClubCard key={club.clubId} club={club} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">
              {searchQuery ? 'Không tìm thấy câu lạc bộ phù hợp.' : 'Chưa có câu lạc bộ nào.'}
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

      <footer className="py-12 text-center text-gray-400 text-sm border-t border-gray-100 bg-white">
        © 2026 UniClubs News - Mọi thông tin thuộc bản quyền của các CLB UNIC.
      </footer>
    </div>
  );
};

export default NewsPage;