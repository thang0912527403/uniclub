import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useSoftDeleteFundMutation } from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { useClubRole } from '~/hooks/useClubRole';
import { extractClubFundErrorMessage } from '~/modules/funds/utils/fundRefundErrors';
import { fundTokens as t } from '~/routes/funds.design-tokens';

export type ClubFundSoftDeleteControlProps = {
  clubId: number;
  fundId: number;
  fundLabel: string;
  canSoftDeleteFund: boolean;
  isFundClosed?: boolean;
  softDeleteBlockedReasonVi?: string | null;
  financeAccessHintVi?: string | null;
  compact?: boolean;
  onAfterSuccess?: () => void;
};

export function ClubFundSoftDeleteControl({
  clubId,
  fundId,
  fundLabel,
  canSoftDeleteFund,
  isFundClosed,
  softDeleteBlockedReasonVi,
  financeAccessHintVi,
  compact,
  onAfterSuccess,
}: ClubFundSoftDeleteControlProps) {
  const { show: showNotification } = useNotification();
  const { can } = useClubRole();
  const canDeleteByPolicy = can("deletefinance");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [softDeleteFund, { isLoading }] = useSoftDeleteFundMutation();

  if (clubId < 1 || fundId < 1) return null;

  const hint = financeAccessHintVi?.trim() || undefined;
  const closedBlock = isFundClosed === true;
  const terminalBlock = Boolean(softDeleteBlockedReasonVi?.trim());
  const terminalReason = softDeleteBlockedReasonVi?.trim() || undefined;
  const disabledReason = !canDeleteByPolicy
    ? 'Bạn không có quyền đóng quỹ trong CLB này.'
    : !canSoftDeleteFund && hint
      ? hint
      : !canSoftDeleteFund
        ? 'Bạn không có quyền đóng quỹ trong CLB này.'
        : undefined;

  const btnClass = compact
    ? `${t.btn.secondary} !min-h-0 !py-1.5 !px-3 text-xs`
    : `${t.btn.secondary}`;

  const handleConfirm = async () => {
    try {
      const res = await softDeleteFund({ clubId, fundId }).unwrap();
      showNotification({
        type: 'success',
        title: 'Đã đóng quỹ',
        message:
          res.message?.trim() ||
          'Quỹ đã được đóng. Trạng thái cập nhật theo quy định CLB; danh sách có thể vẫn hiển thị nếu bạn có quyền xem đầy đủ.',
      });
      setConfirmOpen(false);
      onAfterSuccess?.();
    } catch (err: unknown) {
      const msg = extractClubFundErrorMessage(err);
      const st =
        err && typeof err === 'object' && 'status' in err ? (err as { status?: number }).status : undefined;
      let title = 'Không thể đóng quỹ';
      let message = msg || 'Vui lòng thử lại sau.';
      if (st === 403) {
        title = 'Không có quyền';
        message = msg || 'Bạn không có quyền đóng quỹ.';
      } else if (st === 404) {
        title = 'Không tìm thấy quỹ';
        message = msg || 'Quỹ không tồn tại hoặc đã được đóng.';
      } else if (st === 400) {
        title = 'Không thể đóng quỹ';
        message = msg || 'Điều kiện không hợp lệ.';
      }
      showNotification({ type: 'error', title, message });
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={
          closedBlock || terminalBlock || !canSoftDeleteFund || !canDeleteByPolicy || isLoading
        }
        title={
          closedBlock
            ? undefined
            : terminalBlock
              ? terminalReason
              : !canDeleteByPolicy
                ? 'Bạn không có quyền đóng quỹ trong CLB này.'
                : !canSoftDeleteFund
                  ? disabledReason
                  : hint
                    ? `Gợi ý: ${hint}`
                    : 'Đóng quỹ — thường dùng khi quỹ không còn nhận nộp; một số loại quỹ sau hạn có thể không đóng được, hệ thống sẽ báo nếu không hợp lệ.'
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (closedBlock || terminalBlock || !canSoftDeleteFund || !canDeleteByPolicy || isLoading)
            return;
          setConfirmOpen(true);
        }}
        className={`${btnClass} ${closedBlock || terminalBlock || !canSoftDeleteFund || !canDeleteByPolicy ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={`Đóng quỹ ${fundLabel}`}
      >
        {isLoading ? 'Đang xử lý…' : 'Đóng quỹ'}
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-[70] p-4"
          role="presentation"
          onClick={() => !isLoading && setConfirmOpen(false)}
        >
          <div
            className={`${t.card.base} w-full max-w-md rounded-2xl shadow-xl outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="soft-delete-fund-heading"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="soft-delete-fund-heading" className={t.type.sectionTitle}>
                Đóng quỹ?
              </h2>
              <button
                type="button"
                onClick={() => !isLoading && setConfirmOpen(false)}
                className={t.btn.ghost}
                aria-label="Đóng"
                disabled={isLoading}
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="px-6 py-4 text-slate-900 dark:text-slate-50 space-y-3">
              <p className={t.type.body}>
                Quỹ <strong className="font-semibold text-slate-900 dark:text-slate-100">{fundLabel}</strong> sẽ được{' '}
                <strong className="font-semibold text-slate-900 dark:text-slate-100">đóng</strong>.
              </p>
              {hint ? <p className={`text-xs ${t.type.muted}`}>{hint}</p> : null}
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <button type="button" onClick={() => setConfirmOpen(false)} className={t.btn.secondary} disabled={isLoading}>
                  Hủy
                </button>
                <button type="button" onClick={handleConfirm} className={t.btn.danger} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 inline animate-spin mr-2" aria-hidden />
                      Đang xử lý…
                    </>
                  ) : (
                    'Xác nhận đóng quỹ'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
