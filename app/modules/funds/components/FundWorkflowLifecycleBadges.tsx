import type { ClubFund } from '~/cores/api/types';
import { isManagerClosedAmberNoteDuplicateVi } from '~/modules/funds/utils/fundContributeNoteFilter';
import { fundTokens as t } from '~/routes/funds.design-tokens';

function workflowLabel(fund: ClubFund): string {
  const s = String(fund.status ?? '').toUpperCase();
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return '—';
}

function WorkflowBadge({ fund }: { fund: ClubFund }) {
  const s = String(fund.status ?? '').toUpperCase();
  if (s === 'APPROVED')
    return (
      <span className={t.status.approved}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        <span>{workflowLabel(fund)}</span>
      </span>
    );
  if (s === 'REJECTED')
    return (
      <span className={t.status.rejected}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" aria-hidden />
        <span>{workflowLabel(fund)}</span>
      </span>
    );
  return (
    <span className={t.status.pending}>
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
      <span>{workflowLabel(fund)}</span>
    </span>
  );
}

function closedReasonSubtitleVi(fund: ClubFund): string {
  const c = fund.closedReasonCode;
  if (c === 'EXPIRED') return 'Hết hạn nhận nộp';
  if (c === 'MANAGER_CLOSED') return 'Đóng bởi quản lý';
  return '';
}

const closedBadgeClass =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100 border border-slate-200 dark:border-slate-600';

export function FundWorkflowLifecycleBadges({ fund, compact }: { fund: ClubFund; compact?: boolean }) {
  const gap = compact ? 'gap-1' : 'gap-1.5';
  const hideApprovedWorkflowWhenClosed =
    fund.isClosed === true && String(fund.status ?? '').toUpperCase() === 'APPROVED';
  return (
    <div className={`flex flex-wrap items-center ${gap}`}>
      {!hideApprovedWorkflowWhenClosed ? <WorkflowBadge fund={fund} /> : null}
      {fund.isClosed ? (
        <span
          className={closedBadgeClass}
          title={closedReasonSubtitleVi(fund) || undefined}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500 shrink-0" aria-hidden />
          <span>
            {isManagerClosedAmberNoteDuplicateVi(fund.lifecycleStatusVi ?? '')
              ? 'Đã đóng'
              : fund.lifecycleStatusVi?.trim() || 'Đã đóng'}
          </span>
        </span>
      ) : null}
    </div>
  );
}
