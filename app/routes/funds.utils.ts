import type { FundListSort, FundListStatus, FundMineType } from '~/cores/api/types';

export const FUND_DUPLICATE_NAME_MESSAGE = 'Tên quỹ đã tồn tại trong câu lạc bộ này.';
export const DEFAULT_FUND_STATUS: FundListStatus = 'ALL';
export const DEFAULT_FUND_SORT: FundListSort = 'NEWEST';
export const DEFAULT_FUND_PAGE_SIZE = 9;
export const DEFAULT_FUND_MINE_TYPE: FundMineType = 'ALL';

export type FundPageMainView = 'funds' | 'refunds';

export function parseFundPageMainView(v: string | null): FundPageMainView {
  return v === 'refunds' ? 'refunds' : 'funds';
}

export type MyFundsScopeTab = 'created' | 'responsible' | 'contributions' | 'refunds';

export function parseMyFundsScopeTab(v: string | null): MyFundsScopeTab {
  if (v === 'responsible') return 'responsible';
  if (v === 'contributions' || v === 'transactions') return 'contributions';
  if (v === 'refunds') return 'refunds';
  return 'created';
}

export function applyMyFundsTabChangeParams(
  prev: URLSearchParams,
  tab: MyFundsScopeTab,
  pageSize: number,
) {
  const next = new URLSearchParams(prev);
  if (tab === 'created') next.delete('tab');
  else next.set('tab', tab);
  next.set('page', '1');
  if (pageSize !== DEFAULT_FUND_PAGE_SIZE) next.set('pageSize', String(pageSize));
  else next.delete('pageSize');
  return next;
}

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

export function buildCreateFundPayload(
  fundName: string,
  fundTypeId: number,
  expiresAt?: string,
  description?: string,
  goalAmount?: number,
) {
  const payload: {
    fundName: string;
    expiresAt?: string;
    description?: string;
    fundTypeId: number;
    goalAmount?: number;
  } = {
    fundName: fundName.trim(),
    fundTypeId,
  };
  if (expiresAt) payload.expiresAt = expiresAt;
  const normalizedDescription = description?.trim();
  if (normalizedDescription) payload.description = normalizedDescription;
  if (goalAmount != null && Number.isFinite(goalAmount) && goalAmount >= 0) {
    payload.goalAmount = goalAmount;
  }
  return payload;
}

export function isDuplicateFundNameError(message?: string): boolean {
  const normalized = String(message ?? '').trim();
  if (!normalized) return false;
  if (normalized === FUND_DUPLICATE_NAME_MESSAGE) return true;

  const lower = normalized.toLowerCase();
  const mentionsFundName = lower.includes('fundname') || lower.includes('fund name');
  const mentionsDuplicateVi = lower.includes('tồn tại') || lower.includes('trùng');
  const mentionsClubVi = lower.includes('câu lạc bộ') || lower.includes('clb') || lower.includes('club');
  return mentionsFundName && mentionsDuplicateVi && mentionsClubVi;
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

export type ParseVndIntegerResult =
  | { ok: true; amount: number }
  | { ok: false; message: string };

export function parseVndIntegerFromInput(raw: string): ParseVndIntegerResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, message: 'Vui lòng nhập số tiền.' };
  const noSpaces = trimmed.replace(/\s/g, '');
  let digits: string;
  if (/^\d+$/.test(noSpaces)) {
    digits = noSpaces;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(noSpaces)) {
    digits = noSpaces.replace(/\./g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(noSpaces)) {
    digits = noSpaces.replace(/,/g, '');
  } else {
    return {
      ok: false,
      message:
        'Chỉ nhập số nguyên (₫). Có thể dùng dấu chấm hoặc phẩy ngăn cách hàng nghìn (ví dụ 50.000). Không dùng số thập phân.',
    };
  }
  if (!digits || !/^\d+$/.test(digits)) return { ok: false, message: 'Số tiền không hợp lệ.' };
  const amount = Number(digits);
  if (!Number.isSafeInteger(amount)) return { ok: false, message: 'Số tiền quá lớn hoặc không hợp lệ.' };
  return { ok: true, amount };
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
