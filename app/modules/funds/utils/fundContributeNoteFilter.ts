export function isManagerClosedAmberNoteDuplicateVi(note: string | null | undefined): boolean {
  const s = (note ?? '').trim();
  if (!s) return false;
  return /^Quỹ đã đóng\s*\(\s*Quản lý đã đóng quỹ\s*\)\.?$/iu.test(s);
}
