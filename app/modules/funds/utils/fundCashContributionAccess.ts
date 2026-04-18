import type { ClubFundCapabilities } from '~/cores/api/types';

export function canShowRecordCashContributionForm(
  isAdmin: boolean,
  caps: ClubFundCapabilities | undefined,
): boolean {
  if (isAdmin) return true;
  if (caps?.canRecordCashContributions === true) return true;
  if (!caps?.hasEditFinancePolicy) return false;
  return Number(caps.clubRoleLevel) === 1;
}
