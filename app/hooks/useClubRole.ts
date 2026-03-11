import { useGetUserClubInfoQuery } from '~/cores/api/userApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';

const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager', 'Manager', 'Admin'];

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

  return {
    memberships,
    isClubManager,
    isAdmin,
    clubManagerMembership: clubManagerMembership
      ? { clubId: clubManagerMembership.clubId, roleName: clubManagerMembership.roleName, level: (clubManagerMembership as { level?: number }).level }
      : undefined,
    isLoading,
  };
}
