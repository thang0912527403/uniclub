import type { FundHistoryScopeFilter, FundHistoryStatusFilter } from '~/cores/api';

export const FUND_HISTORY_PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_FUND_HISTORY_PAGE_SIZE = 20;
export const FILTER_DEBOUNCE_MS = 300;

export const FUND_HISTORY_STATUS_OPTIONS: ReadonlyArray<{
  value: FundHistoryStatusFilter;
  label: string;
}> = [
  { value: '', label: 'Đã thanh toán (mặc định)' },
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

export const FUND_HISTORY_SCOPE_OPTIONS: ReadonlyArray<{
  value: FundHistoryScopeFilter;
  label: string;
}> = [
  { value: '', label: 'Tất cả giao dịch' },
  { value: 'mine', label: 'Giao dịch của tôi' },
];
