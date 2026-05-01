export const CLUB_FUND_DETAIL_SESSION_KEY = 'uniclub:clubFundDetail:v1';

export const CLUB_FUND_DETAIL_CHANGE_EVENT = 'uniclub:club-fund-detail-change';

export type ClubFundDetailSessionPayload = { clubId: number; fundId: number };

function notifyChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CLUB_FUND_DETAIL_CHANGE_EVENT));
}

export function readClubFundDetailSession(): ClubFundDetailSessionPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLUB_FUND_DETAIL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { clubId?: unknown; fundId?: unknown };
    const clubId = Number(parsed.clubId);
    const fundId = Number(parsed.fundId);
    if (!Number.isFinite(clubId) || clubId < 1 || !Number.isFinite(fundId) || fundId < 1) return null;
    return { clubId, fundId };
  } catch {
    return null;
  }
}

export function setClubFundDetailSession(payload: ClubFundDetailSessionPayload) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CLUB_FUND_DETAIL_SESSION_KEY, JSON.stringify(payload));
  notifyChange();
}

export function clearClubFundDetailSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CLUB_FUND_DETAIL_SESSION_KEY);
  notifyChange();
}
