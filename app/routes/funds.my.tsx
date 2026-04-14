import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Cookies from 'js-cookie';
import { ArrowRight, Banknote, ChevronLeft, ChevronRight, HandCoins, Loader2, Lock, Plus, Search, Users } from 'lucide-react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useFundsClubSelection } from '~/hooks/useFundsClubSelection';
import {
  useGetClubFundTransactionsQuery,
  useGetFundCapabilitiesQuery,
  useGetMyFundsQuery,
  type FundHistoryItem,
} from '~/cores/api';
import type { ClubFund, FundListSort, FundListStatus } from '~/cores/api';
import { MemberRefundPanel } from '~/modules/funds/components/refunds/FundsRefundSection';
import { getFundTransactionId } from '~/modules/funds/utils/refundTransactions';
import { fundTransactionPaymentProviderLabel } from '~/modules/funds/utils/fundTransactionPaymentProvider';
import { fundTokens as t } from './funds.design-tokens';
import {
  FinanceAccessHintBanner,
  FundCardBalanceHint,
  FundRejectionReasonCallout,
} from '~/modules/funds/components/FundUxHints';
import {
  applyFilterChangeParams,
  applyMyFundsTabChangeParams,
  DEFAULT_FUND_PAGE_SIZE,
  DEFAULT_FUND_SORT,
  DEFAULT_FUND_STATUS,
  parseFundSort,
  parseFundStatus,
  parseMyFundsScopeTab,
  type MyFundsScopeTab,
} from './funds.utils';

function parsePage(v: string | null): number {
  const n = parseInt(v ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parsePageSize(v: string | null): number {
  const n = parseInt(v ?? String(DEFAULT_FUND_PAGE_SIZE), 10);
  if (!Number.isFinite(n) || n < 1 || n > 100) return DEFAULT_FUND_PAGE_SIZE;
  return n;
}

function fundListBalanceVnd(f: ClubFund): number {
  if (typeof f.currentBalance === 'number' && Number.isFinite(f.currentBalance)) return f.currentBalance;
  if (typeof f.balance === 'number' && Number.isFinite(f.balance)) return f.balance;
  return 0;
}

function fundStatusLabel(f: ClubFund): string {
  const s = String(f.status ?? '').toUpperCase();
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return '—';
}

function FundStatusBadge({ fund }: { fund: ClubFund }) {
  const s = String(fund.status ?? '').toUpperCase();
  if (s === 'APPROVED') {
    return (
      <span className={t.status.approved}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  }
  if (s === 'REJECTED') {
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  }
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
      <span>{fundStatusLabel(fund)}</span>
    </span>
  );
}

const STATUS_OPTIONS: Array<{ value: FundListStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const SORT_OPTIONS: Array<{ value: FundListSort; label: string }> = [
  { value: 'NEWEST', label: 'Mới nhất' },
  { value: 'OLDEST', label: 'Cũ nhất' },
  { value: 'NAME_ASC', label: 'Tên A-Z' },
  { value: 'NAME_DESC', label: 'Tên Z-A' },
];

const SEARCH_DEBOUNCE_MS = 300;
const USE_MOCK_MY_FUNDS = String(import.meta.env.VITE_MOCK_MY_FUNDS ?? '').toLowerCase() === 'true';

const MY_FUNDS_TAB_META: Array<{
  id: MyFundsScopeTab;
  label: string;
  description: string;
}> = [
  {
    id: 'created',
    label: 'Đã tạo',
    description: 'Quỹ do bạn khởi tạo trong CLB đang chọn.',
  },
  {
    id: 'responsible',
    label: 'Phụ trách',
    description: 'Quỹ mà bạn được gán phụ trách trong CLB đang chọn.',
  },
  {
    id: 'contributions',
    label: 'Đã nộp & giao dịch',
    description: 'Giao dịch quỹ gắn với tài khoản của bạn trong CLB đang chọn: nộp tiền, hoàn, v.v.',
  },
  {
    id: 'refunds',
    label: 'Hoàn tiền',
    description: 'Gửi yêu cầu hoàn tiền nộp quỹ và theo dõi trạng thái yêu cầu của bạn trong CLB đang chọn.',
  },
];

function txRecord(item: FundHistoryItem): Record<string, unknown> {
  return item as FundHistoryItem & Record<string, unknown>;
}

function txTypeLabel(item: FundHistoryItem): string {
  const raw = String(txRecord(item).transactionType ?? txRecord(item).TransactionType ?? '').toUpperCase();
  if (raw === 'INCOME') return 'Thu';
  if (raw === 'EXPENSE') return 'Chi';
  return raw || '—';
}

function txStatusLabelVi(status: string): string {
  const u = String(status ?? '').toUpperCase();
  if (u === 'PENDING') return 'Chờ xử lý';
  if (u === 'APPROVED' || u === 'PAID' || u === 'COMPLETED' || u === 'SUCCESS' || u === 'CONFIRMED') return 'Đã xác nhận';
  if (u === 'REJECTED' || u === 'CANCELLED' || u === 'CANCELED') return 'Từ chối / hủy';
  return status?.trim() || '—';
}

function formatTxWhen(item: FundHistoryItem): string {
  const r = txRecord(item);
  const iso = String(
    r.transactionDate ?? r.TransactionDate ?? r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt ?? '',
  ).trim();
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function MyFundsPage() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const hasToken = !!Cookies.get('accessToken');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const pageSize = parsePageSize(searchParams.get('pageSize'));
  const status = parseFundStatus(searchParams.get('status'));
  const sort = parseFundSort(searchParams.get('sort'));
  const search = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const scopeTab = parseMyFundsScopeTab(searchParams.get('tab'));
  const isFundScopeTab = scopeTab === 'created' || scopeTab === 'responsible';
  const mineType = scopeTab === 'responsible' ? 'RESPONSIBLE' : 'CREATED';

  const { clubId, setSelectedClubId, memberClubOptions, clubs, isAdmin, hasAnyClub, isLoadingUserMemberships } =
    useFundsClubSelection();

  const { data: caps, isLoading: capsLoading, isError: capsIsError, error: capsError } = useGetFundCapabilitiesQuery(clubId, {
    skip: !hasToken || clubId < 1,
  });
  const capsErrorStatus =
    capsError && typeof capsError === 'object' && 'status' in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;
  const capsOtherError = capsIsError && capsErrorStatus !== 403;
  const canViewFunds = caps?.canViewFunds ?? false;

  const skipQuery =
    !hasToken ||
    clubId < 1 ||
    capsLoading ||
    capsForbidden ||
    capsOtherError ||
    (caps !== undefined && !canViewFunds);

  const {
    data: myFundsPaged,
    isLoading: isLoadingMyFunds,
    error: myFundsError,
    isFetching: isFetchingMyFunds,
  } = useGetMyFundsQuery(
    {
      clubId,
      mineType,
      status,
      search,
      sort,
      page,
      pageSize,
    },
    { skip: skipQuery || !isFundScopeTab },
  );

  const {
    data: myTxPaged,
    isLoading: isLoadingMyTx,
    error: myTxError,
    isFetching: isFetchingMyTx,
  } = useGetClubFundTransactionsQuery(
    {
      clubId,
      page,
      pageSize,
      scope: 'mine',
    },
    { skip: skipQuery || scopeTab !== 'contributions' },
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const normalized = searchInput.trim();
    const current = search.trim();
    if (normalized === current) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => applyFilterChangeParams(prev, { search: normalized, pageSize }),
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search, pageSize, setSearchParams]);

  const errorStatus =
    myFundsError && typeof myFundsError === 'object' && 'status' in myFundsError
      ? (myFundsError as { status: number }).status
      : undefined;
  const apiErrorMessage =
    myFundsError && typeof myFundsError === 'object' && 'data' in myFundsError
      ? (myFundsError as { data?: { message?: string } }).data?.message
      : undefined;

  const txErrorStatus =
    myTxError && typeof myTxError === 'object' && 'status' in myTxError
      ? (myTxError as { status: number }).status
      : undefined;
  const txApiErrorMessage =
    myTxError && typeof myTxError === 'object' && 'data' in myTxError
      ? (myTxError as { data?: { message?: string } }).data?.message
      : undefined;

  const items = myFundsPaged?.items ?? [];
  const totalCount = myFundsPaged?.totalCount ?? 0;
  const txItems = myTxPaged?.items ?? [];
  const txTotalCount = myTxPaged?.totalCount ?? 0;
  const hasAnyFilter =
    isFundScopeTab &&
    (status !== DEFAULT_FUND_STATUS || sort !== DEFAULT_FUND_SORT || !!search.trim());

  const pageLabel = useMemo(() => {
    if (scopeTab === 'contributions') {
      if (!myTxPaged) return '';
      return `Trang ${myTxPaged.pageNumber}${myTxPaged.totalPages > 0 ? ` / ${myTxPaged.totalPages}` : ''}`;
    }
    if (!myFundsPaged) return '';
    return `Trang ${myFundsPaged.pageNumber}${myFundsPaged.totalPages > 0 ? ` / ${myFundsPaged.totalPages}` : ''}`;
  }, [myFundsPaged, myTxPaged, scopeTab]);

  const scopeDescription = MY_FUNDS_TAB_META.find((x) => x.id === scopeTab)?.description ?? '';

  const setScopeTab = (next: MyFundsScopeTab) => {
    setSearchParams((prev) => applyMyFundsTabChangeParams(prev, next, pageSize), { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds/my" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Quỹ của tôi"
        breadcrumb="Tài chính / Quản lý quỹ / Quỹ của tôi"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 bg-slate-50 dark:bg-[#0F172A] transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {!capsLoading && caps?.financeAccessHintVi?.trim() ? (
            <FinanceAccessHintBanner message={caps.financeAccessHintVi} />
          ) : null}
          {isFundScopeTab && myFundsPaged?.usedMyFundsFallback ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              <strong className="font-semibold">Dữ liệu thay thế.</strong> Không gọi được API &quot;quỹ của tôi&quot; cho CLB này
              . Danh sách đang lấy từ tất cả quỹ CLB và lọc tạm — có thể không khớp hoàn toàn với quỹ
              thực sự của bạn. Khi backend sẵn sàng, thông báo này sẽ biến mất.
            </div>
          ) : null}
          <header className="flex flex-col gap-2">
            <h1 className={t.type.pageTitle}>Quỹ của tôi</h1>
            <p className={t.type.body}>{scopeDescription}</p>
            {USE_MOCK_MY_FUNDS ? (
              <p className={`text-xs ${t.type.muted}`}>Đang chạy mock adapter cho `/funds/my` (VITE_MOCK_MY_FUNDS=true).</p>
            ) : null}
          </header>

          <div
            className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 p-1.5"
            role="tablist"
            aria-label="Phạm vi quỹ của tôi"
          >
            {MY_FUNDS_TAB_META.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={scopeTab === tab.id}
                id={`my-funds-tab-${tab.id}`}
                className={`flex-1 min-w-[120px] sm:flex-none rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  scopeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                }`}
                onClick={() => setScopeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`${t.card.base} ${t.space.card} flex flex-wrap items-end justify-between gap-4 border-slate-200 dark:border-slate-600`}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 min-w-[240px]">
                <label htmlFor="club-select-my-funds" className={t.type.label}>Câu lạc bộ</label>
                <select
                  id="club-select-my-funds"
                  value={clubId}
                  onChange={(e) => setSelectedClubId(Number(e.target.value))}
                  className={`${t.input} h-11`}
                  disabled={!hasToken || (isAdmin ? clubs.length === 0 : memberClubOptions.length === 0)}
                >
                  <option value={0}>-- Chọn CLB --</option>
                  {isAdmin
                    ? clubs.map((c) => (
                      <option key={c.clubId} value={c.clubId}>
                        {c.clubName} (ID: {c.clubId})
                      </option>
                    ))
                    : memberClubOptions.map((c) => (
                      <option
                        key={c.clubId}
                        value={c.clubId}
                        title={c.roleName ? `Vai trò của bạn trong CLB này: ${c.roleName}` : undefined}
                      >
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>

              {isFundScopeTab ? (
              <div className="flex flex-col gap-1 min-w-[220px]">
                <label htmlFor="my-funds-search" className={t.type.label}>Tìm theo tên quỹ</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                  <input
                    id="my-funds-search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className={`${t.input} h-11 pl-9`}
                    placeholder="Nhập tên quỹ..."
                  />
                </div>
              </div>
              ) : null}

              {isFundScopeTab ? (
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label htmlFor="my-funds-status" className={t.type.label}>Trạng thái</label>
                <select
                  id="my-funds-status"
                  value={status}
                  className={t.input}
                  onChange={(e) =>
                    setSearchParams(
                      (prev) => applyFilterChangeParams(prev, { status: parseFundStatus(e.target.value), pageSize }),
                      { replace: true },
                    )}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              ) : null}

              {isFundScopeTab ? (
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label htmlFor="my-funds-sort" className={t.type.label}>Sắp xếp</label>
                <select
                  id="my-funds-sort"
                  value={sort}
                  className={t.input}
                  onChange={(e) =>
                    setSearchParams(
                      (prev) => applyFilterChangeParams(prev, { sort: parseFundSort(e.target.value), pageSize }),
                      { replace: true },
                    )}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              ) : null}
            </div>

            {isFundScopeTab ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams(
                    (prev) =>
                      applyFilterChangeParams(prev, {
                        status: DEFAULT_FUND_STATUS,
                        sort: DEFAULT_FUND_SORT,
                        search: '',
                        pageSize,
                      }),
                    { replace: true },
                  );
                }}
                className={t.btn.secondary}
                disabled={!hasAnyFilter}
              >
                Xóa bộ lọc
              </button>
            ) : null}
          </div>

          <section
            className={`${t.card.base} overflow-hidden border-slate-200 dark:border-slate-600`}
            role="tabpanel"
            aria-labelledby={`my-funds-tab-${scopeTab}`}
          >
            {!hasToken ? (
              <div className="p-12 text-center">
                <Lock className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden />
                <p className={t.type.body}>Đăng nhập để xem quỹ của bạn.</p>
              </div>
            ) : !isAdmin && !hasAnyClub ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden />
                <p className={t.type.body}>
                  {isLoadingUserMemberships
                    ? 'Đang tải danh sách CLB...'
                    : 'Bạn chưa thuộc CLB nào để xem quỹ liên quan.'}
                </p>
              </div>
            ) : !clubId ? (
              <div className="p-12 text-center">
                <p className={t.type.body}>Chọn câu lạc bộ để tiếp tục.</p>
              </div>
            ) : capsLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" aria-hidden />
                <p className={t.type.body}>Đang kiểm tra quyền...</p>
              </div>
            ) : capsForbidden ? (
              <div className="p-10 text-center">
                <p className="text-amber-700 dark:text-amber-300">Bạn không có quyền xem quỹ của CLB này.</p>
              </div>
            ) : capsOtherError ? (
              <div className="p-10 text-center">
                <p className="text-red-600 dark:text-red-400">Không tải được quyền quỹ. Vui lòng thử lại.</p>
              </div>
            ) : scopeTab === 'refunds' ? (
              <div className="p-4 md:p-6">
                <MemberRefundPanel clubId={clubId} skip={skipQuery} caps={caps} isAdmin={isAdmin} />
              </div>
            ) : (isFundScopeTab ? myFundsError : myTxError) ? (
              <div className="p-10 text-center" role="alert">
                <p className="text-red-600 dark:text-red-400">
                  {isFundScopeTab
                    ? (errorStatus === 400 || errorStatus === 403) && apiErrorMessage
                      ? apiErrorMessage
                      : apiErrorMessage || 'Không tải được danh sách quỹ của bạn.'
                    : (txErrorStatus === 400 || txErrorStatus === 403) && txApiErrorMessage
                      ? txApiErrorMessage
                      : txApiErrorMessage || 'Không tải được giao dịch của bạn.'}
                </p>
              </div>
            ) : (isFundScopeTab ? isLoadingMyFunds : isLoadingMyTx) ? (
              <div className="p-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" aria-hidden />
                <p className={t.type.body}>
                  {isFundScopeTab ? 'Đang tải danh sách quỹ...' : 'Đang tải giao dịch của bạn...'}
                </p>
              </div>
            ) : isFundScopeTab && items.length === 0 ? (
              <div className="p-12 text-center">
                <p className={`${t.type.sectionTitle} mb-2`}>Không có quỹ phù hợp</p>
                <p className={t.type.body}>
                  {hasAnyFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Không có quỹ trong phạm vi này cho CLB đang chọn.'}
                </p>
              </div>
            ) : scopeTab === 'contributions' && txItems.length === 0 ? (
              <div className="p-12 text-center">
                <HandCoins className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden />
                <p className={`${t.type.sectionTitle} mb-2`}>Chưa có giao dịch</p>
                <p className={t.type.body}>
                  Chưa có dòng giao dịch quỹ nào được ghi nhận cho tài khoản của bạn trong CLB này (hoặc bạn chưa có quyền
                  xem lịch sử).
                </p>
              </div>
            ) : scopeTab === 'contributions' ? (
              <>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={t.type.sectionTitle}>Giao dịch quỹ của tôi</h2>
                  <p className={`text-sm ${t.type.muted}`}>
                    Tổng {txTotalCount.toLocaleString('vi-VN')} dòng · {pageLabel}
                    {isFetchingMyTx ? ' · Đang cập nhật...' : ''}
                  </p>
                </div>
                <div className="p-4 md:p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[820px]">
                    <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                      <tr>
                        <th className="pb-2 pr-3 font-medium">Thời gian</th>
                        <th className="pb-2 pr-3 font-medium">Quỹ</th>
                        <th className="pb-2 pr-3 font-medium">Loại</th>
                        <th className="pb-2 pr-3 font-medium text-right">Số tiền (₫)</th>
                        <th className="pb-2 pr-3 font-medium">Trạng thái</th>
                        <th className="pb-2 pr-3 font-medium">Cổng TT</th>
                        <th className="pb-2 font-medium w-[100px]"> </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                      {txItems.map((row) => {
                        const tid = getFundTransactionId(row);
                        return (
                          <tr key={`${tid}-${row.fundId}`} className="text-slate-900 dark:text-slate-100">
                            <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                              {formatTxWhen(row)}
                            </td>
                            <td className="py-2.5 pr-3">{row.fundName?.trim() || `Quỹ #${row.fundId}`}</td>
                            <td className="py-2.5 pr-3">{txTypeLabel(row)}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums font-medium">
                              {Number(row.amount).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-2.5 pr-3">{txStatusLabelVi(row.status)}</td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {fundTransactionPaymentProviderLabel(row) || '—'}
                            </td>
                            <td className="py-2.5">
                              <Link
                                to={`/clubs/${clubId}/funds/${row.fundId}`}
                                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium hover:underline text-xs"
                              >
                                Chi tiết
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {myTxPaged && (myTxPaged.hasPreviousPage || myTxPaged.hasNextPage || myTxPaged.totalPages > 1) ? (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${t.type.muted}`}>
                      Hiển thị {txItems.length.toLocaleString('vi-VN')} / {txTotalCount.toLocaleString('vi-VN')} giao dịch
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!myTxPaged.hasPreviousPage}
                        onClick={() =>
                          setSearchParams(
                            (prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(Math.max(1, page - 1)));
                              return next;
                            },
                            { replace: true },
                          )}
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={!myTxPaged.hasNextPage}
                        onClick={() =>
                          setSearchParams(
                            (prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(page + 1));
                              return next;
                            },
                            { replace: true },
                          )}
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        Sau
                        <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : isFundScopeTab ? (
              <>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={t.type.sectionTitle}>
                    {scopeTab === 'responsible' ? 'Quỹ tôi phụ trách' : 'Quỹ tôi đã tạo'}
                  </h2>
                  <p className={`text-sm ${t.type.muted}`}>
                    Tổng {totalCount.toLocaleString('vi-VN')} quỹ · {pageLabel}
                    {isFetchingMyFunds ? ' · Đang cập nhật...' : ''}
                  </p>
                </div>
                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
                  {items.map((f) => (
                    <div key={f.fundId} role="listitem" className={`${t.card.fundCard} flex flex-col`}>
                      <Link
                        to={`/clubs/${clubId}/funds/${f.fundId}`}
                        className="flex-1 flex flex-col p-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            <Banknote className="w-5 h-5" aria-hidden />
                          </div>
                          <FundStatusBadge fund={f} />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{f.fundName || `Quỹ #${f.fundId}`}</h3>
                        <FundCardBalanceHint
                          amountFormatted={fundListBalanceVnd(f).toLocaleString('vi-VN')}
                          balanceVnd={fundListBalanceVnd(f)}
                          fund={f}
                        />
                        {f.expiresAt ? (
                          <p className={`mt-1 text-xs ${t.type.muted}`}>
                            Hạn nhận nộp: {new Date(f.expiresAt).toLocaleDateString('vi-VN')}
                          </p>
                        ) : null}
                        {String(f.status ?? '').toUpperCase() === 'APPROVED' && f.canAcceptContributions === false ? (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90 line-clamp-2">
                            {f.cannotContributeReasonVi?.trim() || 'Không còn nhận nộp tiền.'}
                          </p>
                        ) : null}
                        {String(f.status ?? '').toUpperCase() === 'REJECTED' ? (
                          <FundRejectionReasonCallout reason={f.rejectionReasonVi} compact />
                        ) : null}
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                          Xem chi tiết
                          <Plus className="w-3 h-3 rotate-45" aria-hidden />
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
                {myFundsPaged && (myFundsPaged.hasPreviousPage || myFundsPaged.hasNextPage || myFundsPaged.totalPages > 1) ? (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${t.type.muted}`}>
                      Hiển thị {items.length.toLocaleString('vi-VN')} / {totalCount.toLocaleString('vi-VN')} quỹ
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!myFundsPaged.hasPreviousPage}
                        onClick={() =>
                          setSearchParams(
                            (prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(Math.max(1, page - 1)));
                              return next;
                            },
                            { replace: true },
                          )}
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={!myFundsPaged.hasNextPage}
                        onClick={() =>
                          setSearchParams(
                            (prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(page + 1));
                              return next;
                            },
                            { replace: true },
                          )}
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        Sau
                        <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

