import { useState, useEffect, useCallback } from 'react';
import { getUserId, isLoggedIn } from '~/utils/auth';
import { useGetUserByIdQuery } from '~/cores/api';

export function useCurrentUser() {
  const [userId, setUserId] = useState(() => typeof window !== 'undefined' ? getUserId() : '');
  const [isAuth, setIsAuth] = useState(() => typeof window !== 'undefined' ? isLoggedIn() : false);

  const syncUserId = useCallback(() => {
    setUserId(getUserId());
    setIsAuth(isLoggedIn());
  }, []);

  useEffect(() => {
    syncUserId();
    window.addEventListener('authchange', syncUserId);
    return () => window.removeEventListener('authchange', syncUserId);
  }, [syncUserId]);

  const { data, isLoading, isError } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const user = userId ? (data ?? null) : null;
  const isAdmin = user?.role === 'Admin';
  const role = user?.role ?? null;

  return {
    user,
    role,
    isAdmin,
    isLoading: userId ? isLoading : false,
    isError: userId ? isError : false,
    userId,
    isAuth,
  };
}
