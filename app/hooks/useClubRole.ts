import { useGetUserClubInfoQuery } from "~/cores/api/userApi";
import type { ClubMembership } from "~/cores/api/userApi";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export function isManagerRole(roleName: string | null | undefined): boolean {
  const r = (roleName ?? "").trim().toLowerCase();
  if (!r) return false;

  if (r.startsWith("phó") || r.includes("phó nhóm") || r.includes("vice"))
    return false;
  return (
    r === "manager" ||
    r === "admin" ||
    r === "club manager" ||
    r === "clubmanager" ||
    r.includes("quản lý") ||
    r === "ql" ||
    r === "quản lý clb" ||
    r.includes("chủ nhiệm") ||
    r.includes("trường câu lạc bộ") ||
    r.includes("trường clb")
  );
}

function isViceRole(roleName: string | null | undefined): boolean {
  const r = (roleName ?? "").trim().toLowerCase();
  if (!r) return false;
  return r.startsWith("phó") || r.includes("phó nhóm") || r.includes("vice");
}

const DEFAULT_MANAGER_ROLE_ID = 1;

export function useClubRole() {
  const { isAdmin, userId } = useCurrentUser();

  const { data: rawMemberships, isLoading } = useGetUserClubInfoQuery(userId, {
    skip: isAdmin || !userId,
  });

  const memberships: ClubMembership[] = Array.isArray(rawMemberships)
    ? rawMemberships
    : rawMemberships &&
        typeof rawMemberships === "object" &&
        "items" in rawMemberships
      ? ((rawMemberships as { items: ClubMembership[] }).items ?? [])
      : [];

  const isManager = (m: ClubMembership) =>
    (m?.status ?? "").toUpperCase() === "ACTIVE" &&
    (isManagerRole(m?.roleName) || m?.clubRoleId === DEFAULT_MANAGER_ROLE_ID);

  const isViceOrManager = (m: ClubMembership) =>
    (m?.status ?? "").toUpperCase() === "ACTIVE" &&
    (isViceRole(m?.roleName) ||
      isManagerRole(m?.roleName) ||
      m?.clubRoleId === DEFAULT_MANAGER_ROLE_ID);

  const isClubManager = !isAdmin && memberships.some(isManager);

  const clubManagerMembership = memberships.find(isManager);

  const canApproveFund = isAdmin || memberships.some(isManager);

  const canManageFundCollections = isAdmin || memberships.some(isViceOrManager);

  return {
    memberships,
    isClubManager,
    isAdmin,
    canApproveFund,
    canManageFundCollections,
    clubManagerMembership: clubManagerMembership
      ? {
          clubId: clubManagerMembership.clubId,
          roleName: clubManagerMembership.roleName,
          level: (clubManagerMembership as ClubMembership & { level?: number })
            .level,
        }
      : undefined,
    isLoading,
  };
}
