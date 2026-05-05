export function normalizeExternalOrderCodeFromApi(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length > 0 ? s : undefined;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(Math.trunc(raw));
  }
  if (typeof raw === "bigint") {
    return String(raw);
  }
  return undefined;
}
