import type { NavigateFunction } from 'react-router';
import { setClubFundDetailSession } from '~/modules/funds/utils/clubFundDetailSession';
import { setClubId } from '~/utils/auth';

export const CLUB_FUND_DETAIL_PATH = '/clubs/funds/detail';

export function openClubFundDetail(
  navigate: NavigateFunction,
  selection: { clubId: number; fundId: number },
  options?: { replace?: boolean },
) {
  const { clubId, fundId } = selection;
  if (!Number.isFinite(clubId) || clubId < 1 || !Number.isFinite(fundId) || fundId < 1) return;
  setClubFundDetailSession({ clubId, fundId });
  setClubId(clubId);
  void navigate(CLUB_FUND_DETAIL_PATH, { replace: options?.replace ?? false });
}
