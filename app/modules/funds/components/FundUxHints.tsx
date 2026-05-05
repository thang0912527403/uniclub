import { Info } from 'lucide-react';
import type { ClubFund } from '~/cores/api/types/clubFund';

type FundBalanceHoverFields = Pick<ClubFund, 'balanceContextVi' | 'status' | 'totalAmount'>;

export function resolveFundBalanceHoverTextVi(fund: FundBalanceHoverFields, balanceVnd: number): string | undefined {
  const status = String(fund.status ?? '').toUpperCase();
  const totalRaw = fund.totalAmount;
  const hasRecordedTotal =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw) && Math.abs(totalRaw) > 1e-9;
  if (status === 'APPROVED' && balanceVnd === 0 && !hasRecordedTotal) {
    return 'Chưa có giao dịch.';
  }
  return fund.balanceContextVi?.trim() || undefined;
}

export function FinanceAccessHintBanner({ message }: { message: string | null | undefined }) {
  const text = message?.trim();
  if (!text) return null;
  return (
    <div
      className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100"
      role="status"
    >
      {text}
    </div>
  );
}

export function FundBalanceContextLine({ text }: { text: string | null | undefined }) {
  const t = text?.trim();
  if (!t) return null;
  return (
    <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
      <span className="inline-flex shrink-0 mt-0.5" title={t}>
        <Info className="w-3.5 h-3.5" aria-hidden />
      </span>
      <span>{t}</span>
    </p>
  );
}

export function FundCardBalanceHint({
  amountFormatted,
  balanceVnd,
  fund,
}: {
  amountFormatted: string;
  balanceVnd: number;
  fund: FundBalanceHoverFields;
}) {
  const hint = resolveFundBalanceHoverTextVi(fund, balanceVnd);
  return (
    <div className="mt-1 flex items-baseline gap-1">
      <p
        className={`text-lg font-semibold text-slate-700 dark:text-slate-200 ${hint ? 'cursor-help' : ''}`}
        title={hint || undefined}
      >
        {amountFormatted} ₫
      </p>
      {hint ? (
        <span className="inline-flex text-slate-400 dark:text-slate-500 shrink-0 self-center" title={hint} aria-label={hint}>
          <Info className="w-3.5 h-3.5" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

export function CannotContributeReasonLine({ reason }: { reason: string | null | undefined }) {
  const t = reason?.trim();
  if (!t) return null;
  return <p className="mt-1 text-sm text-red-600/90 dark:text-red-300/90">{t}</p>;
}

export function ReportDateFilterNote({ note }: { note: string | null | undefined }) {
  const t = note?.trim();
  if (!t) return null;
  return <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-3xl">{t}</p>;
}

export function FundRejectionReasonCallout({
  reason,
  compact,
}: {
  reason?: string | null;
  compact?: boolean;
}) {
  const text = reason?.trim();
  if (!text) return null;
  if (compact) {
    return (
      <div
        className="mt-2 rounded-lg border border-red-200/90 bg-red-50/80 px-2.5 py-2 text-xs text-red-950 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-100"
        role="status"
      >
        <p className="font-semibold text-red-900 dark:text-red-200">Lý do từ chối</p>
        <p className="mt-1 line-clamp-5 whitespace-pre-wrap">{text}</p>
      </div>
    );
  }
  return (
    <div
      className="mt-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2.5 text-sm text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
      role="status"
      aria-label="Lý do từ chối quỹ"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-red-200/90">Lý do từ chối</p>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
