import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Gavel, X } from 'lucide-react';
import {
  useGetFundByIdQuery,
  useGetFundHistoryQuery,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
  useApproveFundMutation,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useNotification } from '~/components/Notification';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import type { FundHistoryItem, ClubFund } from '~/cores/api';
import { fundTokens as t } from '../funds.design-tokens';

function fundStatusLabel(f: ClubFund): string {
  const s = String(f.status ?? '').toUpperCase();
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return '—';
}

function FundStatusBadge({ fund }: { fund: ClubFund }) {
  const s = String(fund.status ?? '').toUpperCase();
  if (s === 'APPROVED')
    return (
      <span className={t.status.approved}>
        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  if (s === 'REJECTED')
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-3 h-3 rounded-full bg-red-500" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-3 h-3 rounded-full bg-amber-500" aria-hidden />
      <span>{fundStatusLabel(fund)}</span>
    </span>
  );
}

function HistoryStatusBadge({ status }: { status: string }) {
  if (status === 'Approved')
    return (
      <span className={t.status.approved}>
        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" aria-hidden />
        <span>Đã duyệt</span>
      </span>
    );
  if (status === 'Rejected')
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-3 h-3 rounded-full bg-red-500" aria-hidden />
        <span>Từ chối</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-3 h-3 rounded-full bg-amber-500" aria-hidden />
      <span>Chờ duyệt</span>
    </span>
  );
}

export default function FundDetailPageByClub() {
  const { id: clubIdParam, fundId: fundIdParam } = useParams<{ id: string; fundId: string }>();
  const clubId = parseInt(clubIdParam ?? '0', 10);
  const fundId = parseInt(fundIdParam ?? '0', 10);

  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();
  const { canApproveFund } = useClubRole();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processTarget, setProcessTarget] = useState<FundHistoryItem | null>(null);
  const [processApproved, setProcessApproved] = useState(true);
  const [processNote, setProcessNote] = useState('');

  const [createAmount, setCreateAmount] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPurpose, setCreatePurpose] = useState('');
  const [createTransactionType, setCreateTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const isInvalidParams = !clubIdParam || !fundIdParam || isNaN(clubId) || isNaN(fundId) || clubId < 1 || fundId < 1;

  const { data: fund, isLoading: isLoadingFund, error: fundError } = useGetFundByIdQuery(
    { clubId, fundId },
    { skip: isInvalidParams }
  );
  const { data: history = [], isLoading: isLoadingHistory, error: historyError } = useGetFundHistoryQuery(
    { clubId, fundId, status: statusFilter || undefined },
    { skip: isInvalidParams }
  );

  const [createRequest, { isLoading: isCreating }] = useCreateFundRequestMutation();
  const [processRequest, { isLoading: isProcessing }] = useProcessFundRequestMutation();
  const [approveFund, { isLoading: isApprovingFund }] = useApproveFundMutation();

  const isFundApproved = fund && String(fund.status ?? '').toUpperCase() === 'APPROVED';
  const isFundPending = fund && String(fund.status ?? '').toUpperCase() === 'PENDING';
  const isUnauthorized =
    (fundError && 'status' in fundError && fundError.status === 401) ||
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
    if (!clubId || !fundId || isNaN(amount) || amount <= 0 || !createDescription.trim()) return;
    try {
      await createRequest({
        clubId,
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
    if (!processTarget || !clubId) return;
    try {
      await processRequest({
        clubId,
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

  if (isInvalidParams) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <p className={t.type.body}>Đường dẫn không hợp lệ.</p>
        <Link to="/funds" className={`${t.btn.secondary} !min-h-0 !py-2`}>Quay lại danh sách quỹ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title={fund ? (fund.fundName || `Quỹ #${fundId}`) : 'Chi tiết quỹ'}
        breadcrumb="Tài chính / Quản lý quỹ / Chi tiết"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <nav aria-label="Breadcrumb">
            <Link to="/funds" className={`inline-flex items-center gap-2 ${t.type.body} hover:underline focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded`}>
              <span aria-hidden className="text-base">←</span>
              Quay lại danh sách quỹ
            </Link>
          </nav>

          {isLoadingFund ? (
            <section className={`${t.card.base} p-12 text-center`} aria-busy="true" aria-live="polite">
              <p className={t.type.body}>Đang tải thông tin quỹ...</p>
            </section>
          ) : fundError || !fund ? (
            <section className={`${t.card.base} border-red-200 dark:border-red-800/70 p-6`} role="alert">
              <p className="text-red-600 dark:text-red-400">Không tải được thông tin quỹ.</p>
              <Link to="/funds" className={`mt-2 inline-block ${t.btn.secondary} !min-h-0 !py-2`}>Quay lại danh sách quỹ</Link>
            </section>
          ) : (
            <>
              {isFundPending && (
                <section className={`${t.card.base} overflow-hidden`} aria-labelledby="approval-heading">
                  <div className={`${t.space.card} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300" aria-hidden>
                        <Gavel className="w-5 h-5" aria-hidden />
                      </div>
                      <div>
                        <h2 id="approval-heading" className={t.type.sectionTitle}>Thao tác duyệt quỹ</h2>
                        <p className={`mt-0.5 ${t.type.body}`}>
                          {canApproveFund
                            ? 'Bạn có quyền duyệt quỹ này. Chọn Duyệt quỹ hoặc Từ chối quỹ bên dưới.'
                            : 'Quỹ này đang chờ Manager/Admin của câu lạc bộ duyệt.'}
                        </p>
                      </div>
                    </div>
                    {canApproveFund && (
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button
                          type="button"
                          disabled={isApprovingFund}
                          onClick={async () => {
                            try {
                              await approveFund({ clubId, fundId: fund.fundId, action: 'APPROVE' }).unwrap();
                              showNotification({ type: 'success', title: 'Đã duyệt quỹ', message: `${fund.fundName || `Quỹ #${fundId}`} đã được duyệt.` });
                            } catch (err) {
                              console.error(err);
                              showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể duyệt quỹ.' });
                            }
                          }}
                          className={`${t.btn.primary} inline-flex items-center gap-2`}
                        >
                          Duyệt quỹ
                        </button>
                        <button
                          type="button"
                          disabled={isApprovingFund}
                          onClick={async () => {
                            try {
                              await approveFund({ clubId, fundId: fund.fundId, action: 'REJECT' }).unwrap();
                              showNotification({ type: 'success', title: 'Đã từ chối quỹ', message: `${fund.fundName || `Quỹ #${fundId}`} đã bị từ chối.` });
                            } catch (err) {
                              console.error(err);
                              showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể từ chối quỹ.' });
                            }
                          }}
                          className={`${t.btn.danger} inline-flex items-center gap-2`}
                        >
                          Từ chối quỹ
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className={`${t.card.base} ${t.space.card}`} aria-labelledby="fund-info-heading">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 id="fund-info-heading" className={t.type.pageTitle}>{fund.fundName || `Quỹ #${fund.fundId}`}</h1>
                    <p className={`mt-1 ${t.type.muted}`}>{fund.description || 'Không có mô tả'}</p>
                    <div className="mt-3"><FundStatusBadge fund={fund} /></div>
                    {typeof fund.balance === 'number' && (
                      <p className={`mt-2 text-lg font-semibold ${textClass}`}>Số dư: {fund.balance.toLocaleString('vi-VN')} ₫</p>
                    )}
                  </div>
                  {isFundApproved && (
                    <button type="button" onClick={() => setShowCreateForm(true)} className={`${t.btn.primary} inline-flex items-center gap-2`}>
                      Tạo yêu cầu quỹ (THU/CHI)
                    </button>
                  )}
                </div>
              </section>

              {showCreateForm && (
                <section className={`${t.card.base} ${t.space.card}`} aria-labelledby="create-request-heading">
                  <h2 id="create-request-heading" className={`${t.type.sectionTitle} mb-4`}>Tạo yêu cầu thu/chi</h2>
                  <form onSubmit={handleCreateSubmit} className={`space-y-4 max-w-xl ${t.space.section}`}>
                    <div className={`grid grid-cols-1 md:grid-cols-4 ${t.space.grid}`}>
                      <div className="md:col-span-1">
                        <label htmlFor="create-amount" className={`block ${t.type.label} mb-1.5`}>Số tiền</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400" aria-hidden>VND</span>
                          <input id="create-amount" type="number" step="0.01" min="0" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} className={`${t.input} pl-11 ${inputClass}`} required />
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <label htmlFor="create-type" className={`block ${t.type.label} mb-1.5`}>Loại</label>
                        <select id="create-type" value={createTransactionType} onChange={(e) => setCreateTransactionType(e.target.value === 'INCOME' ? 'INCOME' : 'EXPENSE')} className={`${t.input} ${inputClass}`}>
                          <option value="INCOME">Thu</option>
                          <option value="EXPENSE">Chi</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label htmlFor="create-desc" className={`block ${t.type.label} mb-1.5`}>Nội dung</label>
                        <input id="create-desc" type="text" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} className={`${t.input} ${inputClass}`} required />
                      </div>
                      <div className="md:col-span-1">
                        <label htmlFor="create-purpose" className={`block ${t.type.label} mb-1.5`}>Mục đích (tuỳ chọn)</label>
                        <input id="create-purpose" type="text" value={createPurpose} onChange={(e) => setCreatePurpose(e.target.value)} className={`${t.input} ${inputClass}`} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={isCreating} className={t.btn.primary}>
                        {isCreating ? 'Đang gửi...' : 'Gửi yêu cầu'}
                      </button>
                      <button type="button" onClick={() => setShowCreateForm(false)} className={t.btn.secondary}>Hủy</button>
                    </div>
                  </form>
                </section>
              )}

              <section className={`${t.card.base} overflow-hidden`} aria-labelledby="history-heading">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="history-heading" className={t.type.sectionTitle}>Lịch sử giao dịch</h2>
                  <label htmlFor="history-filter" className="sr-only">Lọc theo trạng thái</label>
                  <select id="history-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${t.input} w-fit max-w-[180px] ${inputClass}`} aria-label="Lọc theo trạng thái">
                    <option value="">Tất cả</option>
                    <option value="Pending">Đang chờ</option>
                    <option value="Approved">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                </div>
                <div className="p-4">
                  {isLoadingHistory ? (
                    <div className={`py-8 text-center ${t.type.muted}`}>Đang tải lịch sử...</div>
                  ) : isUnauthorized ? (
                    <div className={`p-4 bg-slate-100 dark:bg-slate-800 rounded-xl ${t.type.body}`}>
                      Phiên đăng nhập hết hạn. <Link to="/auth/login" className="underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded">Đăng nhập lại</Link>
                    </div>
                  ) : historyError ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-200 text-sm" role="alert">Lỗi tải lịch sử.</div>
                  ) : history.length === 0 ? (
                    <p className={`${t.type.muted} py-4`}>Chưa có lịch sử giao dịch.</p>
                  ) : (
                    <div className="overflow-x-auto" role="region" aria-label="Bảng lịch sử giao dịch">
                      <table className="w-full min-w-[560px]">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">ID</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">Số tiền</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">Trạng thái</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">Mô tả</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">Ngày</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((item) => (
                            <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                              <td className={`px-4 py-2 ${t.type.body}`}>{item.id}</td>
                              <td className={`px-4 py-2 ${t.type.body}`}>{item.amount != null ? `${Number(item.amount).toLocaleString('vi-VN')} ₫` : '—'}</td>
                              <td className="px-4 py-2"><HistoryStatusBadge status={item.status ?? ''} /></td>
                              <td className={`px-4 py-2 ${t.type.body}`}>{item.description ?? '—'}</td>
                              <td className={`px-4 py-2 ${t.type.body}`}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-2">
                                {item.status === 'Pending' && (
                                  <button type="button" onClick={() => setProcessTarget(item)} className={`${t.btn.ghost} !min-h-0 !py-1 !px-2 text-xs`} aria-label={`Xử lý yêu cầu #${item.id}`}>
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
              </section>
            </>
          )}
        </div>
      </main>

      {processTarget && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="process-request-title">
          <div className={`${t.card.base} max-w-md w-full overflow-hidden`}>
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="process-request-title" className={t.type.sectionTitle}>Xử lý yêu cầu #{processTarget.id}</h2>
              <button type="button" onClick={() => { setProcessTarget(null); setProcessNote(''); }} className={t.btn.ghost} aria-label="Đóng">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <form onSubmit={handleProcessSubmit} className={`px-6 py-4 ${t.space.section}`}>
              <fieldset className="flex gap-4">
                <legend className="sr-only">Chọn duyệt hoặc từ chối</legend>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="process-action" checked={processApproved} onChange={() => setProcessApproved(true)} className="focus:ring-2 focus:ring-slate-500" />
                  <span className={textClass}>Duyệt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="process-action" checked={!processApproved} onChange={() => setProcessApproved(false)} className="focus:ring-2 focus:ring-slate-500" />
                  <span className={textClass}>Từ chối</span>
                </label>
              </fieldset>
              <div>
                <label htmlFor="process-note" className={`block ${t.type.label} mb-1.5`}>Ghi chú (tuỳ chọn)</label>
                <textarea id="process-note" value={processNote} onChange={(e) => setProcessNote(e.target.value)} rows={3} className={`${t.input} ${inputClass}`} placeholder="Lý do duyệt / từ chối..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isProcessing} className={processApproved ? t.btn.primary : t.btn.danger}>
                  {isProcessing ? 'Đang xử lý...' : (processApproved ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu')}
                </button>
                <button type="button" onClick={() => { setProcessTarget(null); setProcessNote(''); }} className={t.btn.secondary}>Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

