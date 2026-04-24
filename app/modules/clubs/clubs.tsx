import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubsQuery, useToggleClubStatusMutation } from '~/cores/api';
import type { Club } from '~/cores/api';
import { useNotification } from '~/components/Notification';
interface ConfirmModalProps {
  club: Club;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmModal({ club, onConfirm, onCancel, isLoading }: ConfirmModalProps) {
  const willActivate = !club.isActive;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${willActivate ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <i className={`fas ${willActivate ? 'fa-check-circle text-green-600 dark:text-green-400' : 'fa-ban text-red-600 dark:text-red-400'} text-xl`}></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {willActivate ? 'Kích hoạt câu lạc bộ' : 'Vô hiệu hóa câu lạc bộ'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{club.clubName}</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {willActivate
            ? `Bạn có chắc muốn kích hoạt câu lạc bộ "${club.clubName}"? Câu lạc bộ sẽ hiển thị và hoạt động trở lại.`
            : `Bạn có chắc muốn vô hiệu hóa câu lạc bộ "${club.clubName}"? Câu lạc bộ sẽ bị tạm ngừng hoạt động.`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 cursor-pointer py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 cursor-pointer py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${willActivate
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading && <i className="fas fa-spinner fa-spin"></i>}
            {willActivate ? 'Kích hoạt' : 'Vô hiệu hóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubsModule() {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const PAGE_SIZE_OPTIONS = [6, 9, 12, 18];

  const [confirmClub, setConfirmClub] = useState<Club | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [pageIndex, setPageIndex] = useState('1');
  const [pageSize, setPageSize] = useState(6);

  const { show: showNotification } = useNotification();

  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setPageIndex('1'); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPageIndex('1'); }, [statusFilter, visibilityFilter, pageSize]);

  const { data: clubsData, isLoading, isFetching, error } = useGetClubsQuery({
    pageIndex,
    pageSize: String(pageSize),
    searchQuery: searchQuery || undefined,
    status: statusFilter || undefined,
  });

  const clubs = clubsData?.data ?? [];
  const totalPages = clubsData?.totalPage ?? 1;
  const totalCount = clubsData?.totalCount ?? 0;
  const currentPage = parseInt(pageIndex, 10);

  const [toggleStatus, { isLoading: isToggling }] = useToggleClubStatusMutation();

  const visibleClubs = useMemo(() => {
    if (!visibilityFilter) return clubs;
    return clubs.filter((c) =>
      visibilityFilter === 'public' ? c.isPublic : !c.isPublic
    );
  }, [clubs, visibilityFilter]);

  const handleToggleClick = (e: React.MouseEvent, club: Club) => {
    e.stopPropagation();
    setConfirmClub(club);
  };

  const handleConfirm = async () => {
    if (!confirmClub) return;
    try {
      await toggleStatus({ id: confirmClub.clubId, isActive: !confirmClub.isActive }).unwrap();
      showNotification({
        type: 'success',
        title: 'Thay đổi trạng thái thành công!',
        message: `Câu lạc bộ "${confirmClub.clubName}" đã được ${confirmClub.isActive ? 'vô hiệu hóa' : 'kích hoạt'} thành công.`,
        duration: 3000,
      });
    } catch (err) {
      const rtkErr = err as { status?: number; data?: { message?: string } };
      const errMsg = rtkErr?.data?.message ?? 'Vui lòng thử lại sau.';
      showNotification({
        type: 'error',
        title: 'Thay đổi trạng thái thất bại!',
        message: `Câu lạc bộ "${confirmClub.clubName}" không thể thay đổi trạng thái. ${errMsg}`,
        duration: 4000,
      });
    } finally {
      setConfirmClub(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Settings Button - Fixed bottom right */}
      <SettingButton />

      <Sidebar
        currentPath="/clubs"
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />

      <HeaderBar
        title="Quản lý Câu lạc bộ"
        breadcrumb="Pages / Clubs"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}>
        {/* Loading State */}
        {isLoading && (
          <Loading />
        )}

        {/* Error State */}
        {error && (
          <Error title="Lỗi khi tải danh sách câu lạc bộ." error={error} />
        )}

        {/* Stats Overview */}
        {!isLoading && clubsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[
                { label: 'Tổng CLB', value: totalCount, color: 'bg-blue-500', icon: 'fa-building' },
                { label: 'Tổng thành viên', value: clubs.reduce((s, c) => s + c.memberCount, 0), color: 'bg-green-500', icon: 'fa-user-friends' },
                { label: 'Hoạt động', value: clubs.filter(c => c.isActive).length, color: 'bg-purple-500', icon: 'fa-check-circle' },
                { label: 'Công khai', value: clubs.filter(c => c.isPublic).length, color: 'bg-orange-500', icon: 'fa-globe' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                      <i className={`fas ${icon} text-white text-xl`}></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{label}</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách CLB</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full font-medium">{totalCount}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Page size */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Hiển thị</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-xs text-gray-500">dòng</span>
                  </div>
                  {/* Status filter tabs */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                    {[
                      { value: '', label: 'Tất cả' },
                      { value: 'active', label: 'Hoạt động' },
                      { value: 'inactive', label: 'Không HĐ' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setStatusFilter(value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === value ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Visibility filter tabs */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                    {[
                      { value: '', label: 'Tất cả' },
                      { value: 'public', label: 'Công khai' },
                      { value: 'private', label: 'Riêng tư' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setVisibilityFilter(value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${visibilityFilter === value ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="text"
                      placeholder="Tìm tên CLB..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all w-full md:w-52 placeholder:text-gray-400"
                    />
                    {searchInput && (
                      <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        <i className="fas fa-times text-[10px]"></i>
                      </button>
                    )}
                  </div>

                  <button className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors cursor-pointer text-sm font-semibold whitespace-nowrap" onClick={() => navigate("/clubs/create")}>
                    <i className="fas fa-plus mr-2"></i>Tạo CLB mới
                  </button>
                </div>
              </div>
            </div>

            {/* Clubs Grid */}
            {isFetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse w-full" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleClubs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center text-gray-400">
                <i className="fas fa-building text-5xl mb-3 block opacity-20"></i>
                <p className="text-sm font-medium">Không tìm thấy câu lạc bộ nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleClubs.map((club) => (
                  <div
                    key={club.clubId}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/clubs/${club.clubId}`)}
                  >
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                      {club.coverImageUrl || club.logoUrl ? (
                        <img
                          src={club.coverImageUrl || club.logoUrl}
                          alt={club.clubName}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-building text-4xl text-white/20"></i>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${club.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                          {club.isActive ? 'Hoạt động' : 'Ngừng HĐ'}
                        </span>
                        {club.isPublic && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                            Công khai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-tight">
                          {club.clubName}
                        </h3>
                        {club.shortName && (
                          <span className="shrink-0 px-2 py-0.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
                            {club.shortName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
                        {club.description || 'Chưa có mô tả'}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <i className="fas fa-users text-xs"></i>
                          <span>{club.memberCount} thành viên</span>
                        </div>
                        <button
                          onClick={(e) => handleToggleClick(e, club)}
                          title={club.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          className="cursor-pointer relative inline-flex items-center w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none"
                          style={{ backgroundColor: club.isActive ? '#22c55e' : '#d1d5db' }}
                        >
                          <span
                            className="inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform duration-300"
                            style={{ transform: club.isActive ? 'translateX(1.25rem)' : 'translateX(0.2rem)' }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 py-4">
                <span className="text-xs text-gray-500">
                  Trang {currentPage}/{totalPages} · {totalCount} câu lạc bộ
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPageIndex(String(currentPage - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (currentPage <= 3) p = i + 1;
                    else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                    else p = currentPage - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPageIndex(String(p))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentPage === p ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPageIndex(String(currentPage + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Confirm Modal */}
      {confirmClub && (
        <ConfirmModal
          club={confirmClub}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmClub(null)}
          isLoading={isToggling}
        />
      )}
    </div>
  );
}

