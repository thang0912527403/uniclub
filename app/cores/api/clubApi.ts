import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
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
  type ClubFundCapabilities,
  type FundCategoryResponseDto,
  type FundHistoryScope,
  type FundMineType,
  type FundListSort,
  type FundListStatus,
  type FundMenuItemDto,
  type FundReportSummaryDto,
  type FundSidebarMenuId,
  type GetClubFundTransactionsParams,
  type GetMyFundsParams,
  type MyFundsPagedResult,
  type PagedResult,
} from './types';

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
  if (rawTc != null && rawTc !== '' && Number.isFinite(Number(rawTc))) {
    totalCountFinal = Math.max(0, Number(rawTc));
  } else {
    totalCountFinal = items.length;
  }
  let totalPages = Number(d.totalPages);
  if (!Number.isFinite(totalPages) || totalPages < 1) {
    totalPages =
      totalCountFinal > 0 && pageSize > 0 ? Math.ceil(totalCountFinal / pageSize) : 0;
  }
  const hasPreviousPage =
    typeof d.hasPreviousPage === 'boolean' ? d.hasPreviousPage : pageNumber > 1;
  const hasNextPage =
    typeof d.hasNextPage === 'boolean'
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

const FUND_SIDEBAR_MENU_IDS: readonly FundSidebarMenuId[] = [
  'overview',
  'transactions',
  'reports',
  'settings',
];

function isFundSidebarMenuId(id: string): id is FundSidebarMenuId {
  return (FUND_SIDEBAR_MENU_IDS as readonly string[]).includes(id);
}

function normalizeFundMenuItemsFromApi(raw: unknown): FundMenuItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: FundMenuItemDto[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    const id = String(e.id ?? e.Id ?? '').trim();
    if (!isFundSidebarMenuId(id)) continue;
    out.push({
      id,
      labelVi: String(e.labelVi ?? e.LabelVi ?? '').trim() || id,
      labelEn: String(e.labelEn ?? e.LabelEn ?? '').trim() || id,
      visible: !!(e.visible ?? e.Visible),
    });
  }
  return out;
}

function numFundReport(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function pickOptionalViString(d: Record<string, unknown>, camel: string, pascal: string): string | null {
  const v = d[camel] ?? d[pascal];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function normalizeFundReportSummary(raw: unknown): FundReportSummaryDto {
  if (raw == null || typeof raw !== 'object') {
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
    approvedFundCount: numFundReport(d.approvedFundCount ?? d.ApprovedFundCount),
    rejectedFundCount: numFundReport(d.rejectedFundCount ?? d.RejectedFundCount),
    totalBalanceApprovedFunds: numFundReport(d.totalBalanceApprovedFunds ?? d.TotalBalanceApprovedFunds),
    totalApprovedIncome: numFundReport(d.totalApprovedIncome ?? d.TotalApprovedIncome),
    totalApprovedExpense: numFundReport(d.totalApprovedExpense ?? d.TotalApprovedExpense),
    dateFilterNoteVi: pickOptionalViString(d, 'dateFilterNoteVi', 'DateFilterNoteVi'),
  };
}

function normalizeClubFund(raw: unknown): ClubFund {
  if (raw == null || typeof raw !== 'object') return {} as ClubFund;
  const d = raw as Record<string, unknown>;
  const num = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const canAcceptRaw = d.canAcceptContributions ?? d.CanAcceptContributions;
  return {
    fundId: num(d.fundId ?? d.FundId) ?? 0,
    clubId: num(d.clubId ?? d.ClubId) ?? 0,
    fundName: String(d.fundName ?? d.FundName ?? '').trim() || undefined,
    currentBalance: num(d.currentBalance ?? d.CurrentBalance),
    totalAmount: num(d.totalAmount ?? d.TotalAmount),
    balance: num(d.balance ?? d.Balance),
    description: String(
      d.description ??
      d.Description ??
      d.fundDescription ??
      d.FundDescription ??
      d.purpose ??
      d.Purpose ??
      ''
    ).trim() || undefined,
    status: (d.status ?? d.Status) as ClubFund['status'],
    createdAt: (d.createdAt ?? d.CreatedAt) as string | undefined,
    updatedAt: (d.updatedAt ?? d.UpdatedAt) as string | undefined,
    expiresAt: (d.expiresAt ?? d.ExpiresAt ?? null) as string | null | undefined,
    canAcceptContributions: canAcceptRaw == null ? undefined : Boolean(canAcceptRaw),
    balanceContextVi: pickOptionalViString(d, 'balanceContextVi', 'BalanceContextVi'),
    cannotContributeReasonVi: pickOptionalViString(d, 'cannotContributeReasonVi', 'CannotContributeReasonVi'),
    rejectionReasonVi:
      pickOptionalViString(d, 'rejectionReasonVi', 'RejectionReasonVi') ??
      pickOptionalViString(d, 'rejectionReason', 'RejectionReason') ??
      pickOptionalViString(d, 'rejectReason', 'RejectReason'),
    expiresAtUtcNoteVi: pickOptionalViString(d, 'expiresAtUtcNoteVi', 'ExpiresAtUtcNoteVi'),
  };
}

function normalizeFundPagedResponse(raw: unknown): PagedResult<ClubFund> {
  if (raw == null || typeof raw !== 'object') return normalizePagedResult<ClubFund>(raw);
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
  if (sort === 'NAME_ASC') return cloned.sort((a, b) => String(a.fundName ?? '').localeCompare(String(b.fundName ?? ''), 'vi'));
  if (sort === 'NAME_DESC') return cloned.sort((a, b) => String(b.fundName ?? '').localeCompare(String(a.fundName ?? ''), 'vi'));
  if (sort === 'OLDEST') return cloned.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
  return cloned.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

function matchesMineType(item: ClubFund, mineType: FundMineType): boolean {
  if (mineType === 'ALL') return true;
  // Temporary client-side fallback when BE /funds/my unavailable:
  // split deterministic by fundId so tabs remain testable.
  if (mineType === 'CREATED') return (item.fundId ?? 0) % 2 === 1;
  return (item.fundId ?? 0) % 2 === 0;
}

function buildMyFundsQuery(clubId: number, params: Omit<GetMyFundsParams, 'clubId'>) {
  return {
    url: `/clubs/${clubId}/funds/my`,
    params: {
      mineType: params.mineType ?? 'ALL',
      status: params.status ?? 'ALL',
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      sort: params.sort ?? 'NEWEST',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 9,
    },
  };
}

const USE_MOCK_MY_FUNDS = String(import.meta.env.VITE_MOCK_MY_FUNDS ?? '').toLowerCase() === 'true';

export const clubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClubs: builder.query<Club[], void>({
      query: () => '/Club',
      transformResponse: (response: ApiResponse<Club[]>) => response.data,
      providesTags: ['Club'],
    }),
    getClubById: builder.query<Club, number>({
      query: (id) => `/Club/${id}`,
      transformResponse: (response: ApiResponse<Club>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Club', id }],
    }),
    getClubMembers: builder.query<ClubMember[], number>({
      query: (clubId) => `/clubs/${clubId}/members`,
      transformResponse: (response: ApiResponse<ClubMember[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
    createClub: builder.mutation<Club, Partial<Club>>({
      query: (club) => ({
        url: '/Club',
        method: 'POST',
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: ['Club'],
    }),
    updateClub: builder.mutation<Club, { id: number; club: Partial<Club> }>({
      query: ({ id, club }) => ({
        url: `/Club/${id}`,
        method: 'PUT',
        body: club,
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Club', id }],
    }),
    deleteClub: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Club/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Club'],
    }),
    toggleClubStatus: builder.mutation<Club, { id: number; isActive: boolean }>({
      query: ({ id }) => ({
        url: `/Club/ChangeStatus/${id}`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<Club>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Club', id }, 'Club'],
    }),
    // ─── ClubPost: /api/club/{clubId}/posts (không còn /ClubPost flat) ─────────
    getClubPostsByClubId: builder.query<ClubPostResponseDto[], number>({
      query: (clubId) => `/club/${clubId}/posts`,
      transformResponse: (response: ApiResponse<ClubPostResponseDto[]>) => response.data,
      providesTags: (result, error, clubId) => [{ type: 'ClubPost', id: `club-${clubId}` }],
    }),
    /** Trang chủ / news: gộp bài từ mọi CLB (gọi lần lượt theo từng clubId). */
    getAllClubPosts: builder.query<ClubPostResponseDto[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const clubsRes = await baseQuery('/Club');
        if (clubsRes.error) {
          return { error: clubsRes.error as FetchBaseQueryError };
        }
        const raw = clubsRes.data as ApiResponse<Club[]>;
        const clubs = raw?.data ?? [];
        const all: ClubPostResponseDto[] = [];
        for (const club of clubs) {
          const r = await baseQuery(`/club/${club.clubId}/posts`);
          if (!r.error && r.data) {
            const inner = r.data as ApiResponse<ClubPostResponseDto[]>;
            all.push(...(inner.data ?? []));
          }
        }
        return { data: all };
      },
      providesTags: ['ClubPost'],
    }),
    getClubPostById: builder.query<ClubPostResponseDto, { postId: number; clubId?: number }>({
      async queryFn({ postId, clubId }, _api, _extraOptions, baseQuery) {
        if (clubId != null && clubId > 0) {
          const r = await baseQuery(`/club/${clubId}/posts/${postId}`);
          if (r.error) {
            return { error: r.error as FetchBaseQueryError };
          }
          const raw = r.data as ApiResponse<ClubPostResponseDto>;
          return { data: raw.data };
        }
        const clubsRes = await baseQuery('/Club');
        if (clubsRes.error) {
          return { error: clubsRes.error as FetchBaseQueryError };
        }
        const clubs = (clubsRes.data as ApiResponse<Club[]>).data ?? [];
        for (const c of clubs) {
          const r = await baseQuery(`/club/${c.clubId}/posts/${postId}`);
          if (!r.error && r.data) {
            const raw = r.data as ApiResponse<ClubPostResponseDto>;
            if (raw?.data) {
              return { data: raw.data };
            }
          }
        }
        return {
          error: {
            status: 404,
            statusText: 'Not Found',
            data: 'Post not found',
          } as FetchBaseQueryError,
        };
      },
      providesTags: (result, error, { postId }) => [{ type: 'ClubPost', id: postId }],
    }),
    createClubPost: builder.mutation<CreateClubPostDto, { clubId: number; formData: FormData }>({
      query: ({ clubId, formData }) => ({
        url: `/club/${clubId}/posts`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<CreateClubPostDto>) => response.data,
      invalidatesTags: (result, error, { clubId }) => [
        { type: 'ClubPost', id: `club-${clubId}` },
        'ClubPost',
      ],
    }),
    updateClubPost: builder.mutation<
      ClubPostResponseDto,
      { clubId: number; id: number; formData: FormData }
    >({
      query: ({ clubId, id, formData }) => ({
        url: `/club/${clubId}/posts/${id}`,
        method: 'PUT',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ClubPostResponseDto>) => response.data,
      invalidatesTags: (result, error, { clubId, id }) => [
        { type: 'ClubPost', id: `club-${clubId}` },
        { type: 'ClubPost', id },
        'ClubPost',
      ],
    }),
    deleteClubPost: builder.mutation<void, { clubId: number; id: number }>({
      query: ({ clubId, id }) => ({
        url: `/club/${clubId}/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { clubId, id }) => [
        { type: 'ClubPost', id: `club-${clubId}` },
        { type: 'ClubPost', id },
        'ClubPost',
      ],
    }),
    // ─── ClubFund endpoints ─────────────────────────────────────────────
    getFundCapabilities: builder.query<ClubFundCapabilities, number>({
      query: (clubId) => `/clubs/${clubId}/funds/capabilities`,
      transformResponse: (response: ApiResponse<ClubFundCapabilities>) => {
        const d = response.data;
        const rawCap = d as unknown as Record<string, unknown> | undefined;
        return {
          canViewFunds: !!d?.canViewFunds,
          canContribute: !!d?.canContribute,
          canCreateFund: !!d?.canCreateFund,
          canApproveOrRejectFundEntity: !!d?.canApproveOrRejectFundEntity,
          hasViewFinancePolicy: !!d?.hasViewFinancePolicy,
          hasCreateFinancePolicy: !!d?.hasCreateFinancePolicy,
          hasEditFinancePolicy: !!d?.hasEditFinancePolicy,
          clubRoleName: d?.clubRoleName ?? null,
          clubRoleLevel: d?.clubRoleLevel ?? null,
          isActiveClubMember: !!d?.isActiveClubMember,
          menuItems: normalizeFundMenuItemsFromApi(
            rawCap ? (rawCap.menuItems ?? rawCap.MenuItems) : undefined,
          ),
          financeAccessHintVi: rawCap
            ? pickOptionalViString(rawCap, 'financeAccessHintVi', 'FinanceAccessHintVi')
            : null,
        };
      },
      providesTags: (result, error, clubId) => [{ type: 'ClubFund', id: `capabilities-${clubId}` }],
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
      providesTags: (result, error, { clubId }) => [{ type: 'ClubFund', id: `report-summary-${clubId}` }],
    }),
    getFundCategories: builder.query<FundCategoryResponseDto[], number>({
      query: (clubId) => `/clubs/${clubId}/funds/categories`,
      transformResponse: (response: ApiResponse<FundCategoryResponseDto[]>) => response.data ?? [],
      providesTags: (result, error, clubId) => [{ type: 'ClubFund', id: `categories-${clubId}` }],
    }),
    getFundById: builder.query<ClubFund, FundScoped>({
      query: ({ clubId, fundId }) => `/clubs/${clubId}/funds/${fundId}`,
      transformResponse: (response: ApiResponse<ClubFund>) => normalizeClubFund(response.data),
      providesTags: (result, error, { fundId }) => [{ type: 'ClubFund', id: fundId }],
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
      transformResponse: (response: ApiResponse<PagedResult<ClubFund> | ClubFund[]>) => {
        const paged = normalizePagedResult<ClubFund>(response.data);
        return {
          ...paged,
          items: paged.items.map((i) => normalizeClubFund(i)),
        };
      },
      providesTags: (result, error, { clubId }) => [
        { type: 'ClubFund', id: `club-${clubId}` },
      ],
    }),
    getMyFunds: builder.query<MyFundsPagedResult, GetMyFundsParams>({
      async queryFn({ clubId, ...params }, _api, _extraOptions, baseQuery) {
        const myFundsRes = await baseQuery(buildMyFundsQuery(clubId, params));
        if (!myFundsRes.error && myFundsRes.data) {
          const raw = (myFundsRes.data as ApiResponse<PagedResult<ClubFund> | ClubFund[]>).data;
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
          myFundsRes.error && typeof myFundsRes.error === 'object' && 'status' in myFundsRes.error
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

        const fallbackRaw = (fallbackRes.data as ApiResponse<PagedResult<ClubFund> | ClubFund[]>).data;
        const fallbackPaged = normalizeFundPagedResponse(fallbackRaw);
        const mineType = params.mineType ?? 'ALL';
        const status = params.status ?? 'ALL';
        const search = params.search?.trim().toLowerCase() ?? '';
        const sort = params.sort ?? 'NEWEST';
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 9));

        let filtered = fallbackPaged.items.map((i) => normalizeClubFund(i)).filter((i) => matchesMineType(i, mineType));
        if (status !== 'ALL') {
          filtered = filtered.filter((i) => String(i.status ?? '').toUpperCase() === status);
        }
        if (search) {
          filtered = filtered.filter((i) => String(i.fundName ?? '').toLowerCase().includes(search));
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
      providesTags: (result, error, { clubId }) => [{ type: 'ClubFund', id: `my-funds-${clubId}` }],
    }),
    createFund: builder.mutation<ClubFund, { clubId: number } & CreateFundDto>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds`,
        method: 'POST',
        body: {
          ...body,
          ...(body.description ? { Description: body.description } : {}),
          ...(body.description ? { fundDescription: body.description } : {}),
          ...(body.description ? { FundDescription: body.description } : {}),
          ...(body.description ? { purpose: body.description } : {}),
          ...(body.description ? { Purpose: body.description } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<ClubFund>) => normalizeClubFund(response.data),
      invalidatesTags: ['ClubFund'],
    }),
    getMyClubsForFunds: builder.query<Club[], void>({
      query: () => '/ClubFund/my-clubs',
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ['ClubFund', 'Club'],
    }),

    getMyClubsForFundsV2: builder.query<Club[], void>({
      query: () => '/clubs/funds/my-clubs',
      transformResponse: (response: ApiResponse<Club[]>) => response.data ?? [],
      providesTags: ['ClubFund', 'Club'],
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
        if (scope === 'mine') params.scope = scope;
        return {
          url: `/clubs/${clubId}/funds/history/${fundId}`,
          params,
        };
      },
      transformResponse: (response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>) =>
        normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (result, error, { fundId }) => [
        { type: 'ClubFund', id: fundId },
      ],
    }),

    /** Danh sách giao dịch quỹ theo CLB (một hoặc mọi quỹ). Policy: viewfinance. */
    getClubFundTransactions: builder.query<
      PagedResult<FundHistoryItem>,
      GetClubFundTransactionsParams
    >({
      query: ({ clubId, page = 1, pageSize = 20, fundId, status, scope, fromUtc, toUtc }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (fundId != null && fundId > 0) params.fundId = fundId;
        if (status) params.status = status;
        if (scope === 'mine') params.scope = scope;
        if (fromUtc) params.fromUtc = fromUtc;
        if (toUtc) params.toUtc = toUtc;
        return {
          url: `/clubs/${clubId}/funds/transactions`,
          params,
        };
      },
      transformResponse: (response: ApiResponse<PagedResult<FundHistoryItem> | FundHistoryItem[]>) =>
        normalizePagedResult<FundHistoryItem>(response.data),
      providesTags: (result, error, { clubId }) => [
        { type: 'ClubFund', id: `club-tx-${clubId}` },
      ],
    }),

    approveFund: builder.mutation<ClubFund, ApproveFundDto & ClubFundScoped>({
      query: ({ clubId, ...body }) => {
        const action = (body as ApproveFundDto).action;
        const reason = (body as ApproveFundDto).rejectReason?.trim();
        return {
          url: `/clubs/${clubId}/funds/approve`,
          method: 'POST',
          body: {
            ...body,
            Action: action,
            ...(action === 'REJECT' && reason
              ? { rejectReason: reason, RejectReason: reason, rejectionReason: reason, RejectionReason: reason }
              : {}),
          },
        };
      },
      transformResponse: (response: ApiResponse<ClubFund>) => normalizeClubFund(response.data),
      invalidatesTags: ['ClubFund'],
    }),

    contributeToFund: builder.mutation<ContributeToFundResponse, ClubFundScoped & ContributeToFundDto>({
      query: ({ clubId, ...body }) => ({
        url: `/clubs/${clubId}/funds/contribute`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<ContributeToFundResponse>) => response.data,
      invalidatesTags: ['ClubFund'],
    }),
    getContributeTransactionStatus: builder.query<
      FundContributeTransactionStatus,
      { clubId: number; transactionId: number }
    >({
      query: ({ clubId, transactionId }) =>
        `/clubs/${clubId}/funds/contribute/${transactionId}/status`,
      transformResponse: (response: ApiResponse<FundContributeTransactionStatus>) => {
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
    /** PayOS redirect: Bearer JWT. orderCode trên URL = transactionId. */
    getPayosFundContributionReturn: builder.query<PayosFundContributionReturn, number>({
      query: (orderCode) => `/fund-contributions/payos-return/${orderCode}`,
      transformResponse: (response: ApiResponse<PayosFundContributionReturn>) => {
        const d = response.data;
        return {
          clubId: Number(d?.clubId) || 0,
          fundId: Number(d?.fundId) || 0,
          isPaid: !!d?.isPaid,
          message: d?.message,
        };
      },
    }),
    // ─── Member Roles ───────────────────────────────────────────────────
    updateMemberRole: builder.mutation<void, { clubId: number; memberId: number; clubRoleId: number | null }>({
      query: ({ clubId, memberId, clubRoleId }) => ({
        url: `/clubs/${clubId}/members/${memberId}/role`,
        method: 'PUT',
        body: { clubRoleId },
      }),
      invalidatesTags: (result, error, { clubId }) => [{ type: 'Club', id: `members-${clubId}` }],
    }),
    getFundLocation: builder.query<FundLocationResponse, number>({
      query: (fundId) => `/funds/${fundId}/location`,
      transformResponse: (response: ApiResponse<FundLocationResponse>) => response.data,
    }),
  }),
});

export const {
  useGetClubsQuery,
  useGetFundCapabilitiesQuery,
  useGetFundReportSummaryQuery,
  useGetClubFundTransactionsQuery,
  useGetFundCategoriesQuery,
  useGetClubByIdQuery,
  useGetClubMembersQuery,
  useGetFundByIdQuery,
  useGetFundsByClubQuery,
  useGetMyFundsQuery,
  useCreateFundMutation,
  useGetMyClubsForFundsQuery,
  useGetMyClubsForFundsV2Query,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useToggleClubStatusMutation,
  useGetClubPostsByClubIdQuery,
  useGetAllClubPostsQuery,
  useGetClubPostByIdQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useGetFundHistoryQuery,
  useApproveFundMutation,
  useUpdateMemberRoleMutation,
  useGetFundLocationQuery,
  useContributeToFundMutation,
  useLazyGetContributeTransactionStatusQuery,
  useLazyGetPayosFundContributionReturnQuery,
} = clubApi;
