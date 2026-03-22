import { useState, useEffect, useCallback } from 'react';
import { getUserId } from '~/utils/auth';
import { useGetUserByIdQuery } from '~/cores/api';

export function useCurrentUser() {
  const [userId, setUserId] = useState('');

  const syncUserId = useCallback(() => {
    setUserId(getUserId());
  }, []);

  useEffect(() => {
    syncUserId();
    window.addEventListener('authchange', syncUserId);
    return () => window.removeEventListener('authchange', syncUserId);
  }, [syncUserId]);

  const { data, isLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const user = userId ? (data ?? null) : null;
  const isAdmin = user?.role === 'Admin';
  const role = user?.role ?? null;

  return { user, role, isAdmin, isLoading: userId ? isLoading : false, userId };
}
