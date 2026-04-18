import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { normalizeClubFundCapabilitiesFromApi } from "~/modules/funds/utils/normalizeClubFundCapabilities";
import { baseApi } from "./baseApi";
import {
  type Club,
  type ApiResponse,
  type ClubPostResponseDto,
  type CreateClubPostDto,
  type ClubMember,
  type ClubFund,
  type ApproveFundDto,
  type FundHistoryItem,
  type CreateFundDto,
  type ContributeToFundDto,
  type ContributeToFundResponse,
  type FundContributeTransactionStatus,
  type PayosFundContributionReturn,
  type ClubPayosGuide,
  type ClubPayosSettings,
  type UpdateClubPayosSettingsDto,
  type PaymentCredentialFieldSchema,
  type PaymentCredentialFieldName,
  type ClubFundCapabilities,
  type FundCategoryResponseDto,
  type FundHistoryScope,
  type FundMineType,
  type FundListSort,
  type FundListStatus,
  type FundReportSummaryDto,
  type GetClubFundTransactionsParams,
  type GetMyFundsParams,
  type MyFundsPagedResult,
  type PagedResult,
  type FundRefundRequestResponseDto,
  type CreateFundRefundRequestDto,
  type CompleteFundRefundRequestDto,
  type RejectFundRefundRequestDto,
  type GetClubFundRefundRequestsParams,
  type RecordCashContributionRequest,
  type RecordCashContributionResponse,
  type CreateManagerRefundDto,
  type FundTypeDto,
  type FundMemberContributionsDto,
} from "./types";

function normalizeRecordCashContributionResponse(
  raw: RecordCashContributionResponse | Record<string, unknown> | null | undefined,
): RecordCashContributionResponse {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
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
type FundScoped = { clubId: number; fundId: number };
type FundLocationResponse = { fundId: number; clubId: number };

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

const PAYMENT_CREDENTIAL_FIELD_NAMES = new Set<string>([
  "clientId",
  "apiKey",
  "checksumKey",
]);

function normalizePaymentCredentialField(
  raw: unknown,
): PaymentCredentialFieldSchema | null {
  if (raw == null || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const nameStr = String(x.name ?? x.Name ?? "").trim();
  if (!PAYMENT_CREDENTIAL_FIELD_NAMES.has(nameStr)) return null;
  const name = nameStr as PaymentCredentialFieldName;
  const cap = name === "clientId" ? 100 : 200;
  const maxFromApi = Number(x.maxLength ?? x.MaxLength);
  const maxLength =
    Number.isFinite(maxFromApi) && maxFromApi > 0
      ? Math.min(maxFromApi, cap)
      : cap;
  const inputRaw = String(x.inputType ?? x.InputType ?? "text").toLowerCase();
  const inputType = inputRaw === "password" ? "password" : "text";
  return {
    name,
    labelVi: String(x.labelVi ?? x.LabelVi ?? name).trim() || name,
    requiredWhenEnabled: !!(x.requiredWhenEnabled ?? x.RequiredWhenEnabled),
    maxLength,
    inputType,
    helpTextVi: pickOptionalViString(x, "helpTextVi", "HelpTextVi") ?? undefined,
  };
}

function normalizeClubPayosGuide(raw: unknown): ClubPayosGuide {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const payosRaw = (d.payos ?? d.Payos) as Record<string, unknown> | undefined;
  const schemaVerRaw =
    d.paymentCredentialSchemaVersion ?? d.PaymentCredentialSchemaVersion;
  const schemaNum = Number(schemaVerRaw);
  const paymentCredentialSchemaVersion =
    Number.isFinite(schemaNum) && schemaNum >= 1 ? schemaNum : 1;
  const providersRaw = d.onlinePaymentProviders ?? d.OnlinePaymentProviders;
  const onlinePaymentProviders = Array.isArray(providersRaw)
    ? providersRaw
        .map((p) => {
          const x = p as Record<string, unknown>;
          const code = String(x.code ?? x.Code ?? "").trim();
          const labelVi = String(x.labelVi ?? x.LabelVi ?? code).trim() || code;
          const credRaw = x.credentialFields ?? x.CredentialFields;
          const credentialFields = Array.isArray(credRaw)
            ? credRaw
                .map((row) => normalizePaymentCredentialField(row))
                .filter((f): f is PaymentCredentialFieldSchema => f != null)
            : [];
          return { code, labelVi, credentialFields };
        })
        .filter((p) => p.code.length > 0)
    : [];
  const stepsRaw = d.stepsVi ?? d.StepsVi;
  const stepsVi = Array.isArray(stepsRaw) ? stepsRaw.map((s) => String(s)) : [];
  const cidRaw = d.clubId ?? d.ClubId;
  const clubId =
    cidRaw != null && cidRaw !== "" && Number.isFinite(Number(cidRaw))
      ? Number(cidRaw)
      : undefined;
  return {
    clubId,
    paymentCredentialSchemaVersion,
    onlinePaymentProviders,
    payos: {
      isConfigured: !!(payosRaw?.isConfigured ?? payosRaw?.IsConfigured),
      isEnabled: !!(payosRaw?.isEnabled ?? payosRaw?.IsEnabled),
      noteVi: payosRaw
        ? (pickOptionalViString(payosRaw, "noteVi", "NoteVi") ?? undefined)
        : undefined,
    },
    stepsVi,
  };
}

function normalizeClubPayosSettings(raw: unknown): ClubPayosSettings {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ppRaw = String(d.paymentProvider ?? d.PaymentProvider ?? "")
    .trim()
    .toUpperCase();
  const paymentProvider = (ppRaw || "PAYOS").slice(0, 32);
  const cidRaw = d.clubId ?? d.ClubId;
  const clubId =
    cidRaw != null && cidRaw !== "" && Number.isFinite(Number(cidRaw))
      ? Number(cidRaw)
      : undefined;
  const updatedRaw = d.updatedAtUtc ?? d.UpdatedAtUtc;
  const updatedAtUtc =
    updatedRaw == null
      ? null
      : (() => {
          const s = String(updatedRaw).trim();
          return s || null;
        })();
  return {
    clubId,
    paymentProvider,
    isConfigured: !!(d.isConfigured ?? d.IsConfigured),
    clientId:
      (d.clientId as string | undefined) ??
      (d.ClientId as string | undefined) ??
      null,
    apiKeyMasked:
      (d.apiKeyMasked as string | undefined) ??
      (d.ApiKeyMasked as string | undefined) ??
      null,
    checksumKeyMasked:
      (d.checksumKeyMasked as string | undefined) ??
      (d.ChecksumKeyMasked as string | undefined) ??
      null,
    isEnabled: !!(d.isEnabled ?? d.IsEnabled),
    updatedAtUtc,
  };
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

function normalizeClubFund(raw: unknown): ClubFund {
  if (raw == null || typeof raw !== "object") return {} as ClubFund;
  const d = raw as Record<string, unknown>;
  const num = (v: unknown): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (v: unknown): string => (v == null ? "" : String(v).trim());
  const optStr = (v: unknown): string | null => {
    const s = str(v);
    return s || null;
  };
  const nullableNum = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const canAcceptRaw = d.canAcceptContributions ?? d.CanAcceptContributions;
  return {
    fundId: num(d.fundId ?? d.FundId) ?? 0,
    clubId: num(d.clubId ?? d.ClubId) ?? 0,
    fundName: String(d.fundName ?? d.FundName ?? "").trim() || undefined,
    fundTypeId: nullableNum(d.fundTypeId ?? d.FundTypeId),
    fundTypeName: optStr(d.fundTypeName ?? d.FundTypeName),
    goalAmount: nullableNum(d.goalAmount ?? d.GoalAmount),
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
    balanceContextVi: pickOptionalViString(
      d,
      "balanceContextVi",
      "BalanceContextVi",
    ),
    cannotContributeReasonVi: pickOptionalViString(
      d,
      "cannotContributeReasonVi",
      "CannotContributeReasonVi",
    ),
    rejectionReasonVi:
      pickOptionalViString(d, "rejectionReasonVi", "RejectionReasonVi") ??
      pickOptionalViString(d, "rejectionReason", "RejectionReason") ??
      pickOptionalViString(d, "rejectReason", "RejectReason"),
    expiresAtUtcNoteVi: pickOptionalViString(
      d,
      "expiresAtUtcNoteVi",
      "ExpiresAtUtcNoteVi",
    ),
  };
}

function normalizeFundPagedResponse(raw: unknown): PagedResult<ClubFund> {
  if (raw == null || typeof raw !== "object")
    return normalizePagedResult<ClubFund>(raw);
  const d = raw as Record<string, unknown>;
  const normalized = {
    items: (d.items ?? d.Items) as unknown,
    pageNumber: d.pageNumber ?? d.PageNumber,
    pageSize: d.pageSize ?? d.PageSize,
    totalCount: d.totalCount ?? d.TotalCount,
    totalPages: d.totalPages ?? d.TotalPages,
    hasPreviousPage: d.hasPreviousPage ?? d.HasPreviousPage,
    hasNextPage: d.hasNextPage ?? d.HasNextPage,
  };
  return normalizePagedResult<ClubFund>(normalized);
}

function sortClubFunds(items: ClubFund[], sort: FundListSort): ClubFund[] {
  const cloned = [...items];
  if (sort === "NAME_ASC")
    return cloned.sort((a, b) =>
      String(a.fundName ?? "").localeCompare(String(b.fundName ?? ""), "vi"),
    );
  if (sort === "NAME_DESC")
    return cloned.sort((a, b) =>
      String(b.fundName ?? "").localeCompare(String(a.fundName ?? ""), "vi"),
    );
  if (sort === "OLDEST")
    return cloned.sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime(),
    );
  return cloned.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
}

function matchesMineType(item: ClubFund, mineType: FundMineType): boolean {
  if (mineType === "ALL") return true;
  // Temporary client-side fallback when BE /funds/my unavailable:
  // split deterministic by fundId so tabs remain testable.
  if (mineType === "CREATED") return (item.fundId ?? 0) % 2 === 1;
  return (item.fundId ?? 0) % 2 === 0;
}

function buildMyFundsQuery(
  clubId: number,
  params: Omit<GetMyFundsParams, "clubId">,
) {
  return {
    url: `/clubs/${clubId}/funds/my`,
    params: {
      mineType: params.mineType ?? "ALL",
      status: params.status ?? "ALL",
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      sort: params.sort ?? "NEWEST",
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 9,
    },
  };
}

const USE_MOCK_MY_FUNDS =
  String(import.meta.env.VITE_MOCK_MY_FUNDS ?? "").toLowerCase() === "true";

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFundTypes: builder.query<FundTypeDto[], void>({
      query: () => "/fund-types",
      transformResponse: (response: ApiResponse<FundTypeDto[]>) =>
        response.data ?? [],
      providesTags: ["ClubFund"],
    }),

    getClubs: builder.query<
      { data: Club[]; totalPage: number; totalCount: number },
      { pageIndex: string; searchQuery: string; pageSize: string }
    >({
      query: ({ pageIndex, searchQuery, pageSize }) =>
        `/Club?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ["Club"],
    }),

    getActiveClubs: builder.query<
      { data: Club[]; totalPage: number; totalCount: number },
      { pageIndex: string; searchQuery: string; pageSize: string }
    >({
      query: ({ pageIndex, searchQuery, pageSize }) =>
        `/Club/active?pageSize=${pageSize}&pageIndex=${pageIndex}&searchQuery=${searchQuery}`,
      transformResponse: (response: ApiResponse<Club[]>) => ({
        data: response.data,
        totalPage: response.totalPages,
        totalCount: response.totalCount,
      }),
      providesTags: ["Club"],
    }),
    getClubById: builder.query<Club, number>({
      query: (id) => `/Club/${id}`,
      transformResponse: (response: ApiResponse<Club>) => response.data,
      providesTags: (result, error, id) => [{ type: "Club", id }],
    }),
    getClubMembers: builder.query<ClubMember[], number>({
      query: (clubId) => `/clubs/${clubId}/members`,
      transformResponse: (response: ApiResponse<ClubMember[]>) => response.data,
      providesTags: (result, error, clubId) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    createClub: builder.mutation<Club, Partial<Club>>({
      query: (club) => ({
        url: "/Club",
        method: "POST",
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: ["Club"],
    }),
    updateClub: builder.mutation<Club, { id: number; club: Partial<Club> }>({
      query: ({ id, club }) => ({
        url: `/Club/${id}`,
        method: "PUT",
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: "Club", id }],
    }),
    deleteClub: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Club/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Club"],
    }),
    toggleClubStatus: builder.mutation<Club, { id: number; isActive: boolean }>(
      {
        query: ({ id }) => ({
          url: `/Club/ChangeStatus/${id}`,
          method: "PUT",
        }),
        transformResponse: (response: ApiResponse<Club>) => response.data,
        invalidatesTags: (result, error, { id }) => [
          { type: "Club", id },
          "Club",
        ],
      },
    ),
    getClubPosts: builder.query<ClubPostResponseDto[], void>({
      query: () => `/ClubPost`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) =>
        response.data,
      providesTags: ["ClubPost"],
    }),
    getClubPostById: builder.query<ClubPostResponseDto, number>({
      query: (id) => `/ClubPost/${id}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "ClubPost", id }],
    }),
    getClubPostsByClubId: builder.query<ClubPostResponseDto[], number>({
      query: (clubId) => `/api/ClubPost/club/${clubId}`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) =>
        response.data,
      providesTags: ["ClubPost"],
    }),
    createClubPost: builder.mutation<ClubPostResponseDto, FormData>({
      query: (formData) => ({
        url: "/ClubPost",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: ["ClubPost"],
    }),

    updateClubPost: builder.mutation<
      ClubPostResponseDto,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/ClubPost/${id}`,
        method: "PUT",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "ClubPost", id },
        "ClubPost",
      ],
    }),

    deleteClubPost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/ClubPost/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClubPost"],
    }),
    // ─── ClubFund endpoints ─────────────────────────────────────────────
    getFundCapabilities: builder.query<ClubFundCapabilities, number>({
      query: (clubId) => `/clubs/${clubId}/funds/capabilities`,
      transformResponse: (response: ApiResponse<ClubFundCapabilities>) =>
        normalizeClubFundCapabilitiesFromApi(response),
      providesTags: (result, error, clubId) => [
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
      providesTags: (result, error, { clubId }) => [
        { type: "ClubFund", id: `report-summary-${clubId}` },
      ],
    }),
    getFundCategories: builder.query<FundCategoryResponseDto[], number>({
      query: (clubId) => `/clubs/${clubId}/funds/categories`,
      transformResponse: (response: ApiResponse<FundCategoryResponseDto[]>) =>
        response.data ?? [],
      providesTags: (result, error, clubId) => [
        { type: "ClubFund", id: `categories-${clubId}` },
      ],
    }),
    getFundById: builder.query<ClubFund, FundScoped>({
      query: ({ clubId, fundId }) => `/clubs/${clubId}/funds/${fundId}`,
      transformResponse: (response: ApiResponse<ClubFund>) =>
        normalizeClubFund(response.data),
      providesTags: (result, error, { fundId }) => [
        { type: "ClubFund", id: fundId },
      ],
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
      ) => {
        const paged = normalizePagedResult<ClubFund>(response.data);
        return {
          ...paged,
          items: paged.items.map((i) => normalizeClubFund(i)),
        };
      },
      providesTags: (result, error, { clubId }) => [
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
              items: paged.items.map((i) => normalizeClubFund(i)),
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
          return {
            error: (myFundsRes.error ??
              fallbackRes.error) as FetchBaseQueryError,
          };
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

        let filtered = fallbackPaged.items
          .map((i) => normalizeClubFund(i))
          .filter((i) => matchesMineType(i, mineType));
        if (status !== "ALL") {
          filtered = filtered.filter(
            (i) => String(i.status ?? "").toUpperCase() === status,
          );
        }
        if (search) {
          filtered = filtered.filter((i) =>
            String(i.fundName ?? "")
              .toLowerCase()
              .includes(search),
          );
        }
        filtered = sortClubFunds(filtered, sort);
        const totalCount = filtered.length;
        const totalPages =
          totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
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
      providesTags: (result, error, { clubId }) => [
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

    getFundMemberContributions: builder.query<
      FundMemberContributionsDto,
      { clubId: number; fundId: number }
    >({
      query: ({ clubId, fundId }) =>
        `/clubs/${clubId}/funds/${fundId}/member-contributions`,
      transformResponse: (response: ApiResponse<FundMemberContributionsDto>) =>
        response.data as FundMemberContributionsDto,
      providesTags: (result, error, { clubId, fundId }) => [
        { type: "ClubFund", id: `member-contrib-${clubId}-${fundId}` },
      ],
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
        return {
          url: `/clubs/${clubId}/funds/history/${fundId}`,
          params,
        };
      },
      transformResponse: (
        response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>,
      ) => normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (result, error, { fundId }) => [
        { type: "ClubFund", id: fundId },
      ],
    }),

    /** Danh sách giao dịch quỹ theo CLB (một hoặc mọi quỹ). Policy: viewfinance. */
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
        return {
          url: `/clubs/${clubId}/funds/transactions`,
          params,
        };
      },
      transformResponse: (
        response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>,
      ) => normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (result, error, { clubId }) => [
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
        response.data,
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
        return {
          transactionId: d?.transactionId ?? 0,
          fundId: d?.fundId ?? 0,
          status: d?.status,
          amount: d?.amount,
          isPaid: !!d?.isPaid,
          isPaymentLinkExpired: !!d?.isPaymentLinkExpired,
          paymentLinkExpiresAtUtc: d?.paymentLinkExpiresAtUtc ?? undefined,
          message: d?.message,
        };
      },
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
      invalidatesTags: (result, error, { clubId, body }) => [
        "ClubFund",
        { type: "ClubFund", id: body.fundId },
        { type: "ClubFund", id: `capabilities-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `my-funds-${clubId}` },
        { type: "ClubFund", id: `club-${clubId}` },
        { type: "ClubFund", id: `report-summary-${clubId}` },
      ],
    }),

    /** PayOS redirect: Bearer JWT. orderCode trên URL = transactionId. */
    getPayosFundContributionReturn: builder.query<
      PayosFundContributionReturn,
      number
    >({
      query: (orderCode) => `/fund-contributions/payos-return/${orderCode}`,
      transformResponse: (
        response: ApiResponse<PayosFundContributionReturn>,
      ) => {
        const d = response.data;
        return {
          clubId: Number(d?.clubId) || 0,
          fundId: Number(d?.fundId) || 0,
          isPaid: !!d?.isPaid,
          message: d?.message,
        };
      },
    }),

    // ─── PayOS onboarding per-club ───────────────────────────────────────
    /** Guide: all club members can view. */
    getPayosGuide: builder.query<ClubPayosGuide, number>({
      query: (clubId) => `/clubs/${clubId}/funds/payos-guide`,
      transformResponse: (response: ApiResponse<ClubPayosGuide>) =>
        normalizeClubPayosGuide(response.data),
      providesTags: (result, error, clubId) => [
        { type: "ClubFund", id: `payos-guide-${clubId}` },
      ],
    }),

    getPayosSettings: builder.query<ClubPayosSettings, number>({
      query: (clubId) => `/clubs/${clubId}/funds/payos-settings`,
      transformResponse: (response: ApiResponse<ClubPayosSettings>) =>
        normalizeClubPayosSettings(response.data),
      providesTags: (result, error, clubId) => [
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
      invalidatesTags: (result, error, { clubId }) => [
        { type: "ClubFund", id: `payos-guide-${clubId}` },
        { type: "ClubFund", id: `payos-settings-${clubId}` },
      ],
    }),
    // ─── Member Roles ───────────────────────────────────────────────────
    updateMemberRole: builder.mutation<
      void,
      { clubId: number; memberId: number; clubRoleId: number | null }
    >({
      query: ({ clubId, memberId, clubRoleId }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: "PUT",
        body: { clubRoleId },
      }),
      invalidatesTags: (result, error, { clubId }) => [
        { type: "Club", id: `members-${clubId}` },
      ],
    }),
    getFundLocation: builder.query<FundLocationResponse, number>({
      query: (fundId) => `/funds/${fundId}/location`,
      transformResponse: (response: ApiResponse<FundLocationResponse>) =>
        response.data,
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
      invalidatesTags: (result, error, { clubId }) => [
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
        const paged = normalizePagedResult<FundRefundRequestResponseDto>(
          response.data,
        );
        return {
          ...paged,
          items: paged.items.map((i) => normalizeFundRefundRequest(i)),
        };
      },
      providesTags: (result, error, { clubId }) => [
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
      invalidatesTags: (result, error, { clubId }) => [
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
        const paged = normalizePagedResult<FundRefundRequestResponseDto>(
          response.data,
        );
        return {
          ...paged,
          items: paged.items.map((i) => normalizeFundRefundRequest(i)),
        };
      },
      providesTags: (result, error, { clubId }) => [
        { type: "ClubFund", id: `refund-club-${clubId}` },
      ],
    }),

    completeFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      {
        clubId: number;
        refundRequestId: number;
        body?: CompleteFundRefundRequestDto;
      }
    >({
      query: ({ clubId, refundRequestId, body }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/${refundRequestId}/complete`,
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (result, error, { clubId }) => [
        { type: "ClubFund", id: `refund-mine-${clubId}` },
        { type: "ClubFund", id: `refund-club-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `club-${clubId}` },
      ],
    }),

    rejectFundRefundRequest: builder.mutation<
      FundRefundRequestResponseDto,
      {
        clubId: number;
        refundRequestId: number;
        body: RejectFundRefundRequestDto;
      }
    >({
      query: ({ clubId, refundRequestId, body }) => ({
        url: `/clubs/${clubId}/funds/refund-requests/${refundRequestId}/reject`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FundRefundRequestResponseDto>) =>
        normalizeFundRefundRequest(response.data),
      invalidatesTags: (result, error, { clubId }) => [
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
      invalidatesTags: (result, error, { clubId, fundId }) => [
        { type: "ClubFund", id: fundId },
        { type: "ClubFund", id: `club-${clubId}` },
        { type: "ClubFund", id: `club-tx-${clubId}` },
        { type: "ClubFund", id: `member-contrib-${clubId}-${fundId}` },
      ],
    }),
  }),
});

export const {
  useGetFundTypesQuery,
  useGetClubsQuery,
  useGetFundCapabilitiesQuery,
  useGetFundReportSummaryQuery,
  useGetClubFundTransactionsQuery,
  useLazyGetFundHistoryQuery,
  useGetFundCategoriesQuery,
  useGetActiveClubsQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useGetFundByIdQuery,
  useGetFundLocationQuery,
  useGetFundsByClubQuery,
  useGetMyFundsQuery,
  useCreateFundMutation,
  useGetFundMemberContributionsQuery,
  useApproveFundMutation,
  useContributeToFundMutation,
  useRecordCashContributionMutation,
  useLazyGetContributeTransactionStatusQuery,
  useLazyGetPayosFundContributionReturnQuery,
  useGetPayosGuideQuery,
  useGetPayosSettingsQuery,
  useUpdatePayosSettingsMutation,
  useGetMyClubsForFundsQuery,
  useGetMyClubsForFundsV2Query,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsQuery,
  useGetClubPostsByClubIdQuery,
  useGetClubPostByIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useUpdateMemberRoleMutation,
  useCreateFundRefundRequestMutation,
  useGetMyFundRefundRequestsQuery,
  useCancelFundRefundRequestMutation,
  useGetClubFundRefundRequestsQuery,
  useCompleteFundRefundRequestMutation,
  useRejectFundRefundRequestMutation,
  useCreateManagerRefundMutation,
} = clubApi;
