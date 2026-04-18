import type {
  ApiResponse,
  ClubFundCapabilities,
  FundMenuItemDto,
  FundSidebarMenuId,
} from '~/cores/api/types';

/** Khớp rule quản lý CLB trong useClubRole (tránh import hook từ nhánh clubApi). */
function isClubFundManagerRoleName(roleName: string | null | undefined): boolean {
  const r = (roleName ?? '').trim().toLowerCase();
  if (!r) return false;
  if (r.startsWith('phó') || r.includes('phó nhóm') || r.includes('vice')) return false;
  return (
    r === 'manager' ||
    r === 'admin' ||
    r === 'club manager' ||
    r === 'clubmanager' ||
    r.includes('quản lý') ||
    r === 'ql' ||
    r === 'quản lý clb' ||
    r.includes('chủ nhiệm') ||
    r.includes('trường câu lạc bộ') ||
    r.includes('trường clb')
  );
}

const FUND_SIDEBAR_MENU_IDS: readonly FundSidebarMenuId[] = [
  'overview',
  'transactions',
  'reports',
  'settings',
];

function isFundSidebarMenuId(id: string): id is FundSidebarMenuId {
  return (FUND_SIDEBAR_MENU_IDS as readonly string[]).includes(id);
}

function normalizeFundMenuItemsFromApi(raw: unknown): FundMenuItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: FundMenuItemDto[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    const id = String(e.id ?? e.Id ?? '').trim();
    if (!isFundSidebarMenuId(id)) continue;
    out.push({
      id,
      labelVi: String(e.labelVi ?? e.LabelVi ?? '').trim() || id,
      labelEn: String(e.labelEn ?? e.LabelEn ?? '').trim() || id,
      visible: !!(e.visible ?? e.Visible),
    });
  }
  return out;
}

function pickOptionalViString(
  d: Record<string, unknown>,
  camel: string,
  pascal: string,
): string | null {
  const v = d[camel] ?? d[pascal];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function pickClubFundBooleanFlag(
  raw: Record<string, unknown> | undefined,
  camel: string,
  pascal: string,
  fallback: boolean,
): boolean {
  if (!raw) return fallback;
  const v = raw[camel] ?? raw[pascal];
  if (typeof v === 'boolean') return v;
  return fallback;
}

/** Chuẩn hoá DTO capabilities Club Fund (gồm 3 cờ mới + fallback khi BE chưa gửi field). */
export function normalizeClubFundCapabilitiesFromApi(
  response: ApiResponse<ClubFundCapabilities>,
): ClubFundCapabilities {
  const d = response.data;
  const rawCap = d as unknown as Record<string, unknown> | undefined;
  const hasEdit = !!d?.hasEditFinancePolicy;
  const managerL1 =
    Number(d?.clubRoleLevel) === 1 || isClubFundManagerRoleName(d?.clubRoleName ?? null);
  const financeManagerOpsFallback = managerL1 && hasEdit;

  return {
    canViewFunds: !!d?.canViewFunds,
    canContribute: !!d?.canContribute,
    canCreateFund: !!d?.canCreateFund,
    canApproveOrRejectFundEntity: !!d?.canApproveOrRejectFundEntity,
    canManageOnlinePaymentSettings: pickClubFundBooleanFlag(
      rawCap,
      'canManageOnlinePaymentSettings',
      'CanManageOnlinePaymentSettings',
      financeManagerOpsFallback,
    ),
    canRecordCashContributions: pickClubFundBooleanFlag(
      rawCap,
      'canRecordCashContributions',
      'CanRecordCashContributions',
      financeManagerOpsFallback,
    ),
    canProcessClubRefunds: pickClubFundBooleanFlag(
      rawCap,
      'canProcessClubRefunds',
      'CanProcessClubRefunds',
      financeManagerOpsFallback,
    ),
    hasViewFinancePolicy: !!d?.hasViewFinancePolicy,
    hasCreateFinancePolicy: !!d?.hasCreateFinancePolicy,
    hasEditFinancePolicy: !!d?.hasEditFinancePolicy,
    clubRoleName: d?.clubRoleName ?? null,
    clubRoleLevel: d?.clubRoleLevel ?? null,
    isActiveClubMember: !!d?.isActiveClubMember,
    menuItems: normalizeFundMenuItemsFromApi(
      rawCap ? (rawCap.menuItems ?? rawCap.MenuItems) : undefined,
    ),
    financeAccessHintVi: rawCap
      ? pickOptionalViString(rawCap, 'financeAccessHintVi', 'FinanceAccessHintVi')
      : null,
  };
}
