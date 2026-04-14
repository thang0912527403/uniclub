import type { ClubFundCapabilities } from '~/cores/api';
import { isManagerRole } from '~/hooks/useClubRole';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { MemberRequestForm } from './MemberRequestForm';
import { MyRefundList } from './MyRefundList';
import { ManagerRefundQueue } from './ManagerRefundQueue';

export function showMemberRefundRequestForm(
  caps: ClubFundCapabilities | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return false;
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
      {showForm ? (
        <MemberRequestForm clubId={clubId} skip={skip} />
      ) : (
        <div
          className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40`}
          role="note"
        >
          <p className={`text-sm ${t.type.body}`}>
            Với vai trò quản lý hoặc quyền xử lý tài chính trong CLB này, bạn không dùng biểu mẫu gửi yêu cầu hoàn ở
            đây — hãy xử lý tại <strong className="font-semibold text-slate-800 dark:text-slate-100">Quản lý quỹ</strong>{' '}
            → <strong className="font-semibold text-slate-800 dark:text-slate-100">Xử lý hoàn tiền</strong>. Danh sách
            bên dưới vẫn hiển thị các yêu cầu bạn đã gửi trước đây (nếu có).
          </p>
        </div>
      )}
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
  const showManagerQueue = isAdmin || caps?.hasEditFinancePolicy === true;
  const showForm = showMemberRefundRequestForm(caps, isAdmin);

  return (
    <div className="space-y-6">
      {showForm ? <MemberRequestForm clubId={clubId} skip={skip} /> : null}
      <MyRefundList clubId={clubId} skip={skip} />
      {showManagerQueue ? <ManagerRefundQueue clubId={clubId} skip={skip} /> : null}
    </div>
  );
}
