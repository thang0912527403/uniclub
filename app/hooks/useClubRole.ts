import { useGetUserClubInfoQuery } from '~/cores/api/userApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';

const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager'];

export function useClubRole() {
  const { isAdmin, userId } = useCurrentUser();

  const { data: memberships = [], isLoading } = useGetUserClubInfoQuery(
    userId,
    { skip: isAdmin || !userId },
  );

  const isClubManager =
    !isAdmin &&
    memberships.some(
      (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE',
    );

  const clubManagerMembership = memberships.find(
    (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE',
  );

  return {
    memberships,
    isClubManager,
    clubManagerMembership,
    isLoading: !isAdmin && isLoading,
  };
}
