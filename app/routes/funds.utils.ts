import type { FundListSort, FundListStatus, FundMineType } from '~/cores/api/types';

export const FUND_DUPLICATE_NAME_MESSAGE = 'Tên quỹ đã tồn tại trong câu lạc bộ này.';
export const DEFAULT_FUND_STATUS: FundListStatus = 'ALL';
export const DEFAULT_FUND_SORT: FundListSort = 'NEWEST';
export const DEFAULT_FUND_PAGE_SIZE = 9;
export const DEFAULT_FUND_MINE_TYPE: FundMineType = 'ALL';

export function parseFundStatus(v: string | null): FundListStatus {
  if (v === 'PENDING' || v === 'APPROVED' || v === 'REJECTED' || v === 'ALL') return v;
  return DEFAULT_FUND_STATUS;
}

export function parseFundSort(v: string | null): FundListSort {
  if (v === 'NEWEST' || v === 'OLDEST' || v === 'NAME_ASC' || v === 'NAME_DESC') return v;
  return DEFAULT_FUND_SORT;
}

export function parseFundMineType(v: string | null): FundMineType {
  if (v === 'ALL' || v === 'CREATED' || v === 'RESPONSIBLE') return v;
  return DEFAULT_FUND_MINE_TYPE;
}

export function buildCreateFundPayload(fundName: string, expiresAt?: string, description?: string) {
  const payload: { fundName: string; expiresAt?: string; description?: string } = {
    fundName: fundName.trim(),
  };
  if (expiresAt) payload.expiresAt = expiresAt;
  const normalizedDescription = description?.trim();
  if (normalizedDescription) payload.description = normalizedDescription;
  return payload;
}

export function isDuplicateFundNameError(message?: string): boolean {
  return message === FUND_DUPLICATE_NAME_MESSAGE;
}

export function buildFundsListQueryArgs(input: {
  clubId: number;
  page: number;
  pageSize: number;
  search: string;
  status: FundListStatus;
  sort: FundListSort;
}) {
  return {
    clubId: input.clubId,
    page: input.page,
    pageSize: input.pageSize,
    search: input.search.trim() || undefined,
    status: input.status,
    sort: input.sort,
  };
}

export function applyFilterChangeParams(
  prev: URLSearchParams,
  options: {
    search?: string | null;
    mineType?: FundMineType;
    status?: FundListStatus;
    sort?: FundListSort;
    pageSize: number;
  },
) {
  const next = new URLSearchParams(prev);
  if (options.search !== undefined) {
    const normalized = options.search?.trim() ?? '';
    if (normalized) next.set('search', normalized);
    else next.delete('search');
  }
  if (options.mineType !== undefined) {
    if (options.mineType === DEFAULT_FUND_MINE_TYPE) next.delete('mineType');
    else next.set('mineType', options.mineType);
  }
  if (options.status !== undefined) {
    if (options.status === DEFAULT_FUND_STATUS) next.delete('status');
    else next.set('status', options.status);
  }
  if (options.sort !== undefined) {
    if (options.sort === DEFAULT_FUND_SORT) next.delete('sort');
    else next.set('sort', options.sort);
  }
  next.set('page', '1');
  if (options.pageSize !== DEFAULT_FUND_PAGE_SIZE) next.set('pageSize', String(options.pageSize));
  else next.delete('pageSize');
  return next;
}
