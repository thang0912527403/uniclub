import { useEffect, useState } from 'react';
import { HandCoins, Plus, X } from 'lucide-react';
import type { ClubFundCapabilities } from '~/cores/api';
import { useClubRole } from '~/hooks/useClubRole';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { MemberRequestForm } from './MemberRequestForm';
import { MyRefundList } from './MyRefundList';
import { ManagerRefundQueue } from './ManagerRefundQueue';

export function showMemberRefundRequestForm(
  caps: ClubFundCapabilities | undefined,
  isAdmin: boolean,
  canEditFinancePolicy: boolean,
): boolean {
  if (isAdmin) return false;
  if (caps?.canProcessClubRefunds === true) return false;
  void canEditFinancePolicy;
  return true;
}

type MemberPanelProps = {
  clubId: number;
  skip: boolean;
  caps: ClubFundCapabilities | undefined;
  isAdmin: boolean;
};

export function MemberRefundPanel({ clubId, skip, caps, isAdmin }: MemberPanelProps) {
  const { can } = useClubRole();
  const canEditFinancePolicy = can('editfinance', clubId) || can('deletefinance', clubId);
  const showForm = showMemberRefundRequestForm(caps, isAdmin, canEditFinancePolicy);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="space-y-6">
      {showForm ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Gửi yêu cầu hoàn tiền cho khoản đã nộp và được duyệt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`${t.btn.cta} inline-flex items-center gap-2`}
            >
              <Plus className="w-5 h-5 shrink-0" aria-hidden />
              Gửi yêu cầu hoàn tiền
            </button>
          </div>

          {open ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="refund-request-modal-title"
              onClick={() => setOpen(false)}
            >
              <div
                className={`${t.card.base} w-full max-w-3xl overflow-hidden border-slate-200 dark:border-slate-600 max-h-[calc(100vh-2rem)] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm"
                      aria-hidden
                    >
                      <HandCoins className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <h2 id="refund-request-modal-title" className={t.type.sectionTitle}>
                        Gửi yêu cầu hoàn tiền
                      </h2>
                      <p className={t.type.muted}>Điền thông tin để quản lý xử lý hoàn tiền.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={t.btn.ghost}
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" aria-hidden />
                  </button>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto">
                  <MemberRequestForm clubId={clubId} skip={skip} variant="plain" onSuccess={() => setOpen(false)} />
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <MyRefundList clubId={clubId} skip={skip} />
    </div>
  );
}

type PersonalProps = {
  clubId: number;
  skip: boolean;
  caps: ClubFundCapabilities | undefined;
  isAdmin: boolean;
};

export function PersonalRefundSection({ clubId, skip, caps, isAdmin }: PersonalProps) {
  return <MemberRefundPanel clubId={clubId} skip={skip} caps={caps} isAdmin={isAdmin} />;
}

type Props = {
  clubId: number;
  skip: boolean;
  caps: ClubFundCapabilities | undefined;
  isAdmin: boolean;
};

export function FundsRefundSection({ clubId, skip, caps, isAdmin }: Props) {
  const { can } = useClubRole();
  const canEditFinancePolicy = can('editfinance', clubId) || can('deletefinance', clubId);
  const showManagerQueue =
    isAdmin ||
    caps?.canProcessClubRefunds === true ||
    caps?.hasEditFinancePolicy === true ||
    canEditFinancePolicy;
  const showForm = showMemberRefundRequestForm(caps, isAdmin, canEditFinancePolicy);

  return (
    <div className="space-y-6">
      {showForm ? <MemberRequestForm clubId={clubId} skip={skip} /> : null}
      <MyRefundList clubId={clubId} skip={skip} />
      {showManagerQueue ? <ManagerRefundQueue clubId={clubId} skip={skip} /> : null}
    </div>
  );
}
