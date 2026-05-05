import { normalizeExternalOrderCodeFromApi } from "./externalOrderCode";

const STORAGE_KEY = "uniclub_payos_pending_contribute";

export type PayosPendingContribute = {
  clubId: number;
  transactionId: number;
  externalOrderCode?: string;
  fundId?: number;
  publicId?: string;
  savedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function savePayosPendingContribute(payload: {
  clubId: number;
  transactionId: number;
  externalOrderCode?: string | null;
  fundId?: number;
  publicId?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const publicId = String(payload.publicId ?? "").trim();
    const ext = normalizeExternalOrderCodeFromApi(payload.externalOrderCode);
    const data: PayosPendingContribute = {
      clubId: payload.clubId,
      transactionId: payload.transactionId,
      ...(ext != null ? { externalOrderCode: ext } : {}),
      ...(payload.fundId != null && payload.fundId > 0 ? { fundId: payload.fundId } : {}),
      ...(publicId ? { publicId } : {}),
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function readPayosPendingContribute(): PayosPendingContribute | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const clubId = Number(parsed.clubId);
    const transactionId = Number(parsed.transactionId);
    if (
      !Number.isFinite(clubId) ||
      clubId < 1 ||
      !Number.isFinite(transactionId) ||
      transactionId < 1
    ) {
      return null;
    }
    const fundIdRaw = parsed.fundId;
    const fundId =
      fundIdRaw != null && Number.isFinite(Number(fundIdRaw)) && Number(fundIdRaw) > 0
        ? Number(fundIdRaw)
        : undefined;
    const publicId = typeof parsed.publicId === "string" ? parsed.publicId.trim() : "";
    const ext = normalizeExternalOrderCodeFromApi(parsed.externalOrderCode);
    return {
      clubId,
      transactionId,
      ...(ext != null ? { externalOrderCode: ext } : {}),
      ...(fundId != null ? { fundId } : {}),
      ...(publicId ? { publicId } : {}),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearPayosPendingContribute(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
