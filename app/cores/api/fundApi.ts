import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "./baseApi";
import { normalizeExternalOrderCodeFromApi } from "~/modules/funds/utils/externalOrderCode";
import { normalizeClubFundCapabilitiesFromApi } from "~/modules/funds/utils/normalizeClubFundCapabilities";
import {
  type ApiResponse,
  type Club,
  type ClubFund,
  type ClubFundCapabilities,
  type ClubPayosGuide,
  type ClubPayosSettings,
  type ContributeToFundDto,
  type ContributeToFundResponse,
  type CreateFundDto,
  type FundCategoryResponseDto,
  type FundContributeTransactionStatus,
  type FundHistoryItem,
  type FundHistoryScope,
  type FundListSort,
  type FundListStatus,
  type FundMenuItemDto,
  type FundMineType,
  type FundReportSummaryDto,
  type FundSidebarMenuId,
  type FundTypeDto,
  type GetClubFundTransactionsParams,
  type GetMyFundsParams,
  type MyFundsPagedResult,
  type OnlinePaymentProviderOption,
  type PagedResult,
  type PayosFundContributionReturn,
  type PaymentCredentialFieldName,
  type PaymentCredentialFieldSchema,
  type UpdateClubPayosSettingsDto,
  type ApproveFundDto,
  type CreateFundRefundRequestDto,
  type CompleteFundRefundRequestDto,
  type CreateManagerRefundDto,
  type FundMemberContributionsDto,
  type FundRefundRequestResponseDto,
  type GetClubFundRefundRequestsParams,
  type RecordCashContributionRequest,
  type RecordCashContributionResponse,
  type RejectFundRefundRequestDto,
  type SoftDeleteFundResponse,
} from "./types";

function normalizeContributeToFundResponse(
  data: ContributeToFundResponse | null | undefined,
): ContributeToFundResponse {
  if (data == null || typeof data !== "object") {
    return { transactionId: 0 };
  }
  const d = data as unknown as Record<string, unknown>;
  const tid = Number(d.transactionId ?? d.TransactionId);
  const ext = normalizeExternalOrderCodeFromApi(
    d.externalOrderCode ?? d.ExternalOrderCode,
  );
  const base = data as unknown as ContributeToFundResponse;
  return {
    ...base,
    transactionId: Number.isFinite(tid) ? tid : 0,
    ...(ext != null ? { externalOrderCode: ext } : {}),
  };
}

function normalizePagedResult<T>(raw: unknown): PagedResult<T> {
  const empty = (): PagedResult<T> => ({
    items: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  if (raw == null) return empty();
  if (Array.isArray(raw)) {
    const items = raw as T[];
    const n = items.length;
    return {
      items,
      pageNumber: 1,
      pageSize: n || 10,
      totalCount: n,
      totalPages: n > 0 ? 1 : 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
  const d = raw as Record<string, unknown>;
  const items = Array.isArray(d.items) ? (d.items as T[]) : [];
  const pageNumber = Math.max(1, Number(d.pageNumber) || 1);
  const pageSize = Math.max(1, Number(d.pageSize) || 10);
  const rawTc = d.totalCount;
  let totalCountFinal: number;
  if (rawTc != null && rawTc !== "" && Number.isFinite(Number(rawTc))) {
    totalCountFinal = Math.max(0, Number(rawTc));
  } else {
    totalCountFinal = items.length;
  }
  let totalPages = Number(d.totalPages);
  if (!Number.isFinite(totalPages) || totalPages < 1) {
    totalPages =
      totalCountFinal > 0 && pageSize > 0
        ? Math.ceil(totalCountFinal / pageSize)
        : 0;
  }
  const hasPreviousPage =
    typeof d.hasPreviousPage === "boolean" ? d.hasPreviousPage : pageNumber > 1;
  const hasNextPage =
    typeof d.hasNextPage === "boolean"
      ? d.hasNextPage
      : totalPages > 0 && pageNumber < totalPages;

  return {
    items,
    pageNumber,
    pageSize,
    totalCount: totalCountFinal,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
}

type ClubFundScoped = { clubId: number };
type FundScoped = { clubId: number; fundId: string | number };
type FundLocationResponse = { fundId: number; clubId: number };

function isGuidLike(v: string): boolean {
  const s = v.trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s,
  );
}

function normalizeRecordCashContributionResponse(
  raw: RecordCashContributionResponse | Record<string, unknown> | null | undefined,
): RecordCashContributionResponse {
  const d =
    (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = (a: string, b: string) => {
    const v = d[a] ?? d[b];
    const x = typeof v === "number" ? v : Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const s = (a: string, b: string) => {
    const v = d[a] ?? d[b];
    return typeof v === "string" ? v : v != null ? String(v) : "";
  };
  return {
    transactionId: n("transactionId", "TransactionId"),
    fundId: n("fundId", "FundId"),
    amount: n("amount", "Amount"),
    status: s("status", "Status"),
    contributionSource: s("contributionSource", "ContributionSource"),
    newCurrentBalance: n("newCurrentBalance", "NewCurrentBalance"),
    contributorUserId: s("contributorUserId", "ContributorUserId"),
    recordedByUserId: s("recordedByUserId", "RecordedByUserId"),
  };
}

function stripSoftDeleteParenFromFundCloseMessageVi(msg: string): string {
  const s = msg.trim();
  if (!s) return s;
  return s
    .replace(/\s*[\(\[]\s*(?:xoá|xóa)\s+mềm\s*[\)\]]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseSoftDeleteFundResponse(raw: unknown): SoftDeleteFundResponse {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const data = r.data ?? r.Data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const m = d.message ?? d.Message;
    if (typeof m === "string" && m.trim()) {
      return { message: stripSoftDeleteParenFromFundCloseMessageVi(m) };
    }
  }
  const m = r.message ?? r.Message;
  if (typeof m === "string" && m.trim()) {
    return { message: stripSoftDeleteParenFromFundCloseMessageVi(m) };
  }
  return {};
}

function normalizeFundRefundRequest(raw: unknown): FundRefundRequestResponseDto {
  if (raw == null || typeof raw !== "object") {
    return {
      refundRequestId: 0,
      clubId: 0,
      fundId: 0,
      originalTransactionId: 0,
      requestedBy: "",
      amount: 0,
      bankName: "",
      bankAccountNumber: "",
      accountHolderName: "",
      status: "PENDING",
      createdAtUtc: "",
      updatedAtUtc: "",
    };
  }
  const d = raw as Record<string, unknown>;
  const num = (v: unknown): number => {
    if (v == null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const str = (v: unknown): string => (v == null ? "" : String(v).trim());
  const optStr = (v: unknown): string | null => {
    const s = str(v);
    return s || null;
  };
  return {
    refundRequestId: num(d.refundRequestId ?? d.RefundRequestId),
    clubId: num(d.clubId ?? d.ClubId),
    fundId: num(d.fundId ?? d.FundId),
    originalTransactionId: num(
      d.originalTransactionId ?? d.OriginalTransactionId,
    ),
    requestedBy: str(d.requestedBy ?? d.RequestedBy),
    amount: num(d.amount ?? d.Amount),
    reason: optStr(d.reason ?? d.Reason),
    bankName: str(d.bankName ?? d.BankName),
    bankAccountNumber: str(d.bankAccountNumber ?? d.BankAccountNumber),
    accountHolderName: str(d.accountHolderName ?? d.AccountHolderName),
    status: str(d.status ?? d.Status) || "PENDING",
    createdAtUtc: str(d.createdAtUtc ?? d.CreatedAtUtc),
    updatedAtUtc: str(d.updatedAtUtc ?? d.UpdatedAtUtc),
    completedAtUtc: optStr(d.completedAtUtc ?? d.CompletedAtUtc),
    completedBy: optStr(d.completedBy ?? d.CompletedBy),
    rejectedAtUtc: optStr(d.rejectedAtUtc ?? d.RejectedAtUtc),
    rejectedBy: optStr(d.rejectedBy ?? d.RejectedBy),
    rejectionReason: optStr(d.rejectionReason ?? d.RejectionReason),
    transferReference: optStr(d.transferReference ?? d.TransferReference),
    managerNote: optStr(d.managerNote ?? d.ManagerNote),
    fundName: optStr(d.fundName ?? d.FundName),
  };
}

const FUND_SIDEBAR_MENU_IDS: readonly FundSidebarMenuId[] = [
  "overview",
  "transactions",
  "reports",
  "settings",
];

function isFundSidebarMenuId(id: string): id is FundSidebarMenuId {
  return (FUND_SIDEBAR_MENU_IDS as readonly string[]).includes(id);
}

function normalizeFundMenuItemsFromApi(raw: unknown): FundMenuItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: FundMenuItemDto[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    const id = String(e.id ?? e.Id ?? "").trim();
    if (!isFundSidebarMenuId(id)) continue;
    out.push({
      id,
      labelVi: String(e.labelVi ?? e.LabelVi ?? "").trim() || id,
      labelEn: String(e.labelEn ?? e.LabelEn ?? "").trim() || id,
      visible: !!(e.visible ?? e.Visible),
    });
  }
  return out;
}

function numFundReport(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function pickOptionalViString(
  d: Record<string, unknown>,
  camel: string,
  pascal: string,
): string | null {
  const v = d[camel] ?? d[pascal];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function nullableNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function optStr(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  return s ? s : undefined;
}

function normalizeCredentialFields(raw: unknown): PaymentCredentialFieldSchema[] {
  if (!Array.isArray(raw)) return [];
  const out: PaymentCredentialFieldSchema[] = [];
  for (const entry of raw) {
    const d = entry as Record<string, unknown>;
    const nameRaw = String(d.name ?? d.Name ?? "").trim();
    const labelVi = String(d.labelVi ?? d.LabelVi ?? "").trim();
    const requiredWhenEnabled = !!(
      d.requiredWhenEnabled ?? d.RequiredWhenEnabled
    );
    const maxLength = Math.max(1, Number(d.maxLength ?? d.MaxLength) || 200);
    const inputTypeRaw = String(d.inputType ?? d.InputType ?? "text")
      .trim()
      .toLowerCase();
    const inputType = (inputTypeRaw === "password" ? "password" : "text") as
      | "text"
      | "password";
    const helpTextVi = optStr(d.helpTextVi ?? d.HelpTextVi);
    const safeName = (["clientId", "apiKey", "checksumKey"] as const).includes(
      nameRaw as PaymentCredentialFieldName,
    )
      ? (nameRaw as PaymentCredentialFieldName)
      : null;
    if (!safeName || !labelVi) continue;
    out.push({
      name: safeName,
      labelVi,
      requiredWhenEnabled,
      maxLength,
      inputType,
      ...(helpTextVi ? { helpTextVi } : {}),
    });
  }
  return out;
}

function normalizeOnlinePaymentProviders(
  raw: unknown,
): OnlinePaymentProviderOption[] {
  if (!Array.isArray(raw)) return [];
  const out: OnlinePaymentProviderOption[] = [];
  for (const entry of raw) {
    const d = entry as Record<string, unknown>;
    const code = String(d.code ?? d.Code ?? "").trim() || "PAYOS";
    const labelVi = String(d.labelVi ?? d.LabelVi ?? "").trim() || code;
    const credentialFields = normalizeCredentialFields(
      d.credentialFields ?? d.CredentialFields,
    );
    out.push({ code, labelVi, credentialFields });
  }
  return out;
}

function normalizeClubPayosGuide(raw: unknown): ClubPayosGuide {
  const d =
    (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const payosRaw = (d.payos ?? d.Payos) as Record<string, unknown> | undefined;
  const schemaVerRaw =
    d.paymentCredentialSchemaVersion ?? d.PaymentCredentialSchemaVersion;
  const schemaVer = Math.max(1, Number(schemaVerRaw) || 1);
  const stepsRaw = d.stepsVi ?? d.StepsVi;
  return {
    clubId: nullableNum(d.clubId ?? d.ClubId) ?? undefined,
    paymentCredentialSchemaVersion: schemaVer,
    onlinePaymentProviders: normalizeOnlinePaymentProviders(
      d.onlinePaymentProviders ?? d.OnlinePaymentProviders,
    ),
    payos: {
      isConfigured: !!(payosRaw?.isConfigured ?? payosRaw?.IsConfigured),
      isEnabled: !!(payosRaw?.isEnabled ?? payosRaw?.IsEnabled),
      noteVi: payosRaw
        ? pickOptionalViString(payosRaw, "noteVi", "NoteVi") ?? undefined
        : undefined,
    },
    stepsVi: Array.isArray(stepsRaw)
      ? stepsRaw.map((x) => String(x ?? "").trim()).filter(Boolean)
      : [],
  };
}

function normalizeClubPayosSettings(raw: unknown): ClubPayosSettings {
  const d =
    (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ppRaw = String(d.paymentProvider ?? d.PaymentProvider ?? "").trim();
  const paymentProvider = (ppRaw || "PAYOS").slice(0, 32);
  return {
    clubId: nullableNum(d.clubId ?? d.ClubId) ?? undefined,
    paymentProvider,
    isConfigured: !!(d.isConfigured ?? d.IsConfigured),
    clientId: (d.clientId ?? d.ClientId ?? null) as string | null,
    apiKeyMasked: (d.apiKeyMasked ?? d.ApiKeyMasked ?? null) as string | null,
    checksumKeyMasked: (d.checksumKeyMasked ?? d.ChecksumKeyMasked ?? null) as
      | string
      | null,
    isEnabled: !!(d.isEnabled ?? d.IsEnabled),
    updatedAtUtc: (d.updatedAtUtc ?? d.UpdatedAtUtc ?? null) as string | null,
  };
}

function normalizeFundReportSummary(raw: unknown): FundReportSummaryDto {
  if (raw == null || typeof raw !== "object") {
    return {
      clubId: 0,
      fromUtc: null,
      toUtc: null,
      pendingFundCount: 0,
      approvedFundCount: 0,
      rejectedFundCount: 0,
      totalBalanceApprovedFunds: 0,
      totalApprovedIncome: 0,
      totalApprovedExpense: 0,
    };
  }
  const d = raw as Record<string, unknown>;
  return {
    clubId: numFundReport(d.clubId ?? d.ClubId),
    fromUtc: (d.fromUtc ?? d.FromUtc ?? null) as string | null,
    toUtc: (d.toUtc ?? d.ToUtc ?? null) as string | null,
    pendingFundCount: numFundReport(d.pendingFundCount ?? d.PendingFundCount),
    approvedFundCount: numFundReport(
      d.approvedFundCount ?? d.ApprovedFundCount,
    ),
    rejectedFundCount: numFundReport(
      d.rejectedFundCount ?? d.RejectedFundCount,
    ),
    totalBalanceApprovedFunds: numFundReport(
      d.totalBalanceApprovedFunds ?? d.TotalBalanceApprovedFunds,
    ),
    totalApprovedIncome: numFundReport(
      d.totalApprovedIncome ?? d.TotalApprovedIncome,
    ),
    totalApprovedExpense: numFundReport(
      d.totalApprovedExpense ?? d.TotalApprovedExpense,
    ),
    dateFilterNoteVi: pickOptionalViString(
      d,
      "dateFilterNoteVi",
      "DateFilterNoteVi",
    ),
  };
}

function normalizeClubFund(raw: unknown): ClubFund {
  if (raw == null || typeof raw !== "object") return {} as ClubFund;
  const d = raw as Record<string, unknown>;
  const num = (v: unknown): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const canAcceptRaw = d.canAcceptContributions ?? d.CanAcceptContributions;
  return {
    fundId: num(d.fundId ?? d.FundId) ?? 0,
    clubId: num(d.clubId ?? d.ClubId) ?? 0,
    publicId: optStr(
      d.publicId ??
        d.PublicId ??
        (d as any).PublicID ??
        (d as any).fundPublicId ??
        (d as any).FundPublicId,
    ),
    fundName: String(d.fundName ?? d.FundName ?? "").trim() || undefined,
    currentBalance: num(d.currentBalance ?? d.CurrentBalance),
    totalAmount: num(d.totalAmount ?? d.TotalAmount),
    balance: num(d.balance ?? d.Balance),
    description:
      String(
        d.description ??
          d.Description ??
          d.fundDescription ??
          d.FundDescription ??
          d.purpose ??
          d.Purpose ??
          "",
      ).trim() || undefined,
    status: (d.status ?? d.Status) as ClubFund["status"],
    createdAt: (d.createdAt ?? d.CreatedAt) as string | undefined,
    updatedAt: (d.updatedAt ?? d.UpdatedAt) as string | undefined,
    expiresAt: (d.expiresAt ?? d.ExpiresAt ?? null) as
      | string
      | null
      | undefined,
    canAcceptContributions:
      canAcceptRaw == null ? undefined : Boolean(canAcceptRaw),
    balanceContextVi: pickOptionalViString(d, "balanceContextVi", "BalanceContextVi"),
    cannotContributeReasonVi: pickOptionalViString(
      d,
      "cannotContributeReasonVi",
      "CannotContributeReasonVi",
    ),
    lifecycleStatusVi: pickOptionalViString(
      d,
      "lifecycleStatusVi",
      "LifecycleStatusVi",
    ),
    rejectionReasonVi: pickOptionalViString(d, "rejectionReasonVi", "RejectionReasonVi"),
    expiresAtUtcNoteVi: pickOptionalViString(d, "expiresAtUtcNoteVi", "ExpiresAtUtcNoteVi"),
  };
}

function normalizeFundPagedResponse(raw: unknown): PagedResult<ClubFund> {
  const paged = normalizePagedResult<ClubFund>(raw);
  return {
    ...paged,
    items: paged.items.map((i) => normalizeClubFund(i)),
  };
}

function sortClubFunds(items: ClubFund[], sort: FundListSort): ClubFund[] {
  const normalized = sort ?? "NEWEST";
  const list = [...items];
  const ts = (s?: string) => {
    if (!s) return 0;
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : 0;
  };
  if (normalized === "OLDEST")
    return list.sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
  if (normalized === "NAME_ASC")
    return list.sort((a, b) =>
      String(a.fundName ?? "").localeCompare(String(b.fundName ?? "")),
    );
  if (normalized === "NAME_DESC")
    return list.sort((a, b) =>
      String(b.fundName ?? "").localeCompare(String(a.fundName ?? "")),
    );
  return list.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
}

function matchesMineType(item: ClubFund, mineType: FundMineType): boolean {
  const t = mineType ?? "ALL";
  if (t === "ALL") return true;
  const raw = (item as unknown as Record<string, unknown>)?.mineType;
  const mine = String(raw ?? "").toUpperCase();
  if (t === "CREATED") return mine === "CREATED";
  if (t === "RESPONSIBLE") return mine === "RESPONSIBLE";
  return true;
}

function buildMyFundsQuery(clubId: number, params: Omit<GetMyFundsParams, "clubId">) {
  const q = new URLSearchParams();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 9));
  q.set("page", String(page));
  q.set("pageSize", String(pageSize));
  if (params.mineType) q.set("mineType", params.mineType);
  if (params.status) q.set("status", params.status);
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.sort) q.set("sort", params.sort);
  return { url: `/clubs/${clubId}/funds/my?${q.toString()}` };
}

const USE_MOCK_MY_FUNDS =
  String(import.meta.env.VITE_MOCK_MY_FUNDS ?? "").toLowerCase() === "true";

export const fundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFundTypes: builder.query<FundTypeDto[], void>({
      query: () => "/fund-types",
      transformResponse: (response: ApiResponse<FundTypeDto[]>) =>
        response.data ?? [],
      providesTags: ["ClubFund"],
    }),

    getFundCapabilities: builder.query<ClubFundCapabilities, number>({
      query: (clubId) => `/clubs/${clubId}/funds/capabilities`,
      transformResponse: (response: ApiResponse<ClubFundCapabilities>) =>
        normalizeClubFundCapabilitiesFromApi(response),
      providesTags: (_result, _error, clubId) => [
        { type: "ClubFund", id: `capabilities-${clubId}` },
      ],
    }),

    getFundReportSummary: builder.query<
      FundReportSummaryDto,
      { clubId: number; fromUtc?: string | null; toUtc?: string | null }
    >({
      query: ({ clubId, fromUtc, toUtc }) => ({
        url: `/clubs/${clubId}/funds/report-summary`,
        params: {
          ...(fromUtc ? { fromUtc } : {}),
          ...(toUtc ? { toUtc } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<FundReportSummaryDto>) =>
        normalizeFundReportSummary(response.data),
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `report-summary-${clubId}` },
      ],
    }),

    getFundCategories: builder.query<FundCategoryResponseDto[], number>({
      query: (clubId) => `/clubs/${clubId}/funds/categories`,
      transformResponse: (response: ApiResponse<FundCategoryResponseDto[]>) =>
        response.data ?? [],
      providesTags: (_result, _error, clubId) => [
        { type: "ClubFund", id: `categories-${clubId}` },
      ],
    }),

    getFundById: builder.query<ClubFund, FundScoped>({
      query: ({ clubId, fundId }) => `/clubs/${clubId}/funds/${fundId}`,
      transformResponse: (response: ApiResponse<ClubFund>) =>
        normalizeClubFund(response.data),
      providesTags: (_result, _error, { fundId }) => [{ type: "ClubFund", id: fundId }],
    }),

    getFundsByClub: builder.query<
      PagedResult<ClubFund>,
      {
        clubId: number;
        page?: number;
        pageSize?: number;
        search?: string;
        status?: FundListStatus;
        sort?: FundListSort;
      }
    >({
      query: ({ clubId, page = 1, pageSize = 10, search, status, sort }) => ({
        url: `/clubs/${clubId}/funds`,
        params: {
          page,
          pageSize,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(sort ? { sort } : {}),
        },
      }),
      transformResponse: (
        response: ApiResponse<PagedResult<ClubFund> | ClubFund[]>,
      ) => normalizeFundPagedResponse(response.data),
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `club-${clubId}` },
      ],
    }),

    getMyFunds: builder.query<MyFundsPagedResult, GetMyFundsParams>({
      async queryFn({ clubId, ...params }, _api, _extraOptions, baseQuery) {
        const myFundsRes = await baseQuery(buildMyFundsQuery(clubId, params));
        if (!myFundsRes.error && myFundsRes.data) {
          const raw = (
            myFundsRes.data as ApiResponse<PagedResult<ClubFund> | ClubFund[]>
          ).data;
          const paged = normalizeFundPagedResponse(raw);
          return {
            data: {
              ...paged,
              usedMyFundsFallback: false,
            },
          };
        }

        const errStatus =
          myFundsRes.error &&
          typeof myFundsRes.error === "object" &&
          "status" in myFundsRes.error
            ? (myFundsRes.error as { status: number | string }).status
            : undefined;
        const allowMockFallback = USE_MOCK_MY_FUNDS || errStatus === 404;
        if (!allowMockFallback) {
          return { error: myFundsRes.error as FetchBaseQueryError };
        }

        const fallbackRes = await baseQuery({
          url: `/clubs/${clubId}/funds`,
          params: {
            page: params.page ?? 1,
            pageSize: Math.max(1, Math.min(100, params.pageSize ?? 9)),
          },
        });
        if (fallbackRes.error || !fallbackRes.data) {
          return { error: (myFundsRes.error ?? fallbackRes.error) as FetchBaseQueryError };
        }

        const fallbackRaw = (
          fallbackRes.data as ApiResponse<PagedResult<ClubFund> | ClubFund[]>
        ).data;
        const fallbackPaged = normalizeFundPagedResponse(fallbackRaw);
        const mineType = params.mineType ?? "ALL";
        const status = params.status ?? "ALL";
        const search = params.search?.trim().toLowerCase() ?? "";
        const sort = params.sort ?? "NEWEST";
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 9));

        let filtered = fallbackPaged.items.filter((i) => matchesMineType(i, mineType));
        if (status !== "ALL") {
          filtered = filtered.filter(
            (i) => String(i.status ?? "").toUpperCase() === status,
          );
        }
        if (search) {
          filtered = filtered.filter((i) =>
            String(i.fundName ?? "").toLowerCase().includes(search),
          );
        }
        filtered = sortClubFunds(filtered, sort);
        const totalCount = filtered.length;
        const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
          data: {
            items: filtered.slice(start, end),
            pageNumber: page,
            pageSize,
            totalCount,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: totalPages > 0 && page < totalPages,
            usedMyFundsFallback: true,
          },
        };
      },
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `my-funds-${clubId}` },
      ],
    }),

    createFund: builder.mutation<ClubFund, { clubId: number } & CreateFundDto>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds`,
        method: "POST",
        body: {
          ...body,
          ...(body.description ? { Description: body.description } : {}),
          ...(body.description ? { fundDescription: body.description } : {}),
          ...(body.description ? { FundDescription: body.description } : {}),
          ...(body.description ? { purpose: body.description } : {}),
          ...(body.description ? { Purpose: body.description } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<ClubFund>) =>
        normalizeClubFund(response.data),
      invalidatesTags: ["ClubFund"],
    }),

    getMyClubsForFunds: builder.query<Club[], void>({
      query: () => "/ClubFund/my-clubs",
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ["ClubFund", "Club"],
    }),

    getMyClubsForFundsV2: builder.query<Club[], void>({
      query: () => "/clubs/funds/my-clubs",
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ["ClubFund", "Club"],
    }),

    getFundHistory: builder.query<
      PagedResult<FundHistoryItem>,
      {
        clubId: number;
        fundId: number;
        page?: number;
        pageSize?: number;
        status?: string;
        scope?: FundHistoryScope;
      }
    >({
      query: ({ clubId, fundId, page = 1, pageSize = 10, status, scope }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (status) params.status = status;
        if (scope === "mine") params.scope = scope;
        return { url: `/clubs/${clubId}/funds/history/${fundId}`, params };
      },
      transformResponse: (
        response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>,
      ) => normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (_result, _error, { fundId }) => [{ type: "ClubFund", id: fundId }],
    }),

    getClubFundTransactions: builder.query<
      PagedResult<FundHistoryItem>,
      GetClubFundTransactionsParams
    >({
      query: ({
        clubId,
        page = 1,
        pageSize = 20,
        fundId,
        status,
        scope,
        fromUtc,
        toUtc,
      }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (fundId != null && fundId > 0) params.fundId = fundId;
        if (status) params.status = status;
        if (scope === "mine") params.scope = scope;
        if (fromUtc) params.fromUtc = fromUtc;
        if (toUtc) params.toUtc = toUtc;
        return { url: `/clubs/${clubId}/funds/transactions`, params };
      },
      transformResponse: (
        response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>,
      ) => normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `club-tx-${clubId}` },
      ],
    }),

    approveFund: builder.mutation<ClubFund, ApproveFundDto & ClubFundScoped>({
      query: ({ clubId, ...body }) => {
        const action = (body as ApproveFundDto).action;
        const reason = (body as ApproveFundDto).rejectReason?.trim();
        return {
          url: `/clubs/${clubId}/funds/approve`,
          method: "POST",
          body: {
            ...body,
            Action: action,
            ...(action === "REJECT" && reason
              ? {
                  rejectReason: reason,
                  RejectReason: reason,
                  rejectionReason: reason,
                  RejectionReason: reason,
                }
              : {}),
          },
        };
      },
      transformResponse: (response: ApiResponse<ClubFund>) =>
        normalizeClubFund(response.data),
      invalidatesTags: ["ClubFund"],
    }),

    contributeToFund: builder.mutation<
      ContributeToFundResponse,
      ClubFundScoped & ContributeToFundDto
    >({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/contribute`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ContributeToFundResponse>) =>
        normalizeContributeToFundResponse(response.data),
      invalidatesTags: ["ClubFund"],
    }),

    getContributeTransactionStatus: builder.query<
      FundContributeTransactionStatus,
      { clubId: number; transactionId: number }
    >({
      query: ({ clubId, transactionId }) =>
        `/clubs/${clubId}/funds/contribute/${transactionId}/status`,
      transformResponse: (
        response: ApiResponse<FundContributeTransactionStatus>,
      ) => {
        const d = response.data;
        const dr = (d ?? {}) as unknown as Record<string, unknown>;
        const tid = Number(d?.transactionId ?? dr.TransactionId);
        const ext = normalizeExternalOrderCodeFromApi(
          dr.externalOrderCode ?? dr.ExternalOrderCode,
        );
        return {
          transactionId: Number.isFinite(tid) ? tid : 0,
          fundId: d?.fundId ?? 0,
          ...(ext != null ? { externalOrderCode: ext } : {}),
          status: d?.status,
          amount: d?.amount,
          isPaid: !!d?.isPaid,
          isPaymentLinkExpired: !!d?.isPaymentLinkExpired,
          paymentLinkExpiresAtUtc: d?.paymentLinkExpiresAtUtc ?? undefined,
          message: d?.message,
        };
      },
    }),

    getPayosFundContributionReturn: builder.query<
      PayosFundContributionReturn,
      string
    >({
      query: (orderCode) =>
        `/fund-contributions/payos-return/${encodeURIComponent(String(orderCode))}`,
      transformResponse: (
        response: ApiResponse<PayosFundContributionReturn>,
      ) => {
        const dr = (response.data ?? {}) as unknown as Record<string, unknown>;
        const clubId = Number(dr.clubId ?? dr.ClubId) || 0;
        const fundId = Number(dr.fundId ?? dr.FundId) || 0;
        const tid = Number(dr.transactionId ?? dr.TransactionId);
        const pub =
          typeof dr.publicId === "string"
            ? dr.publicId.trim()
            : typeof dr.PublicId === "string"
              ? String(dr.PublicId).trim()
              : undefined;
        const ext = normalizeExternalOrderCodeFromApi(
          dr.externalOrderCode ?? dr.ExternalOrderCode,
        );
        const msgRaw = dr.message ?? dr.Message;
        const message = typeof msgRaw === "string" ? msgRaw : undefined;
        const paidRaw = dr.isPaid ?? dr.IsPaid;
        return {
          clubId,
          fundId,
          ...(pub ? { publicId: pub } : {}),
          ...(Number.isFinite(tid) && tid > 0 ? { transactionId: tid } : {}),
          ...(ext != null ? { externalOrderCode: ext } : {}),
          isPaid: !!paidRaw,
          message,
        };
      },
    }),

    getPayosGuide: builder.query<ClubPayosGuide, number>({
      query: (clubId) => `/clubs/${clubId}/funds/payos-guide`,
      transformResponse: (response: ApiResponse<ClubPayosGuide>) =>
        normalizeClubPayosGuide(response.data),
      providesTags: (_result, _error, clubId) => [
        { type: "ClubFund", id: `payos-guide-${clubId}` },
      ],
    }),

    getPayosSettings: builder.query<ClubPayosSettings, number>({
      query: (clubId) => `/clubs/${clubId}/funds/payos-settings`,
      transformResponse: (response: ApiResponse<ClubPayosSettings>) =>
        normalizeClubPayosSettings(response.data),
      providesTags: (_result, _error, clubId) => [
        { type: "ClubFund", id: `payos-settings-${clubId}` },
      ],
    }),

    updatePayosSettings: builder.mutation<
      ClubPayosSettings,
      { clubId: number } & UpdateClubPayosSettingsDto
    >({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/payos-settings`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<ClubPayosSettings>) =>
        normalizeClubPayosSettings(response.data),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `payos-guide-${clubId}` },
        { type: "ClubFund", id: `payos-settings-${clubId}` },
      ],
    }),

    getFundMemberContributions: builder.query<
      FundMemberContributionsDto,
      { clubId: number; fundId: number }
    >({
      query: ({ clubId, fundId }) =>
        `/clubs/${clubId}/funds/${fundId}/member-contributions`,
      transformResponse: (response: ApiResponse<FundMemberContributionsDto>) =>
        response.data as FundMemberContributionsDto,
      providesTags: (_result, _error, { clubId, fundId }) => [
        { type: "ClubFund", id: `member-contrib-${clubId}-${fundId}` },
      ],
    }),

    softDeleteFund: builder.mutation<SoftDeleteFundResponse, FundScoped>({
      query: ({ clubId, fundId }) => ({
        url: `/clubs/${clubId}/funds/${fundId}`,
        method: "DELETE",
      }),
      transformResponse: (response: unknown) => parseSoftDeleteFundResponse(response),
      invalidatesTags: (_result, _error, { clubId, fundId }) => [
        { type: "ClubFund", id: String(fundId) },
        { type: "ClubFund", id: `capabilities-${clubId}` },
        { type: "ClubFund", id: `club-${clubId}` },
        { type: "ClubFund", id: `my-funds-${clubId}` },
        { type: "ClubFund", id: `member-contrib-${clubId}-${fundId}` },
        { type: "ClubFund", id: `report-summary-${clubId}` },
        "ClubFund",
      ],
    }),

    recordCashContribution: builder.mutation<
      RecordCashContributionResponse,
      { clubId: number; body: RecordCashContributionRequest }
    >({
      query: ({ clubId, body }) => ({
        url: `/clubs/${clubId}/funds/contributions/cash`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<RecordCashContributionResponse>) =>
        normalizeRecordCashContributionResponse(response.data),
      invalidatesTags: (_result, _error, { clubId, body }) => [
        "ClubFund",
        { type: "ClubFund", id: String(body.fundId) },
        { type: "ClubFund", id: `capabilities-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `my-funds-${clubId}` },
        { type: "ClubFund", id: `club-${clubId}` },
        { type: "ClubFund", id: `report-summary-${clubId}` },
      ],
    }),

    createFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      ClubFundScoped & CreateFundRefundRequestDto
    >({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/refund-requests`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
        { type: "ClubFund", id: `refund-club-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
      ],
    }),

    getMyFundRefundRequests: builder.query<
      PagedResult<FundRefundRequestResponseDto>,
      { clubId: number; page?: number; pageSize?: number }
    >({
      query: ({ clubId, page = 1, pageSize = 20 }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/mine`,
        params: { page, pageSize },
      }),
      transformResponse: (
        response: ApiResponse<
          PagedResult<FundRefundRequestResponseDto> | FundRefundRequestResponseDto[]
        >,
      ) => {
        const paged = normalizePagedResult<FundRefundRequestResponseDto>(response.data);
        return {
          ...paged,
          items: paged.items.map((i) => normalizeFundRefundRequest(i)),
        };
      },
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
      ],
    }),

    cancelFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      { clubId: number; refundRequestId: number }
    >({
      query: ({ clubId, refundRequestId }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/${refundRequestId}/cancel`,
        method: "POST",
        body: {},
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
        { type: "ClubFund", id: `refund-club-${clubId}` },
      ],
    }),

    getClubFundRefundRequests: builder.query<
      PagedResult<FundRefundRequestResponseDto>,
      GetClubFundRefundRequestsParams
    >({
      query: ({ clubId, page = 1, pageSize = 20, status }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (status) params.status = status;
        return {
          url: `/clubs/${clubId}/funds/refund-requests`,
          params,
        };
      },
      transformResponse: (
        response: ApiResponse<
          PagedResult<FundRefundRequestResponseDto> | FundRefundRequestResponseDto[]
        >,
      ) => {
        const paged = normalizePagedResult<FundRefundRequestResponseDto>(response.data);
        return {
          ...paged,
          items: paged.items.map((i) => normalizeFundRefundRequest(i)),
        };
      },
      providesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-club-${clubId}` },
      ],
    }),

    completeFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      { clubId: number; refundRequestId: number; body?: CompleteFundRefundRequestDto }
    >({
      query: ({ clubId, refundRequestId, body }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/${refundRequestId}/complete`,
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
        { type: "ClubFund", id: `refund-club-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `club-${clubId}` },
      ],
    }),

    rejectFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      { clubId: number; refundRequestId: number; body: RejectFundRefundRequestDto }
    >({
      query: ({ clubId, refundRequestId, body }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/${refundRequestId}/reject`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (_result, _error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
        { type: "ClubFund", id: `refund-club-${clubId}` },
      ],
    }),

    createManagerRefund: builder.mutation<
      FundHistoryItem,
      { clubId: number; fundId: number; body: CreateManagerRefundDto }
    >({
      query: ({ clubId, fundId, body }) => ({
        url: `/clubs/${clubId}/funds/${fundId}/manager-refunds`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FundHistoryItem>) => response.data,
      invalidatesTags: (_result, _error, { clubId, fundId }) => [
        { type: "ClubFund", id: String(fundId) },
        { type: "ClubFund", id: `club-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `member-contrib-${clubId}-${fundId}` },
      ],
    }),

    getFundLocation: builder.query<FundLocationResponse, string>({
      query: (fundIdOrPublicId) => `/funds/${fundIdOrPublicId}/location`,
      transformResponse: (response: ApiResponse<FundLocationResponse>) =>
        response.data,
    }),
  }),
});

export const {
  useGetFundTypesQuery,
  useGetFundCapabilitiesQuery,
  useGetFundReportSummaryQuery,
  useGetFundCategoriesQuery,
  useGetFundByIdQuery,
  useGetFundsByClubQuery,
  useGetMyFundsQuery,
  useCreateFundMutation,
  useGetFundMemberContributionsQuery,
  useSoftDeleteFundMutation,
  useGetMyClubsForFundsQuery,
  useGetMyClubsForFundsV2Query,
  useGetFundHistoryQuery,
  useGetClubFundTransactionsQuery,
  useApproveFundMutation,
  useContributeToFundMutation,
  useRecordCashContributionMutation,
  useLazyGetContributeTransactionStatusQuery,
  useLazyGetPayosFundContributionReturnQuery,
  useGetPayosGuideQuery,
  useGetPayosSettingsQuery,
  useUpdatePayosSettingsMutation,
  useCreateFundRefundRequestMutation,
  useGetMyFundRefundRequestsQuery,
  useCancelFundRefundRequestMutation,
  useGetClubFundRefundRequestsQuery,
  useCompleteFundRefundRequestMutation,
  useRejectFundRefundRequestMutation,
  useCreateManagerRefundMutation,
  useGetFundLocationQuery,
} = fundApi;

