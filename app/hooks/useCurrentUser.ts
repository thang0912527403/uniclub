import { useAuth } from '~/components/AuthProvider';

export function useCurrentUser() {
  const { user, isAdmin } = useAuth();
  const role = user?.role ?? null;

  return { user, role, isAdmin };
}
