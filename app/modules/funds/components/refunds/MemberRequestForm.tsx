import { useMemo, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  useCreateFundRefundRequestMutation,
  useGetClubFundTransactionsQuery,
  useGetMyFundRefundRequestsQuery,
  type FundHistoryItem,
} from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { parseVndIntegerFromInput } from '~/routes/funds.utils';
import { FUND_REFUND_LIMITS } from '~/modules/funds/constants/fundRefund';
import {
  getFundTransactionId,
  isEligibleRefundOriginalTransaction,
  sumRefundRequestAmountForOriginal,
  sumRefundedAmountForOriginalFromItems,
} from '~/modules/funds/utils/refundTransactions';
import { extractClubFundErrorMessage } from '~/modules/funds/utils/fundRefundErrors';

const L = FUND_REFUND_LIMITS;

type Props = {
  clubId: number;
  skip: boolean;
};

export function MemberRequestForm({ clubId, skip }: Props) {
  const { show: showNotification } = useNotification();
  const [originalTxId, setOriginalTxId] = useState<string>('');
  const [amountRaw, setAmountRaw] = useState('');
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const notifyFormError = (message: string) => {
    showNotification({
      type: 'error',
      title: 'Chưa thể gửi yêu cầu',
      message,
    });
  };

  const {
    data: txPaged,
    isLoading: txLoading,
    isError: txError,
    error: txErr,
  } = useGetClubFundTransactionsQuery(
    {
      clubId,
      page: 1,
      pageSize: L.txPickerPageSize,
      scope: 'mine',
    },
    { skip: skip || clubId < 1 },
  );

  const { data: myRefundPaged } = useGetMyFundRefundRequestsQuery(
    { clubId, page: 1, pageSize: L.minePageSizeMax },
    { skip: skip || clubId < 1 },
  );

  const txItems = txPaged?.items ?? [];
  const myRefundItems = myRefundPaged?.items ?? [];
  const eligible = useMemo(
    () => txItems.filter(isEligibleRefundOriginalTransaction),
    [txItems],
  );

  const selectedTx: FundHistoryItem | undefined = useMemo(() => {
    const id = Number(originalTxId);
    if (!Number.isFinite(id) || id < 1) return undefined;
    return eligible.find((i) => getFundTransactionId(i) === id);
  }, [eligible, originalTxId]);

  const originalAmount = selectedTx ? Number(selectedTx.amount) : 0;
  const refundedSum = useMemo(() => {
    if (!selectedTx) return 0;
    const tid = getFundTransactionId(selectedTx);
    const fromHistory = sumRefundedAmountForOriginalFromItems(txItems, tid);
    const fromRequests = sumRefundRequestAmountForOriginal(myRefundItems, tid);
    return Math.max(fromHistory, fromRequests);
  }, [selectedTx, txItems, myRefundItems]);
  const maxRefundable =
    selectedTx && Number.isFinite(originalAmount)
      ? Math.max(0, originalAmount - refundedSum)
      : 0;

  const [createRefund, { isLoading: isSubmitting }] = useCreateFundRefundRequestMutation();

  const txErrorMessage = txError ? extractClubFundErrorMessage(txErr) : undefined;

  const resetForm = () => {
    setAmountRaw('');
    setReason('');
    setBankName('');
    setBankAccountNumber('');
    setAccountHolderName('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) {
      notifyFormError('Chọn giao dịch nộp quỹ đã duyệt của bạn.');
      return;
    }
    const tid = getFundTransactionId(selectedTx);
    if (tid < 1) {
      notifyFormError('Giao dịch không có mã hợp lệ.');
      return;
    }
    const parsed = parseVndIntegerFromInput(amountRaw);
    if (!parsed.ok) {
      notifyFormError(parsed.message);
      return;
    }
    if (parsed.amount < 1) {
      notifyFormError('Số tiền hoàn phải lớn hơn 0.');
      return;
    }
    if (parsed.amount > maxRefundable) {
      notifyFormError(
        `Số tiền hoàn không được vượt quá ${maxRefundable.toLocaleString('vi-VN')} ₫ (còn lại sau các yêu cầu hoàn đã hoàn tất hoặc đang chờ xử lý).`,
      );
      return;
    }
    const bn = bankName.trim();
    const acc = bankAccountNumber.trim();
    const holder = accountHolderName.trim();
    if (!bn || bn.length > L.bankNameMax) {
      notifyFormError(`Tên ngân hàng bắt buộc, tối đa ${L.bankNameMax} ký tự.`);
      return;
    }
    if (!acc || acc.length > L.bankAccountNumberMax) {
      notifyFormError(`Số tài khoản bắt buộc, tối đa ${L.bankAccountNumberMax} ký tự.`);
      return;
    }
    if (!holder || holder.length > L.accountHolderNameMax) {
      notifyFormError(`Tên chủ tài khoản bắt buộc, tối đa ${L.accountHolderNameMax} ký tự.`);
      return;
    }
    const rs = reason.trim();
    if (rs.length > L.reasonMax) {
      notifyFormError(`Lý do tối đa ${L.reasonMax} ký tự.`);
      return;
    }
    try {
      await createRefund({
        clubId,
        originalTransactionId: tid,
        amount: parsed.amount,
        ...(rs ? { reason: rs } : {}),
        bankName: bn,
        bankAccountNumber: acc,
        accountHolderName: holder,
      }).unwrap();
      showNotification({
        type: 'success',
        title: 'Đã gửi yêu cầu hoàn tiền',
        message: 'Quản lý sẽ xử lý sau khi chuyển khoản ngoài hệ thống.',
      });
      resetForm();
      setOriginalTxId('');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = extractClubFundErrorMessage(err);
      const text =
        msg ??
        (status === 403
          ? 'Bạn không có quyền tạo yêu cầu hoàn trong CLB này.'
          : 'Không tạo được yêu cầu. Vui lòng thử lại.');
      showNotification({ type: 'error', title: 'Không tạo được yêu cầu', message: text });
    }
  };

  return (
    <section
      className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}
      aria-labelledby="refund-request-form-title"
    >
      <h2 id="refund-request-form-title" className={t.type.sectionTitle}>
        Gửi yêu cầu hoàn tiền nộp quỹ
      </h2>
      <p className={`mt-1 ${t.type.body}`}>
        Chỉ áp dụng cho khoản bạn đã nộp và đã được duyệt. Có thể hoàn một phần; hệ thống giới hạn theo số tiền gốc và
        các yêu cầu hoàn đã hoàn tất hoặc đang chờ xử lý.
      </p>

      {txError ? (
        <p className={`mt-3 text-sm text-red-600 dark:text-red-400`} role="alert">
          {txErrorMessage || 'Không tải được lịch sử giao dịch để chọn khoản nộp.'}
        </p>
      ) : null}

      {txLoading ? (
        <div className="mt-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
          <span className="text-sm">Đang tải giao dịch nộp của bạn…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={`mt-4 ${t.space.section}`}>
          <div>
            <label htmlFor="refund-original-tx" className={`block ${t.type.label} mb-1.5`}>
              Giao dịch nộp gốc
            </label>
            <select
              id="refund-original-tx"
              className={t.input}
              value={originalTxId}
              onChange={(e) => setOriginalTxId(e.target.value)}
              disabled={skip || eligible.length === 0}
            >
              <option value="">
                {eligible.length === 0 ? 'Không có giao dịch đủ điều kiện' : '— Chọn một dòng —'}
              </option>
              {eligible.map((item) => {
                const id = getFundTransactionId(item);
                const labelFund = item.fundName?.trim() || `Quỹ #${item.fundId}`;
                return (
                  <option key={`${id}-${item.fundId}`} value={String(id)}>
                    #{id} · {labelFund} · {Number(item.amount).toLocaleString('vi-VN')} ₫
                  </option>
                );
              })}
            </select>
            {selectedTx ? (
              <p className={`mt-1.5 text-xs ${t.type.muted}`}>
                Số tiền gốc: {originalAmount.toLocaleString('vi-VN')} ₫
                {refundedSum > 0 ? (
                  <>
                    {' '}
                    · Đã trừ: {refundedSum.toLocaleString('vi-VN')} ₫
                  </>
                ) : null}
                {' · '}
                Tối đa có thể yêu cầu thêm: {maxRefundable.toLocaleString('vi-VN')} ₫
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="refund-amount" className={`block ${t.type.label} mb-1.5`}>
              Số tiền hoàn (₫)
            </label>
            <input
              id="refund-amount"
              type="text"
              inputMode="numeric"
              className={t.input}
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              placeholder="Ví dụ: 500.000"
              disabled={!selectedTx}
            />
          </div>

          <div>
            <label htmlFor="refund-reason" className={`block ${t.type.label} mb-1.5`}>
              Lý do (tuỳ chọn)
            </label>
            <textarea
              id="refund-reason"
              className={`${t.input} min-h-[80px] resize-y`}
              value={reason}
              maxLength={L.reasonMax}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tối đa 2000 ký tự"
            />
            <p className={`mt-0.5 text-xs ${t.type.muted}`}>
              {reason.length}/{L.reasonMax}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="refund-bank" className={`block ${t.type.label} mb-1.5`}>
                Ngân hàng
              </label>
              <input
                id="refund-bank"
                type="text"
                className={t.input}
                value={bankName}
                maxLength={L.bankNameMax}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Tên ngân hàng nhận hoàn"
              />
            </div>
            <div>
              <label htmlFor="refund-acc" className={`block ${t.type.label} mb-1.5`}>
                Số tài khoản
              </label>
              <input
                id="refund-acc"
                type="text"
                className={t.input}
                value={bankAccountNumber}
                maxLength={L.bankAccountNumberMax}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="refund-holder" className={`block ${t.type.label} mb-1.5`}>
                Chủ tài khoản
              </label>
              <input
                id="refund-holder"
                type="text"
                className={t.input}
                value={accountHolderName}
                maxLength={L.accountHolderNameMax}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>
          </div>

          <div
            className="flex gap-2 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100/95"
            role="note"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <p>
              Bạn chịu trách nhiệm về thông tin chuyển khoản. Sai STK / ngân hàng có thể khiến tiền không về đúng tài
              khoản; hãy kiểm tra kỹ trước khi gửi.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={t.btn.cta}
              disabled={skip || !selectedTx || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 inline mr-2" aria-hidden />
                  Đang gửi…
                </>
              ) : (
                'Gửi yêu cầu hoàn tiền'
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
