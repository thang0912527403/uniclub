import { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useGetClubsQuery, useGetUserClubInfoQuery, type Club } from '~/cores/api';
import { useClubRole } from '~/hooks/useClubRole';
import { useCurrentUser } from '~/hooks/useCurrentUser';

export function useFundsClubSelection() {
  const hasToken = !!Cookies.get('accessToken');
  const { isAdmin } = useClubRole();
  const { userId } = useCurrentUser();

  const { data: clubsResponse } = useGetClubsQuery(
    { pageIndex: '1', pageSize: '200', searchQuery: '', status: 'ACTIVE' },
    { skip: !hasToken || !isAdmin },
  );
  const clubs: Club[] = clubsResponse?.data ?? [];
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
          label: `${String((m as { clubName?: string }).clubName ?? '').trim() || 'Câu lạc bộ'} • ${
            (m as { roleName?: string }).roleName || `RoleId ${(m as { clubRoleId?: number }).clubRoleId}`
          }`,
        })),
    [memberships],
  );

  const hasAnyClub = isAdmin ? clubs.length > 0 : memberClubOptions.length > 0;
  const [selectedClubId, setSelectedClubId] = useState(0);

  useEffect(() => {
    if (!hasToken) return;
    if (!isAdmin) {
      if (selectedClubId === 0 && memberClubOptions.length > 0) {
        setSelectedClubId(memberClubOptions[0].clubId);
      }
    }
  }, [hasToken, isAdmin, memberClubOptions, selectedClubId]);

  useEffect(() => {
    if (isAdmin && clubs.length > 0 && selectedClubId === 0) {
      setSelectedClubId(clubs[0].clubId);
    }
  }, [isAdmin, clubs, selectedClubId]);

  return {
    clubId: selectedClubId,
    setSelectedClubId,
    memberClubOptions,
    clubs,
    hasToken,
    isAdmin,
    hasAnyClub,
    isLoadingUserMemberships,
  };
}
