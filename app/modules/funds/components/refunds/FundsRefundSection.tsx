import type { ClubFundCapabilities } from '~/cores/api';
import { isManagerRole } from '~/hooks/useClubRole';
import { MemberRequestForm } from './MemberRequestForm';
import { MyRefundList } from './MyRefundList';
import { ManagerRefundQueue } from './ManagerRefundQueue';

export function showMemberRefundRequestForm(
  caps: ClubFundCapabilities | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return false;
  if (caps?.canProcessClubRefunds === true) return false;
  if (caps?.hasEditFinancePolicy) return false;
  if (isManagerRole(caps?.clubRoleName)) return false;
  return true;
}

type MemberPanelProps = {
  clubId: number;
  skip: boolean;
  caps: ClubFundCapabilities | undefined;
  isAdmin: boolean;
};

export function MemberRefundPanel({ clubId, skip, caps, isAdmin }: MemberPanelProps) {
  const showForm = showMemberRefundRequestForm(caps, isAdmin);

  return (
    <div className="space-y-6">
      {showForm ? <MemberRequestForm clubId={clubId} skip={skip} /> : null}
      <MyRefundList clubId={clubId} skip={skip} />
    </div>
  );
}

type Props = {
  clubId: number;
  skip: boolean;
  caps: ClubFundCapabilities | undefined;
  isAdmin: boolean;
};

export function FundsRefundSection({ clubId, skip, caps, isAdmin }: Props) {
  const showManagerQueue =
    isAdmin ||
    caps?.canProcessClubRefunds === true ||
    caps?.hasEditFinancePolicy === true;
  const showForm = showMemberRefundRequestForm(caps, isAdmin);

  return (
    <div className="space-y-6">
      {showForm ? <MemberRequestForm clubId={clubId} skip={skip} /> : null}
      <MyRefundList clubId={clubId} skip={skip} />
      {showManagerQueue ? <ManagerRefundQueue clubId={clubId} skip={skip} /> : null}
    </div>
  );
}
