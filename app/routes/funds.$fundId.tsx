import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  useGetFundByIdQuery,
  useGetFundHistoryQuery,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useNotification } from '~/components/Notification';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import type { FundHistoryItem, ClubFund } from '~/cores/api';

function fundStatusLabel(f: ClubFund): string {
  const s = String(f.status ?? '').toUpperCase();
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return '—';
}

export default function FundDetailPage() {
  const { fundId: fundIdParam } = useParams<{ fundId: string }>();
  const fundId = parseInt(fundIdParam ?? '0', 10);
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processTarget, setProcessTarget] = useState<FundHistoryItem | null>(null);
  const [processApproved, setProcessApproved] = useState(true);
  const [processNote, setProcessNote] = useState('');

  const [createAmount, setCreateAmount] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPurpose, setCreatePurpose] = useState('');
  const [createTransactionType, setCreateTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const { data: fund, isLoading: isLoadingFund, error: fundError } = useGetFundByIdQuery(fundId, {
    skip: !fundId || isNaN(fundId),
  });
  const { data: history = [], isLoading: isLoadingHistory, error: historyError } = useGetFundHistoryQuery(
    { fundId, status: statusFilter || undefined },
    { skip: !fundId || isNaN(fundId) }
  );

  const [createRequest, { isLoading: isCreating }] = useCreateFundRequestMutation();
  const [processRequest, { isLoading: isProcessing }] = useProcessFundRequestMutation();

  const isFundApproved = fund && String(fund.status ?? '').toUpperCase() === 'APPROVED';
  const isUnauthorized = (fundError && 'status' in fundError && fundError.status === 401) ||
    (historyError && 'status' in historyError && historyError.status === 401);

  const bgClass = isDark ? 'bg-[#0f1729]' : 'bg-slate-50';
  const cardClass = isDark ? 'bg-[#151827]' : 'bg-white';
  const textClass = isDark ? 'text-slate-50' : 'text-slate-900';
  const inputClass = isDark
    ? 'bg-[#0f1729] border-slate-600 text-slate-50 placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

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
      showNotification({ type: 'success', title: 'Đã gửi yêu cầu', message: 'Yêu cầu thu/chi đã được gửi.' });
    } catch (err: unknown) {
      console.error('Create fund request failed:', err);
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        (err as { message?: string })?.message ||
        'Chỉ có thể tạo yêu cầu THU/CHI khi quỹ đã được duyệt.';
      showNotification({ type: 'error', title: 'Không thể tạo yêu cầu', message: msg });
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
      showNotification({ type: 'success', title: 'Đã xử lý', message: 'Yêu cầu đã được cập nhật.' });
    } catch (err) {
      console.error('Process fund request failed:', err);
      showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể xử lý yêu cầu.' });
    }
  };

  if (!fundIdParam || isNaN(fundId) || fundId < 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Mã quỹ không hợp lệ.</p>
        <Link to="/funds" className="ml-2 text-sky-500 hover:underline">Quay lại danh sách quỹ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} />
      <HeaderBar
        title={fund ? (fund.fundName || `Quỹ #${fundId}`) : 'Chi tiết quỹ'}
        breadcrumb="Tài chính / Quản lý quỹ / Chi tiết"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Nút quay lại */}
          <Link
            to="/funds"
            className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <i className="fas fa-arrow-left" />
            Quay lại danh sách quỹ
          </Link>

          {isLoadingFund ? (
            <div className={`${cardClass} rounded-2xl border border-slate-200/70 dark:border-slate-700/70 p-12 text-center`}>
              <i className="fas fa-spinner fa-spin text-4xl text-sky-500 mb-4" />
              <p className={textClass}>Đang tải thông tin quỹ...</p>
            </div>
          ) : fundError || !fund ? (
            <div className={`${cardClass} rounded-2xl border border-red-200/70 dark:border-red-800/70 p-6`}>
              <p className="text-red-600 dark:text-red-400">Không tải được thông tin quỹ.</p>
              <Link to="/funds" className="mt-2 inline-block text-sky-500 hover:underline">Quay lại danh sách quỹ</Link>
            </div>
          ) : (
            <>
              {/* Thông tin quỹ */}
              <div className={`${cardClass} rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/70 p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className={`text-xl font-bold ${textClass}`}>{fund.fundName || `Quỹ #${fund.fundId}`}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{fund.description || 'Không có mô tả'}</p>
                    <span
                      className={`inline-block mt-3 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        String(fund.status ?? '').toUpperCase() === 'APPROVED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : String(fund.status ?? '').toUpperCase() === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                      }`}
                    >
                      {fundStatusLabel(fund)}
                    </span>
                    {typeof fund.balance === 'number' && (
                      <p className={`mt-2 text-lg font-semibold ${textClass}`}>
                        Số dư: {fund.balance.toLocaleString('vi-VN')} ₫
                      </p>
                    )}
                  </div>
                  {isFundApproved && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 text-sm font-semibold cursor-pointer"
                    >
                      <i className="fas fa-plus" />
                      Tạo yêu cầu quỹ (THU/CHI)
                    </button>
                  )}
                </div>
              </div>

              {showCreateForm && (
                <div className={`${cardClass} border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-sm p-5`}>
                  <h2 className={`text-lg font-semibold ${textClass} mb-4`}>Tạo yêu cầu thu/chi</h2>
                  <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>Số tiền</label>
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
                        <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>Loại</label>
                        <select
                          value={createTransactionType}
                          onChange={(e) => setCreateTransactionType(e.target.value === 'INCOME' ? 'INCOME' : 'EXPENSE')}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                        >
                          <option value="INCOME">Thu</option>
                          <option value="EXPENSE">Chi</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>Nội dung</label>
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
                        <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${textClass}`}>Mục đích (tuỳ chọn)</label>
                        <input
                          type="text"
                          value={createPurpose}
                          onChange={(e) => setCreatePurpose(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 ${inputClass}`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 text-sm font-semibold cursor-pointer"
                      >
                        {isCreating && <i className="fas fa-spinner fa-spin text-xs" />}
                        {isCreating ? 'Đang gửi...' : 'Gửi yêu cầu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lịch sử giao dịch */}
              <div className={`${cardClass} rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/70 overflow-hidden`}>
                <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                  <h2 className={`text-base font-semibold ${textClass}`}>Lịch sử giao dịch</h2>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 w-fit ${inputClass}`}
                  >
                    <option value="">Tất cả</option>
                    <option value="Pending">Đang chờ</option>
                    <option value="Approved">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                </div>
                <div className="p-4">
                  {isLoadingHistory ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">Đang tải lịch sử...</div>
                  ) : isUnauthorized ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-200 text-sm">
                      Phiên đăng nhập hết hạn. <Link to="/auth/login" className="underline">Đăng nhập lại</Link>
                    </div>
                  ) : historyError ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-200 text-sm">Lỗi tải lịch sử.</div>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Chưa có lịch sử giao dịch.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={isDark ? 'bg-slate-700/80' : 'bg-gray-100'}>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">Số tiền</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">Trạng thái</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">Mô tả</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">Ngày</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((item) => (
                            <tr key={item.id} className={`border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                              <td className="px-4 py-2 text-sm">{item.id}</td>
                              <td className="px-4 py-2 text-sm">{item.amount != null ? `${Number(item.amount).toLocaleString('vi-VN')} ₫` : '—'}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
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
                              <td className="px-4 py-2 text-sm">{item.description ?? '—'}</td>
                              <td className="px-4 py-2 text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-2">
                                {item.status === 'Pending' && (
                                  <button
                                    type="button"
                                    onClick={() => setProcessTarget(item)}
                                    className="text-sky-500 hover:text-sky-600 text-xs font-medium cursor-pointer"
                                  >
                                    Xử lý
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
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal xử lý yêu cầu */}
      {processTarget && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-md w-full overflow-hidden`}>
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70">
              <h2 className={`text-lg font-semibold ${textClass}`}>Xử lý yêu cầu #{processTarget.id}</h2>
              <button type="button" onClick={() => { setProcessTarget(null); setProcessNote(''); }} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleProcessSubmit} className="px-6 py-4 space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={processApproved} onChange={() => setProcessApproved(true)} />
                  <span className={textClass}>Duyệt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!processApproved} onChange={() => setProcessApproved(false)} />
                  <span className={textClass}>Từ chối</span>
                </label>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${textClass}`}>Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  rows={3}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${inputClass}`}
                  placeholder="Lý do duyệt / từ chối..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${processApproved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-60 cursor-pointer`}
                >
                  {isProcessing && <i className="fas fa-spinner fa-spin text-xs" />}
                  {processApproved ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
                </button>
                <button
                  type="button"
                  onClick={() => { setProcessTarget(null); setProcessNote(''); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
