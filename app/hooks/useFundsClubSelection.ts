import { useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetClubsQuery } from '~/cores/api';
import { useGetUserAllClubsQuery, useGetUserClubInfoQuery, type ClubMembership } from '~/cores/api/userApi';
import { useClubRole } from '~/hooks/useClubRole';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { getClubId, setClubId } from '~/utils/auth';
import { clearClubFundDetailSession } from '~/modules/funds/utils/clubFundDetailSession';

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

  const { data: userClubs = [] } = useGetUserAllClubsQuery(userId, {
    skip: !hasToken || isAdmin || !userId,
  });

  const userClubNameById = useMemo(
    () => new Map(userClubs.map((c) => [c.clubId, c.clubName] as const)),
    [userClubs],
  );

  const memberships = useMemo(() => {
    const arr = Array.isArray(rawMemberships)
      ? rawMemberships
      : rawMemberships && typeof rawMemberships === 'object' && 'items' in rawMemberships
        ? ((rawMemberships as { items: unknown[] }).items ?? [])
        : [];
    return arr;
  }, [rawMemberships]);

  const memberClubOptions = useMemo(() => {
    return memberships
      .filter((m) => String((m as ClubMembership).status ?? '').toUpperCase() === 'ACTIVE')
      .map((m) => {
        const rec = m as ClubMembership;
        const name =
          rec.clubName?.trim() || userClubNameById.get(rec.clubId)?.trim() || `CLB #${rec.clubId}`;
        return {
          clubId: rec.clubId,
          label: name,
          roleName: rec.roleName?.trim() || undefined,
        };
      });
  }, [memberships, userClubNameById]);

  const hasAnyClub = isAdmin ? clubs.length > 0 : memberClubOptions.length > 0;
  const [selectedClubId, setSelectedClubId] = useState(0);

  const currentClubLabel = useMemo(() => {
    if (selectedClubId > 0) {
      if (isAdmin) {
        const c = clubs.find((x) => x.clubId === selectedClubId);
        return c?.clubName?.trim() || `CLB #${selectedClubId}`;
      }
      const m = memberClubOptions.find((x) => x.clubId === selectedClubId);
      return m?.label || `CLB #${selectedClubId}`;
    }
    if (!hasToken) return '—';
    if (!isAdmin && isLoadingUserMemberships) return 'Đang tải…';
    return '—';
  }, [selectedClubId, isAdmin, clubs, memberClubOptions, hasToken, isLoadingUserMemberships]);

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

  const setSelectedClubIdAndPersist = useCallback((nextClubId: number) => {
    setSelectedClubId((prev) => {
      if (nextClubId > 0 && prev > 0 && nextClubId !== prev) {
        clearClubFundDetailSession();
      }
      return nextClubId;
    });
    if (nextClubId > 0) setClubId(nextClubId);
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
    currentClubLabel,
  };
}
