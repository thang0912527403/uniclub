import type { ClubFund, FundLifecycleFilter } from '~/cores/api/types';

export function fundMatchesLifecycleFilter(fund: ClubFund, filter: FundLifecycleFilter): boolean {
  const closed = fund.isClosed === true;
  const code = fund.closedReasonCode ?? null;
  switch (filter) {
    case 'ALL':
      return true;
    case 'OPEN':
      return !closed;
    case 'CLOSED':
      return closed;
    case 'EXPIRED':
      return closed && code === 'EXPIRED';
    case 'MANAGER_CLOSED':
      return closed && code === 'MANAGER_CLOSED';
    default:
      return true;
  }
}
