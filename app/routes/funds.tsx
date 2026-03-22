import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import Cookies from 'js-cookie';
import {
  Wallet,
  Plus,
  X,
  Shield,
  Clock,
  Lock,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Banknote,
} from 'lucide-react';
import {
  useGetClubsQuery,
  useGetFundsByClubQuery,
  useGetFundCapabilitiesQuery,
  useCreateFundMutation,
  useApproveFundMutation,
  useGetUserClubInfoQuery,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useNotification } from '~/components/Notification';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import type { ClubFund } from '~/cores/api';
import { fundTokens as t } from './funds.design-tokens';

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
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  if (s === 'REJECTED')
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" aria-hidden />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
      <span>{fundStatusLabel(fund)}</span>
    </span>
  );
}

function isPendingFund(f: ClubFund): boolean {
  return String(f.status ?? '').toUpperCase() === 'PENDING';
}

function fundListBalanceVnd(f: ClubFund): number | null {
  if (typeof f.currentBalance === 'number' && Number.isFinite(f.currentBalance)) {
    return f.currentBalance;
  }
  if (typeof f.balance === 'number' && Number.isFinite(f.balance)) {
    return f.balance;
  }
  return null;
}

function parseFundListPage(v: string | null): number {
  const n = parseInt(v ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** 1–100, mặc định 10 (khớp BE). */
function parseFundListPageSize(v: string | null): number {
  const n = parseInt(v ?? '10', 10);
  if (!Number.isFinite(n) || n < 1 || n > 100) return 10;
  return n;
}

export default function FundsPage() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin } = useClubRole();
  const { userId } = useCurrentUser();
  const { show: showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const fundListPage = parseFundListPage(searchParams.get('page'));
  const fundListPageSize = parseFundListPageSize(searchParams.get('pageSize'));

  const hasToken = !!Cookies.get('accessToken');
  const { data: clubs = [] } = useGetClubsQuery(undefined, { skip: !hasToken || !isAdmin });

  const {
    data: userMemberships = [],
    error: userMembershipsError,
    isLoading: isLoadingUserMemberships,
  } = useGetUserClubInfoQuery(userId, { skip: !hasToken || isAdmin || !userId });

  const activeMemberships = (Array.isArray(userMemberships) ? userMemberships : []).filter(
    (m) => String(m?.status ?? '').toUpperCase() === 'ACTIVE'
  );
  const memberClubOptions = activeMemberships.map((m) => ({
    clubId: m.clubId,
    label: `CLB #${m.clubId} • ${m.roleName || `RoleId ${m.clubRoleId}`}`,
  }));

  const [selectedClubId, setSelectedClubId] = useState<number>(0);
  const clubId = selectedClubId;
  const hasAnyClub = isAdmin ? clubs.length > 0 : memberClubOptions.length > 0;

  const [showCreateFundForm, setShowCreateFundForm] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newInitialAmount, setNewInitialAmount] = useState('0');
  /** yyyy-mm-dd — cuối ngày UTC; để trống = không giới hạn nhận nộp */
  const [newFundExpiresDate, setNewFundExpiresDate] = useState('');

  const {
    data: caps,
    isLoading: capsLoading,
    isError: capsIsError,
    error: capsError,
  } = useGetFundCapabilitiesQuery(clubId, { skip: !hasToken || clubId < 1 });
  const capsErrorStatus =
    capsError && typeof capsError === 'object' && 'status' in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;
  const capsOtherError = capsIsError && capsErrorStatus !== 403;
  const canViewFunds = caps?.canViewFunds ?? false;
  const canCreateFundCap = caps?.canCreateFund ?? false;
  const canApproveOrRejectFundEntity = caps?.canApproveOrRejectFundEntity ?? false;

  const skipFundsQuery =
    !hasToken ||
    clubId < 1 ||
    capsLoading ||
    capsForbidden ||
    capsOtherError ||
    (caps !== undefined && !canViewFunds);

  const {
    data: fundsPaged,
    error: fundsError,
    isLoading: isLoadingFunds,
  } = useGetFundsByClubQuery(
    { clubId, page: fundListPage, pageSize: fundListPageSize },
    { skip: skipFundsQuery },
  );
  const availableFunds = fundsPaged?.items ?? [];
  const fundsMeta = fundsPaged;
  const totalFundCount = fundsMeta?.totalCount ?? 0;
  const isForbiddenFunds =
    fundsError && typeof fundsError === 'object' && 'status' in fundsError && fundsError.status === 403;
  const fundsBadRequest =
    fundsError && typeof fundsError === 'object' && 'status' in fundsError && fundsError.status === 400;
  const fundsErrorMessage =
    fundsError && typeof fundsError === 'object' && 'data' in fundsError
      ? (fundsError as { data?: { message?: string } }).data?.message
      : undefined;

  const prevClubForPagingRef = useRef<number>(0);
  useEffect(() => {
    if (clubId < 1) return;
    if (prevClubForPagingRef.current !== 0 && prevClubForPagingRef.current !== clubId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', '1');
          return next;
        },
        { replace: true },
      );
    }
    prevClubForPagingRef.current = clubId;
  }, [clubId, setSearchParams]);

  const setFundListPage = (page: number) => {
    const p = Math.max(1, page);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(p));
        if (fundListPageSize !== 10) next.set('pageSize', String(fundListPageSize));
        else next.delete('pageSize');
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (!hasToken) return;
    if (!isAdmin) {
      if (selectedClubId === 0 && memberClubOptions.length > 0) setSelectedClubId(memberClubOptions[0].clubId);
      return;
    }
  }, [hasToken, isAdmin, memberClubOptions, selectedClubId]);
  useEffect(() => {
    if (isAdmin && clubs.length > 0 && selectedClubId === 0) setSelectedClubId(clubs[0].clubId);
  }, [isAdmin, clubs, selectedClubId]);

  const [createFund, { isLoading: isCreatingFund }] = useCreateFundMutation();
  const [approveFund, { isLoading: isApprovingFund }] = useApproveFundMutation();

  const bgClass = 'bg-slate-50 dark:bg-[#0F172A]';
  const handleCreateFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmount = Number(newInitialAmount);
    if (!clubId || !newFundName.trim() || isNaN(initialAmount) || initialAmount < 0) return;
    let expiresAt: string | undefined;
    if (newFundExpiresDate.trim()) {
      const [y, m, d] = newFundExpiresDate.split('-').map(Number);
      if (y && m && d) {
        expiresAt = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
      }
    }
    try {
      await createFund({
        clubId,
        fundName: newFundName.trim(),
        initialAmount,
        ...(expiresAt ? { expiresAt } : {}),
      }).unwrap();
      setShowCreateFundForm(false);
      setNewFundName('');
      setNewInitialAmount('0');
      setNewFundExpiresDate('');
      showNotification({
        type: 'success',
        title: 'Đã tạo quỹ',
        message: 'Quỹ đã được tạo. Nếu bạn là Vice Manager, quỹ sẽ chờ Manager duyệt.',
      });
    } catch (err: unknown) {
      console.error('Create fund failed:', err);
      const status = (err as { status?: number })?.status;
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        (err as Error)?.message ??
        (status === 403 ? 'Bạn không có quyền tạo quỹ trong CLB này.' : 'Không thể tạo quỹ.');
      showNotification({ type: 'error', title: 'Lỗi tạo quỹ', message: `${String(msg)}${status ? ` (HTTP ${status})` : ''}` });
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Quản lý quỹ câu lạc bộ"
        breadcrumb="Tài chính / Quản lý quỹ"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Modal: Tạo quỹ mới */}
          {showCreateFundForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-fund-title"
            >
              <div
                className={`${t.card.base} max-w-xl w-full overflow-hidden border-slate-200 dark:border-slate-600`}
              >
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm"
                      aria-hidden
                    >
                      <Wallet className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <h2 id="create-fund-title" className={t.type.sectionTitle}>
                        Tạo quỹ mới
                      </h2>
                      <p className={t.type.muted}>
                        Thiết lập quỹ tài chính cho câu lạc bộ đang chọn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateFundForm(false)}
                    className={t.btn.ghost}
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" aria-hidden />
                  </button>
                </div>
                <form
                  onSubmit={handleCreateFundSubmit}
                  className={`${t.space.card} ${t.space.section}`}
                >
                  <div className={`grid grid-cols-1 ${t.space.grid}`}>
                    <div>
                      <label htmlFor="fund-name" className={`block ${t.type.label} mb-1.5`}>
                        Tên quỹ
                      </label>
                      <input
                        id="fund-name"
                        type="text"
                        value={newFundName}
                        onChange={(e) => setNewFundName(e.target.value)}
                        className={t.input}
                        placeholder="VD: Quỹ hoạt động thường niên"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="fund-initial-amount" className={`block ${t.type.label} mb-1.5`}>
                        Số dư ban đầu
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400" aria-hidden>VND</span>
                        <input
                          id="fund-initial-amount"
                          type="number"
                          min="0"
                          step="1"
                          value={newInitialAmount}
                          onChange={(e) => setNewInitialAmount(e.target.value)}
                          className={`${t.input} pl-11`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="fund-expires" className={`block ${t.type.label} mb-1.5`}>
                        Hạn nhận nộp tiền (tuỳ chọn, UTC)
                      </label>
                      <input
                        id="fund-expires"
                        type="date"
                        value={newFundExpiresDate}
                        onChange={(e) => setNewFundExpiresDate(e.target.value)}
                        className={t.input}
                      />
                      <p className={`mt-1 text-xs ${t.type.muted}`}>
                        Ngày cuối cùng quỹ còn nhận nộp (theo ngày UTC). Để trống nếu không giới hạn.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateFundForm(false)}
                      className={t.btn.secondary}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingFund || !clubId}
                      className={t.btn.cta}
                    >
                      {isCreatingFund && (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                      )}
                      {isCreatingFund ? 'Đang tạo...' : 'Tạo quỹ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Hero: title + CTA above fold */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={t.type.pageTitle}>Quản lý quỹ</h1>
              <p className={`mt-1 ${t.type.body}`}>
                Theo dõi thu chi, duyệt yêu cầu rút quỹ và quản lý ngân sách minh bạch.
              </p>
            </div>
            {clubId > 0 && hasToken && !capsLoading && !capsForbidden && !capsOtherError && canViewFunds
              ? (() => {
                  const showMgmtBanner =
                    canApproveOrRejectFundEntity || canCreateFundCap;
                  const roleLine =
                    caps?.clubRoleName != null && String(caps.clubRoleName).trim() !== ''
                      ? `${caps.clubRoleName}${
                          caps.clubRoleLevel != null && caps.clubRoleLevel !== undefined
                            ? ` • Cấp ${caps.clubRoleLevel}`
                            : ''
                        }`
                      : null;
                  if (showMgmtBanner) {
                    return (
                      <div
                        className={`${t.card.base} ${t.space.card} flex items-center gap-3 border-slate-200 dark:border-slate-600`}
                        role="status"
                        aria-label="Phân quyền"
                      >
                        <div
                          className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0"
                          aria-hidden
                        >
                          <Shield className="w-5 h-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            Phân quyền theo CLB
                          </p>
                          <p className={t.type.muted}>
                            {isAdmin
                              ? 'Bạn đang xem với quyền quản trị.'
                              : roleLine
                                ? `Vai trò trong CLB: ${roleLine}.`
                                : 'Bạn có quyền thao tác quản trị quỹ trong phạm vi được cấp.'}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (roleLine) {
                    return (
                      <div
                        className={`${t.card.base} ${t.space.card} flex items-center gap-3 border-slate-200 dark:border-slate-600`}
                        role="status"
                        aria-label="Vai trò CLB"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Vai trò trong CLB</p>
                          <p className={t.type.muted}>{roleLine}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              : null}
          </header>

          {/* Toolbar: club selector + CTA */}
          <div
            className={`${t.card.base} ${t.space.card} flex flex-wrap items-center justify-between gap-4 border-slate-200 dark:border-slate-600`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1 min-w-[240px]">
                <label htmlFor="club-select" className={t.type.label}>
                  Câu lạc bộ
                </label>
                <select
                  id="club-select"
                  value={clubId}
                  onChange={(e) => setSelectedClubId(Number(e.target.value))}
                  className={t.input}
                  aria-label="Chọn câu lạc bộ"
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
                      <option key={c.clubId} value={c.clubId}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {clubId > 0 && canCreateFundCap && canViewFunds && !capsLoading && !capsForbidden && !isForbiddenFunds && (
              <button
                type="button"
                onClick={() => setShowCreateFundForm(true)}
                className={`${t.btn.cta} inline-flex items-center gap-2`}
                aria-label="Tạo quỹ mới"
              >
                <Plus className="w-5 h-5 shrink-0" aria-hidden />
                Tạo quỹ mới
              </button>
            )}
          </div>

          {/* Content: list or empty / auth states */}
          <section
            className={`${t.card.base} overflow-hidden border-slate-200 dark:border-slate-600`}
            aria-labelledby="fund-list-heading"
          >
            {!hasToken ? (
              <div className="p-12 text-center">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4"
                  aria-hidden
                >
                  <Lock className="w-8 h-8" aria-hidden />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
                  Cần đăng nhập
                </h2>
                <p className={`${t.type.body} mb-4`}>Đăng nhập để xem và quản lý quỹ.</p>
                <Link to="/auth/login" className={t.btn.cta}>
                  Đăng nhập
                </Link>
              </div>
            ) : !isAdmin && !hasAnyClub ? (
              <div className="p-12 text-center">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4"
                  aria-hidden
                >
                  <Users className="w-8 h-8" aria-hidden />
                </div>
                {isLoadingUserMemberships ? (
                  <p className={t.type.body}>Đang tải danh sách CLB của bạn...</p>
                ) : (
                  <>
                    <p className={t.type.body}>
                      Bạn chưa được gán vào câu lạc bộ nào (hoặc hệ thống chưa trả được danh sách CLB).
                    </p>
                    {userMembershipsError && (
                      <p className={`mt-2 text-sm ${t.type.muted}`}>
                        Membership error:{' '}
                        {String(
                          ((typeof userMembershipsError === 'object' && userMembershipsError && 'status' in userMembershipsError && userMembershipsError.status) ||
                            'unknown')
                        )}
                      </p>
                    )}
                    <p className={`mt-2 text-sm ${t.type.muted}`}>
                      Nếu bạn chắc chắn đã thuộc CLB (vd ID=7) mà vẫn rỗng, hãy kiểm tra API `/me/clubinfo?userId=...` có trả membership ACTIVE cho CLB đó không.
                    </p>
                  </>
                )}
              </div>
            ) : !clubId ? (
              <div className="p-12 text-center">
                <p className={t.type.body}>Chọn câu lạc bộ để xem danh sách quỹ.</p>
              </div>
            ) : capsLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500 mx-auto mb-4"
                  aria-hidden
                />
                <p className={t.type.body}>Đang kiểm tra quyền truy cập quỹ...</p>
              </div>
            ) : capsOtherError ? (
              <div className="p-12 text-center">
                <p className={`${t.type.body} text-red-600 dark:text-red-400`}>
                  Không tải được quyền quỹ (capabilities). Thử lại sau.
                </p>
              </div>
            ) : capsForbidden || isForbiddenFunds ? (
              <div className="p-12 text-center">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4"
                  aria-hidden
                >
                  <Shield className="w-8 h-8" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Bạn không thuộc CLB này hoặc không có quyền xem quỹ
                </h2>
                <p className={t.type.body}>
                  Hãy chọn câu lạc bộ khác ở thanh phía trên, hoặc liên hệ quản trị viên.
                </p>
              </div>
            ) : !canViewFunds ? (
              <div className="p-12 text-center">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4"
                  aria-hidden
                >
                  <Shield className="w-8 h-8" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Bạn không có quyền xem quỹ của CLB này
                </h2>
                <p className={t.type.body}>
                  Hãy chọn câu lạc bộ khác ở thanh phía trên, hoặc liên hệ quản trị viên để được cấp quyền.
                </p>
              </div>
            ) : fundsError && !isForbiddenFunds ? (
              <div className="p-8 text-center space-y-2" role="alert">
                <p className={`${t.type.body} text-red-600 dark:text-red-400`}>
                  {fundsBadRequest && fundsErrorMessage
                    ? fundsErrorMessage
                    : fundsErrorMessage || 'Không tải được danh sách quỹ.'}
                </p>
                {fundsBadRequest ? (
                  <p className={`text-sm ${t.type.muted}`}>
                    Tham số phân trang: trang bắt đầu từ 1; pageSize từ 1 đến 100.
                  </p>
                ) : null}
              </div>
            ) : isLoadingFunds ? (
              <div className="p-8 text-center">
                <Loader2
                  className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500 mx-auto mb-4"
                  aria-hidden
                />
                <p className={t.type.body}>Đang tải danh sách quỹ...</p>
              </div>
            ) : totalFundCount === 0 ? (
              <div className="px-6 py-12 flex items-center justify-center">
                <div className="max-w-md w-full text-center">
                  <div
                    className="mx-auto w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5"
                    aria-hidden
                  >
                    <Wallet className="w-8 h-8" aria-hidden />
                  </div>
                  <p className={`${t.type.sectionTitle} mb-2`}>Chưa có quỹ nào</p>
                  <p className={`${t.type.body} mb-4`}>
                    Tạo quỹ đầu tiên để bắt đầu quản lý tài chính.
                  </p>
                  {canCreateFundCap ? (
                    <button
                      type="button"
                      onClick={() => setShowCreateFundForm(true)}
                      className={`${t.btn.cta} inline-flex items-center gap-2`}
                    >
                      <Plus className="w-5 h-5 shrink-0" aria-hidden />
                      Tạo quỹ mới
                    </button>
                  ) : (
                    <p className={`${t.type.muted} text-sm`}>Bạn không có quyền tạo quỹ mới trong CLB này.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {canApproveOrRejectFundEntity && availableFunds.some(isPendingFund) && (
                  <div
                    className={`${t.card.base} ${t.space.card} flex items-center gap-3 border-slate-200 dark:border-slate-600 bg-amber-50/50 dark:bg-amber-900/10`}
                    role="alert"
                  >
                    <div
                      className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    >
                      <Clock className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={t.type.sectionTitle}>
                        Trên trang này có {availableFunds.filter(isPendingFund).length} quỹ đang chờ duyệt
                      </p>
                      <p className={t.type.muted}>
                        Dùng nút Duyệt hoặc Từ chối trong từng thẻ; xem các trang khác nếu danh sách nhiều quỹ.
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex flex-wrap items-end justify-between gap-2">
                  <h2 id="fund-list-heading" className={t.type.sectionTitle}>
                    Danh sách quỹ
                  </h2>
                  {fundsMeta && totalFundCount > 0 ? (
                    <p className={`text-sm ${t.type.muted}`}>
                      Tổng {totalFundCount.toLocaleString('vi-VN')} quỹ · Trang {fundsMeta.pageNumber}
                      {fundsMeta.totalPages > 0 ? ` / ${fundsMeta.totalPages}` : ''}
                    </p>
                  ) : null}
                </div>

                {/* Card grid: each fund = card (dashboard-style) */}
                {availableFunds.length === 0 ? (
                  <p className={`p-8 text-center ${t.type.muted}`}>Không có quỹ trên trang này.</p>
                ) : (
                <div
                  className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  role="list"
                  aria-label="Danh sách quỹ"
                >
                  {availableFunds.map((f) => {
                    const listBalance = fundListBalanceVnd(f);
                    return (
                    <div
                      key={f.fundId}
                      role="listitem"
                      className={`${t.card.fundCard} flex flex-col`}
                    >
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
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {f.fundName || `Quỹ #${f.fundId}`}
                        </h3>
                        <p className={`mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200`}>
                          {listBalance != null ? `${listBalance.toLocaleString('vi-VN')} ₫` : '—'}
                        </p>
                        {f.expiresAt ? (
                          <p className={`mt-1 text-xs ${t.type.muted}`}>
                            Hạn nhận nộp (UTC): {new Date(f.expiresAt).toLocaleDateString('vi-VN')}
                          </p>
                        ) : null}
                        {String(f.status ?? '').toUpperCase() === 'APPROVED' && f.canAcceptContributions === false ? (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90">Không còn nhận nộp tiền</p>
                        ) : null}
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                          Xem chi tiết
                          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                        </span>
                      </Link>
                      <div className="px-4 pb-4 pt-0 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
                        {isPendingFund(f) && canApproveOrRejectFundEntity && (
                          <>
                            <button
                              type="button"
                              disabled={isApprovingFund}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  await approveFund({
                                    clubId,
                                    fundId: f.fundId,
                                    action: 'APPROVE',
                                  }).unwrap();
                                  showNotification({
                                    type: 'success',
                                    title: 'Đã duyệt quỹ',
                                    message: `${f.fundName || `Quỹ #${f.fundId}`} đã được duyệt.`,
                                  });
                                } catch (err) {
                                  console.error(err);
                                  showNotification({
                                    type: 'error',
                                    title: 'Lỗi',
                                    message: 'Không thể duyệt quỹ.',
                                  });
                                }
                              }}
                              className={`${t.btn.primary} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1`}
                              aria-label={`Duyệt quỹ ${f.fundName || f.fundId}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                              Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={isApprovingFund}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  await approveFund({
                                    clubId,
                                    fundId: f.fundId,
                                    action: 'REJECT',
                                  }).unwrap();
                                  showNotification({
                                    type: 'success',
                                    title: 'Đã từ chối quỹ',
                                    message: `${f.fundName || `Quỹ #${f.fundId}`} đã bị từ chối.`,
                                  });
                                } catch (err) {
                                  console.error(err);
                                  showNotification({
                                    type: 'error',
                                    title: 'Lỗi',
                                    message: 'Không thể từ chối quỹ.',
                                  });
                                }
                              }}
                              className={`${t.btn.danger} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1`}
                              aria-label={`Từ chối quỹ ${f.fundName || f.fundId}`}
                            >
                              <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                              Từ chối
                            </button>
                          </>
                        )}
                        <Link
                          to={`/clubs/${clubId}/funds/${f.fundId}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1 ml-auto`}
                        >
                          Xem chi tiết
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        </Link>
                      </div>
                    </div>
                    );
                  })}
                </div>
                )}

                {fundsMeta && (fundsMeta.hasPreviousPage || fundsMeta.hasNextPage || fundsMeta.totalPages > 1) ? (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${t.type.muted}`}>
                      Hiển thị {availableFunds.length.toLocaleString('vi-VN')} /{' '}
                      {totalFundCount.toLocaleString('vi-VN')} quỹ
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!fundsMeta.hasPreviousPage}
                        onClick={() => setFundListPage(fundListPage - 1)}
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={!fundsMeta.hasNextPage}
                        onClick={() => setFundListPage(fundListPage + 1)}
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
        </div>
      </main>
    </div>
  );
}
