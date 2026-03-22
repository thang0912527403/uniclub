const STORAGE_KEY = 'uniclub_payos_pending_contribute';

export type PayosPendingContribute = {
  clubId: number;
  transactionId: number;
  fundId?: number;
  savedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function savePayosPendingContribute(payload: {
  clubId: number;
  transactionId: number;
  fundId?: number;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const data: PayosPendingContribute = {
      clubId: payload.clubId,
      transactionId: payload.transactionId,
      ...(payload.fundId != null && payload.fundId > 0 ? { fundId: payload.fundId } : {}),
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function readPayosPendingContribute(): PayosPendingContribute | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const clubId = Number(parsed.clubId);
    const transactionId = Number(parsed.transactionId);
    if (!Number.isFinite(clubId) || clubId < 1 || !Number.isFinite(transactionId) || transactionId < 1) {
      return null;
    }
    const fundIdRaw = parsed.fundId;
    const fundId =
      fundIdRaw != null && Number.isFinite(Number(fundIdRaw)) && Number(fundIdRaw) > 0
        ? Number(fundIdRaw)
        : undefined;
    return {
      clubId,
      transactionId,
      ...(fundId != null ? { fundId } : {}),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearPayosPendingContribute(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
