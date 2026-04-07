import { useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetClubsQuery, useGetUserClubInfoQuery } from '~/cores/api';
import { useClubRole } from '~/hooks/useClubRole';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { getClubId, setClubId } from '~/utils/auth';

export function useFundsClubSelection() {
  const hasToken = !!Cookies.get('accessToken');
  const { isAdmin } = useClubRole();
  const { userId } = useCurrentUser();

  const { data: clubsResult } = useGetClubsQuery(
    hasToken && isAdmin ? { pageIndex: '1', searchQuery: '', pageSize: '200' } : skipToken,
  );
  const clubs = clubsResult?.data ?? [];
  const { data: rawMemberships, isLoading: isLoadingUserMemberships } = useGetUserClubInfoQuery(userId, {
    skip: !hasToken || isAdmin || !userId,
  });

  const memberships = useMemo(() => {
    const arr = Array.isArray(rawMemberships)
      ? rawMemberships
      : rawMemberships && typeof rawMemberships === 'object' && 'items' in rawMemberships
        ? ((rawMemberships as { items: unknown[] }).items ?? [])
        : [];
    return arr;
  }, [rawMemberships]);

  const memberClubOptions = useMemo(
    () =>
      memberships
        .filter((m) => String((m as { status?: string }).status ?? '').toUpperCase() === 'ACTIVE')
        .map((m) => ({
          clubId: (m as { clubId: number }).clubId,
          label: `CLB #${(m as { clubId: number }).clubId} • ${(m as { roleName?: string }).roleName || `RoleId ${(m as { clubRoleId?: number }).clubRoleId}`}`,
        })),
    [memberships],
  );

  const hasAnyClub = isAdmin ? clubs.length > 0 : memberClubOptions.length > 0;
  const [selectedClubId, setSelectedClubId] = useState(0);

  const cookieClubId = getClubId();

  const effectiveClubOptions = isAdmin
    ? clubs.map((c) => ({ clubId: c.clubId }))
    : memberClubOptions.map((c) => ({ clubId: c.clubId }));

  const isClubInOptions = useCallback(
    (clubId: number) => clubId > 0 && effectiveClubOptions.some((c) => c.clubId === clubId),
    [effectiveClubOptions],
  );

  useEffect(() => {
    if (!hasToken) return;
    if (selectedClubId !== 0) return;

    // Prefer persisted "current club" from cookie if it belongs to this user.
    if (isClubInOptions(cookieClubId)) {
      setSelectedClubId(cookieClubId);
      return;
    }

    if (!isAdmin) {
      if (memberClubOptions.length > 0) setSelectedClubId(memberClubOptions[0].clubId);
    } else {
      if (clubs.length > 0) setSelectedClubId(clubs[0].clubId);
    }
  }, [
    hasToken,
    isAdmin,
    selectedClubId,
    cookieClubId,
    isClubInOptions,
    memberClubOptions,
    clubs,
  ]);

  const setSelectedClubIdAndPersist = useCallback((clubId: number) => {
    setSelectedClubId(clubId);
    if (clubId > 0) setClubId(clubId);
  }, []);

  return {
    clubId: selectedClubId,
    setSelectedClubId: setSelectedClubIdAndPersist,
    memberClubOptions,
    clubs,
    hasToken,
    isAdmin,
    hasAnyClub,
    isLoadingUserMemberships,
  };
}
