import type { ClubFund } from '~/cores/api/types/clubFund';

function isFundPastContributionDeadline(f: ClubFund): boolean {
  const raw = f.expiresAt;
  if (raw == null || String(raw).trim() === '') return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const endOfDeadlineDayUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  return Date.now() > endOfDeadlineDayUtc;
}

export function fundSoftDeleteBlockedReasonVi(f: ClubFund): string | null {
  const status = String(f.status ?? '').toUpperCase();
  if (status === 'REJECTED') {
    return 'Quỹ đã bị từ chối; không cần đóng quỹ.';
  }
  if (isFundPastContributionDeadline(f)) {
    return 'Quỹ đã quá hạn nhận nộp; không cần đóng quỹ.';
  }
  return null;
}
