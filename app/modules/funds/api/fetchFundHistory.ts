import Cookies from 'js-cookie';
import { API_URLS } from '~/cores/api';
import type {
  FundHistoryItem,
  FundHistoryResponse,
  FundHistoryScopeFilter,
  FundHistoryStatusFilter,
} from '~/cores/api';

type FetchFundHistoryParams = {
  clubId: number;
  fundId: number;
  page: number;
  pageSize: number;
  status?: FundHistoryStatusFilter;
  scope?: FundHistoryScopeFilter;
  signal?: AbortSignal;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function emptyPaging(page: number, pageSize: number): FundHistoryResponse {
  return {
    items: [],
    pageNumber: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

function normalizePaging(
  payload: Partial<FundHistoryResponse> | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
): FundHistoryResponse {
  if (!payload) return emptyPaging(fallbackPage, fallbackPageSize);
  const items = Array.isArray(payload.items) ? (payload.items as FundHistoryItem[]) : [];
  const pageNumber = Math.max(1, Number(payload.pageNumber) || fallbackPage);
  const pageSize = Math.max(1, Number(payload.pageSize) || fallbackPageSize);
  const totalCount = Math.max(0, Number(payload.totalCount) || 0);
  const totalPagesRaw = Number(payload.totalPages);
  const totalPages = Number.isFinite(totalPagesRaw)
    ? Math.max(0, totalPagesRaw)
    : totalCount > 0
      ? Math.ceil(totalCount / pageSize)
      : 0;

  return {
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: typeof payload.hasPreviousPage === 'boolean' ? payload.hasPreviousPage : pageNumber > 1,
    hasNextPage:
      typeof payload.hasNextPage === 'boolean'
        ? payload.hasNextPage
        : totalPages > 0 && pageNumber < totalPages,
  };
}

export async function fetchFundHistory({
  clubId,
  fundId,
  page,
  pageSize,
  status = '',
  scope = '',
  signal,
}: FetchFundHistoryParams): Promise<FundHistoryResponse> {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
    pageSize: String(Math.min(100, Math.max(1, pageSize))),
  });

  if (status) params.set('status', status);
  if (scope) params.set('scope', scope);

  const accessToken = Cookies.get('accessToken');
  const response = await fetch(
    `${API_URLS.MAIN_SERVICE}/clubs/${clubId}/funds/history/${fundId}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      signal,
    },
  );

  if (!response.ok) {
    const fallback = 'Không thể tải lịch sử giao dịch quỹ.';
    let message = fallback;
    try {
      const errData = (await response.json()) as { message?: string };
      if (errData?.message) message = errData.message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as ApiEnvelope<FundHistoryResponse>;
  return normalizePaging(payload.data, page, pageSize);
}

export type { FetchFundHistoryParams };
