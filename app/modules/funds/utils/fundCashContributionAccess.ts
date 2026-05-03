import type { ClubFundCapabilities } from '~/cores/api/types';

export function canShowRecordCashContributionForm(
  isAdmin: boolean,
  caps: ClubFundCapabilities | undefined,
  canEditFinancePolicy: boolean = false,
): boolean {
  if (isAdmin) return true;
  if (caps?.canRecordCashContributions === true) return true;
  if (canEditFinancePolicy) return true;
  if (!caps?.hasEditFinancePolicy) return false;
  return [0, 1].includes(Number(caps.clubRoleLevel));
}
