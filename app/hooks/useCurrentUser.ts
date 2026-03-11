import { useState, useEffect } from 'react';
import { getUserId } from '~/utils/auth';
import { useGetUserByIdQuery } from '~/cores/api';

export function useCurrentUser() {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const { data: user = null, isLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const isAdmin = user?.role === 'Admin';
  const role = user?.role ?? null;

  return { user, role, isAdmin, isLoading, userId };
}
