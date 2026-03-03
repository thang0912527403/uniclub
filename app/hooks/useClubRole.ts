import { useGetUserClubInfoQuery } from '~/cores/api/userApi';
import { useCurrentUser } from './useCurrentUser';

const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager'];

export function useClubRole() {
  const { user, isAdmin } = useCurrentUser();

  const { data: memberships, isLoading } = useGetUserClubInfoQuery(
    user?.userId ?? '',
    { skip: isAdmin || !user?.userId }
  );

  const isClubManager = !isAdmin && (memberships ?? []).some(
    (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE'
  );

  const clubManagerMembership = (memberships ?? []).find(
    (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE'
  );

  return {
    memberships: memberships ?? [],
    isClubManager,
    clubManagerMembership,
    isLoading: !isAdmin && isLoading,
  };
}
