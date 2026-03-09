import { useAuth } from '~/components/AuthProvider';

export function useClubRole() {
  const { memberships, isClubManager, clubManagerMembership, isLoading, isAdmin } = useAuth();

  return {
    memberships,
    isClubManager,
    clubManagerMembership,
    isLoading: !isAdmin && isLoading,
  };
}
