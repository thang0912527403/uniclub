import { Link } from 'react-router';
import { setClubId } from '~/utils/auth';
import { CLUB_FUND_DETAIL_PATH } from '~/modules/funds/utils/openClubFundDetail';
import { setClubFundDetailSession } from '~/modules/funds/utils/clubFundDetailSession';

type Props = {
  clubId: number;
  fundId: number;
  className?: string;
  children: React.ReactNode;
  stopPropagation?: boolean;
  afterSelect?: () => void;
};

export function ClubFundDetailLink({ clubId, fundId, className, children, stopPropagation, afterSelect }: Props) {
  return (
    <Link
      to={CLUB_FUND_DETAIL_PATH}
      className={className}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        if (!Number.isFinite(clubId) || clubId < 1 || !Number.isFinite(fundId) || fundId < 1) {
          e.preventDefault();
          return;
        }
        setClubFundDetailSession({ clubId, fundId });
        setClubId(clubId);
        afterSelect?.();
      }}
    >
      {children}
    </Link>
  );
}
