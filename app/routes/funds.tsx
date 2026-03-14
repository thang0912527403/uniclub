import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Cookies from 'js-cookie';
import {
  useGetClubsQuery,
  useGetFundsByClubQuery,
  useCreateFundMutation,
  useApproveFundMutation,
  useGetMyClubsForFundsQuery,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useNotification } from '~/components/Notification';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import type { ClubFund } from '~/cores/api';

function fundStatusLabel(f: ClubFund): string {
  const s = String(f.status ?? '').toUpperCase();
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return '—';
}

/** Quỹ đang chờ duyệt (so sánh không phân biệt hoa thường) */
function isPendingFund(f: ClubFund): boolean {
  return String(f.status ?? '').toUpperCase() === 'PENDING';
}

export default function FundsPage() {
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, clubManagerMembership, canApproveFund } = useClubRole();
  const { show: showNotification } = useNotification();

  const hasToken = !!Cookies.get('accessToken');
  const { data: clubs = [] } = useGetClubsQuery(undefined, { skip: !hasToken || !isAdmin });
  const { data: myClubsFromApi = [], isLoading: isLoadingMyClubs } = useGetMyClubsForFundsQuery(
    undefined,
    {
      skip: !hasToken || isAdmin,
    },
  );

  const effectiveClubId = clubManagerMembership?.clubId ?? myClubsFromApi?.[0]?.clubId ?? 0;
  const [selectedClubId, setSelectedClubId] = useState<number>(effectiveClubId);
  const clubId = isAdmin ? selectedClubId : selectedClubId || effectiveClubId;
  const hasAnyClub = isAdmin
    ? clubs.length > 0
    : effectiveClubId > 0 || myClubsFromApi.length > 0;

  const [showCreateFundForm, setShowCreateFundForm] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundDescription, setNewFundDescription] = useState('');

  const { data: funds = [] } = useGetFundsByClubQuery(clubId, { skip: !hasToken || clubId < 1 });
  const availableFunds = funds;

  useEffect(() => {
    if (!isAdmin && effectiveClubId > 0 && selectedClubId === 0) setSelectedClubId(effectiveClubId);
  }, [isAdmin, effectiveClubId, selectedClubId]);
  useEffect(() => {
    if (!isAdmin && myClubsFromApi.length > 0 && selectedClubId === 0)
      setSelectedClubId(myClubsFromApi[0].clubId);
  }, [isAdmin, myClubsFromApi, selectedClubId]);
  useEffect(() => {
    if (isAdmin && clubs.length > 0 && selectedClubId === 0) setSelectedClubId(clubs[0].clubId);
  }, [isAdmin, clubs, selectedClubId]);
  // Không tự chọn quỹ: user bấm vào quỹ trong danh sách mới xem chi tiết

  const [createFund, { isLoading: isCreatingFund }] = useCreateFundMutation();
  const [approveFund, { isLoading: isApprovingFund }] = useApproveFundMutation();

  const bgClass = isDark ? 'bg-[#0f1729]' : 'bg-slate-50';
  const cardClass = isDark ? 'bg-[#151827]' : 'bg-white';
  const textClass = isDark ? 'text-slate-50' : 'text-slate-900';
  const inputClass = isDark
    ? 'bg-[#0f1729] border-slate-600 text-slate-50 placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

  const handleCreateFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !newFundName.trim()) return;
    try {
      await createFund({
        clubId,
        fundName: newFundName.trim(),
        description: newFundDescription.trim() || undefined,
      }).unwrap();
      setShowCreateFundForm(false);
      setNewFundName('');
      setNewFundDescription('');
      showNotification({ type: 'success', title: 'Đã tạo quỹ', message: 'Quỹ đã được tạo. Nếu bạn là Vice Manager, quỹ sẽ chờ Manager duyệt.' });
    } catch (err: unknown) {
      console.error('Create fund failed:', err);
      const msg = (err as { data?: { message?: string } })?.data?.message ?? (err as Error)?.message ?? 'Không thể tạo quỹ.';
      showNotification({ type: 'error', title: 'Lỗi tạo quỹ', message: String(msg) });
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Quản lý quỹ câu lạc bộ"
        breadcrumb="Tài chính / Quản lý quỹ"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
        {showCreateFundForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div
                className={`${cardClass} rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl w-full overflow-hidden`}
              >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-r from-sky-500/10 to-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                      <i className="fas fa-wallet" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-semibold ${textClass}`}>Tạo quỹ mới</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Thiết lập quỹ tài chính cho câu lạc bộ đang chọn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateFundForm(false)}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={handleCreateFundSubmit} className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                        Tên quỹ
                      </label>
                      <input
                        type="text"
                        value={newFundName}
                        onChange={(e) => setNewFundName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500/70 ${inputClass}`}
                        placeholder="VD: Quỹ hoạt động thường niên"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                        Mô tả (tuỳ chọn)
                      </label>
                      <textarea
                        value={newFundDescription}
                        onChange={(e) => setNewFundDescription(e.target.value)}
                        rows={3}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500/70 ${inputClass}`}
                        placeholder="Mục đích sử dụng quỹ, quy định chi tiêu..."
                      />
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-end gap-3 pt-2 pb-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateFundForm(false)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border ${isDark
                        ? 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingFund || !clubId}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isCreatingFund && <i className="fas fa-spinner fa-spin text-xs" />}
                      {isCreatingFund ? 'Đang tạo...' : 'Tạo quỹ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${textClass}`}>
                Quản lý quỹ
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Theo dõi thu chi, duyệt yêu cầu rút quỹ và quản lý ngân sách minh bạch.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`${cardClass} border border-slate-200/70 dark:border-slate-700/70 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm`}>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                  <i className="fas fa-shield-alt" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-600 dark:text-slate-200">Phân quyền theo CLB</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {isAdmin ? 'Bạn đang xem với quyền quản trị.' : 'Bạn đang xem với quyền quản lý CLB.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardClass} border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-sm px-4 py-4 md:px-6 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Câu lạc bộ
                  </span>
                  <select
                    value={clubId}
                    onChange={(e) => setSelectedClubId(Number(e.target.value))}
                    className={`px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                  >
                    <option value={0}>-- Chọn CLB --</option>
                    {clubs.map((c) => (
                      <option key={c.clubId} value={c.clubId}>
                        {c.clubName} (ID: {c.clubId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {clubId > 0 && (
              <button
                onClick={() => setShowCreateFundForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-colors text-sm font-semibold shadow-md cursor-pointer"
              >
                <i className="fas fa-plus" />
                Tạo quỹ mới
              </button>
            )}
          </div>
        </div>

        <div className={`${cardClass} rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/70 overflow-hidden`}>
          {!hasToken ? (
            <div className="p-12 text-center">
              <i className="fas fa-lock text-6xl text-amber-500 dark:text-amber-400 mb-4" />
              <h3 className={`text-xl font-semibold mb-2 ${textClass}`}>
                Authentication required
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                Please log in to view fund history and manage requests.
              </p>
              <Link
                to="/auth/login"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : !isAdmin && isLoadingMyClubs ? (
            <div className="p-8 text-center">
              <div className="animate-pulse h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/3 mx-auto mb-4" />
              <p className={`text-sm ${textClass}`}>Đang tải danh sách câu lạc bộ...</p>
            </div>
          ) : !isAdmin && !isLoadingMyClubs && !hasAnyClub ? (
            <div className="p-12 text-center">
              <i className="fas fa-users text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                Bạn chưa được gán vào câu lạc bộ nào. Liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>
          ) : !clubId ? (
            <div className="p-12 text-center">
              <p className={`text-gray-500 ${textClass}`}>Chọn câu lạc bộ để xem danh sách quỹ.</p>
            </div>
          ) : availableFunds.length === 0 ? (
            <div className="px-6 py-10 flex items-center justify-center">
              <div className="max-w-md w-full text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg mb-5">
                  <i className="fas fa-wallet text-2xl" />
                </div>
                <p className={`text-base ${textClass} font-semibold mb-2`}>Câu lạc bộ này chưa có quỹ nào.</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Tạo quỹ đầu tiên để bắt đầu quản lý tài chính.
                </p>
                <button
                  onClick={() => setShowCreateFundForm(true)}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow-md hover:from-sky-600 hover:to-indigo-600 cursor-pointer"
                >
                  <i className="fas fa-plus" />
                  Tạo quỹ mới
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Bảng danh sách quỹ */}
              <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                <h2 className={`text-base font-semibold ${textClass}`}>Danh sách quỹ</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-slate-700/80' : 'bg-gray-100'}>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">Tên quỹ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">Số dư</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-200">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableFunds.map((f) => (
                      <tr
                        key={f.fundId}
                        className={`border-t ${isDark ? 'border-slate-600' : 'border-gray-200'} ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/funds/${f.fundId}`}
                            className={`font-medium ${textClass} hover:text-sky-600 dark:hover:text-sky-400`}
                          >
                            {f.fundName || `Quỹ #${f.fundId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              String(f.status ?? '').toUpperCase() === 'APPROVED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : String(f.status ?? '').toUpperCase() === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                            }`}
                          >
                            {fundStatusLabel(f)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {typeof f.balance === 'number' ? `${f.balance.toLocaleString('vi-VN')} ₫` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {isPendingFund(f) && canApproveFund && (
                              <>
                                <button
                                  type="button"
                                  disabled={isApprovingFund}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                      await approveFund({ fundId: f.fundId, action: 'APPROVE' }).unwrap();
                                      showNotification({ type: 'success', title: 'Đã duyệt quỹ', message: `${f.fundName || `Quỹ #${f.fundId}`} đã được duyệt.` });
                                    } catch (err) {
                                      console.error(err);
                                      showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể duyệt quỹ.' });
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  disabled={isApprovingFund}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                      await approveFund({ fundId: f.fundId, action: 'REJECT' }).unwrap();
                                      showNotification({ type: 'success', title: 'Đã từ chối quỹ', message: `${f.fundName || `Quỹ #${f.fundId}`} đã bị từ chối.` });
                                    } catch (err) {
                                      console.error(err);
                                      showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể từ chối quỹ.' });
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/90 text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            <Link
                              to={`/funds/${f.fundId}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500 text-white hover:bg-sky-600 inline-block"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
