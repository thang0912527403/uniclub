import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import Cookies from 'js-cookie';
import { setClubId } from '~/utils/auth';
import { BarChart3, Loader2, Lock, RefreshCw, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useFundsClubSelection } from '~/hooks/useFundsClubSelection';
import {
  useGetFundCapabilitiesQuery,
  useGetFundReportSummaryQuery,
  useGetClubFundTransactionsQuery,
  useGetFundsByClubQuery,
} from '~/cores/api';
import type { FundHistoryItem, FundHistoryScopeFilter, FundHistoryStatusFilter } from '~/cores/api';
import { fundTokens as t } from './funds.design-tokens';
import {
  DEFAULT_FUND_HISTORY_PAGE_SIZE,
  FUND_HISTORY_PAGE_SIZES,
  FUND_HISTORY_SCOPE_OPTIONS,
  FUND_HISTORY_STATUS_OPTIONS,
} from '~/modules/funds/constants/fundHistory';

function ymdToUtcStartIso(ymd: string): string | undefined {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

function ymdToUtcEndIso(ymd: string): string | undefined {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
}

function formatVnd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('vi-VN')} ₫`;
}

function txFundLabel(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const n = r.fundName ?? r.FundName;
  if (typeof n === 'string' && n.trim()) return n.trim();
  return `Quỹ #${item.fundId}`;
}

function txSenderLabel(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  return (
    pick('memberName', 'MemberName') ||
    pick('contributorName', 'ContributorName') ||
    pick('userFullName', 'UserFullName') ||
    pick('userName', 'UserName') ||
    pick('senderName', 'SenderName') ||
    pick('createdByName', 'CreatedByName') ||
    pick('requestedBy', 'RequestedBy') ||
    '—'
  );
}

function txCategoryLabel(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const name = r.categoryName ?? r.CategoryName;
  if (typeof name === 'string' && name.trim()) return name.trim();
  const id = r.categoryId ?? r.CategoryId;
  const num = typeof id === 'number' ? id : Number(id);
  if (Number.isFinite(num)) return `ID ${num}`;
  return '—';
}

function txTimeIso(item: FundHistoryItem): string | undefined {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return undefined;
  };
  return pick('updatedAt', 'UpdatedAt', 'transactionDate', 'TransactionDate', 'createdAt', 'CreatedAt');
}

function formatTxDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

type FundsReportTab = 'summary' | 'transactions';

export default function FundsReportsPage() {
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasToken = !!Cookies.get('accessToken');

  const activeTab: FundsReportTab =
    searchParams.get('tab') === 'transactions' ? 'transactions' : 'summary';

  const setTab = (tab: FundsReportTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'summary') next.delete('tab');
        else next.set('tab', 'transactions');
        return next;
      },
      { replace: true },
    );
  };

  const {
    clubId,
    setSelectedClubId,
    memberClubOptions,
    clubs,
    hasToken: selHasToken,
    isAdmin,
    hasAnyClub,
    isLoadingUserMemberships,
  } = useFundsClubSelection();

  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState<number>(DEFAULT_FUND_HISTORY_PAGE_SIZE);
  const [txStatus, setTxStatus] = useState<FundHistoryStatusFilter>('');
  const [txScope, setTxScope] = useState<FundHistoryScopeFilter>('');
  const [txFundId, setTxFundId] = useState(0);
  const [txDraftFrom, setTxDraftFrom] = useState('');
  const [txDraftTo, setTxDraftTo] = useState('');
  const [txAppliedFrom, setTxAppliedFrom] = useState('');
  const [txAppliedTo, setTxAppliedTo] = useState('');

  const {
    data: caps,
    isLoading: capsLoading,
    isError: capsIsError,
    error: capsError,
  } = useGetFundCapabilitiesQuery(clubId, { skip: !selHasToken || clubId < 1 });

  const capsErrorStatus =
    capsError && typeof capsError === 'object' && 'status' in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;
  const capsOtherError = capsIsError && capsErrorStatus !== 403;
  const hasViewFinancePolicy = caps?.hasViewFinancePolicy ?? false;

  const { fromUtc, toUtc } = useMemo(() => {
    if (!appliedFrom && !appliedTo) return { fromUtc: undefined as string | undefined, toUtc: undefined as string | undefined };
    return {
      fromUtc: appliedFrom ? ymdToUtcStartIso(appliedFrom) : undefined,
      toUtc: appliedTo ? ymdToUtcEndIso(appliedTo) : undefined,
    };
  }, [appliedFrom, appliedTo]);

  const skipTxBase =
    !selHasToken ||
    clubId < 1 ||
    capsLoading ||
    capsForbidden ||
    capsOtherError ||
    (caps !== undefined && !hasViewFinancePolicy);

  const skipReport = activeTab !== 'summary' || skipTxBase;
  const skipTx = activeTab !== 'transactions' || skipTxBase;

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    isError: summaryIsError,
    error: summaryError,
    refetch,
  } = useGetFundReportSummaryQuery(
    { clubId, fromUtc: fromUtc ?? null, toUtc: toUtc ?? null },
    { skip: skipReport },
  );

  const summaryErrorStatus =
    summaryError && typeof summaryError === 'object' && 'status' in summaryError
      ? (summaryError as { status: number }).status
      : undefined;
  const summaryForbidden = summaryIsError && summaryErrorStatus === 403;

  const { txFromUtc, txToUtc } = useMemo(() => {
    if (!txAppliedFrom && !txAppliedTo) {
      return { txFromUtc: null as string | null, txToUtc: null as string | null };
    }
    return {
      txFromUtc: txAppliedFrom ? (ymdToUtcStartIso(txAppliedFrom) ?? null) : null,
      txToUtc: txAppliedTo ? (ymdToUtcEndIso(txAppliedTo) ?? null) : null,
    };
  }, [txAppliedFrom, txAppliedTo]);

  const { data: fundsPaged } = useGetFundsByClubQuery(
    { clubId, page: 1, pageSize: 200 },
    { skip: skipTx },
  );

  const {
    data: txPaged,
    isLoading: txLoading,
    isFetching: txFetching,
    isError: txIsError,
    error: txError,
    refetch: refetchTx,
  } = useGetClubFundTransactionsQuery(
    {
      clubId,
      page: txPage,
      pageSize: txPageSize,
      ...(txFundId > 0 ? { fundId: txFundId } : {}),
      ...(txStatus ? { status: txStatus } : {}),
      scope: txScope === 'mine' ? 'mine' : undefined,
      fromUtc: txFromUtc,
      toUtc: txToUtc,
    },
    { skip: skipTx },
  );

  const txErrorStatus =
    txError && typeof txError === 'object' && 'status' in txError
      ? (txError as { status: number }).status
      : undefined;
  const txNotFound = txIsError && txErrorStatus === 404;

  const txItems = txPaged?.items ?? [];
  const txMeta = txPaged;

  useEffect(() => {
    setTxPage(1);
  }, [clubId, txPageSize, txStatus, txScope, txFundId]);

  const txFiltersDisabled = !clubId || skipTxBase;

  const bgClass = isDark ? 'bg-[#0f1729]' : 'bg-slate-50';
  const inputClass = isDark
    ? 'bg-[#0f1729] border-slate-600 text-slate-50'
    : 'bg-white border-slate-200 text-slate-900';

  const applyRange = () => {
    setAppliedFrom(draftFrom.trim());
    setAppliedTo(draftTo.trim());
  };

  const clearRange = () => {
    setDraftFrom('');
    setDraftTo('');
    setAppliedFrom('');
    setAppliedTo('');
  };

  const applyTxFilters = () => {
    setTxAppliedFrom(txDraftFrom.trim());
    setTxAppliedTo(txDraftTo.trim());
    setTxPage(1);
  };

  const clearTxFilters = () => {
    setTxDraftFrom('');
    setTxDraftTo('');
    setTxAppliedFrom('');
    setTxAppliedTo('');
    setTxPage(1);
  };

  const tabBtn = (tab: FundsReportTab, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setTab(tab)}
      className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        activeTab === tab
          ? 'bg-amber-500 text-slate-900 shadow-sm'
          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds/reports" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Báo cáo & giao dịch quỹ"
        breadcrumb="Tài chính / Quản lý quỹ / Báo cáo & giao dịch"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
            <p className={`${t.type.label} mb-3`}>Chế độ xem</p>
            <div className="flex flex-wrap gap-2">
              {tabBtn(
                'summary',
                'Báo cáo & thống kê',
                <BarChart3 className="w-4 h-4 shrink-0" aria-hidden />,
              )}
              {tabBtn(
                'transactions',
                'Giao dịch',
                <ArrowRightLeft className="w-4 h-4 shrink-0" aria-hidden />,
              )}
            </div>
          </div>

          <div className={`${t.card.base} ${t.space.card} flex flex-wrap items-end gap-4 border-slate-200 dark:border-slate-600`}>
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label htmlFor="report-club" className={t.type.label}>
                Câu lạc bộ
              </label>
              <select
                id="report-club"
                value={clubId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSelectedClubId(v);
                  if (v > 0) setClubId(v);
                }}
                className={`${t.input} ${inputClass}`}
                disabled={!selHasToken || (isAdmin ? clubs.length === 0 : memberClubOptions.length === 0)}
              >
                <option value={0}>-- Chọn CLB --</option>
                {isAdmin
                  ? clubs.map((c) => (
                      <option key={c.clubId} value={c.clubId}>
                        {c.clubName} (ID: {c.clubId})
                      </option>
                    ))
                  : memberClubOptions.map((c) => (
                      <option key={c.clubId} value={c.clubId}>
                        {c.label}
                      </option>
                    ))}
              </select>
            </div>
            {activeTab === 'summary' ? (
              <>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <label htmlFor="report-from" className={t.type.label}>
                    Từ ngày (UTC)
                  </label>
                  <input
                    id="report-from"
                    type="date"
                    value={draftFrom}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className={`${t.input} ${inputClass}`}
                    disabled={!clubId || skipReport}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <label htmlFor="report-to" className={t.type.label}>
                    Đến ngày (UTC)
                  </label>
                  <input
                    id="report-to"
                    type="date"
                    value={draftTo}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className={`${t.input} ${inputClass}`}
                    disabled={!clubId || skipReport}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyRange}
                    className={t.btn.primary}
                    disabled={!clubId || skipReport}
                  >
                    Áp dụng khoảng thời gian
                  </button>
                  <button type="button" onClick={clearRange} className={t.btn.secondary} disabled={!clubId || skipReport}>
                    Xóa lọc ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className={`${t.btn.secondary} inline-flex items-center gap-2`}
                    disabled={skipReport || summaryLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${summaryFetching ? 'animate-spin' : ''}`} aria-hidden />
                    Làm mới
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label htmlFor="tx-status" className={t.type.label}>
                    Trạng thái giao dịch
                  </label>
                  <select
                    id="tx-status"
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as FundHistoryStatusFilter)}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  >
                    {FUND_HISTORY_STATUS_OPTIONS.map((o) => (
                      <option key={o.value || 'default'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <label htmlFor="tx-scope" className={t.type.label}>
                    Phạm vi
                  </label>
                  <select
                    id="tx-scope"
                    value={txScope}
                    onChange={(e) => setTxScope(e.target.value as FundHistoryScopeFilter)}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  >
                    {FUND_HISTORY_SCOPE_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label htmlFor="tx-fund" className={t.type.label}>
                    Quỹ
                  </label>
                  <select
                    id="tx-fund"
                    value={txFundId}
                    onChange={(e) => setTxFundId(Number(e.target.value))}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  >
                    <option value={0}>Tất cả quỹ</option>
                    {(fundsPaged?.items ?? []).map((f) => (
                      <option key={f.fundId} value={f.fundId}>
                        {f.fundName?.trim() ? f.fundName : `Quỹ #${f.fundId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label htmlFor="tx-page-size" className={t.type.label}>
                    Số dòng / trang
                  </label>
                  <select
                    id="tx-page-size"
                    value={txPageSize}
                    onChange={(e) => setTxPageSize(Number(e.target.value))}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  >
                    {FUND_HISTORY_PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <label htmlFor="tx-from" className={t.type.label}>
                    Từ ngày (UTC)
                  </label>
                  <input
                    id="tx-from"
                    type="date"
                    value={txDraftFrom}
                    onChange={(e) => setTxDraftFrom(e.target.value)}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <label htmlFor="tx-to" className={t.type.label}>
                    Đến ngày (UTC)
                  </label>
                  <input
                    id="tx-to"
                    type="date"
                    value={txDraftTo}
                    onChange={(e) => setTxDraftTo(e.target.value)}
                    className={`${t.input} ${inputClass}`}
                    disabled={txFiltersDisabled}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyTxFilters}
                    className={t.btn.primary}
                    disabled={txFiltersDisabled}
                  >
                    Áp dụng bộ lọc giao dịch
                  </button>
                  <button type="button" onClick={clearTxFilters} className={t.btn.secondary} disabled={txFiltersDisabled}>
                    Xóa lọc ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => void refetchTx()}
                    className={`${t.btn.secondary} inline-flex items-center gap-2`}
                    disabled={skipTx || txLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${txFetching ? 'animate-spin' : ''}`} aria-hidden />
                    Làm mới
                  </button>
                </div>
              </>
            )}
          </div>

          {!hasToken ? (
            <section className={`${t.card.base} p-12 text-center`}>
              <Lock className="w-10 h-10 mx-auto text-slate-400 mb-3" aria-hidden />
              <p className={t.type.body}>Đăng nhập để xem báo cáo quỹ.</p>
              <Link to="/auth/login" className={`mt-4 inline-block ${t.btn.cta}`}>
                Đăng nhập
              </Link>
            </section>
          ) : !isAdmin && !hasAnyClub ? (
            <section className={`${t.card.base} p-12 text-center`}>
              {isLoadingUserMemberships ? (
                <p className={t.type.body}>Đang tải danh sách CLB...</p>
              ) : (
                <p className={t.type.body}>Bạn chưa thuộc CLB nào (hoạt động).</p>
              )}
            </section>
          ) : !clubId ? (
            <section className={`${t.card.base} p-12 text-center`}>
              <p className={t.type.muted}>Chọn câu lạc bộ để tiếp tục.</p>
            </section>
          ) : capsLoading ? (
            <section className={`${t.card.base} p-12 flex justify-center`} aria-busy="true">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden />
            </section>
          ) : capsForbidden ? (
            <section className={`${t.card.base} p-6 border-amber-200 dark:border-amber-800/60`} role="alert">
              <p className={t.type.body}>Bạn không thuộc CLB này hoặc không có quyền truy cập module quỹ.</p>
            </section>
          ) : capsOtherError ? (
            <section className={`${t.card.base} p-6 border-red-200 dark:border-red-800/60`} role="alert">
              <p className="text-red-600 dark:text-red-400">Không tải được quyền quỹ (capabilities).</p>
            </section>
          ) : !hasViewFinancePolicy ? (
            <section className={`${t.card.base} p-6`} role="status">
              <p className={t.type.body}>
                Bạn cần quyền xem tài chính (viewfinance) trong CLB để xem báo cáo tổng hợp.
              </p>
              <Link to="/funds" className={`mt-3 inline-block ${t.btn.secondary}`}>
                Về tổng quan quỹ
              </Link>
            </section>
          ) : activeTab === 'transactions' ? (
            <section className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
                <h2 className={t.type.sectionTitle}>Giao dịch toàn CLB</h2>
              </div>
              {txNotFound ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 space-y-3" role="status">
                  <p className={t.type.body}>
                    Không tìm thấy API giao dịch CLB (404). Có thể backend chưa triển khai hoặc đường dẫn đã đổi. Bạn vẫn có
                    thể xem lịch sử theo từng quỹ trong trang chi tiết quỹ.
                  </p>
                  <button type="button" onClick={() => void refetchTx()} className={t.btn.secondary}>
                    Thử lại
                  </button>
                </div>
              ) : txIsError ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-200 text-sm space-y-2" role="alert">
                  <p>
                    {(txError as { data?: { message?: string } })?.data?.message ||
                      'Không tải được danh sách giao dịch. Thử lại sau.'}
                  </p>
                  <button type="button" onClick={() => void refetchTx()} className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs`}>
                    Thử lại
                  </button>
                </div>
              ) : txLoading && txItems.length === 0 ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              ) : (txMeta?.totalCount ?? 0) === 0 ? (
                <p className={`${t.type.muted} py-4`}>Không có giao dịch phù hợp bộ lọc.</p>
              ) : (
                <>
                  <div className="overflow-x-auto" role="region" aria-label="Bảng giao dịch quỹ theo CLB">
                    <table className="w-full min-w-[860px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Quỹ
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Người gửi
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Danh mục
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Số tiền
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Mô tả
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Thời gian
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {txItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className={`px-4 py-6 text-center ${t.type.muted}`}>
                              Không có giao dịch trên trang này.
                            </td>
                          </tr>
                        ) : (
                          txItems.map((item) => {
                            const rowKey = item.transactionId ?? item.id ?? `${item.fundId}-${item.createdAt}-${item.updatedAt}`;
                            const st = String(item.status ?? '').toUpperCase();
                            const statusLabel =
                              st === 'APPROVED'
                                ? 'Đã duyệt'
                                : st === 'REJECTED'
                                  ? 'Từ chối'
                                  : st === 'PENDING'
                                    ? 'Chờ duyệt'
                                    : st || '—';
                            const statusClass =
                              st === 'APPROVED'
                                ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                                : st === 'REJECTED'
                                  ? 'text-red-700 dark:text-red-300 font-medium'
                                  : st === 'PENDING'
                                    ? 'text-amber-700 dark:text-amber-300 font-medium'
                                    : t.type.muted;
                            return (
                              <tr
                                key={rowKey}
                                className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                              >
                                <td className={`px-4 py-2 ${t.type.body}`}>
                                  <Link
                                    to={`/clubs/${clubId}/funds/${item.fundId}`}
                                    className="text-amber-700 dark:text-amber-300 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
                                  >
                                    {txFundLabel(item)}
                                  </Link>
                                </td>
                                <td className={`px-4 py-2 ${t.type.body}`}>{txSenderLabel(item)}</td>
                                <td className={`px-4 py-2 text-sm ${t.type.body}`}>{txCategoryLabel(item)}</td>
                                <td className={`px-4 py-2 ${t.type.body} whitespace-nowrap`}>
                                  {item.amount != null ? `${Number(item.amount).toLocaleString('vi-VN')} ₫` : '—'}
                                </td>
                                <td className={`px-4 py-2 ${t.type.body}`}>
                                  {item.description?.trim() ? item.description : '—'}
                                </td>
                                <td className={`px-4 py-2 text-sm ${t.type.muted} whitespace-nowrap`}>
                                  {formatTxDateTime(txTimeIso(item))}
                                </td>
                                <td className={`px-4 py-2 text-sm ${statusClass}`}>{statusLabel}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {txMeta && (txMeta.totalPages ?? 0) > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className={`text-sm ${t.type.muted}`}>
                        {(txMeta.totalCount ?? 0).toLocaleString('vi-VN')} giao dịch · Trang {txMeta.pageNumber}
                        {(txMeta.totalPages ?? 0) > 0 ? ` / ${txMeta.totalPages}` : ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={skipTx || !txMeta.hasPreviousPage}
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                          className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                          aria-label="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                          Trước
                        </button>
                        <button
                          type="button"
                          disabled={skipTx || !txMeta.hasNextPage}
                          onClick={() => setTxPage((p) => p + 1)}
                          className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                          aria-label="Trang sau"
                        >
                          Sau
                          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : summaryForbidden ? (
            <section className={`${t.card.base} p-6 border-red-200 dark:border-red-800/60`} role="alert">
              <p className="text-red-600 dark:text-red-400">Không có quyền xem báo cáo (403).</p>
            </section>
          ) : summaryIsError ? (
            <section className={`${t.card.base} p-6 border-red-200 dark:border-red-800/60`} role="alert">
              <p className="text-red-600 dark:text-red-400">
                {(summaryError as { data?: { message?: string } })?.data?.message ||
                  'Không tải được báo cáo. Thử lại sau.'}
              </p>
            </section>
          ) : summaryLoading && !summary ? (
            <section className={`${t.card.base} p-12 flex justify-center`} aria-busy="true">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden />
            </section>
          ) : summary ? (
            <>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                <BarChart3 className="w-4 h-4 shrink-0" aria-hidden />
                <span>
                  Khoảng thời gian lọc giao dịch (UTC):{' '}
                  {summary.fromUtc && summary.toUtc
                    ? `${new Date(summary.fromUtc).toLocaleString('vi-VN')} — ${new Date(summary.toUtc).toLocaleString('vi-VN')}`
                    : summary.fromUtc
                      ? `Từ ${new Date(summary.fromUtc).toLocaleString('vi-VN')}`
                      : summary.toUtc
                        ? `Đến ${new Date(summary.toUtc).toLocaleString('vi-VN')}`
                        : 'Toàn thời gian (theo server)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
                  <p className={`text-sm ${t.type.muted}`}>Quỹ chờ duyệt</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">
                    {summary.pendingFundCount}
                  </p>
                </div>
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
                  <p className={`text-sm ${t.type.muted}`}>Quỹ đã duyệt</p>
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {summary.approvedFundCount}
                  </p>
                </div>
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
                  <p className={`text-sm ${t.type.muted}`}>Quỹ từ chối</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                    {summary.rejectedFundCount}
                  </p>
                </div>
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600 sm:col-span-2 lg:col-span-3`}>
                  <p className={`text-sm ${t.type.muted}`}>Tổng số dư các quỹ đã duyệt</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">
                    {formatVnd(summary.totalBalanceApprovedFunds)}
                  </p>
                </div>
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
                  <p className={`text-sm ${t.type.muted}`}>Tổng thu (giao dịch APPROVED, INCOME)</p>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatVnd(summary.totalApprovedIncome)}
                  </p>
                </div>
                <div className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
                  <p className={`text-sm ${t.type.muted}`}>Tổng chi (giao dịch APPROVED, EXPENSE)</p>
                  <p className="text-xl font-semibold text-amber-700 dark:text-amber-300 mt-1">
                    {formatVnd(summary.totalApprovedExpense)}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
