import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Cookies from 'js-cookie';
import {
  useGetClubsQuery,
  useGetFundsByClubQuery,
  useGetFundHistoryQuery,
  useCreateFundMutation,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
  useGetMyClubsForFundsQuery,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import type { FundHistoryItem } from '~/cores/api';

export default function FundsPage() {
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, clubManagerMembership } = useClubRole();

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

  const [fundId, setFundId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processTarget, setProcessTarget] = useState<FundHistoryItem | null>(null);
  const [processApproved, setProcessApproved] = useState(true);
  const [processNote, setProcessNote] = useState('');

  // Create fund form state
  const [showCreateFundForm, setShowCreateFundForm] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundDescription, setNewFundDescription] = useState('');

  // Create request form state
  const [createAmount, setCreateAmount] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPurpose, setCreatePurpose] = useState('');
  const [createTransactionType, setCreateTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const { data: funds = [] } = useGetFundsByClubQuery(clubId, { skip: !hasToken || clubId < 1 });
  const { data: history = [], isLoading, error } = useGetFundHistoryQuery(
    { fundId, status: statusFilter || undefined },
    { skip: !hasToken || !fundId || fundId < 1 }
  );
  const isUnauthorized = error && 'status' in error && error.status === 401;

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
  useEffect(() => {
    if (availableFunds.length > 0 && fundId === 0) setFundId(availableFunds[0].fundId);
  }, [availableFunds, fundId]);

  const [createRequest, { isLoading: isCreating }] = useCreateFundRequestMutation();
  const [processRequest, { isLoading: isProcessing }] = useProcessFundRequestMutation();
  const [createFund, { isLoading: isCreatingFund }] = useCreateFundMutation();

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
    } catch (err) {
      console.error('Create fund failed:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(createAmount);
    if (!fundId || isNaN(amount) || amount <= 0 || !createDescription.trim()) return;
    try {
      await createRequest({
        fundId,
        transactionType: createTransactionType,
        amount,
        description: createDescription.trim(),
        purpose: createPurpose.trim() || undefined,
      }).unwrap();
      setShowCreateForm(false);
      setCreateAmount('');
      setCreateDescription('');
      setCreatePurpose('');
      setCreateTransactionType('EXPENSE');
    } catch (err) {
      console.error('Create fund request failed:', err);
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processTarget) return;
    try {
      await processRequest({
        requestId: processTarget.id,
        approved: processApproved,
        note: processNote.trim() || undefined,
      }).unwrap();
      setProcessTarget(null);
      setProcessNote('');
    } catch (err) {
      console.error('Process fund request failed:', err);
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

          <div className={`${cardClass} border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-sm px-4 py-4 md:px-6 md:py-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4`}>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Câu lạc bộ
                  </span>
                  <select
                    value={clubId}
                    onChange={(e) => {
                      setSelectedClubId(Number(e.target.value));
                      setFundId(0);
                    }}
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
              <div className="flex flex-col gap-1 min-w-[200px]">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Quỹ
                </span>
                <select
                  value={fundId}
                  onChange={(e) => setFundId(Number(e.target.value))}
                  className={`px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                  disabled={!clubId || availableFunds.length === 0}
                >
                  <option value={0}>-- Chọn quỹ --</option>
                  {availableFunds.map((f) => (
                    <option key={f.fundId} value={f.fundId}>
                      {f.fundName || `Quỹ #${f.fundId}`} (ID: {f.fundId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Trạng thái
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                >
                  <option value="">Tất cả</option>
                  <option value="Pending">Đang chờ</option>
                  <option value="Approved">Đã duyệt</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-colors text-sm font-semibold shadow-md cursor-pointer"
              >
                <i className="fas fa-plus" />
                Tạo yêu cầu quỹ
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className={`${cardClass} border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-sm p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-lg font-semibold ${textClass}`}>
                  Tạo yêu cầu quỹ
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gửi yêu cầu thu/chi cho quỹ đang chọn. Ban quản lý sẽ xem xét và duyệt.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <i className="fas fa-file-invoice-dollar" />
              </div>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                    Số tiền
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">VND</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value)}
                      className={`w-full pl-11 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                    Loại giao dịch
                  </label>
                  <select
                    value={createTransactionType}
                    onChange={(e) =>
                      setCreateTransactionType(e.target.value === 'INCOME' ? 'INCOME' : 'EXPENSE')
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                  >
                    <option value="INCOME">Thu (INCOME)</option>
                    <option value="EXPENSE">Chi (EXPENSE)</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                    Nội dung
                  </label>
                  <input
                    type="text"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                    placeholder="VD: Thu tiền áo CLB"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                    Mục đích (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={createPurpose}
                    onChange={(e) => setCreatePurpose(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                    placeholder="Chi tiết mục đích sử dụng"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 text-sm font-semibold cursor-pointer"
                >
                  {isCreating && <i className="fas fa-spinner fa-spin text-xs" />}
                  {isCreating ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {processTarget && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-md w-full overflow-hidden`}>
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-r from-emerald-500/10 to-sky-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                    <i className="fas fa-check-double" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${textClass}`}>
                      Xử lý yêu cầu #{processTarget.id}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Xem xét và duyệt hoặc từ chối yêu cầu rút/thu quỹ này.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProcessTarget(null);
                    setProcessNote('');
                  }}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleProcessSubmit} className="px-6 py-4 space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={processApproved}
                      onChange={() => setProcessApproved(true)}
                    />
                    <span className={textClass}>Duyệt yêu cầu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!processApproved}
                      onChange={() => setProcessApproved(false)}
                    />
                    <span className={textClass}>Từ chối</span>
                  </label>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    value={processNote}
                    onChange={(e) => setProcessNote(e.target.value)}
                    rows={3}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${inputClass}`}
                    placeholder="Lý do duyệt / từ chối, ghi chú cho người tạo yêu cầu..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${processApproved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-60 cursor-pointer`}
                  >
                    {isProcessing && <i className="fas fa-spinner fa-spin text-xs" />}
                    {isProcessing ? 'Đang xử lý...' : processApproved ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProcessTarget(null);
                      setProcessNote('');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/3 mx-auto mb-4" />
              <div className="animate-pulse h-4 bg-gray-300 dark:bg-slate-600 rounded w-2/3 mx-auto" />
            </div>
          ) : isUnauthorized ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
              <h3 className="text-amber-800 dark:text-amber-200 font-semibold">
                Session expired or not logged in
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm mt-2 mb-4">
                Please log in again to view fund history.
              </p>
              <Link
                to="/auth/login"
                className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
              >
                Log in again
              </Link>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <h3 className="text-red-800 dark:text-red-200 font-semibold">
                Error loading fund history
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm mt-2">
                {((error as any)?.status ? `Error ${(error as any).status}` : 'Request failed')}
              </p>
            </div>
          ) : !isAdmin && !isLoadingMyClubs && !hasAnyClub ? (
            <div className="p-12 text-center">
              <i className="fas fa-users text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                Bạn chưa được gán vào câu lạc bộ nào. Liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>
          ) : !fundId || availableFunds.length === 0 ? (
            <div className="px-6 py-10 flex items-center justify-center">
              <div className="max-w-md w-full text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg mb-5">
                  <i className="fas fa-wallet text-2xl" />
                </div>
                <p className={`text-base ${textClass} font-semibold mb-2`}>
                  {clubId ? 'Câu lạc bộ này chưa có quỹ nào.' : 'Chọn câu lạc bộ để xem quỹ.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Quỹ giúp theo dõi thu chi minh bạch cho từng câu lạc bộ. Hãy tạo quỹ đầu tiên để bắt đầu quản lý tài chính.
                </p>
                {clubId > 0 && (
                  <button
                    onClick={() => setShowCreateFundForm(true)}
                    className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow-md hover:from-sky-600 hover:to-indigo-600 cursor-pointer"
                  >
                    <i className="fas fa-plus" />
                    Tạo quỹ mới
                  </button>
                )}
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-history text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                Chưa có lịch sử giao dịch. Tạo yêu cầu mới hoặc chọn quỹ khác.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-slate-700' : 'bg-gray-100'}>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}
                    >
                      <td className="px-4 py-3 text-sm">{item.id}</td>
                      <td className="px-4 py-3 text-sm">{item.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : item.status === 'Rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.description ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'Pending' && (
                          <button
                            onClick={() => setProcessTarget(item)}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                          >
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
