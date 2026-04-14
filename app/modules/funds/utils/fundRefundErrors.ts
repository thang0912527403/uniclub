export function stripClubFundErrorDisplaySuffixes(text: string): string {
  return text
    .trim()
    .replace(/\s*\(Parameter\s+['"][^'"]+['"]\)/gi, '')
    .replace(/\s*\(HTTP\s+\d+\)/gi, '')
    .trim();
}

export function extractClubFundErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { data?: unknown };
  const d = e.data;
  if (typeof d === 'string' && d.trim()) return stripClubFundErrorDisplaySuffixes(d);
  if (d && typeof d === 'object') {
    const rec = d as Record<string, unknown>;
    const m = rec.message ?? rec.Message;
    if (typeof m === 'string' && m.trim()) return stripClubFundErrorDisplaySuffixes(m);
  }
  return undefined;
}

export function refundManagerForbiddenCopy(message: string | undefined): {
  title: string;
  detail: string;
} {
  const raw = message?.trim() ?? '';
  const m = raw.toLowerCase();
  const financePolicy =
    m.includes('editfinance') ||
    m.includes('edit finance') ||
    m.includes('chỉnh sửa tài chính') ||
    m.includes('policy');
  const managerLevel =
    m.includes('manager') ||
    m.includes('quản lý') ||
    m.includes('level 1') ||
    m.includes('level1') ||
    m.includes('cấp 1') ||
    m.includes('l1') ||
    m.includes('admin');
  if (financePolicy || managerLevel) {
    return {
      title: 'Không đủ quyền xử lý hoàn tiền',
      detail:
        raw ||
        'Cần policy chỉnh sửa tài chính (editfinance) và là Quản lý CLB cấp 1 (hoặc Admin hệ thống).',
    };
  }
  return {
    title: 'Không thể truy cập danh sách hoàn tiền',
    detail:
      raw ||
      'Bạn có thể không thuộc CLB này hoặc không có quyền xem yêu cầu hoàn tiền của toàn CLB.',
  };
}
