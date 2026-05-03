import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Gavel,
  X,
  HandCoins,
  Banknote,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  FinanceAccessHintBanner,
  resolveFundBalanceHoverTextVi,
} from "~/modules/funds/components/FundUxHints";
import {
  useGetClubByIdQuery,
  useApproveFundMutation,
  useContributeToFundMutation,
  useLazyGetContributeTransactionStatusQuery,
} from "~/cores/api";
import {
  useGetFundByIdQuery,
  useGetFundCapabilitiesQuery,
  useGetFundsByClubQuery,
  useGetFundMemberContributionsQuery,
} from "~/cores/api/fundApi";
import { useDialogAccessibility } from "~/hooks/useDialogAccessibility";
import { parseVndIntegerFromInput } from "../funds.utils";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useNotification } from "~/components/Notification";
import { useTheme } from "~/hooks/useTheme";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useClubRole } from "~/hooks/useClubRole";
import { extractClubFundErrorMessage } from "~/modules/funds/utils/fundRefundErrors";
import { isFundClosedOnList } from "~/modules/funds/utils/isFundClosedOnList";
import { RecordCashContributionForm } from "~/modules/funds/components/RecordCashContributionForm";
import { canShowRecordCashContributionForm } from "~/modules/funds/utils/fundCashContributionAccess";
import type {
  FundHistoryItem,
  ClubFund,
  FundHistoryScopeFilter,
  FundHistoryStatusFilter,
} from "~/cores/api";
import { fundTokens as t } from "../funds.design-tokens";
import { savePayosPendingContribute } from "~/utils/payosContributeSession";
import { useFundHistory } from "~/modules/funds/hooks/useFundHistory";
import { getClubId } from "~/utils/auth";
import {
  DEFAULT_FUND_HISTORY_PAGE_SIZE,
  FILTER_DEBOUNCE_MS,
  FUND_HISTORY_PAGE_SIZES,
  FUND_HISTORY_SCOPE_OPTIONS,
  FUND_HISTORY_STATUS_OPTIONS,
} from "~/modules/funds/constants/fundHistory";

function resolveMinContributeVnd(): number {
  const raw = import.meta.env.VITE_MIN_FUND_CONTRIBUTE_VND as
    | string
    | undefined;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1000) return Math.floor(n);
  }
  return 10_000;
}

const MIN_FUND_TX_AMOUNT = resolveMinContributeVnd();
function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fundHistorySenderLabel(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };
  return (
    pick("memberName", "MemberName") ||
    pick("contributorName", "ContributorName") ||
    pick("userFullName", "UserFullName") ||
    pick("userName", "UserName") ||
    pick("senderName", "SenderName") ||
    pick("createdByName", "CreatedByName") ||
    pick("requestedBy", "RequestedBy") ||
    "—"
  );
}

function formatFundHistoryDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function fundHistoryStatusLabelVi(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const raw = r.status ?? r.Status;
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!s) return "—";
  if (s === "PENDING") return "Chờ xử lý";
  if (
    s === "APPROVED" ||
    s === "PAID" ||
    s === "COMPLETED" ||
    s === "SUCCESS" ||
    s === "CONFIRMED"
  )
    return "Đã xác nhận";
  if (
    s === "REJECTED" ||
    s === "FAILED" ||
    s === "CANCELLED" ||
    s === "CANCELED"
  )
    return "Từ chối / lỗi";
  return String(raw).trim();
}

function fundHistoryContributionTimeIso(
  item: FundHistoryItem,
): string | undefined {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return undefined;
  };
  return pick(
    "updatedAt",
    "UpdatedAt",
    "transactionDate",
    "TransactionDate",
    "createdAt",
    "CreatedAt",
  );
}

function resolvedFundCurrentBalanceVnd(fund: ClubFund): number | null {
  if (
    typeof fund.currentBalance === "number" &&
    Number.isFinite(fund.currentBalance)
  ) {
    return fund.currentBalance;
  }
  if (typeof fund.balance === "number" && Number.isFinite(fund.balance)) {
    return fund.balance;
  }
  return null;
}

function resolvedFundTotalRecordedVnd(fund: ClubFund): number | null {
  if (
    typeof fund.totalAmount === "number" &&
    Number.isFinite(fund.totalAmount)
  ) {
    return fund.totalAmount;
  }
  return null;
}

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
          className="inline-block w-3 h-3 rounded-full bg-slate-500"
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
          className="inline-block w-3 h-3 rounded-full bg-emerald-500"
          aria-hidden
        />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  if (s === "REJECTED")
    return (
      <span className={t.status.rejected}>
        <span
          className="inline-block w-3 h-3 rounded-full bg-red-500"
          aria-hidden
        />
        <span>{fundStatusLabel(fund)}</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span
        className="inline-block w-3 h-3 rounded-full bg-amber-500"
        aria-hidden
      />
      <span>{fundStatusLabel(fund)}</span>
    </span>
  );
}

export default function FundDetailPageByClub() {
  const navigate = useNavigate();
  const { id: clubIdParam, publicId: publicIdParam } = useParams<{
    id: string;
    publicId: string;
  }>();
  const clubId = parseInt(clubIdParam ?? "0", 10) || getClubId();
  const fundKey = String(publicIdParam ?? "").trim();
  const fundIdFromParam = parseInt(fundKey, 10);
  const isGuidLike =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      fundKey,
    );
  const isParamValid = !!fundKey && (isGuidLike || (!isNaN(fundIdFromParam) && fundIdFromParam > 0));

  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin } = useCurrentUser();
  const { can } = useClubRole();
  const { show: showNotification } = useNotification();

  const [showContribute, setShowContribute] = useState(false);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeDescription, setContributeDescription] = useState("");
  const [showRecordCashModal, setShowRecordCashModal] = useState(false);
  const [contributeResult, setContributeResult] = useState<{
    transactionId: number;
    checkoutUrl?: string;
    paymentLinkId?: string;
    amount?: number;
    paymentLinkExpiresAtUtc?: string;
    message?: string;
  } | null>(null);
  const [payStatus, setPayStatus] = useState<{
    isPaid: boolean;
    isPaymentLinkExpired: boolean;
    status?: string;
    message?: string;
    paymentLinkExpiresAtUtc?: string | null;
  } | null>(null);
  const [contributePollError, setContributePollError] = useState<string | null>(
    null,
  );
  const [contributePollTimedOut, setContributePollTimedOut] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState<number>(
    DEFAULT_FUND_HISTORY_PAGE_SIZE,
  );
  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<FundHistoryStatusFilter>("");
  const [historyScopeFilter, setHistoryScopeFilter] =
    useState<FundHistoryScopeFilter>("");
  const [debouncedStatus, setDebouncedStatus] =
    useState<FundHistoryStatusFilter>("");
  const [debouncedScope, setDebouncedScope] =
    useState<FundHistoryScopeFilter>("");
  const [memberContribTab, setMemberContribTab] = useState<"unpaid" | "paid">(
    "unpaid",
  );
  const [memberContribSearch, setMemberContribSearch] = useState("");
  const [rejectFundOpen, setRejectFundOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  const isInvalidParams =
    !clubIdParam ||
    !publicIdParam ||
    isNaN(clubId) ||
    clubId < 1 ||
    !isParamValid;

  const { data: breadcrumbClub, isLoading: breadcrumbClubLoading } =
    useGetClubByIdQuery(clubId, {
      skip: isInvalidParams || clubId < 1,
    });
  const fundBreadcrumbClubPart =
    breadcrumbClub?.clubName?.trim() ||
    (breadcrumbClubLoading ? "Đang tải…" : "Câu lạc bộ");

  useEffect(() => {
    setHistoryPage(1);
  }, [clubId, fundKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStatus(historyStatusFilter);
      setDebouncedScope(historyScopeFilter);
    }, FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [historyStatusFilter, historyScopeFilter]);

  const {
    data: caps,
    isLoading: capsLoading,
    isError: capsIsError,
    error: capsError,
  } = useGetFundCapabilitiesQuery(clubId, { skip: isInvalidParams });
  const capsErrorStatus =
    capsError && typeof capsError === "object" && "status" in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;
  const capsOtherError = capsIsError && capsErrorStatus !== 403;
  const canViewFunds = caps?.canViewFunds ?? false;
  const canContribute = caps?.canContribute ?? false;
  const canApproveOrRejectFundEntity =
    caps?.canApproveOrRejectFundEntity ?? false;

  const canUseFullFundHistoryFilters = isAdmin || can("viewfinance", clubId);
  const canEditFinancePolicy = can("editfinance", clubId) || can("deletefinance", clubId);
  const canRecordCashContribution = canShowRecordCashContributionForm(
    isAdmin,
    caps,
    canEditFinancePolicy,
  );

  const capsBlocked =
    isInvalidParams || capsLoading || capsForbidden || capsOtherError;
  const skipFundQuery =
    capsBlocked || (caps !== undefined && !canViewFunds && !canContribute);
  const skipHistoryQuery =
    skipFundQuery || (caps !== undefined && !canViewFunds);

  const {
    data: fund,
    isLoading: isLoadingFund,
    error: fundError,
    refetch: refetchFund,
  } = useGetFundByIdQuery({ clubId, fundId: fundKey }, { skip: skipFundQuery });

  const shouldResolveLegacyToGuid = !isGuidLike && Number.isFinite(fundIdFromParam) && fundIdFromParam > 0;
  const { data: fundListForLegacyResolve } = useGetFundsByClubQuery(
    {
      clubId,
      page: 1,
      pageSize: 50,
    },
    { skip: skipFundQuery || !shouldResolveLegacyToGuid },
  );

  useEffect(() => {
    if (!fund || isGuidLike) return;
    const next = String(fund.publicId ?? "").trim();
    if (!next) return;
    void navigate(`/clubs/${clubId}/funds/${next}`, { replace: true });
  }, [clubId, fund, isGuidLike, navigate]);

  useEffect(() => {
    if (!shouldResolveLegacyToGuid || isGuidLike) return;
    const items = fundListForLegacyResolve?.items ?? [];
    const match = items.find((x) => x.fundId === fundIdFromParam);
    const next = String(match?.publicId ?? "").trim();
    if (!next) return;
    void navigate(`/clubs/${clubId}/funds/${next}`, { replace: true });
  }, [
    clubId,
    fundIdFromParam,
    fundListForLegacyResolve,
    isGuidLike,
    navigate,
    shouldResolveLegacyToGuid,
  ]);
  useEffect(() => {
    if (capsLoading || isInvalidParams) return;
    if (!canUseFullFundHistoryFilters && historyScopeFilter === "") {
      setHistoryScopeFilter("mine");
    }
  }, [
    capsLoading,
    canUseFullFundHistoryFilters,
    historyScopeFilter,
    isInvalidParams,
  ]);

  const historyQueryClubId = skipHistoryQuery ? 0 : clubId;
  const resolvedFundId =
    fund?.fundId ??
    (!isNaN(fundIdFromParam) && fundIdFromParam > 0 ? fundIdFromParam : 0);
  const historyQueryFundId = skipHistoryQuery ? 0 : resolvedFundId;

  const skipMemberContribQuery =
    skipFundQuery ||
    (caps !== undefined && !canViewFunds) ||
    isLoadingFund ||
    resolvedFundId < 1;

  const {
    data: memberContrib,
    isLoading: isLoadingMemberContrib,
    isError: isMemberContribError,
    error: memberContribError,
    refetch: refetchMemberContrib,
  } = useGetFundMemberContributionsQuery(
    { clubId, fundId: resolvedFundId },
    { skip: skipMemberContribQuery },
  );

  const requiredPerMember = (memberContrib as any)?.requiredPerMember ?? null;
  const goalAmount = (memberContrib as any)?.goalAmount ?? null;
  const hasGoal =
    (typeof goalAmount === "number" ? goalAmount : 0) > 0 &&
    (typeof requiredPerMember === "number" ? requiredPerMember : 0) > 0;

  const filteredMemberRows = useMemo(() => {
    const list = Array.isArray((memberContrib as any)?.members)
      ? ((memberContrib as any).members as any[])
      : [];
    const q = memberContribSearch.trim().toLowerCase();
    let rows = q
      ? list.filter((m) => {
          const name = String(m?.fullName ?? "").toLowerCase();
          const email = String(m?.email ?? "").toLowerCase();
          return name.includes(q) || email.includes(q);
        })
      : list;
    if (hasGoal) {
      rows =
        memberContribTab === "paid"
          ? rows.filter((m) => m?.isPaidEnough === true)
          : rows.filter((m) => m?.isPaidEnough !== true);
      rows = [...rows].sort((a, b) => {
        if (memberContribTab === "paid")
          return (Number(b?.paidAmount) || 0) - (Number(a?.paidAmount) || 0);
        return (
          (Number(b?.remainingAmount) || 0) - (Number(a?.remainingAmount) || 0)
        );
      });
    } else {
      rows = [...rows].sort(
        (a, b) => (Number(b?.paidAmount) || 0) - (Number(a?.paidAmount) || 0),
      );
    }
    return rows;
  }, [memberContrib, memberContribSearch, memberContribTab, hasGoal]);

  const {
    items: history,
    paging: historyMeta,
    loading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useFundHistory({
    clubId: historyQueryClubId,
    fundId: historyQueryFundId,
    page: historyPage,
    pageSize: historyPageSize,
    status: canUseFullFundHistoryFilters ? debouncedStatus : "",
    scope: canUseFullFundHistoryFilters ? debouncedScope : "mine",
  });
  const [approveFund, { isLoading: isApprovingFund }] =
    useApproveFundMutation();
  const [contributeToFund, { isLoading: isContributing }] =
    useContributeToFundMutation();
  const [fetchPayStatus] = useLazyGetContributeTransactionStatusQuery();

  const isFundApproved =
    fund && String(fund.status ?? "").toUpperCase() === "APPROVED";
  const isFundPending =
    fund && String(fund.status ?? "").toUpperCase() === "PENDING";
  const canShowContributeBtn =
    !!fund &&
    canContribute &&
    fund.canAcceptContributions === true &&
    !isFundClosedOnList(fund);
  const isUnauthorized =
    fundError && "status" in fundError && fundError.status === 401;

  const bgClass = isDark ? "bg-[#0f1729]" : "bg-slate-50";
  const textClass = isDark ? "text-slate-50" : "text-slate-900";
  const inputClass = isDark
    ? "bg-[#0f1729] border-slate-600 text-slate-50 placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";

  const resetContributeForm = useCallback(() => {
    setContributeAmount("");
    setContributeDescription("");
    setContributeResult(null);
    setPayStatus(null);
    setContributePollError(null);
    setContributePollTimedOut(false);
  }, []);

  const closeContributeModal = useCallback(() => {
    setShowContribute(false);
    resetContributeForm();
  }, [resetContributeForm]);

  const closeRejectFundModal = useCallback(() => {
    setRejectFundOpen(false);
    setRejectReasonInput("");
  }, []);

  const contributeDialogRef = useDialogAccessibility(
    showContribute,
    closeContributeModal,
  );
  const closeRecordCashModal = useCallback(() => {
    setShowRecordCashModal(false);
  }, []);
  const openRecordCashModal = useCallback(() => {
    setShowContribute(false);
    setShowRecordCashModal(true);
  }, []);
  const recordCashDialogRef = useDialogAccessibility(
    showRecordCashModal,
    closeRecordCashModal,
  );
  const rejectFundDialogRef = useDialogAccessibility(
    rejectFundOpen,
    closeRejectFundModal,
  );

  const paymentExpiresUtc =
    payStatus?.paymentLinkExpiresAtUtc ??
    contributeResult?.paymentLinkExpiresAtUtc;
  const paymentExpiryMs = paymentExpiresUtc
    ? Date.parse(paymentExpiresUtc)
    : NaN;
  const linkExpiryRemainingSec = Number.isFinite(paymentExpiryMs)
    ? Math.max(0, Math.floor((paymentExpiryMs - nowTick) / 1000))
    : null;

  useEffect(() => {
    if (!showContribute || !contributeResult) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [showContribute, contributeResult]);

  useEffect(() => {
    if (!showContribute || !contributeResult?.transactionId || clubId < 1)
      return;

    let cancelled = false;
    let intervalId: number | undefined;

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    let pollCount = 0;
    let inFlight = false;
    const maxPolls = 48;
    const intervalMs = 2500;
    const tid = contributeResult.transactionId;

    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      pollCount += 1;
      try {
        const s = await fetchPayStatus({ clubId, transactionId: tid }).unwrap();
        if (cancelled) return;
        setContributePollError(null);
        setPayStatus({
          isPaid: s.isPaid,
          isPaymentLinkExpired: s.isPaymentLinkExpired,
          status: s.status,
          message: s.message,
          paymentLinkExpiresAtUtc: s.paymentLinkExpiresAtUtc,
        });
        if (s.isPaid) {
          stop();
          void refetchFund();
          void refetchHistory();
          showNotification({
            type: "success",
            title: "Thanh toán đã xác nhận",
            message:
              s.message || "PayOS đã xác nhận — số dư quỹ đã được cập nhật.",
          });
          return;
        }
        if (s.isPaymentLinkExpired && !s.isPaid) {
          stop();
          return;
        }
        if (pollCount >= maxPolls) {
          setContributePollTimedOut(true);
          stop();
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const st =
          typeof err === "object" && err && "status" in err
            ? (err as { status: number }).status
            : undefined;
        if (st === 404) {
          setContributePollError(
            "Không tìm thấy giao dịch hoặc giao dịch không thuộc tài khoản của bạn.",
          );
        } else {
          setContributePollError(
            "Không kiểm tra được trạng thái thanh toán. Thử lại sau.",
          );
        }
        stop();
      } finally {
        inFlight = false;
      }
    };

    void tick();
    intervalId = window.setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      stop();
    };
  }, [
    showContribute,
    contributeResult?.transactionId,
    clubId,
    fetchPayStatus,
    refetchFund,
    refetchHistory,
    showNotification,
  ]);

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !resolvedFundId) return;
    const parsed = parseVndIntegerFromInput(contributeAmount);
    if (!parsed.ok) {
      showNotification({
        type: "error",
        title: "Số tiền không hợp lệ",
        message: parsed.message,
      });
      return;
    }
    const amount = parsed.amount;
    if (amount < MIN_FUND_TX_AMOUNT) {
      showNotification({
        type: "error",
        title: "Số tiền không hợp lệ",
        message: `Số tiền tối thiểu là ${MIN_FUND_TX_AMOUNT.toLocaleString("vi-VN")} ₫.`,
      });
      return;
    }

    try {
      const res = await contributeToFund({
        clubId,
        fundId: resolvedFundId,
        amount,
        description: contributeDescription.trim() || undefined,
      }).unwrap();

      savePayosPendingContribute({
        clubId,
        transactionId: res.transactionId,
        fundId: resolvedFundId,
        publicId: fund?.publicId ?? fundKey,
      });

      setPayStatus(null);
      setContributePollError(null);
      setContributePollTimedOut(false);
      setContributeResult({
        transactionId: res.transactionId,
        checkoutUrl: res.checkoutUrl,
        paymentLinkId: res.paymentLinkId,
        amount: res.amount,
        paymentLinkExpiresAtUtc: res.paymentLinkExpiresAtUtc,
        message: res.message,
      });
      if (res.checkoutUrl && typeof window !== "undefined") {
        window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      showNotification({
        type: "success",
        title: "Đã tạo yêu cầu thanh toán",
        message:
          (res.checkoutUrl
            ? "Đã mở trang PayOS trong tab mới. Nếu không thấy tab, bấm nút cam bên dưới. "
            : "") +
          (res.message || "Quỹ chỉ tăng sau khi thanh toán được xác nhận."),
      });
    } catch (err: unknown) {
      console.error("Contribute failed:", err);
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        (err as { message?: string })?.message ||
        "Không thể tạo giao dịch nộp tiền.";
      showNotification({ type: "error", title: "Lỗi", message: msg });
    }
  };

  const isContributePaid = payStatus?.isPaid === true;
  const isPaymentLinkExpired = !!(
    payStatus?.isPaymentLinkExpired && !payStatus?.isPaid
  );
  const showContributeFormFields =
    !contributeResult ||
    isContributePaid ||
    isPaymentLinkExpired ||
    contributePollTimedOut ||
    !!contributePollError;

  const isHistoryControlDisabled = isLoadingHistory || skipHistoryQuery;

  if (isInvalidParams) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <p className={t.type.body}>Đường dẫn không hợp lệ.</p>
        <Link to="/funds" className={`${t.btn.secondary} !min-h-0 !py-2`}>
          Quay lại danh sách quỹ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        currentPath={clubIdParam ? `/clubs/${clubId}/funds` : "/club/funds"}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      <HeaderBar
        title={fund?.fundName?.trim() || "Chi tiết quỹ"}
        breadcrumb={`Tài chính / Quản lý quỹ / ${fundBreadcrumbClubPart} / Chi tiết`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <nav aria-label="Điều hướng quỹ">
            <Link
              to="/funds"
              className={`${t.btn.secondary} inline-flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <ChevronLeft
                className="w-4 h-4 shrink-0"
                strokeWidth={2.25}
                aria-hidden
              />
              Quay lại danh sách quỹ
            </Link>
          </nav>

          {!capsLoading && caps?.financeAccessHintVi?.trim() ? (
            <FinanceAccessHintBanner message={caps.financeAccessHintVi} />
          ) : null}

          {capsLoading ? (
            <section
              className={`${t.card.base} p-12 text-center`}
              aria-busy="true"
              aria-live="polite"
            >
              <p className={t.type.body}>Đang kiểm tra quyền truy cập quỹ...</p>
            </section>
          ) : capsForbidden ? (
            <section className={`${t.card.base} p-6`} role="alert">
              <p className={t.type.body}>
                Bạn không thuộc CLB này hoặc không có quyền truy cập module quỹ.
              </p>
              <Link
                to="/funds"
                className={`mt-2 inline-block ${t.btn.secondary} !min-h-0 !py-2`}
              >
                Quay lại danh sách quỹ
              </Link>
            </section>
          ) : capsOtherError ? (
            <section
              className={`${t.card.base} border-red-200 dark:border-red-800/70 p-6`}
              role="alert"
            >
              <p className="text-red-600 dark:text-red-400">
                Không tải được quyền quỹ (capabilities).
              </p>
              <Link
                to="/funds"
                className={`mt-2 inline-block ${t.btn.secondary} !min-h-0 !py-2`}
              >
                Quay lại danh sách quỹ
              </Link>
            </section>
          ) : !canViewFunds && !canContribute ? (
            <section className={`${t.card.base} p-6`} role="alert">
              <p className={t.type.body}>
                Bạn không có quyền xem quỹ hoặc nộp tiền vào quỹ của CLB này.
              </p>
              <Link
                to="/funds"
                className={`mt-2 inline-block ${t.btn.secondary} !min-h-0 !py-2`}
              >
                Quay lại danh sách quỹ
              </Link>
            </section>
          ) : isLoadingFund ? (
            <section
              className={`${t.card.base} p-12 text-center`}
              aria-busy="true"
              aria-live="polite"
            >
              <p className={t.type.body}>Đang tải thông tin quỹ...</p>
            </section>
          ) : fundError || !fund ? (
            <section
              className={`${t.card.base} border-red-200 dark:border-red-800/70 p-6`}
              role="alert"
            >
              <p className="text-red-600 dark:text-red-400">
                {fundError &&
                typeof fundError === "object" &&
                "status" in fundError &&
                fundError.status === 403
                  ? "Bạn không có quyền xem quỹ này."
                  : "Không tải được thông tin quỹ."}
              </p>
              <Link
                to="/funds"
                className={`mt-2 inline-block ${t.btn.secondary} !min-h-0 !py-2`}
              >
                Quay lại danh sách quỹ
              </Link>
            </section>
          ) : (
            <>
              {isFundPending && (
                <section
                  className={`${t.card.base} overflow-hidden`}
                  aria-labelledby="approval-heading"
                >
                  <div
                    className={`${t.space.card} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300"
                        aria-hidden
                      >
                        <Gavel className="w-5 h-5" aria-hidden />
                      </div>
                      <div>
                        <h2
                          id="approval-heading"
                          className={t.type.sectionTitle}
                        >
                          Thao tác duyệt quỹ
                        </h2>
                        <p className={`mt-0.5 ${t.type.body}`}>
                          {canApproveOrRejectFundEntity
                            ? "Bạn có quyền duyệt quỹ này. Chọn Duyệt quỹ hoặc Từ chối quỹ bên dưới."
                            : "Quỹ này đang chờ người có quyền duyệt trong câu lạc bộ xử lý."}
                        </p>
                      </div>
                    </div>
                    {canApproveOrRejectFundEntity && (
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button
                          type="button"
                          disabled={isApprovingFund}
                          onClick={async () => {
                            try {
                              await approveFund({
                                clubId,
                                fundId: fund.fundId,
                                action: "APPROVE",
                              }).unwrap();
                              showNotification({
                                type: "success",
                                title: "Đã duyệt quỹ",
                                message: `${fund.fundName?.trim() || "Quỹ"} đã được duyệt.`,
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
                          className={`${t.btn.primary} inline-flex items-center gap-2`}
                        >
                          Duyệt quỹ
                        </button>
                        <button
                          type="button"
                          disabled={isApprovingFund}
                          onClick={() => setRejectFundOpen(true)}
                          className={`${t.btn.danger} inline-flex items-center gap-2`}
                        >
                          Từ chối quỹ
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section
                className={`${t.card.base} ${t.space.card}`}
                aria-labelledby="fund-info-heading"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 id="fund-info-heading" className={t.type.pageTitle}>
                      {fund.fundName?.trim() || "Quỹ"}
                    </h1>
                    <p className={`mt-1 ${t.type.muted}`}>
                      {fund.description || "Không có mô tả"}
                    </p>
                    <div className="mt-3">
                      <FundStatusBadge fund={fund} />
                    </div>
                    {(() => {
                      const cur = resolvedFundCurrentBalanceVnd(fund);
                      const totalRec = resolvedFundTotalRecordedVnd(fund);
                      const showTotalExtra =
                        cur != null &&
                        totalRec != null &&
                        Math.abs(totalRec - cur) > 0.01;
                      if (cur == null && totalRec == null) return null;
                      const balHintCur =
                        cur != null
                          ? resolveFundBalanceHoverTextVi(fund, cur)
                          : undefined;
                      const balHintTotal =
                        cur == null && totalRec != null
                          ? resolveFundBalanceHoverTextVi(fund, totalRec)
                          : undefined;
                      return (
                        <div className={`mt-2 space-y-1 ${textClass}`}>
                          {cur != null ? (
                            <p className="text-lg font-semibold flex flex-wrap items-baseline gap-1.5">
                              <span
                                title={balHintCur || undefined}
                                className={
                                  balHintCur ? "cursor-help" : undefined
                                }
                              >
                                Số dư quỹ: {cur.toLocaleString("vi-VN")} ₫
                              </span>
                              {balHintCur ? (
                                <span
                                  className="inline-flex text-slate-400 dark:text-slate-500"
                                  title={balHintCur}
                                  aria-label={balHintCur}
                                >
                                  <Info className="w-4 h-4" aria-hidden />
                                </span>
                              ) : null}
                            </p>
                          ) : totalRec != null ? (
                            <p className="text-lg font-semibold flex flex-wrap items-baseline gap-1.5">
                              <span
                                title={balHintTotal || undefined}
                                className={
                                  balHintTotal ? "cursor-help" : undefined
                                }
                              >
                                Tổng đã ghi nhận:{" "}
                                {totalRec.toLocaleString("vi-VN")} ₫
                              </span>
                              {balHintTotal ? (
                                <span
                                  className="inline-flex text-slate-400 dark:text-slate-500"
                                  title={balHintTotal}
                                  aria-label={balHintTotal}
                                >
                                  <Info className="w-4 h-4" aria-hidden />
                                </span>
                              ) : null}
                            </p>
                          ) : null}
                          {showTotalExtra && totalRec != null ? (
                            <p className={`text-sm ${t.type.muted}`}>
                              Tổng đã ghi nhận:{" "}
                              {totalRec.toLocaleString("vi-VN")} ₫
                            </p>
                          ) : null}
                        </div>
                      );
                    })()}
                    {fund.expiresAt ? (
                      <p className={`mt-2 text-sm ${t.type.muted}`}>
                        Hạn nhận nộp tiền:{" "}
                        {new Date(fund.expiresAt).toLocaleDateString("vi-VN")}
                      </p>
                    ) : null}
                    {isFundApproved &&
                    canContribute &&
                    fund.canAcceptContributions === false ? (
                      <p
                        className={`mt-2 text-sm text-amber-800 dark:text-amber-200/90`}
                      >
                        {fund.cannotContributeReasonVi?.trim() ||
                          "Quỹ hiện không nhận nộp tiền (hết hạn hoặc đã đóng nhận nộp)."}
                      </p>
                    ) : null}
                    {canContribute && !canViewFunds ? (
                      <p className={`mt-2 text-sm ${t.type.muted}`}>
                        Bạn có thể nộp tiền; lịch sử và danh mục nộp chỉ dành
                        cho thành viên có quyền xem tài chính.
                      </p>
                    ) : null}
                  </div>
                  {isFundApproved && (canContribute || canRecordCashContribution) && (
                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                      {canShowContributeBtn ? (
                        <button
                          type="button"
                          onClick={() => setShowContribute(true)}
                          className={`${t.btn.primary} inline-flex items-center gap-2`}
                        >
                          <HandCoins className="w-4 h-4" aria-hidden />
                          Nộp tiền
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className={`${t.btn.primary} inline-flex items-center gap-2 opacity-60 cursor-not-allowed`}
                          title={
                            isFundClosedOnList(fund)
                              ? fund.lifecycleStatusVi?.trim() ||
                                fund.cannotContributeReasonVi?.trim() ||
                                "Quỹ đã đóng"
                              : fund.cannotContributeReasonVi?.trim() || undefined
                          }
                        >
                          <HandCoins className="w-4 h-4" aria-hidden />
                          Nộp tiền
                        </button>
                      )}
                      {canRecordCashContribution && !isFundClosedOnList(fund) ? (
                        <button
                          type="button"
                          onClick={openRecordCashModal}
                          className={`${t.btn.secondary} inline-flex items-center justify-center gap-2`}
                        >
                          <Banknote className="w-4 h-4 shrink-0" aria-hidden />
                          Ghi nhận tiền mặt
                        </button>
                      ) : canRecordCashContribution && isFundClosedOnList(fund) ? (
                        <button
                          type="button"
                          disabled
                          className={`${t.btn.secondary} inline-flex items-center justify-center gap-2 opacity-60 cursor-not-allowed`}
                          title={fund.lifecycleStatusVi?.trim() || "Quỹ đã đóng"}
                        >
                          <Banknote className="w-4 h-4 shrink-0" aria-hidden />
                          Ghi nhận tiền mặt
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>

              {canViewFunds && !isFundClosedOnList(fund) ? (
                <section
                  className={`${t.card.base} overflow-hidden`}
                  aria-labelledby="fund-member-contrib-heading"
                >
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3
                          id="fund-member-contrib-heading"
                          className={t.type.sectionTitle}
                        >
                          Thống kê đóng góp
                        </h3>
                      </div>
                      {isLoadingMemberContrib ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${t.type.muted}`}
                          aria-live="polite"
                        >
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin"
                            aria-hidden
                          />
                          Đang tải...
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {isMemberContribError ? (
                      <div
                        className="p-4 rounded-xl text-sm space-y-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200"
                        role="alert"
                      >
                        <p>
                          {extractClubFundErrorMessage(memberContribError) ??
                            "Không thể tải thống kê đóng góp. Vui lòng thử lại."}
                        </p>
                        <button
                          type="button"
                          onClick={() => refetchMemberContrib()}
                          className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs`}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : null}

                    {memberContrib ? (
                      <>
                        {hasGoal ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <p className={`text-xs ${t.type.muted}`}>
                                Mục tiêu quỹ
                              </p>
                              <p className="mt-1 text-lg font-semibold">
                                {(Number(goalAmount) || 0).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                ₫
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <p className={`text-xs ${t.type.muted}`}>
                                Mỗi thành viên cần đóng
                              </p>
                              <p className="mt-1 text-lg font-semibold">
                                {(Number(requiredPerMember) || 0).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                ₫
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <p className={`text-xs ${t.type.muted}`}>
                                Tổng đã đóng
                              </p>
                              <p className="mt-1 text-lg font-semibold">
                                {(
                                  Number(
                                    (memberContrib as any)
                                      ?.totalApprovedMemberContributions,
                                  ) || 0
                                ).toLocaleString("vi-VN")}{" "}
                                ₫
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                          <div className="flex-1">
                            <label
                              className={`block ${t.type.label} mb-1.5`}
                              htmlFor="member-contrib-search"
                            >
                              Tìm theo tên/email
                            </label>
                            <input
                              id="member-contrib-search"
                              value={memberContribSearch}
                              onChange={(e) =>
                                setMemberContribSearch(e.target.value)
                              }
                              className={t.input}
                              placeholder="Nhập..."
                            />
                          </div>
                          {hasGoal ? (
                            <div className="flex gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-1">
                              <button
                                type="button"
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                  memberContribTab === "unpaid"
                                    ? "bg-violet-600 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                onClick={() => setMemberContribTab("unpaid")}
                              >
                                Chưa đủ
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                  memberContribTab === "paid"
                                    ? "bg-violet-600 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                onClick={() => setMemberContribTab("paid")}
                              >
                                Đã đủ
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div
                          className="overflow-x-auto"
                          role="region"
                          aria-label="Danh sách đóng góp theo member"
                        >
                          <table className="w-full min-w-[880px]">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800">
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Thành viên
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Đã đóng
                                </th>
                                {hasGoal ? (
                                  <>
                                    <th
                                      scope="col"
                                      className="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                      Cần đóng
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                      Còn thiếu
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                      Trạng thái
                                    </th>
                                  </>
                                ) : null}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredMemberRows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={hasGoal ? 5 : 2}
                                    className={`px-4 py-6 text-sm ${t.type.muted}`}
                                  >
                                    Không có dữ liệu phù hợp.
                                  </td>
                                </tr>
                              ) : (
                                filteredMemberRows.map((m) => (
                                  <tr
                                    key={String(m?.userId ?? m?.email ?? "")}
                                    className="border-b border-slate-200 dark:border-slate-700"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-slate-800 dark:text-slate-100">
                                        {String(m?.fullName ?? "").trim() ||
                                          "—"}
                                      </div>
                                      <div className={`text-xs ${t.type.muted}`}>
                                        {String(m?.email ?? "").trim() || "—"}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">
                                      {(Number(m?.paidAmount) || 0).toLocaleString(
                                        "vi-VN",
                                      )}{" "}
                                      ₫
                                    </td>
                                    {hasGoal ? (
                                      <>
                                        <td className="px-4 py-3 text-right">
                                          {(
                                            Number(m?.requiredAmount) ||
                                            Number(requiredPerMember) ||
                                            0
                                          ).toLocaleString("vi-VN")}{" "}
                                          ₫
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          {(
                                            Number(m?.remainingAmount) || 0
                                          ).toLocaleString("vi-VN")}{" "}
                                          ₫
                                        </td>
                                        <td className="px-4 py-3">
                                          {m?.isPaidEnough ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                                              Đã đủ
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                              Chưa đủ
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    ) : null}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {canViewFunds && !isFundClosedOnList(fund) ? (
                <section
                  className={`${t.card.base} overflow-hidden`}
                  aria-labelledby="fund-tabs-heading"
                >
                  <h2 id="fund-tabs-heading" className="sr-only">
                    Lịch sử quỹ
                  </h2>
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className={t.type.sectionTitle}>Lịch sử nộp tiền</h3>
                      {isLoadingHistory ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${t.type.muted}`}
                          aria-live="polite"
                        >
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin"
                            aria-hidden
                          />
                          Đang tải...
                        </span>
                      ) : null}
                    </div>
                    {(() => {
                      const hint = !canUseFullFundHistoryFilters
                        ? "Chỉ hiển thị các lần bạn đã nộp tiền và thanh toán thành công (đã vào quỹ)."
                        : debouncedStatus === "ALL"
                          ? "Đang hiển thị mọi trạng thái theo bộ lọc."
                          : debouncedStatus === "PENDING" ||
                              debouncedStatus === "REJECTED"
                            ? "Theo trạng thái giao dịch đã chọn."
                            : null;
                      return hint ? (
                        <p className={`text-xs ${t.type.muted}`}>{hint}</p>
                      ) : null;
                    })()}
                  </div>
                  <div className="p-4" aria-labelledby="fund-tabs-heading">
                    <div
                      className={`mb-4 grid grid-cols-1 gap-3 ${
                        canUseFullFundHistoryFilters
                          ? "md:grid-cols-3"
                          : "md:grid-cols-1 sm:max-w-xs"
                      }`}
                    >
                      {canUseFullFundHistoryFilters ? (
                        <>
                          <label className="flex flex-col gap-1 text-sm">
                            <span className={t.type.muted}>Trạng thái</span>
                            <select
                              value={historyStatusFilter}
                              onChange={(e) => {
                                setHistoryStatusFilter(
                                  e.target.value as FundHistoryStatusFilter,
                                );
                                setHistoryPage(1);
                              }}
                              disabled={isHistoryControlDisabled}
                              className={`${t.input} ${inputClass}`}
                            >
                              {FUND_HISTORY_STATUS_OPTIONS.map((opt) => (
                                <option
                                  key={
                                    opt.value === ""
                                      ? "default-paid"
                                      : opt.value
                                  }
                                  value={opt.value}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-sm">
                            <span className={t.type.muted}>Phạm vi</span>
                            <select
                              value={historyScopeFilter}
                              onChange={(e) => {
                                setHistoryScopeFilter(
                                  e.target.value as FundHistoryScopeFilter,
                                );
                                setHistoryPage(1);
                              }}
                              disabled={isHistoryControlDisabled}
                              className={`${t.input} ${inputClass}`}
                            >
                              {FUND_HISTORY_SCOPE_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value || "all"}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      ) : null}

                      <label className="flex flex-col gap-1 text-sm">
                        <span className={t.type.muted}>Số dòng mỗi trang</span>
                        <select
                          value={historyPageSize}
                          onChange={(e) => {
                            setHistoryPageSize(Number(e.target.value));
                            setHistoryPage(1);
                          }}
                          disabled={isHistoryControlDisabled}
                          className={`${t.input} ${inputClass}`}
                        >
                          {FUND_HISTORY_PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {isUnauthorized ? (
                      <div
                        className={`p-4 bg-slate-100 dark:bg-slate-800 rounded-xl ${t.type.body}`}
                      >
                        Phiên đăng nhập hết hạn.{" "}
                        <Link
                          to="/auth/login"
                          className="underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
                        >
                          Đăng nhập lại
                        </Link>
                      </div>
                    ) : isLoadingHistory && history.length === 0 ? (
                      <div
                        className="space-y-2"
                        aria-busy="true"
                        aria-live="polite"
                      >
                        <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      </div>
                    ) : historyError ? (
                      <div
                        className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-200 text-sm space-y-2"
                        role="alert"
                      >
                        <p>
                          {historyError ||
                            "Không thể tải lịch sử quỹ. Vui lòng thử lại."}
                        </p>
                        <button
                          type="button"
                          onClick={() => refetchHistory()}
                          className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs`}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (historyMeta?.totalCount ?? 0) === 0 ? (
                      <p className={`${t.type.muted} py-4`}>Chưa có lịch sử.</p>
                    ) : (
                      <>
                        <div
                          className="overflow-x-auto"
                          role="region"
                          aria-label="Bảng lịch sử giao dịch quỹ"
                        >
                          <table className="w-full min-w-[900px]">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800">
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Người gửi
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Số tiền
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Trạng thái
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Mô tả
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                  Thời gian nộp
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className={`px-4 py-6 text-center ${t.type.muted}`}
                                  >
                                    Không có giao dịch trên trang này.
                                  </td>
                                </tr>
                              ) : (
                                history.map((item) => (
                                  <tr
                                    key={
                                      item.transactionId ??
                                      item.id ??
                                      `${item.fundId}-${item.createdAt}-${item.updatedAt}`
                                    }
                                    className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                                  >
                                    <td className={`px-4 py-2 ${t.type.body}`}>
                                      {fundHistorySenderLabel(item)}
                                    </td>
                                    <td
                                      className={`px-4 py-2 ${t.type.body} whitespace-nowrap`}
                                    >
                                      {item.amount != null
                                        ? `${Number(item.amount).toLocaleString("vi-VN")} ₫`
                                        : "—"}
                                    </td>
                                    <td
                                      className={`px-4 py-2 text-sm ${t.type.body} whitespace-nowrap`}
                                    >
                                      {fundHistoryStatusLabelVi(item)}
                                    </td>
                                    <td className={`px-4 py-2 ${t.type.body}`}>
                                      {item.description?.trim()
                                        ? item.description
                                        : "—"}
                                    </td>
                                    <td
                                      className={`px-4 py-2 text-sm ${t.type.muted} whitespace-nowrap`}
                                    >
                                      {formatFundHistoryDateTime(
                                        fundHistoryContributionTimeIso(item),
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {historyMeta && (historyMeta.totalPages ?? 0) > 0 ? (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <p className={`text-sm ${t.type.muted}`}>
                              {(historyMeta.totalCount ?? 0).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              giao dịch · Trang {historyMeta.pageNumber}
                              {(historyMeta.totalPages ?? 0) > 0
                                ? ` / ${historyMeta.totalPages}`
                                : ""}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={
                                  isHistoryControlDisabled ||
                                  !historyMeta.hasPreviousPage
                                }
                                onClick={() =>
                                  setHistoryPage((p) => Math.max(1, p - 1))
                                }
                                className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                                aria-label="Trang trước"
                              >
                                <ChevronLeft
                                  className="w-4 h-4 shrink-0"
                                  aria-hidden
                                />
                                Trước
                              </button>
                              <button
                                type="button"
                                disabled={
                                  isHistoryControlDisabled ||
                                  !historyMeta.hasNextPage
                                }
                                onClick={() => setHistoryPage((p) => p + 1)}
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
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      {showContribute && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
          role="presentation"
          aria-hidden={rejectFundOpen}
        >
          <div
            ref={contributeDialogRef}
            className={`${t.card.base} w-full max-w-md max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:max-w-lg outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribute-title"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="contribute-title" className={t.type.sectionTitle}>
                Nộp tiền
              </h2>
              <button
                type="button"
                onClick={closeContributeModal}
                className={t.btn.ghost}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <form
              onSubmit={handleContributeSubmit}
              className={`px-6 py-4 ${t.space.section}`}
            >
              {contributeResult && (
                <div
                  className={`rounded-xl border p-4 space-y-3 ${
                    isContributePaid
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-900/10"
                      : isPaymentLinkExpired || contributePollError
                        ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-900/10"
                        : "border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-900/10"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <div className={`text-sm ${textClass}`}>
                    <span className="font-semibold">Giao dịch</span> #
                    {contributeResult.transactionId}
                    {typeof contributeResult.amount === "number" ? (
                      <span className="ml-2 text-slate-600 dark:text-slate-300">
                        — {contributeResult.amount.toLocaleString("vi-VN")} ₫
                      </span>
                    ) : null}
                  </div>

                  {isContributePaid ? (
                    <p className={`text-sm ${t.type.body}`}>
                      Đã xác nhận thanh toán. Có thể đóng cửa sổ và kiểm tra số
                      dư.
                    </p>
                  ) : !contributePollError &&
                    !contributePollTimedOut &&
                    !isPaymentLinkExpired ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Loader2
                        className="w-4 h-4 animate-spin shrink-0"
                        aria-hidden
                      />
                      <span>Đang chờ xác nhận…</span>
                      <span className="sr-only">
                        Hệ thống đang kiểm tra trạng thái thanh toán.
                      </span>
                    </div>
                  ) : null}

                  {!isContributePaid &&
                  linkExpiryRemainingSec != null &&
                  linkExpiryRemainingSec > 0 &&
                  linkExpiryRemainingSec <= 900 ? (
                    <p className={`text-xs ${t.type.muted}`}>
                      Hiệu lực link còn ~
                      {formatCountdown(linkExpiryRemainingSec)}.
                    </p>
                  ) : null}

                  {contributePollError ? (
                    <p
                      className="text-sm text-red-700 dark:text-red-300"
                      role="alert"
                    >
                      {contributePollError}
                    </p>
                  ) : null}
                  {contributePollTimedOut &&
                  !isContributePaid &&
                  !contributePollError ? (
                    <p className={`text-xs ${t.type.muted}`}>
                      Chưa thấy xác nhận ngay — thử làm mới hoặc xem lịch sử
                      quỹ; webhook có thể chậm vài phút.
                    </p>
                  ) : null}
                  {isPaymentLinkExpired && !isContributePaid ? (
                    <p className={`text-xs text-amber-800 dark:text-amber-200`}>
                      Link thanh toán đã hết hạn — chọn &quot;Tạo giao dịch
                      khác&quot;.
                    </p>
                  ) : null}

                  {contributeResult.checkoutUrl ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <a
                        href={contributeResult.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                          isContributePaid
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        {isContributePaid ? "Mở PayOS" : "Mở lại trang PayOS"}
                      </a>
                      <button
                        type="button"
                        className={`${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs`}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              contributeResult.checkoutUrl || "",
                            );
                            showNotification({
                              type: "success",
                              title: "Đã copy",
                              message: "Đã copy liên kết thanh toán.",
                            });
                          } catch {
                            showNotification({
                              type: "error",
                              title: "Không thể copy",
                              message:
                                "Trình duyệt không cho phép copy tự động.",
                            });
                          }
                        }}
                      >
                        Copy link
                      </button>
                    </div>
                  ) : null}
                  {contributeResult.checkoutUrl && !isContributePaid ? (
                    <p
                      className={`text-xs text-center sm:text-left ${t.type.muted}`}
                    >
                      Thanh toán trên trang PayOS. Tab mới đã được mở — nếu
                      không thấy, dùng nút cam.
                    </p>
                  ) : null}
                </div>
              )}

              {showContributeFormFields ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label
                        htmlFor="contribute-amount"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Số tiền
                      </label>
                      <div className="relative">
                        <span
                          className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400"
                          aria-hidden
                        >
                          VND
                        </span>
                        <input
                          id="contribute-amount"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={contributeAmount}
                          onChange={(e) => setContributeAmount(e.target.value)}
                          className={`${t.input} pl-11 ${inputClass}`}
                          placeholder={`Tối thiểu ${MIN_FUND_TX_AMOUNT.toLocaleString("vi-VN")}`}
                          aria-describedby="contribute-amount-hint"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="contribute-desc"
                        className={`block ${t.type.label} mb-1.5`}
                      >
                        Ghi chú (tuỳ chọn)
                      </label>
                      <input
                        id="contribute-desc"
                        value={contributeDescription}
                        onChange={(e) =>
                          setContributeDescription(e.target.value)
                        }
                        className={`${t.input} ${inputClass}`}
                        placeholder="VD: Nộp quỹ tháng 3"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                {showContributeFormFields ? (
                  <button
                    type="submit"
                    disabled={isContributing}
                    className={t.btn.primary}
                  >
                    {isContributing ? "Đang tạo…" : "Tạo thanh toán"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeContributeModal}
                  className={t.btn.secondary}
                >
                  Hủy
                </button>
                {contributeResult ? (
                  <button
                    type="button"
                    onClick={() => resetContributeForm()}
                    className={t.btn.ghost}
                  >
                    Tạo giao dịch khác
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecordCashModal && fund ? (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
          role="presentation"
          aria-hidden={rejectFundOpen}
        >
          <div
            ref={recordCashDialogRef}
            className={`${t.card.base} w-full max-w-md max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:max-w-lg outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-cash-title"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="record-cash-title" className={t.type.sectionTitle}>
                Ghi nhận đóng quỹ tiền mặt
              </h2>
              <button
                type="button"
                onClick={closeRecordCashModal}
                className={t.btn.ghost}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="px-6 py-4">
              <RecordCashContributionForm
                key={`${clubId}-${fund.fundId}`}
                clubId={clubId}
                presetFundId={fund.fundId}
                fundLabel={fund.fundName || `Quỹ #${fund.fundId}`}
                isDark={isDark}
                embeddedInModal
                onRecorded={() => {
                  void refetchFund();
                  void refetchHistory();
                  closeRecordCashModal();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {rejectFundOpen && fund ? (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4"
          role="presentation"
        >
          <div
            ref={rejectFundDialogRef}
            className={`${t.card.base} w-full max-w-md rounded-2xl shadow-xl outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-fund-heading"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="reject-fund-heading" className={t.type.sectionTitle}>
                Từ chối quỹ
              </h2>
              <button
                type="button"
                onClick={closeRejectFundModal}
                className={t.btn.ghost}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className={`px-6 py-4 ${textClass} space-y-4`}>
              <textarea
                id="reject-reason"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                rows={4}
                className={`${t.input} w-full min-h-[100px] ${inputClass}`}
                placeholder="Lý do từ chối"
                aria-label="Lý do từ chối"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeRejectFundModal}
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
                    const reason = rejectReasonInput.trim();
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
                        fundId: fund.fundId,
                        action: "REJECT",
                        rejectReason: reason,
                      }).unwrap();
                      showNotification({
                        type: "success",
                        title: "Đã từ chối quỹ",
                        message: `${fund.fundName?.trim() || "Quỹ"} đã bị từ chối.`,
                      });
                      closeRejectFundModal();
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
