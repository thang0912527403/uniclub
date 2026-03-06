import { useMemo } from 'react';
import Cookies from 'js-cookie';
import type { UserInfo } from '~/cores/api/types/auth';

export function useCurrentUser() {
  const user = useMemo<UserInfo | null>(() => {
    try {
      const raw = Cookies.get('user');
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch {
      return null;
    }
  }, []);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');

  return { user, roles, isAdmin };
}
