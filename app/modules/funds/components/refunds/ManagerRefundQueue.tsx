import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, X } from 'lucide-react';
import {
  useCompleteFundRefundRequestMutation,
  useGetClubFundRefundRequestsQuery,
  useRejectFundRefundRequestMutation,
  type FundRefundQueueStatusFilter,
  type FundRefundRequestResponseDto,
} from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { useDialogAccessibility } from '~/hooks/useDialogAccessibility';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { FUND_REFUND_LIMITS } from '~/modules/funds/constants/fundRefund';
import {
  extractClubFundErrorMessage,
  refundManagerForbiddenCopy,
} from '~/modules/funds/utils/fundRefundErrors';

const L = FUND_REFUND_LIMITS;

const STATUS_OPTIONS: Array<{ value: FundRefundQueueStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

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

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

type Props = {
  clubId: number;
  skip: boolean;
};

export function ManagerRefundQueue({ clubId, skip }: Props) {
  const { show: showNotification } = useNotification();
  const [status, setStatus] = useState<FundRefundQueueStatusFilter>('PENDING');
  const [page, setPage] = useState(1);
  const pageSize = L.managerPageSizeDefault;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [clubId, status]);

  const [completeTarget, setCompleteTarget] = useState<FundRefundRequestResponseDto | null>(null);
  const [managerNote, setManagerNote] = useState('');

  const [rejectTarget, setRejectTarget] = useState<FundRefundRequestResponseDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const closeComplete = useCallback(() => {
    setCompleteTarget(null);
    setManagerNote('');
  }, []);
  const closeReject = useCallback(() => {
    setRejectTarget(null);
    setRejectReason('');
  }, []);

  const completeDialogRef = useDialogAccessibility(completeTarget != null, closeComplete);
  const rejectDialogRef = useDialogAccessibility(rejectTarget != null, closeReject);

  const { data, isLoading, isError, error, isFetching } = useGetClubFundRefundRequestsQuery(
    { clubId, page, pageSize, status },
    { skip: skip || clubId < 1 },
  );

  const [completeMut, { isLoading: completing }] = useCompleteFundRefundRequestMutation();
  const [rejectMut, { isLoading: rejecting }] = useRejectFundRefundRequestMutation();

  const items = data?.items ?? [];
  const meta = data;

  const forbidden =
    isError && typeof error === 'object' && error && 'status' in error && error.status === 403;
  const errMsg = isError ? extractClubFundErrorMessage(error) : undefined;
  const forbiddenCopy = refundManagerForbiddenCopy(errMsg);

  const onCompleteSubmit = async () => {
    if (!completeTarget) return;
    const mn = managerNote.trim();
    if (mn.length > L.managerNoteMax) {
      showNotification({
        type: 'error',
        title: 'Lỗi',
        message: `Ghi chú tối đa ${L.managerNoteMax} ký tự.`,
      });
      return;
    }
    try {
      await completeMut({
        clubId,
        refundRequestId: completeTarget.refundRequestId,
        body: {
          ...(mn ? { managerNote: mn } : {}),
        },
      }).unwrap();
      showNotification({
        type: 'success',
        title: 'Đã hoàn tất hoàn tiền',
        message: 'Giao dịch chi đã được ghi nhận; số dư quỹ đã được cập nhật.',
      });
      closeComplete();
    } catch (err: unknown) {
      const msg = extractClubFundErrorMessage(err) ?? 'Không xác nhận được hoàn tất.';
      showNotification({ type: 'error', title: 'Lỗi', message: msg });
    }
  };

  const onRejectSubmit = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < L.rejectionReasonMin) {
      showNotification({
        type: 'error',
        title: 'Thiếu lý do',
        message: `Lý do từ chối cần ít nhất ${L.rejectionReasonMin} ký tự.`,
      });
      return;
    }
    if (reason.length > L.rejectionReasonMax) {
      showNotification({
        type: 'error',
        title: 'Lỗi',
        message: `Lý do tối đa ${L.rejectionReasonMax} ký tự.`,
      });
      return;
    }
    try {
      await rejectMut({
        clubId,
        refundRequestId: rejectTarget.refundRequestId,
        body: { rejectionReason: reason },
      }).unwrap();
      showNotification({ type: 'success', title: 'Đã từ chối yêu cầu', message: 'Thành viên sẽ thấy lý do trong danh sách.' });
      closeReject();
    } catch (err: unknown) {
      const msg = extractClubFundErrorMessage(err) ?? 'Không từ chối được yêu cầu.';
      showNotification({ type: 'error', title: 'Lỗi', message: msg });
    }
  };

  return (
    <section
      className={`${t.card.base} ${t.space.card} border-slate-200 dark:border-slate-600`}
      aria-labelledby="manager-refund-queue-title"
    >
      <h2 id="manager-refund-queue-title" className={t.type.sectionTitle}>
        Hàng chờ hoàn tiền (quản lý)
      </h2>
      <p className={`mt-1 ${t.type.body}`}>
        Sau khi chuyển khoản ngoài hệ thống, bấm Hoàn tất. Từ chối cần nhập lý do (tối thiểu 5 ký tự).
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label htmlFor="mgr-refund-status" className={t.type.label}>
            Trạng thái
          </label>
          <select
            id="mgr-refund-status"
            className={`${t.input} h-11`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as FundRefundQueueStatusFilter);
              setPage(1);
            }}
            disabled={skip}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {forbidden ? (
        <div
          className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-900/20 px-4 py-3"
          role="alert"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">{forbiddenCopy.title}</p>
          <p className={`mt-1 text-sm text-amber-900/90 dark:text-amber-100/85`}>{forbiddenCopy.detail}</p>
        </div>
      ) : isError ? (
        <p className={`mt-3 text-sm text-red-600 dark:text-red-400`} role="alert">
          {errMsg || 'Không tải được danh sách yêu cầu hoàn tiền của CLB.'}
        </p>
      ) : null}

      {!forbidden && isLoading ? (
        <div className="mt-6 flex justify-center py-8 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
        </div>
      ) : !forbidden && items.length === 0 ? (
        <p className={`mt-4 ${t.type.muted}`}>Không có yêu cầu nào khớp bộ lọc.</p>
      ) : !forbidden ? (
        <>
          <div className="mt-4 space-y-3">
            {items.map((row) => {
              const open = expandedId === row.refundRequestId;
              const pending = String(row.status).toUpperCase() === 'PENDING';
              return (
                <div
                  key={row.refundRequestId}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 overflow-hidden"
                >
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">#{row.refundRequestId}</span>
                        <RefundStatusBadge status={String(row.status)} />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {row.fundName?.trim() || `Quỹ #${row.fundId}`} ·{' '}
                        <span className="tabular-nums">{row.amount.toLocaleString('vi-VN')} ₫</span>
                      </p>
                      <p className={`text-xs ${t.type.muted}`}>
                        GD gốc #{row.originalTransactionId} · Tạo {formatWhen(row.createdAtUtc)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        className={`${t.btn.secondary} !min-h-0 !py-2 !px-3 text-sm inline-flex items-center gap-1`}
                        onClick={() => setExpandedId(open ? null : row.refundRequestId)}
                      >
                        {open ? (
                          <>
                            Thu gọn <ChevronUp className="w-4 h-4" aria-hidden />
                          </>
                        ) : (
                          <>
                            Chi tiết CK <ChevronDown className="w-4 h-4" aria-hidden />
                          </>
                        )}
                      </button>
                      {pending ? (
                        <>
                          <button
                            type="button"
                            className={`${t.btn.primary} !min-h-0 !py-2 !px-3 text-sm`}
                            onClick={() => {
                              setCompleteTarget(row);
                              setManagerNote('');
                            }}
                          >
                            Hoàn tất
                          </button>
                          <button
                            type="button"
                            className={`${t.btn.danger} !min-h-0 !py-2 !px-3 text-sm`}
                            onClick={() => {
                              setRejectTarget(row);
                              setRejectReason('');
                            }}
                          >
                            Từ chối
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {open ? (
                    <div className="px-3 sm:px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700 text-sm space-y-2">
                      <p>
                        <span className={t.type.label}>Ngân hàng</span>{' '}
                        <span className="text-slate-900 dark:text-slate-100">{row.bankName}</span>
                      </p>
                      <p>
                        <span className={t.type.label}>Số TK</span>{' '}
                        <span className="font-mono text-slate-900 dark:text-slate-100">{row.bankAccountNumber}</span>
                      </p>
                      <p>
                        <span className={t.type.label}>Chủ TK</span>{' '}
                        <span className="text-slate-900 dark:text-slate-100">{row.accountHolderName}</span>
                      </p>
                      {row.reason?.trim() ? (
                        <p>
                          <span className={t.type.label}>Lý do thành viên</span>{' '}
                          <span className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{row.reason}</span>
                        </p>
                      ) : null}
                      {row.rejectionReason?.trim() ? (
                        <p>
                          <span className={t.type.label}>Lý do từ chối</span>{' '}
                          <span className="text-red-700 dark:text-red-300 whitespace-pre-wrap">
                            {row.rejectionReason}
                          </span>
                        </p>
                      ) : null}
                      {row.transferReference?.trim() ? (
                        <p>
                          <span className={t.type.label}>Mã CK</span>{' '}
                          <span className="font-mono">{row.transferReference}</span>
                        </p>
                      ) : null}
                      {row.managerNote?.trim() ? (
                        <p>
                          <span className={t.type.label}>Ghi chú QL</span>{' '}
                          <span className="whitespace-pre-wrap">{row.managerNote}</span>
                        </p>
                      ) : null}
                      <p className={`text-xs ${t.type.muted}`}>
                        Cập nhật: {formatWhen(row.updatedAtUtc)}
                        {row.completedAtUtc ? ` · Hoàn tất: ${formatWhen(row.completedAtUtc)}` : ''}
                        {row.rejectedAtUtc ? ` · Từ chối: ${formatWhen(row.rejectedAtUtc)}` : ''}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {meta && (meta.totalPages > 1 || meta.hasPreviousPage || meta.hasNextPage) ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
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
      ) : null}

      {completeTarget ? (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4" role="presentation">
          <div
            ref={completeDialogRef}
            className={`${t.card.base} w-full max-w-md rounded-2xl shadow-xl outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-complete-title"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="refund-complete-title" className={t.type.sectionTitle}>
                Hoàn tất hoàn tiền
              </h2>
              <button type="button" onClick={closeComplete} className={t.btn.ghost} aria-label="Đóng">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-slate-900 dark:text-slate-50">
              <p className={`text-sm ${t.type.body}`}>
                Xác nhận đã chuyển khoản thủ công cho yêu cầu #{completeTarget.refundRequestId} (
                {completeTarget.amount.toLocaleString('vi-VN')} ₫).
              </p>
              <div>
                <label htmlFor="refund-mgr-note" className={`block ${t.type.label} mb-1.5`}>
                  Ghi chú quản lý (tuỳ chọn)
                </label>
                <textarea
                  id="refund-mgr-note"
                  className={`${t.input} min-h-[80px]`}
                  value={managerNote}
                  maxLength={L.managerNoteMax}
                  onChange={(e) => setManagerNote(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button type="button" onClick={closeComplete} className={t.btn.secondary} disabled={completing}>
                  Hủy
                </button>
                <button type="button" className={t.btn.cta} disabled={completing} onClick={onCompleteSubmit}>
                  {completing ? 'Đang xử lý…' : 'Xác nhận hoàn tất'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4" role="presentation">
          <div
            ref={rejectDialogRef}
            className={`${t.card.base} w-full max-w-md rounded-2xl shadow-xl outline-none`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-reject-title"
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h2 id="refund-reject-title" className={t.type.sectionTitle}>
                Từ chối yêu cầu hoàn
              </h2>
              <button type="button" onClick={closeReject} className={t.btn.ghost} aria-label="Đóng">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-slate-900 dark:text-slate-50">
              <p className={`text-sm ${t.type.body}`}>Yêu cầu #{rejectTarget.refundRequestId}</p>
              <div>
                <label htmlFor="refund-reject-reason" className={`block ${t.type.label} mb-1.5`}>
                  Lý do từ chối (tối thiểu {L.rejectionReasonMin} ký tự)
                </label>
                <textarea
                  id="refund-reject-reason"
                  className={`${t.input} min-h-[100px]`}
                  value={rejectReason}
                  maxLength={L.rejectionReasonMax}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nêu rõ lý do để thành viên theo dõi"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button type="button" onClick={closeReject} className={t.btn.secondary} disabled={rejecting}>
                  Hủy
                </button>
                <button type="button" className={t.btn.danger} disabled={rejecting} onClick={onRejectSubmit}>
                  {rejecting ? 'Đang xử lý…' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
