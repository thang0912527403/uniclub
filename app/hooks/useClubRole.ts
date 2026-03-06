import { useCurrentUser } from './useCurrentUser';

const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager', 'Manager', 'Admin'];

export function useClubRole() {
  const { user, isAdmin } = useCurrentUser();

  // Use clubRoles directly from the login cookie instead of a separate API call
  const clubRoles = user?.clubRoles ?? [];

  const isClubManager = !isAdmin && clubRoles.some(
    (r) => CLUB_MANAGER_ROLES.some(role => role.toLowerCase() === r.roleName?.toLowerCase())
  );

  const clubManagerMembership = clubRoles.find(
    (r) => CLUB_MANAGER_ROLES.some(role => role.toLowerCase() === r.roleName?.toLowerCase())
  );

  return {
    memberships: clubRoles,
    isClubManager,
    clubManagerMembership: clubManagerMembership
      ? { clubId: clubManagerMembership.clubId, roleName: clubManagerMembership.roleName, level: clubManagerMembership.level }
      : undefined,
    isLoading: false, // No API call needed, data comes from cookie
  };
}
