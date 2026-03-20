import { useGetUserClubInfoQuery } from '~/cores/api/userApi';
import type { ClubMembership } from '~/cores/api/userApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';

/** Kiểm tra role có được coi là Manager (duyệt quỹ) không — hỗ trợ tên tiếng Anh, tiếng Việt và mô tả vai trò */
function isManagerRole(roleName: string | null | undefined): boolean {
  const r = (roleName ?? '').trim().toLowerCase();
  if (!r) return false;
  // Phó (Vice) không được duyệt quỹ
  if (r.startsWith('phó') || r.includes('phó nhóm') || r.includes('vice')) return false;
  return (
    r === 'manager' || r === 'admin' || r === 'club manager' || r === 'clubmanager' ||
    r.includes('quản lý') || r === 'ql' || r === 'quản lý clb' ||
    r.includes('chủ nhiệm') ||
    // Mô tả vai trò trong DB (VD: "Trường Câu lạc bộ")
    r.includes('trường câu lạc bộ') || r.includes('trường clb')
  );
}

/** Vice/Phó (được quản lý đợt thu, nhưng không duyệt quỹ) */
function isViceRole(roleName: string | null | undefined): boolean {
  const r = (roleName ?? '').trim().toLowerCase();
  if (!r) return false;
  return r.startsWith('phó') || r.includes('phó nhóm') || r.includes('vice');
}

/** ClubRoleId 1 thường là Manager (tùy backend). Dùng khi API không trả roleName. */
const DEFAULT_MANAGER_ROLE_ID = 1;

export function useClubRole() {
  const { isAdmin, userId } = useCurrentUser();

  const { data: rawMemberships, isLoading } = useGetUserClubInfoQuery(
    userId,
    { skip: isAdmin || !userId },
  );

  // Đảm bảo luôn là mảng (API có thể trả response.data hoặc response.data.items)
  const memberships: ClubMembership[] = Array.isArray(rawMemberships)
    ? rawMemberships
    : (rawMemberships && typeof rawMemberships === 'object' && 'items' in rawMemberships
      ? ((rawMemberships as { items: ClubMembership[] }).items ?? [])
      : []);

  const isManager = (m: ClubMembership) =>
    (m?.status ?? '').toUpperCase() === 'ACTIVE' &&
    (isManagerRole(m?.roleName) || m?.clubRoleId === DEFAULT_MANAGER_ROLE_ID);

  const isViceOrManager = (m: ClubMembership) =>
    (m?.status ?? '').toUpperCase() === 'ACTIVE' &&
    (isViceRole(m?.roleName) || isManagerRole(m?.roleName) || m?.clubRoleId === DEFAULT_MANAGER_ROLE_ID);

  const isClubManager = !isAdmin && memberships.some(isManager);

  const clubManagerMembership = memberships.find(isManager);

  /** True nếu user là Manager/Admin (được duyệt quỹ PENDING). Vice Manager = false. */
  const canApproveFund = isAdmin || memberships.some(isManager);

  /** True nếu user là Vice/Manager/Admin (được tạo/đóng đợt thu). */
  const canManageFundCollections = isAdmin || memberships.some(isViceOrManager);

  return {
    memberships,
    isClubManager,
    isAdmin,
    canApproveFund,
    canManageFundCollections,
    clubManagerMembership: clubManagerMembership
      ? { clubId: clubManagerMembership.clubId, roleName: clubManagerMembership.roleName, level: (clubManagerMembership as ClubMembership & { level?: number }).level }
      : undefined,
    isLoading,
  };
}
