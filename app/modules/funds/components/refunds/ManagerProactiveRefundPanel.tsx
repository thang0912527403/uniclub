import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, X } from 'lucide-react';
import { useDialogAccessibility } from '~/hooks/useDialogAccessibility';
import { useNotification } from '~/components/Notification';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { FUND_REFUND_LIMITS } from '~/modules/funds/constants/fundRefund';
import {
  useCreateManagerRefundMutation,
  useGetClubFundTransactionsQuery,
  type FundHistoryItem,
} from '~/cores/api';
import { parseVndIntegerFromInput } from '~/routes/funds.utils';
import { getFundTransactionId } from '~/modules/funds/utils/refundTransactions';

const RL = FUND_REFUND_LIMITS;

function readTxRecord(item: FundHistoryItem): Record<string, unknown> {
  return item as FundHistoryItem & Record<string, unknown>;
}

function isApprovedIncomeMemberContributionTx(item: FundHistoryItem): boolean {
  const r = readTxRecord(item);
  const type = String(r.transactionType ?? r.TransactionType ?? '').toUpperCase();
  const status = String(r.status ?? r.Status ?? '').toUpperCase();
  const isContribution =
    item.isMemberContribution === true ||
    r.isMemberContribution === true ||
    r.IsMemberContribution === true;
  return type === 'INCOME' && status === 'APPROVED' && isContribution;
}

function txDescription(item: FundHistoryItem): string {
  const r = readTxRecord(item);
  return String(r.description ?? r.Description ?? '').trim();
}

function payerLabel(item: FundHistoryItem): string {
  const r = readTxRecord(item);
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  return (
    pick('userFullName', 'UserFullName') ||
    pick('memberName', 'MemberName') ||
    pick('contributorName', 'ContributorName') ||
    pick('senderName', 'SenderName') ||
    pick('userName', 'UserName') ||
    '—'
  );
}

function formatTxWhen(item: FundHistoryItem): string {
  const r = readTxRecord(item);
  const iso = String(
    r.transactionDate ?? r.TransactionDate ?? r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt ?? '',
  ).trim();
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

type Props = {
  clubId: number;
  skip: boolean;
};

export function ManagerProactiveRefundPanel({ clubId, skip }: Props) {
  const { show: showNotification } = useNotification();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPage(1);
  }, [clubId, pageSize]);

  const {
    data: paged,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetClubFundTransactionsQuery(
    { clubId, page, pageSize, status: 'APPROVED' },
    { skip: skip || clubId < 1 },
  );

  const [refundTargetTx, setRefundTargetTx] = useState<FundHistoryItem | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [refundReasonInput, setRefundReasonInput] = useState('');
  const [refundedApprovedAmount, setRefundedApprovedAmount] = useState<number>(0);

  const closeRefundModal = useMemo(
    () => () => {
      setRefundTargetTx(null);
      setRefundAmountInput('');
      setRefundReasonInput('');
      setRefundedApprovedAmount(0);
    },
    [],
  );
  const refundDialogRef = useDialogAccessibility(refundTargetTx != null, closeRefundModal);

  const eligibleRows = useMemo(() => {
    const list = paged?.items ?? [];
    const q = search.trim().toLowerCase();
    const filtered = list.filter((x) => isApprovedIncomeMemberContributionTx(x));
    if (!q) return filtered;
    return filtered.filter((x) => {
      const payer = payerLabel(x).toLowerCase();
      const desc = txDescription(x).toLowerCase();
      const fundName = String(x.fundName ?? '').toLowerCase();
      return payer.includes(q) || desc.includes(q) || fundName.includes(q);
    });
  }, [paged, search]);

  const [createManagerRefund, { isLoading: isCreating }] = useCreateManagerRefundMutation();
  const originalTransactionId = refundTargetTx ? getFundTransactionId(refundTargetTx) : 0;
  const refundFundId = refundTargetTx ? Number(refundTargetTx.fundId ?? 0) : 0;

  const { data: fundTxForRefundCalc, isFetching: isFetchingRefundCalc } = useGetClubFundTransactionsQuery(
    {
      clubId,
      fundId: refundFundId > 0 ? refundFundId : undefined,
      page: 1,
      pageSize: 100,
      status: 'APPROVED',
    },
    { skip: skip || clubId < 1 || !refundTargetTx || !(refundFundId > 0) || !(originalTransactionId > 0) },
  );

  useEffect(() => {
    if (!refundTargetTx) return;
    if (!(originalTransactionId > 0)) return;
    const items = fundTxForRefundCalc?.items ?? [];
    const refunded = items.reduce((sum, it) => {
      const r = readTxRecord(it);
      const forId = Number(r.refundForTransactionId ?? r.RefundForTransactionId ?? 0);
      if (forId !== originalTransactionId) return sum;
      const txType = String(r.transactionType ?? r.TransactionType ?? '').toUpperCase();
      if (txType && txType !== 'EXPENSE') return sum;
      const amt = Number(it.amount);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);

    setRefundedApprovedAmount(refunded);
    const originalAmount = Number(refundTargetTx.amount ?? 0);
    const remaining = Math.max(0, (Number.isFinite(originalAmount) ? originalAmount : 0) - refunded);
    setRefundAmountInput(String(remaining));
  }, [refundTargetTx, originalTransactionId, fundTxForRefundCalc]);

  const submitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetTx) return;
    const originalTransactionId = getFundTransactionId(refundTargetTx);
    const fundId = Number(refundTargetTx.fundId ?? 0);
    if (!(originalTransactionId > 0) || !(fundId > 0)) {
      showNotification({ type: 'error', title: 'Lỗi', message: 'Giao dịch gốc không hợp lệ.' });
      return;
    }
    const parsedAmount = parseVndIntegerFromInput(refundAmountInput);
    if (!parsedAmount.ok || parsedAmount.amount <= 0) {
      showNotification({
        type: 'error',
        title: 'Số tiền không hợp lệ',
        message: parsedAmount.ok ? 'Số tiền phải lớn hơn 0.' : parsedAmount.message,
      });
      return;
    }
    const originalAmount = Number(refundTargetTx.amount ?? 0);
    const remaining = Math.max(
      0,
      (Number.isFinite(originalAmount) ? originalAmount : 0) - (Number.isFinite(refundedApprovedAmount) ? refundedApprovedAmount : 0),
    );
    if (parsedAmount.amount > remaining) {
      showNotification({
        type: 'error',
        title: 'Vượt quá số có thể hoàn',
        message: `Tối đa còn có thể hoàn ${remaining.toLocaleString('vi-VN')} ₫.`,
      });
      return;
    }
    const reason = refundReasonInput.trim();
    if (reason.length > RL.reasonMax) {
      showNotification({ type: 'error', title: 'Lỗi', message: `Lý do tối đa ${RL.reasonMax} ký tự.` });
      return;
    }
    try {
      await createManagerRefund({
        clubId,
        fundId,
        body: {
          originalTransactionId,
          amount: parsedAmount.amount,
          ...(reason ? { reason } : {}),
        },
      }).unwrap();
      showNotification({ type: 'success', title: 'Đã hoàn tiền', message: 'Giao dịch chi đã được ghi nhận.' });
      closeRefundModal();
      refetch();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg =
        (err as { data?: { message?: string; error?: string } })?.data?.message ??
        (err as { data?: { message?: string; error?: string } })?.data?.error ??
        (err as Error)?.message ??
        (status === 403 ? 'Bạn không có quyền hoàn tiền.' : 'Không thể hoàn tiền.');
      showNotification({ type: 'error', title: 'Lỗi', message: String(msg) });
    }
  };

  return (
    <section className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[260px] flex-1">
          <label className={t.type.label} htmlFor="mgr-proactive-refund-search">
            Tìm giao dịch
          </label>
          <input
            id="mgr-proactive-refund-search"
            className={`${t.input} h-11`}
            placeholder="Tìm theo quỹ / người đóng / mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            disabled={skip}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className={t.type.label} htmlFor="mgr-proactive-refund-page-size">
            Số dòng/trang
          </label>
          <select
            id="mgr-proactive-refund-page-size"
            className={`${t.input} h-11`}
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            disabled={skip}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          Không tải được danh sách giao dịch để hoàn tiền.
        </p>
      ) : null}

      {!skip && isLoading ? (
        <div className="mt-6 flex justify-center py-8 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
        </div>
      ) : !skip && eligibleRows.length === 0 ? (
        <p className={`mt-4 ${t.type.muted}`}>Không có giao dịch phù hợp trên trang này.</p>
      ) : !skip ? (
        <div className="mt-4 space-y-2">
          {eligibleRows.map((row) => {
            const tid = getFundTransactionId(row);
            return (
              <div
                key={`${tid}-${row.fundId}`}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {row.fundName?.trim() || `Quỹ #${row.fundId}`} ·{' '}
                    <span className="tabular-nums">{Number(row.amount ?? 0).toLocaleString('vi-VN')} ₫</span>
                  </p>
                  <p className={`text-xs ${t.type.muted}`}>
                    {payerLabel(row)} · {formatTxWhen(row)} · GD #{tid}
                  </p>
                  {txDescription(row) ? <p className={`text-xs ${t.type.muted} line-clamp-2`}>{txDescription(row)}</p> : null}
                </div>
                <button
                  type="button"
                  className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-2 shrink-0`}
                  onClick={() => {
                    setRefundTargetTx(row);
                    setRefundAmountInput(String(row.amount ?? ''));
                    setRefundReasonInput('');
                  }}
                >
                  <RotateCcw className="w-4 h-4" aria-hidden />
                  Hoàn tiền
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {paged && (paged.hasPreviousPage || paged.hasNextPage || paged.totalPages > 1) ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-xs ${t.type.muted}`}>
            Trang {paged.pageNumber}/{Math.max(1, paged.totalPages)} · {paged.totalCount.toLocaleString('vi-VN')} dòng
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1`}
              disabled={!paged.hasPreviousPage || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Trước
            </button>
            <button
              type="button"
              className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1`}
              disabled={!paged.hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {refundTargetTx ? (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4" role="presentation">
          <div
            ref={refundDialogRef}
            className={`${t.card.base} w-full max-w-md max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:max-w-lg outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-refund-title"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="manager-refund-title" className={t.type.sectionTitle}>
                Hoàn tiền
              </h2>
              <button type="button" onClick={closeRefundModal} className={t.btn.ghost} aria-label="Đóng">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <form onSubmit={submitRefund} className={`px-6 py-4 ${t.space.section}`}>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4 space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  GD gốc #{getFundTransactionId(refundTargetTx)}
                </p>
                <p className={`text-xs ${t.type.muted}`}>
                  {payerLabel(refundTargetTx)} · {formatTxWhen(refundTargetTx)}
                </p>
                <p className="text-sm">
                  Số tiền đã thu:{' '}
                  <span className="font-semibold tabular-nums">
                    {Number(refundTargetTx.amount ?? 0).toLocaleString('vi-VN')} ₫
                  </span>
                </p>
                {isFetchingRefundCalc ? (
                  <p className={`text-xs ${t.type.muted}`}>Đang kiểm tra số đã hoàn...</p>
                ) : (
                  <p className={`text-xs ${t.type.muted}`}>
                    Đã hoàn: {refundedApprovedAmount.toLocaleString('vi-VN')} ₫ · Còn có thể hoàn:{' '}
                    {Math.max(0, Number(refundTargetTx.amount ?? 0) - refundedApprovedAmount).toLocaleString('vi-VN')} ₫
                  </p>
                )}
                {txDescription(refundTargetTx) ? (
                  <p className={`text-xs ${t.type.muted} whitespace-pre-wrap`}>{txDescription(refundTargetTx)}</p>
                ) : null}
              </div>

              <div className={`grid grid-cols-1 ${t.space.grid}`}>
                <div>
                  <label htmlFor="mgr-refund-amount" className={`block ${t.type.label} mb-1.5`}>
                    Số tiền hoàn
                  </label>
                  <input
                    id="mgr-refund-amount"
                    className={t.input}
                    inputMode="numeric"
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(e.target.value)}
                    placeholder="VD: 50.000"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label htmlFor="mgr-refund-reason" className={`block ${t.type.label} mb-1.5`}>
                    Lý do (tuỳ chọn)
                  </label>
                  <textarea
                    id="mgr-refund-reason"
                    className={`${t.input} min-h-[84px] resize-y`}
                    value={refundReasonInput}
                    maxLength={RL.reasonMax}
                    onChange={(e) => setRefundReasonInput(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <button type="button" onClick={closeRefundModal} className={t.btn.secondary} disabled={isCreating}>
                  Hủy
                </button>
                <button type="submit" className={t.btn.cta} disabled={isCreating}>
                  {isCreating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Đang hoàn...
                    </span>
                  ) : (
                    'Hoàn tiền'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

