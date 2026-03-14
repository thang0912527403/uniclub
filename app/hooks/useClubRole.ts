import { useGetUserClubInfoQuery } from '~/cores/api/userApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';

const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager', 'Manager', 'Admin'];
/** Chỉ Manager/Admin mới duyệt quỹ; Vice Manager không được. */
const CAN_APPROVE_FUND_ROLES = ['Club Manager', 'ClubManager', 'Manager', 'Admin'];

export function useClubRole() {
  const { isAdmin, userId } = useCurrentUser();

  const { data: memberships = [], isLoading } = useGetUserClubInfoQuery(
    userId,
    { skip: isAdmin || !userId },
  );

  const isClubManager =
    !isAdmin &&
    memberships.some(
      (m) => CLUB_MANAGER_ROLES.some(role => role.toLowerCase() === (m.roleName ?? '').toLowerCase()) && m.status === 'ACTIVE',
    );

  const clubManagerMembership = memberships.find(
    (m) => CLUB_MANAGER_ROLES.some(role => role.toLowerCase() === (m.roleName ?? '').toLowerCase()) && m.status === 'ACTIVE',
  );

  /** True nếu user là Manager/Admin (được duyệt quỹ PENDING). Vice Manager = false. */
  const canApproveFund =
    isAdmin ||
    memberships.some(
      (m) =>
        CAN_APPROVE_FUND_ROLES.some((r) => (m.roleName ?? '').toLowerCase() === r.toLowerCase()) &&
        m.status === 'ACTIVE',
    );

  return {
    memberships,
    isClubManager,
    isAdmin,
    canApproveFund,
    clubManagerMembership: clubManagerMembership
      ? { clubId: clubManagerMembership.clubId, roleName: clubManagerMembership.roleName, level: (clubManagerMembership as { level?: number }).level }
      : undefined,
    isLoading,
  };
}
