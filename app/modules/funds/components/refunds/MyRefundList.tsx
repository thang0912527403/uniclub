import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, OctagonAlert } from 'lucide-react';
import {
  useCancelFundRefundRequestMutation,
  useGetMyFundRefundRequestsQuery,
  type FundRefundRequestResponseDto,
} from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { FUND_REFUND_LIMITS } from '~/modules/funds/constants/fundRefund';
import { extractClubFundErrorMessage } from '~/modules/funds/utils/fundRefundErrors';

const L = FUND_REFUND_LIMITS;

function statusLabel(s: string): string {
  const u = s.toUpperCase();
  if (u === 'PENDING') return 'Chờ xử lý';
  if (u === 'COMPLETED') return 'Đã hoàn tất';
  if (u === 'REJECTED') return 'Từ chối';
  if (u === 'CANCELLED') return 'Đã hủy';
  return s;
}

function RefundStatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u === 'COMPLETED')
    return (
      <span className={t.status.approved}>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        {statusLabel(status)}
      </span>
    );
  if (u === 'REJECTED' || u === 'CANCELLED')
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden />
        {statusLabel(status)}
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

function formatWhen(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

type Props = {
  clubId: number;
  skip: boolean;
};

export function MyRefundList({ clubId, skip }: Props) {
  const { show: showNotification } = useNotification();
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<FundRefundRequestResponseDto | null>(null);
  const pageSize = L.minePageSizeDefault;

  useEffect(() => {
    setPage(1);
  }, [clubId]);

  const { data, isLoading, isError, error, isFetching } = useGetMyFundRefundRequestsQuery(
    { clubId, page, pageSize },
    { skip: skip || clubId < 1 },
  );

  const [cancelReq, { isLoading: isCancelling }] = useCancelFundRefundRequestMutation();

  const items = data?.items ?? [];
  const meta = data;

  const errMsg = isError ? extractClubFundErrorMessage(error) : undefined;

  const closeConfirm = useCallback(() => setConfirmTarget(null), []);

  useEffect(() => {
    if (!confirmTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmTarget, closeConfirm]);

  const requestCancel = (row: FundRefundRequestResponseDto) => {
    if (String(row.status).toUpperCase() !== 'PENDING') return;
    setConfirmTarget(row);
  };

  const confirmCancel = async () => {
    const row = confirmTarget;
    if (!row || String(row.status).toUpperCase() !== 'PENDING') return;
    try {
      await cancelReq({ clubId, refundRequestId: row.refundRequestId }).unwrap();
      closeConfirm();
      showNotification({ type: 'success', title: 'Đã hủy yêu cầu', message: 'Yêu cầu hoàn tiền đã được hủy.' });
    } catch (err: unknown) {
      const msg =
        extractClubFundErrorMessage(err) ?? 'Không hủy được yêu cầu. Thử lại sau.';
      showNotification({ type: 'error', title: 'Lỗi', message: msg });
    }
  };

  return (
    <section
      className={`relative ${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}
      aria-labelledby="my-refund-list-title"
    >
      {confirmTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={closeConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-cancel-dialog-title"
            aria-describedby="refund-cancel-dialog-desc"
            className={`${t.card.base} max-w-md w-full p-5 md:p-6 shadow-xl border-slate-200 dark:border-slate-600`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div
                className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-200"
                aria-hidden
              >
                <OctagonAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="refund-cancel-dialog-title" className={`${t.type.sectionTitle}`}>
                  Hủy yêu cầu hoàn tiền?
                </h3>
                <p id="refund-cancel-dialog-desc" className={`mt-2 ${t.type.body}`}>
                  Yêu cầu{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">#{confirmTarget.refundRequestId}</span>{' '}
                  ·{' '}
                  {confirmTarget.amount.toLocaleString('vi-VN')} ₫ ·{' '}
                  {confirmTarget.fundName?.trim() || `Quỹ #${confirmTarget.fundId}`}
                  <span className="block mt-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    Sau khi hủy, bạn có thể gửi yêu cầu mới nếu cần.
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className={t.btn.secondary} onClick={closeConfirm} disabled={isCancelling}>
                Giữ nguyên
              </button>
              <button type="button" className={t.btn.danger} onClick={() => void confirmCancel()} disabled={isCancelling}>
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 inline mr-2" aria-hidden />
                    Đang hủy…
                  </>
                ) : (
                  'Hủy yêu cầu'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <h2 id="my-refund-list-title" className={t.type.sectionTitle}>
        Yêu cầu hoàn tiền của tôi
      </h2>
      <p className={`mt-1 ${t.type.body}`}>Theo dõi trạng thái và hủy khi còn ở trạng thái chờ xử lý.</p>

      {isError ? (
        <p className={`mt-3 text-sm text-red-600 dark:text-red-400`} role="alert">
          {errMsg || 'Không tải được danh sách yêu cầu của bạn.'}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-6 flex justify-center py-8 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <p className={`mt-4 ${t.type.muted}`}>Bạn chưa có yêu cầu hoàn tiền nào.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Mã</th>
                  <th className="px-3 py-2.5 font-medium">Quỹ</th>
                  <th className="px-3 py-2.5 font-medium">GD gốc</th>
                  <th className="px-3 py-2.5 font-medium text-right">Số tiền</th>
                  <th className="px-3 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-3 py-2.5 font-medium">Tạo lúc</th>
                  <th className="px-3 py-2.5 font-medium w-[100px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {items.map((row) => (
                  <tr key={row.refundRequestId} className="bg-white dark:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-xs">#{row.refundRequestId}</td>
                    <td className="px-3 py-2.5">{row.fundName?.trim() || `Quỹ #${row.fundId}`}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">#{row.originalTransactionId}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {row.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-3 py-2.5">
                      <RefundStatusBadge status={String(row.status)} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatWhen(row.createdAtUtc)}
                    </td>
                    <td className="px-3 py-2.5">
                      {String(row.status).toUpperCase() === 'PENDING' ? (
                        <button
                          type="button"
                          className={`${t.btn.danger} !min-h-0 !py-1.5 !px-2.5 text-xs`}
                          disabled={isCancelling}
                          onClick={() => requestCancel(row)}
                        >
                          Hủy
                        </button>
                      ) : (
                        <span className={`text-xs ${t.type.muted}`}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (meta.totalPages > 1 || meta.hasPreviousPage || meta.hasNextPage) ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs ${t.type.muted}`}>
                Trang {meta.pageNumber}/{Math.max(1, meta.totalPages)} · {meta.totalCount.toLocaleString('vi-VN')} yêu
                cầu
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1`}
                  disabled={!meta.hasPreviousPage || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                  Trước
                </button>
                <button
                  type="button"
                  className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1`}
                  disabled={!meta.hasNextPage || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
