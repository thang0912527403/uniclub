import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import {
  useLazyGetContributeTransactionStatusQuery,
  useLazyGetPayosFundContributionReturnQuery,
  type PayosFundContributionReturn,
} from '~/cores/api';
import {
  clearPayosPendingContribute,
  readPayosPendingContribute,
  type PayosPendingContribute,
} from "~/modules/funds/utils/payosContributeSession";
import { isLoggedIn } from '~/utils/auth';

type PollPhase =
  | 'polling'
  | 'paid'
  | 'expired'
  | 'timeout'
  | 'error'
  | 'missing'
  | 'unauthorized'
  | 'not_paid';

function parsePositiveInt(v: string | null): number | undefined {
  if (v == null || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function PayosReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fetchPayStatus] = useLazyGetContributeTransactionStatusQuery();
  const [fetchPayosReturn] = useLazyGetPayosFundContributionReturnQuery();

  const [resolved, setResolved] = useState<PayosPendingContribute | null>(null);
  const [phase, setPhase] = useState<PollPhase>('polling');
  const [message, setMessage] = useState<string | null>(null);

  const payosReturnOrderCodeFromUrl = useMemo(() => {
    const keys = ['externalOrderCode', 'orderCode', 'code', 'order_code'] as const;
    for (const k of keys) {
      const v = searchParams.get(k);
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return undefined;
  }, [searchParams]);

  const pendingSession = readPayosPendingContribute();
  const effectiveReturnOrderCode =
    payosReturnOrderCodeFromUrl ?? (pendingSession?.externalOrderCode?.trim() || undefined);

  const payosUrlPaid = useMemo(
    () => String(searchParams.get('status') ?? '').toUpperCase() === 'PAID',
    [searchParams],
  );

  const queryClubId = useMemo(() => parsePositiveInt(searchParams.get('clubId')), [searchParams]);
  const queryTxId = useMemo(() => parsePositiveInt(searchParams.get('transactionId')), [searchParams]);
  const queryFundId = useMemo(() => parsePositiveInt(searchParams.get('fundId')), [searchParams]);

  /** PayOS redirect: GET fund-contributions/payos-return/{orderCode} với orderCode = externalOrderCode (string). */
  useEffect(() => {
    if (!effectiveReturnOrderCode) return;
    if (!isLoggedIn()) {
      setPhase('unauthorized');
      return;
    }

    const returnOrderCode = effectiveReturnOrderCode;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearTimer = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const goFund = (clubId: number, fundKey: string | number | undefined) => {
      const key = String(fundKey ?? '').trim();
      if (clubId > 0 && key) {
        void navigate(`/clubs/${clubId}/funds/${key}`, { replace: true });
      } else {
        void navigate('/funds', { replace: true });
      }
    };

    const applyPayload = (data: PayosFundContributionReturn): boolean => {
      setMessage(data.message ?? null);
      const pendingNow = readPayosPendingContribute();
      const tidFromData =
        data.transactionId != null &&
        Number.isFinite(Number(data.transactionId)) &&
        Number(data.transactionId) > 0
          ? Number(data.transactionId)
          : 0;
      const tid = tidFromData || pendingNow?.transactionId || queryTxId || 0;
      if (data.clubId > 0 && tid > 0) {
        setResolved({
          clubId: data.clubId,
          transactionId: tid,
          externalOrderCode: returnOrderCode,
          ...(data.fundId > 0 ? { fundId: data.fundId } : {}),
          ...(data.publicId?.trim() ? { publicId: data.publicId.trim() } : {}),
          savedAt: new Date().toISOString(),
        });
      }
      if (data.isPaid) {
        clearPayosPendingContribute();
        setPhase('paid');
        goFund(data.clubId, data.publicId ?? data.fundId);
        return true;
      }
      return false;
    };

    const fail = (err: unknown, fallback: string) => {
      const st = typeof err === 'object' && err && 'status' in err ? (err as { status: number }).status : undefined;
      if (st === 401) setPhase('unauthorized');
      else if (st === 404) {
        setMessage('Không tìm thấy giao dịch hoặc bạn không có quyền xem.');
        setPhase('error');
      } else {
        setMessage(fallback);
        setPhase('error');
      }
    };

    void (async () => {
      try {
        const data = await fetchPayosReturn(returnOrderCode).unwrap();
        if (cancelled) return;
        if (applyPayload(data)) return;

        if (payosUrlPaid) {
          let pollCount = 0;
          const maxPolls = 15;
          const intervalMs = 2000;

          const tick = async () => {
            if (cancelled) return;
            pollCount += 1;
            try {
              const d = await fetchPayosReturn(returnOrderCode).unwrap();
              if (cancelled) return;
              if (applyPayload(d)) return;
              if (pollCount >= maxPolls) {
                setPhase('timeout');
                setMessage(
                  'PayOS báo đã thanh toán nhưng server chưa ghi nhận — webhook có thể tới chậm vài giây. Thử làm mới trang hoặc xem quỹ sau. Trên localhost, webhook PayOS thường không tới được server; cần URL công khai thì số dư và lịch sử mới cập nhật đúng.',
                );
                return;
              }
              clearTimer();
              timeoutId = setTimeout(() => void tick(), intervalMs);
            } catch (err) {
              if (cancelled) return;
              fail(err, 'Không kiểm tra được trạng thái sau thanh toán.');
            }
          };

          clearTimer();
          timeoutId = setTimeout(() => void tick(), intervalMs);
        } else {
          setPhase('not_paid');
        }
      } catch (err) {
        if (cancelled) return;
        fail(err, 'Không tải được kết quả trả về từ PayOS.');
      }
    })();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [effectiveReturnOrderCode, payosUrlPaid, fetchPayosReturn, navigate, queryTxId]);

  useEffect(() => {
    if (effectiveReturnOrderCode) return;
    if (!isLoggedIn()) {
      setPhase('unauthorized');
      return;
    }
    const stored = readPayosPendingContribute();
    const clubId = stored?.clubId ?? queryClubId;
    const transactionId = stored?.transactionId ?? queryTxId;
    const fundId = stored?.fundId ?? queryFundId;

    if (!clubId || !transactionId) {
      setPhase('missing');
      return;
    }

    setResolved({
      clubId,
      transactionId,
      ...(fundId != null ? { fundId } : {}),
      ...(stored?.publicId?.trim() ? { publicId: stored.publicId.trim() } : {}),
      ...(stored?.externalOrderCode?.trim()
        ? { externalOrderCode: stored.externalOrderCode.trim() }
        : {}),
      savedAt: stored?.savedAt ?? new Date().toISOString(),
    });
  }, [effectiveReturnOrderCode, queryClubId, queryFundId, queryTxId]);

  useEffect(() => {
    if (effectiveReturnOrderCode) return;
    if (!resolved || phase !== 'polling') return;

    let cancelled = false;
    let intervalId: number | undefined;
    let inFlight = false;
    let pollCount = 0;
    const maxPolls = 48;
    const intervalMs = 2500;
    const { clubId, transactionId, fundId, publicId } = resolved;

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const goFund = () => {
      const key = String(publicId ?? fundId ?? '').trim();
      if (key) {
        void navigate(`/clubs/${clubId}/funds/${key}`, { replace: true });
      } else {
        void navigate('/funds', { replace: true });
      }
    };

    const tick = async () => {
      if (cancelled || inFlight) return;
      if (!isLoggedIn()) {
        setPhase('unauthorized');
        stop();
        return;
      }
      inFlight = true;
      pollCount += 1;
      try {
        const s = await fetchPayStatus({ clubId, transactionId }).unwrap();
        if (cancelled) return;
        setMessage(s.message ?? null);
        if (s.isPaid) {
          stop();
          clearPayosPendingContribute();
          setPhase('paid');
          goFund();
          return;
        }
        if (s.isPaymentLinkExpired && !s.isPaid) {
          stop();
          clearPayosPendingContribute();
          setPhase('expired');
          return;
        }
        if (pollCount >= maxPolls) {
          stop();
          setPhase('timeout');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const st = typeof err === 'object' && err && 'status' in err ? (err as { status: number }).status : undefined;
        if (st === 401) {
          setPhase('unauthorized');
        } else if (st === 404) {
          setMessage('Không tìm thấy giao dịch hoặc giao dịch không thuộc tài khoản của bạn.');
          setPhase('error');
        } else {
          setMessage('Không kiểm tra được trạng thái thanh toán.');
          setPhase('error');
        }
        stop();
      } finally {
        inFlight = false;
      }
    };

    void tick();
    intervalId = window.setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      stop();
    };
  }, [effectiveReturnOrderCode, resolved, fetchPayStatus, navigate, phase]);

  const fundHref =
    resolved?.clubId && resolved?.fundId
      ? `/clubs/${resolved.clubId}/funds/${resolved.fundId}`
      : '/funds';

  if (phase === 'unauthorized') {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1729] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Cần đăng nhập</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
            Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Đăng nhập lại để kiểm tra trạng thái thanh toán (Bearer JWT).
          </p>
          <Link
            to={`/auth/login?redirect=${redirect}`}
            className="mt-6 inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'missing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1729] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Thiếu thông tin giao dịch</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
            URL PayOS cần có <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">externalOrderCode</code>{' '}
            hoặc <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">orderCode</code> (mã đơn PayOS,
            dạng chuỗi số), hoặc phiên cần có{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">clubId</code> /{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">transactionId</code> từ lần mở nộp quỹ
            để hệ thống poll trạng thái. Hãy tạo lại thanh toán từ màn quỹ nếu cần.
          </p>
          <Link
            to="/funds"
            className="mt-6 inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
          >
            Về danh sách quỹ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1729] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-8 shadow-sm text-center">
        {phase === 'polling' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-slate-600 dark:text-slate-300 mx-auto" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Đang xác nhận thanh toán…</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
              PayOS đã chuyển bạn về ứng dụng. Số dư và lịch sử quỹ chỉ cập nhật sau khi webhook PayOS tới server backend
              (môi trường thật, không chỉ localhost).
            </p>
            {payosUrlPaid && effectiveReturnOrderCode ? (
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                PayOS báo <span className="font-medium">PAID</span> — đang chờ server ghi nhận (có thể vài giây).
              </p>
            ) : null}
            {message ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
          </>
        )}

        {phase === 'paid' && (
          <>
            <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">Thanh toán đã xác nhận</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">Đang chuyển về chi tiết quỹ…</p>
          </>
        )}

        {phase === 'not_paid' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Chưa ghi nhận thanh toán</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
              Server chưa đánh dấu đã thanh toán và URL không có <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">status=PAID</code>.
              Nếu bạn đã hủy hoặc chưa chuyển khoản, hãy tạo giao dịch mới từ quỹ.
            </p>
            {message ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
            <Link
              to={fundHref}
              className="mt-6 inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
            >
              Về quỹ
            </Link>
          </>
        )}

        {phase === 'expired' && (
          <>
            <h1 className="text-xl font-semibold text-amber-800 dark:text-amber-200">Link thanh toán hết hạn</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
              Giao dịch chưa được thanh toán và link có thể đã hết hạn. Tạo yêu cầu nộp quỹ mới từ màn chi tiết quỹ.
            </p>
            <Link
              to={fundHref}
              className="mt-6 inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
            >
              Về quỹ
            </Link>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Chưa nhận xác nhận kịp</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
              {message ||
                'Có thể webhook PayOS đang chậm. Thử làm mới trang, xem lịch sử nộp tiền trên quỹ, hoặc đợi thêm vài phút rồi kiểm tra lại số dư.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
              >
                Làm mới trang
              </button>
              <Link
                to={fundHref}
                className="inline-flex justify-center items-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Xem quỹ / lịch sử
              </Link>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">Không kiểm tra được trạng thái</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">{message}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={fundHref}
                className="inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium"
              >
                Về quỹ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
