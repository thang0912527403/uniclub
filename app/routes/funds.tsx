import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import Cookies from "js-cookie";
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
} from "lucide-react";
import {
  useGetClubsQuery,
  useGetClubByIdQuery,
  useGetFundsByClubQuery,
  useGetFundCapabilitiesQuery,
  useCreateFundMutation,
  useApproveFundMutation,
  useGetUserAllClubsQuery,
  useGetUserClubInfoQuery,
  useGetFundTypesQuery,
} from "~/cores/api";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useNotification } from "~/components/Notification";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useClubRole } from "~/hooks/useClubRole";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useDialogAccessibility } from "~/hooks/useDialogAccessibility";
import type { ClubFund } from "~/cores/api";
import type { FundListSort, FundListStatus } from "~/cores/api/types";
import { fundTokens as t } from "./funds.design-tokens";
import {
  FinanceAccessHintBanner,
  FundCardBalanceHint,
} from "~/modules/funds/components/FundUxHints";
import { isFundClosedOnList } from "~/modules/funds/utils/isFundClosedOnList";
import { fundSoftDeleteBlockedReasonVi } from "~/modules/funds/utils/fundSoftDeleteBlockedReasonVi";
import { FundsRefundSection } from "~/modules/funds/components/refunds/FundsRefundSection";
import { ClubFundSoftDeleteControl } from "~/modules/funds/components/ClubFundSoftDeleteControl";
import {
  applyFilterChangeParams,
  buildCreateFundPayload,
  buildFundsListQueryArgs,
  DEFAULT_FUND_PAGE_SIZE,
  DEFAULT_FUND_SORT,
  DEFAULT_FUND_STATUS,
  FUND_DUPLICATE_NAME_MESSAGE,
  isDuplicateFundNameError,
  parseVndIntegerFromInput,
  parseFundSort,
  parseFundStatus,
} from "./funds.utils";

function fundStatusLabel(f: ClubFund): string {
  if (isFundClosedOnList(f)) return "Đã đóng";
  const s = String(f.status ?? "").toUpperCase();
  if (s === "PENDING") return "Chờ duyệt";
  if (s === "APPROVED") return "Đã duyệt";
  if (s === "REJECTED") return "Từ chối";
  return "—";
}

function FundStatusBadge({ fund }: { fund: ClubFund }) {
  if (isFundClosedOnList(fund)) {
    return (
      <span className={t.status.closed}>
        <span
          className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"
          aria-hidden
        />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  }
  const s = String(fund.status ?? "").toUpperCase();
  if (s === "APPROVED")
    return (
      <span className={t.status.approved}>
        <span
          className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
          aria-hidden
        />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  if (s === "REJECTED")
    return (
      <span className={t.status.rejected}>
        <span
          className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
          aria-hidden
        />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span
        className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"
        aria-hidden
      />
      <span>{fundStatusLabel(fund)}</span>
    </span>
  );
}

function isPendingFund(f: ClubFund): boolean {
  return String(f.status ?? "").toUpperCase() === "PENDING";
}

function fundListBalanceVnd(f: ClubFund): number {
  if (
    typeof f.currentBalance === "number" &&
    Number.isFinite(f.currentBalance)
  ) {
    return f.currentBalance;
  }
  if (typeof f.balance === "number" && Number.isFinite(f.balance)) {
    return f.balance;
  }

  return 0;
}

function parseFundListPage(v: string | null): number {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parseFundListPageSize(v: string | null): number {
  const n = parseInt(v ?? String(DEFAULT_FUND_PAGE_SIZE), 10);
  if (!Number.isFinite(n) || n < 1 || n > DEFAULT_FUND_PAGE_SIZE)
    return DEFAULT_FUND_PAGE_SIZE;
  return n;
}

const FUND_SEARCH_DEBOUNCE_MS = 400;
const FUND_STATUS_OPTIONS: Array<{ value: FundListStatus; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];
const FUND_SORT_OPTIONS: Array<{ value: FundListSort; label: string }> = [
  { value: "NEWEST", label: "Mới nhất" },
  { value: "OLDEST", label: "Cũ nhất" },
];

type FundsPageTab = "list" | "refunds";
function parseFundsTab(v: string | null): FundsPageTab {
  const x = String(v ?? "").trim().toLowerCase();
  if (x === "refunds") return "refunds";
  return "list";
}

export default function FundsPage() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, selectedClubId: clubIdFromCookie, currentClub } = useClubRole();
  const { userId } = useCurrentUser();
  const { show: showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseFundsTab(searchParams.get("tab"));
  const fundListPage = parseFundListPage(searchParams.get("page"));
  const fundListPageSize = parseFundListPageSize(searchParams.get("pageSize"));
  const fundSearch = searchParams.get("search") ?? "";
  const fundStatus = parseFundStatus(searchParams.get("status"));
  const fundSort = parseFundSort(searchParams.get("sort"));
  const [searchInput, setSearchInput] = useState(fundSearch);

  const hasToken = !!Cookies.get("accessToken");
  const { data: clubsResponse } = useGetClubsQuery(
    {
      pageIndex: "1",
      pageSize: "200",
      searchQuery: "",
    },
    { skip: !hasToken || !isAdmin },
  );
  const clubs = clubsResponse?.data ?? [];

  const {
    data: userMemberships = [],
    error: userMembershipsError,
    isLoading: isLoadingUserMemberships,
  } = useGetUserClubInfoQuery(userId, {
    skip: !hasToken || isAdmin || !userId,
  });
  const { data: userClubs = [] } = useGetUserAllClubsQuery(userId, {
    skip: !hasToken || isAdmin || !userId,
  });
  const userClubNameById = new Map(
    userClubs.map((c) => [c.clubId, c.clubName]),
  );

  const clubId = Number(clubIdFromCookie ?? 0);
  const { data: clubById } = useGetClubByIdQuery(clubId, { skip: clubId < 1 });
  const clubName =
    String(currentClub?.clubName ?? "").trim() ||
    String(clubById?.clubName ?? "").trim() ||
    clubs.find((c) => Number(c.clubId) === clubId)?.clubName?.trim() ||
    userClubNameById.get(clubId)?.trim() ||
    (clubId > 0 ? `CLB #${clubId}` : "");
  const hasAnyClub = clubId > 0;

  const [showCreateFundForm, setShowCreateFundForm] = useState(false);
  const [newFundName, setNewFundName] = useState("");
  const [newFundDescription, setNewFundDescription] = useState("");
  const [newFundExpiresDate, setNewFundExpiresDate] = useState("");
  const [newFundTypeId, setNewFundTypeId] = useState<number>(0);
  const [goalAmountInput, setGoalAmountInput] = useState("");
  const [createFundFormError, setCreateFundFormError] = useState<string | null>(
    null,
  );
  const [rejectTargetFund, setRejectTargetFund] = useState<ClubFund | null>(
    null,
  );
  const [listRejectReason, setListRejectReason] = useState("");

  const {
    data: caps,
    isLoading: capsLoading,
    isError: capsIsError,
    error: capsError,
  } = useGetFundCapabilitiesQuery(clubId, { skip: !hasToken || clubId < 1 });
  const capsErrorStatus =
    capsError && typeof capsError === "object" && "status" in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;
  const capsOtherError = capsIsError && capsErrorStatus !== 403;
  const canViewFunds = caps?.canViewFunds ?? false;
  const canAccessRefunds =
    !!(hasToken && clubId > 0) &&
    (isAdmin || caps?.canProcessClubRefunds === true);
  const canCreateFundCap = caps?.canCreateFund ?? false;
  const canApproveOrRejectFundEntity =
    caps?.canApproveOrRejectFundEntity ?? false;
  const canFilterFundStatusOnOverview = isAdmin || canApproveOrRejectFundEntity;
  const canShowRefundTab = canAccessRefunds && !capsForbidden && !capsOtherError;

  useEffect(() => {
    if (tab !== "refunds") return;
    if (canShowRefundTab) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "list");
        return next;
      },
      { replace: true },
    );
  }, [tab, canShowRefundTab, setSearchParams]);

  const {
    data: fundTypes = [],
    isLoading: isLoadingFundTypes,
    isError: isFundTypesError,
  } = useGetFundTypesQuery(undefined, {
    skip: !hasToken || !showCreateFundForm,
  });

  const activeFundTypes = useMemo(
    () =>
      (Array.isArray(fundTypes) ? fundTypes : []).filter(
        (ft) => ft.isActive !== false,
      ),
    [fundTypes],
  );

  useEffect(() => {
    if (!showCreateFundForm) return;
    if (newFundTypeId > 0) return;
    const first = activeFundTypes[0];
    if (first?.fundTypeId != null && first.fundTypeId > 0)
      setNewFundTypeId(first.fundTypeId);
  }, [showCreateFundForm, newFundTypeId, activeFundTypes]);

  const effectiveFundListStatus: FundListStatus = useMemo(() => {
    if (canFilterFundStatusOnOverview) return fundStatus;
    return "APPROVED";
  }, [canFilterFundStatusOnOverview, fundStatus]);

  const baselineFundStatusForOverview: FundListStatus =
    canFilterFundStatusOnOverview ? DEFAULT_FUND_STATUS : "APPROVED";

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
    refetch: refetchFundsList,
  } = useGetFundsByClubQuery(
    buildFundsListQueryArgs({
      clubId,
      page: fundListPage,
      pageSize: fundListPageSize,
      search: fundSearch,
      status: effectiveFundListStatus,
      sort: fundSort,
    }),
    { skip: skipFundsQuery },
  );
  const availableFunds = fundsPaged?.items ?? [];
  const fundsMeta = fundsPaged;
  const totalFundCount = fundsMeta?.totalCount ?? 0;
  const isForbiddenFunds =
    fundsError &&
    typeof fundsError === "object" &&
    "status" in fundsError &&
    fundsError.status === 403;
  const fundsBadRequest =
    fundsError &&
    typeof fundsError === "object" &&
    "status" in fundsError &&
    fundsError.status === 400;
  const fundsErrorMessage =
    fundsError && typeof fundsError === "object" && "data" in fundsError
      ? (fundsError as { data?: { message?: string } }).data?.message
      : undefined;

  const prevClubForPagingRef = useRef<number>(0);
  useEffect(() => {
    if (clubId < 1) return;
    if (
      prevClubForPagingRef.current !== 0 &&
      prevClubForPagingRef.current !== clubId
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", "1");
          return next;
        },
        { replace: true },
      );
    }
    prevClubForPagingRef.current = clubId;
  }, [clubId, setSearchParams]);

  useEffect(() => {
    setSearchInput(fundSearch);
  }, [fundSearch]);

  useEffect(() => {
    const normalized = searchInput.trim();
    const current = fundSearch.trim();
    if (normalized === current) return;
    const timeout = setTimeout(() => {
      setSearchParams(
        (prev) =>
          applyFilterChangeParams(prev, {
            search: normalized,
            pageSize: fundListPageSize,
          }),
        { replace: true },
      );
    }, FUND_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, fundSearch, fundListPageSize, setSearchParams]);

  const setFundListPage = (page: number) => {
    const p = Math.max(1, page);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(p));
        if (fundListPageSize !== DEFAULT_FUND_PAGE_SIZE)
          next.set("pageSize", String(fundListPageSize));
        else next.delete("pageSize");
        return next;
      },
      { replace: true },
    );
  };

  const [createFund, { isLoading: isCreatingFund }] = useCreateFundMutation();
  const [approveFund, { isLoading: isApprovingFund }] =
    useApproveFundMutation();

  useEffect(() => {
    if (!hasToken || clubId < 1 || capsLoading) return;
    if (!canFilterFundStatusOnOverview && fundStatus !== "APPROVED") {
      setSearchParams(
        (prev) =>
          applyFilterChangeParams(prev, {
            status: "APPROVED",
            pageSize: fundListPageSize,
          }),
        { replace: true },
      );
    }
  }, [
    hasToken,
    clubId,
    capsLoading,
    canFilterFundStatusOnOverview,
    fundStatus,
    fundListPageSize,
    setSearchParams,
  ]);

  const closeListRejectModal = useCallback(() => {
    setRejectTargetFund(null);
    setListRejectReason("");
  }, []);

  const listRejectDialogRef = useDialogAccessibility(
    rejectTargetFund != null,
    closeListRejectModal,
  );

  const hasActiveFundFilters =
    !!fundSearch.trim() ||
    fundStatus !== baselineFundStatusForOverview ||
    fundSort !== DEFAULT_FUND_SORT;

  const bgClass = "bg-slate-50 dark:bg-[#0F172A]";
  const handleCreateFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !newFundName.trim()) return;
    setCreateFundFormError(null);
    if (!(newFundTypeId > 0)) {
      setCreateFundFormError("Vui lòng chọn loại quỹ.");
      return;
    }
    let expiresAt: string | undefined;
    if (newFundExpiresDate.trim()) {
      const [y, m, d] = newFundExpiresDate.split("-").map(Number);
      if (y && m && d) {
        expiresAt = new Date(
          Date.UTC(y, m - 1, d, 23, 59, 59, 999),
        ).toISOString();
      }
    }
    let goalAmount: number | undefined;
    if (goalAmountInput.trim()) {
      const parsed = parseVndIntegerFromInput(goalAmountInput);
      if (!parsed.ok) {
        setCreateFundFormError(parsed.message);
        return;
      }
      goalAmount = parsed.amount;
    }
    try {
      const created = await createFund({
        clubId,
        ...buildCreateFundPayload(
          newFundName,
          newFundTypeId,
          expiresAt,
          newFundDescription,
          goalAmount,
        ),
      }).unwrap();
      setShowCreateFundForm(false);
      setNewFundName("");
      setNewFundDescription("");
      setNewFundExpiresDate("");
      setNewFundTypeId(0);
      setGoalAmountInput("");
      setCreateFundFormError(null);
      const statusNorm = String(created?.status ?? "").toUpperCase();
      const fundLabel = created?.fundName?.trim() || "Quỹ mới";
      let createFundSuccessMessage: string;
      if (statusNorm === "APPROVED") {
        createFundSuccessMessage = "Quỹ đã được tạo.";
      } else if (statusNorm === "PENDING") {
        createFundSuccessMessage = `«${fundLabel}» đã được tạo. Quỹ đang chờ quản lý câu lạc bộ duyệt.`;
      } else {
        createFundSuccessMessage =
          "Quỹ đã được tạo. Kiểm tra trạng thái trong danh sách quỹ.";
      }
      showNotification({
        type: "success",
        title: "Đã tạo quỹ",
        message: createFundSuccessMessage,
      });
    } catch (err: unknown) {
      console.error("Create fund failed:", err);
      const status = (err as { status?: number })?.status;
      const backendMessage = (err as { data?: { message?: string } })?.data
        ?.message;
      if (isDuplicateFundNameError(backendMessage)) {
        const duplicateNameFriendly =
          "Tên quỹ này đã tồn tại trong CLB. Vui lòng chọn tên khác.";
        setCreateFundFormError(duplicateNameFriendly);
        showNotification({
          type: "error",
          title: "Tên quỹ bị trùng",
          message: duplicateNameFriendly,
        });
        return;
      }
      const msg =
        backendMessage ??
        (err as Error)?.message ??
        (status === 403
          ? "Bạn không có quyền tạo quỹ trong CLB này."
          : "Không thể tạo quỹ.");
      showNotification({
        type: "error",
        title: "Lỗi tạo quỹ",
        message: `${String(msg)}${status ? ` (HTTP ${status})` : ""}`,
      });
    }
  };

  const redirectFund403 =
    hasToken &&
    clubId >= 1 &&
    !capsLoading &&
    !capsOtherError &&
    (capsForbidden ||
      isForbiddenFunds ||
      (caps !== undefined && !canViewFunds));

  if (redirectFund403) {
    return <Navigate to="/403" replace />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        currentPath="/funds"
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      <HeaderBar
        title="Quản lý quỹ câu lạc bộ"
        breadcrumb="Tài chính / Quản lý quỹ"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {!capsLoading && !canViewFunds && caps?.financeAccessHintVi?.trim() ? (
            <FinanceAccessHintBanner message={caps.financeAccessHintVi} />
          ) : null}
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
                      <h2
                        id="create-fund-title"
                        className={t.type.sectionTitle}
                      >
                        Tạo quỹ mới
                      </h2>
                      <p className={t.type.muted}>
                        Thiết lập quỹ tài chính cho câu lạc bộ đang chọn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateFundForm(false);
                      setNewFundTypeId(0);
                      setGoalAmountInput("");
                      setCreateFundFormError(null);
                    }}
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
                      <label
                        htmlFor="fund-type"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Loại quỹ
                      </label>
                      <select
                        id="fund-type"
                        value={String(newFundTypeId)}
                        onChange={(e) => {
                          setNewFundTypeId(Number(e.target.value));
                          if (createFundFormError) setCreateFundFormError(null);
                        }}
                        className={t.input}
                        required
                        disabled={isLoadingFundTypes || isFundTypesError}
                      >
                        {activeFundTypes.length === 0 ? (
                          <option value="0">Không có loại quỹ</option>
                        ) : (
                          activeFundTypes.map((ft) => (
                            <option
                              key={ft.fundTypeId}
                              value={String(ft.fundTypeId)}
                            >
                              {ft.name}
                            </option>
                          ))
                        )}
                      </select>
                      {isFundTypesError ? (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Không tải được danh sách loại quỹ. Vui lòng thử lại.
                        </p>
                      ) : (
                        <p className={`mt-1 text-xs ${t.type.muted}`}>
                          {isLoadingFundTypes ? "Đang tải loại quỹ..." : ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="fund-name"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Tên quỹ
                      </label>
                      <input
                        id="fund-name"
                        type="text"
                        value={newFundName}
                        onChange={(e) => {
                          setNewFundName(e.target.value);
                          if (createFundFormError) setCreateFundFormError(null);
                        }}
                        className={t.input}
                        placeholder="VD: Quỹ hoạt động thường niên"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fund-description"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Mô tả (tuỳ chọn)
                      </label>
                      <textarea
                        id="fund-description"
                        value={newFundDescription}
                        onChange={(e) => setNewFundDescription(e.target.value)}
                        className={`${t.input} min-h-[92px] resize-y`}
                        placeholder="Ví dụ: Quỹ hỗ trợ hoạt động thường niên của CLB."
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fund-expires"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Hạn nhận nộp tiền (tuỳ chọn)
                      </label>
                      <input
                        id="fund-expires"
                        type="date"
                        value={newFundExpiresDate}
                        onChange={(e) => setNewFundExpiresDate(e.target.value)}
                        className={t.input}
                      />
                      <p className={`mt-1 text-xs ${t.type.muted}`}>
                        Ngày cuối cùng quỹ còn nhận nộp. Để trống nếu không giới
                        hạn.
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="fund-goal"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Mục tiêu quỹ (tuỳ chọn)
                      </label>
                      <input
                        id="fund-goal"
                        type="text"
                        inputMode="numeric"
                        value={goalAmountInput}
                        onChange={(e) => {
                          setGoalAmountInput(e.target.value);
                          if (createFundFormError) setCreateFundFormError(null);
                        }}
                        className={t.input}
                        placeholder="VD: 1.000.000"
                      />
                    </div>
                  </div>
                  {createFundFormError ? (
                    <p
                      className="text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {createFundFormError}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateFundForm(false);
                        setNewFundTypeId(0);
                        setGoalAmountInput("");
                        setCreateFundFormError(null);
                      }}
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
                        <Loader2
                          className="w-4 h-4 animate-spin shrink-0"
                          aria-hidden
                        />
                      )}
                      {isCreatingFund ? "Đang tạo..." : "Tạo quỹ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={t.type.pageTitle}>Quản lý quỹ</h1>
              <p className={`mt-1 ${t.type.body}`}>
                Theo dõi thu chi và quản lý ngân sách minh bạch.
                {!canFilterFundStatusOnOverview && canViewFunds ? (
                  <span className="block mt-1 text-slate-600 dark:text-slate-400">
                    Thành viên chỉ thấy quỹ đã duyệt; quỹ chờ duyệt / của bạn
                    xem tại &quot;Quỹ của tôi&quot;.
                  </span>
                ) : null}
              </p>
            </div>
          </header>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Điều hướng quản lý quỹ">
            {(
              [
                { id: "list" as const, label: "Danh sách quỹ" },
                ...(canShowRefundTab ? ([{ id: "refunds" as const, label: "Xử lý hoàn tiền" }] as const) : []),
              ] satisfies Array<{ id: FundsPageTab; label: string }>
            ).map((opt) => {
              const active = tab === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("tab", opt.id);
                        next.delete("page");
                        return next;
                      },
                      { replace: true },
                    )
                  }
                  className={`h-10 px-4 rounded-xl text-sm font-semibold border transition-colors ${
                    active
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </nav>

          <div
            className={`${t.card.base} ${t.space.card} flex flex-wrap items-center justify-between gap-4 border-slate-200 dark:border-slate-600`}
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 min-w-[240px]">
                <label htmlFor="club-select" className={t.type.label}>
                  Câu lạc bộ
                </label>
                <input
                  id="club-select"
                  value={clubName}
                  readOnly
                  className={`${t.input} h-11`}
                  aria-label="Câu lạc bộ đã chọn"
                  placeholder="Chưa chọn câu lạc bộ"
                />
              </div>
              {tab === "list" ? (
                <>
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <label htmlFor="fund-search" className={t.type.label}>
                      Tìm kiếm
                    </label>
                    <input
                      id="fund-search"
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={`${t.input} h-11`}
                      placeholder="Nhập..."
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className={t.type.label}>Trạng thái</span>
                    {canFilterFundStatusOnOverview ? (
                      <select
                        id="fund-status-filter"
                        value={fundStatus}
                        onChange={(e) => {
                          const nextStatus = parseFundStatus(e.target.value);
                          setSearchParams(
                            (prev) =>
                              applyFilterChangeParams(prev, {
                                status: nextStatus,
                                pageSize: fundListPageSize,
                              }),
                            { replace: true },
                          );
                        }}
                        className={`${t.input} h-11`}
                      >
                        {FUND_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p
                        id="fund-status-filter"
                        className={`${t.input} h-11 flex items-center cursor-default`}
                        title="Thành viên chỉ xem quỹ đã duyệt trên trang tổng quan"
                      >
                        Đã duyệt
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <label htmlFor="fund-sort" className={t.type.label}>
                      Sắp xếp
                    </label>
                    <select
                      id="fund-sort"
                      value={fundSort}
                      onChange={(e) => {
                        const nextSort = parseFundSort(e.target.value);
                        setSearchParams(
                          (prev) =>
                            applyFilterChangeParams(prev, {
                              sort: nextSort,
                              pageSize: fundListPageSize,
                            }),
                          { replace: true },
                        );
                      }}
                      className={`${t.input} h-11`}
                    >
                      {FUND_SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearchParams(
                          (prev) =>
                            applyFilterChangeParams(prev, {
                              search: "",
                              status: baselineFundStatusForOverview,
                              sort: DEFAULT_FUND_SORT,
                              pageSize: fundListPageSize,
                            }),
                          { replace: true },
                        );
                      }}
                      className={t.btn.secondary}
                      disabled={!hasActiveFundFilters}
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </>
              ) : null}
            </div>
            {clubId > 0 &&
              canCreateFundCap &&
              canViewFunds &&
              !capsLoading &&
              !capsForbidden &&
              !isForbiddenFunds && (
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
                <p className={`${t.type.body} mb-4`}>
                  Đăng nhập để xem và quản lý quỹ.
                </p>
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
                  <p className={t.type.body}>
                    Đang tải danh sách CLB của bạn...
                  </p>
                ) : (
                  <>
                    <p className={t.type.body}>
                      Bạn chưa được gán vào câu lạc bộ nào (hoặc hệ thống chưa
                      trả được danh sách CLB).
                    </p>
                    {userMembershipsError && (
                      <p className={`mt-2 text-sm ${t.type.muted}`}>
                        Membership error:{" "}
                        {String(
                          (typeof userMembershipsError === "object" &&
                            userMembershipsError &&
                            "status" in userMembershipsError &&
                            userMembershipsError.status) ||
                            "unknown",
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : !clubId ? (
              <div className="p-12 text-center">
                <p className={t.type.body}>
                  Chọn câu lạc bộ để xem danh sách quỹ.
                </p>
              </div>
            ) : capsLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500 mx-auto mb-4"
                  aria-hidden
                />
                <p className={t.type.body}>
                  Đang kiểm tra quyền truy cập quỹ...
                </p>
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
                  Hãy chọn câu lạc bộ khác ở thanh phía trên, hoặc liên hệ quản
                  trị viên.
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
                  Hãy chọn câu lạc bộ khác ở thanh phía trên, hoặc liên hệ quản
                  trị viên để được cấp quyền.
                </p>
              </div>
            ) : fundsError && !isForbiddenFunds ? (
              <div className="p-8 text-center space-y-2" role="alert">
                <p className={`${t.type.body} text-red-600 dark:text-red-400`}>
                  {fundsBadRequest && fundsErrorMessage
                    ? fundsErrorMessage
                    : fundsErrorMessage || "Không tải được danh sách quỹ."}
                </p>
                {fundsBadRequest ? (
                  <p className={`text-sm ${t.type.muted}`}>
                    Tham số phân trang: trang bắt đầu từ 1; pageSize tối đa{" "}
                    {DEFAULT_FUND_PAGE_SIZE}.
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
                  <p className={`${t.type.sectionTitle} mb-2`}>
                    Chưa có quỹ nào
                  </p>
                  <p className={`${t.type.body} mb-4`}>
                    Tạo quỹ đầu tiên để bắt đầu quản lý tài chính.
                  </p>
                  <p className={`${t.type.muted} text-sm`}>
                    Tạo quỹ mới tại khu bộ lọc phía trên.
                  </p>
                </div>
              </div>
            ) : tab === "refunds" ? (
                  canAccessRefunds && !capsForbidden && !capsOtherError ? (
                    <section aria-labelledby="fund-refunds-heading">
                      <h2 id="fund-refunds-heading" className="sr-only">
                        Xử lý hoàn tiền
                      </h2>
                      {capsLoading ? (
                        <div className={`${t.card.base} p-10 text-center`} aria-busy="true">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" aria-hidden />
                          <p className={t.type.body}>Đang kiểm tra quyền...</p>
                        </div>
                      ) : (
                        <FundsRefundSection clubId={clubId} skip={!hasToken || clubId < 1} caps={caps} isAdmin={!!isAdmin} />
                      )}
                    </section>
                  ) : (
                    <section className={`${t.card.base} p-6`} role="alert">
                      <p className={t.type.body}>Bạn không có quyền xử lý hoàn tiền trong CLB này.</p>
                    </section>
                  )
                ) : (
                  <>
                    {canApproveOrRejectFundEntity &&
                      availableFunds.some(isPendingFund) && (
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
                              Trên trang này có{" "}
                              {availableFunds.filter(isPendingFund).length} quỹ đang
                              chờ duyệt
                            </p>
                            <p className={t.type.muted}>
                              Dùng nút Duyệt hoặc Từ chối trong từng thẻ; xem các
                              trang khác nếu danh sách nhiều quỹ.
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
                          Tổng {totalFundCount.toLocaleString("vi-VN")} quỹ · Trang{" "}
                          {fundsMeta.pageNumber}
                          {fundsMeta.totalPages > 0
                            ? ` / ${fundsMeta.totalPages}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    {availableFunds.length === 0 ? (
                      <p className={`p-8 text-center ${t.type.muted}`}>
                        {hasActiveFundFilters
                          ? "Không tìm thấy quỹ nào phù hợp bộ lọc hiện tại."
                          : "Không có quỹ trên trang này."}
                      </p>
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
                                to={`/clubs/${clubId}/funds/${f.publicId ?? f.fundId}`}
                                className="flex-1 flex flex-col p-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
                              >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                                    <Banknote className="w-5 h-5" aria-hidden />
                                  </div>
                                  <FundStatusBadge fund={f} />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {f.fundName?.trim() || "Quỹ"}
                                </h3>
                                <FundCardBalanceHint
                                  amountFormatted={listBalance.toLocaleString(
                                    "vi-VN",
                                  )}
                                  balanceVnd={listBalance}
                                  fund={f}
                                />
                                {f.expiresAt ? (
                                  <p className={`mt-1 text-xs ${t.type.muted}`}>
                                    Hạn nhận nộp:{" "}
                                    {new Date(f.expiresAt).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </p>
                                ) : null}
                                {String(f.status ?? "").toUpperCase() ===
                                  "APPROVED" &&
                                f.canAcceptContributions === false ? (
                                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90 line-clamp-2">
                                    {f.cannotContributeReasonVi?.trim() ||
                                      "Không còn nhận nộp tiền."}
                                  </p>
                                ) : null}
                                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                                  Xem chi tiết
                                  <ChevronRight
                                    className="w-4 h-4 shrink-0"
                                    aria-hidden
                                  />
                                </span>
                              </Link>
                              <div className="px-4 pb-4 pt-0 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                {isPendingFund(f) &&
                                  canApproveOrRejectFundEntity && (
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
                                          action: "APPROVE",
                                        }).unwrap();
                                        showNotification({
                                          type: "success",
                                          title: "Đã duyệt quỹ",
                                          message: `${f.fundName?.trim() || "Quỹ"} đã được duyệt.`,
                                        });
                                      } catch (err) {
                                        console.error(err);
                                        showNotification({
                                          type: "error",
                                          title: "Lỗi",
                                          message: "Không thể duyệt quỹ.",
                                        });
                                      }
                                    }}
                                    className={`${t.btn.primary} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1`}
                                    aria-label={`Duyệt quỹ ${f.fundName || f.fundId}`}
                                  >
                                    <CheckCircle
                                      className="w-3.5 h-3.5 shrink-0"
                                      aria-hidden
                                    />
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isApprovingFund}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setListRejectReason("");
                                      setRejectTargetFund(f);
                                    }}
                                    className={`${t.btn.danger} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1`}
                                    aria-label={`Từ chối quỹ ${f.fundName || f.fundId}`}
                                  >
                                    <XCircle
                                      className="w-3.5 h-3.5 shrink-0"
                                      aria-hidden
                                    />
                                    Từ chối
                                  </button>
                                </>
                              )}
                            <ClubFundSoftDeleteControl
                              clubId={clubId}
                              fundId={f.fundId}
                              fundLabel={f.fundName?.trim() || `Quỹ #${f.fundId}`}
                              canSoftDeleteFund={caps?.canSoftDeleteFund === true}
                              isFundClosed={isFundClosedOnList(f)}
                              softDeleteBlockedReasonVi={fundSoftDeleteBlockedReasonVi(
                                f,
                              )}
                              financeAccessHintVi={caps?.financeAccessHintVi}
                              compact
                              onAfterSuccess={() => {
                                void refetchFundsList();
                              }}
                            />
                            <Link
                              to={`/clubs/${clubId}/funds/${f.publicId ?? f.fundId}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1 ml-auto`}
                            >
                              Xem chi tiết
                              <ChevronRight
                                className="w-3.5 h-3.5 shrink-0"
                                aria-hidden
                              />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {fundsMeta &&
                (fundsMeta.hasPreviousPage ||
                  fundsMeta.hasNextPage ||
                  fundsMeta.totalPages > 1) ? (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${t.type.muted}`}>
                      Hiển thị {availableFunds.length.toLocaleString("vi-VN")} /{" "}
                      {totalFundCount.toLocaleString("vi-VN")} quỹ
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
                        <ChevronRight
                          className="w-4 h-4 shrink-0"
                          aria-hidden
                        />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>

      {rejectTargetFund ? (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4"
          role="presentation"
        >
          <div
            ref={listRejectDialogRef}
            className={`${t.card.base} w-full max-w-md rounded-2xl shadow-xl outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="funds-list-reject-heading"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2
                id="funds-list-reject-heading"
                className={t.type.sectionTitle}
              >
                Từ chối quỹ
              </h2>
              <button
                type="button"
                onClick={closeListRejectModal}
                className={t.btn.ghost}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="px-6 py-4 text-slate-900 dark:text-slate-50 space-y-4">
              <textarea
                id="funds-list-reject-reason"
                value={listRejectReason}
                onChange={(e) => setListRejectReason(e.target.value)}
                rows={4}
                className={`${t.input} w-full min-h-[100px]`}
                placeholder="Lý do từ chối"
                aria-label="Lý do từ chối"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeListRejectModal}
                  className={t.btn.secondary}
                  disabled={isApprovingFund}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isApprovingFund}
                  className={t.btn.danger}
                  onClick={async () => {
                    const reason = listRejectReason.trim();
                    if (reason.length < 5) {
                      showNotification({
                        type: "error",
                        title: "Thiếu lý do",
                        message: "Vui lòng nhập lý do từ chối ít nhất 5 ký tự.",
                      });
                      return;
                    }
                    try {
                      await approveFund({
                        clubId,
                        fundId: rejectTargetFund.fundId,
                        action: "REJECT",
                        rejectReason: reason,
                      }).unwrap();
                      showNotification({
                        type: "success",
                        title: "Đã từ chối quỹ",
                        message: `${rejectTargetFund.fundName?.trim() || "Quỹ"} đã bị từ chối.`,
                      });
                      closeListRejectModal();
                    } catch (err) {
                      console.error(err);
                      const msg =
                        (err as { data?: { message?: string } })?.data
                          ?.message || "Không thể từ chối quỹ.";
                      showNotification({
                        type: "error",
                        title: "Lỗi",
                        message: msg,
                      });
                    }
                  }}
                >
                  {isApprovingFund ? "Đang xử lý…" : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
