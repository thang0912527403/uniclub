<<<<<<< HEAD
import { useGetMyEventRoleQuery } from '~/cores/api/eventCollaboratorApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';

/** All known event/attendance policy names */
const POLICY_MAP = {
    canEdit: 'editevent',
    canDelete: 'deleteevent',
    canManageSession: 'managesession',
    canOpenRegistration: 'openregistration',
    canStartComplete: 'startevent',
    canApprove: 'approveattendance',
    canCheckIn: 'checkin',
    canManageTeam: 'managecollaborator',
=======
import { useGetMyEventRoleQuery } from "~/cores/api/eventCollaboratorApi";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useClubRole } from "~/hooks/useClubRole";

const POLICY_MAP = {
  canEdit: "editevent",
  canDelete: "deleteevent",
  canManageSession: "managesession",
  canOpenRegistration: "openregistration",
  canStartComplete: "startevent",
  canApprove: "approveattendance",
  canCheckIn: "checkin",
  canEvaluate: "evaluatemember",
  canManageTeam: "managecollaborator",
>>>>>>> origin/kien
} as const;

type PermKey = keyof typeof POLICY_MAP;

<<<<<<< HEAD
const ALL_TRUE = Object.fromEntries(Object.keys(POLICY_MAP).map(k => [k, true])) as Record<PermKey, boolean>;
const ALL_FALSE = Object.fromEntries(Object.keys(POLICY_MAP).map(k => [k, false])) as Record<PermKey, boolean>;

/**
 * Hook trả về quyền của user hiện tại cho 1 event cụ thể.
 * Ưu tiên: Admin > Club Manager > EventCollaborator (DB policies)
 */
export function useEventPermission(clubId: number, eventId: number) {
    const { isAdmin } = useCurrentUser();
    const { memberships } = useClubRole();

    // Club Manager check — memberships is UserClubDetailedInfo[]
    // Each membership has clubRoles: { roleName, level }[]
    const isClubManager = !isAdmin && memberships.some(
        m => m.clubId === clubId &&
            m.clubRoles?.some(r =>
                Number(r.level) === 0 ||
                (r.roleName ?? '').toLowerCase().match(/^(manager|admin|club\s?manager|quản lý|chủ nhiệm)$/i)
            )
    );

    const { data: myRole, isLoading } = useGetMyEventRoleQuery(
        { clubId, eventId },
        { skip: isAdmin || isClubManager || !clubId || !eventId }
    );

    // System Admin or Club Manager → full access
    if (isAdmin || isClubManager) {
        return {
            role: isAdmin ? 'ADMIN' : 'CLUB_MANAGER',
            isLoading: false,
            ...ALL_TRUE,
            hasAnyPermission: true,
        };
    }

    // Map policies array → permission booleans
    const policies = myRole?.policies ?? [];
    const has = (name: string) => policies.some(p => p.toLowerCase() === name.toLowerCase());

    const perms = Object.fromEntries(
        (Object.entries(POLICY_MAP) as [PermKey, string][]).map(
            ([key, policyName]) => [key, has(policyName)]
        )
    ) as Record<PermKey, boolean>;

    return {
        role: myRole?.role ?? null,
        isLoading,
        ...perms,
        hasAnyPermission: myRole?.role != null,
    };
=======
const ALL_TRUE = Object.fromEntries(
  Object.keys(POLICY_MAP).map((k) => [k, true]),
) as Record<PermKey, boolean>;

/**
 * Per-event permission hook.
 *
 * - System admin / club manager: full access (all flags true)
 * - Otherwise: relies on EventCollaborator role + policies from API
 *
 * Back-compat: also returns `policies` + `can(policyName)` for older call-sites.
 */
export function useEventPermission(
  clubId: number | undefined,
  eventId: number | undefined,
) {
  const safeClubId = clubId ?? 0;
  const safeEventId = eventId ?? 0;

  const { isAdmin } = useCurrentUser();
  const { memberships } = useClubRole();

  const isClubManager =
    !!clubId &&
    !isAdmin &&
    memberships.some(
      (m) =>
        m.clubId === safeClubId &&
        /^(manager|admin|club\s?manager|quản lý|chủ nhiệm)$/i.test(
          (m.roleName ?? "").trim(),
        ),
    );

  const { data: myRole, isLoading } = useGetMyEventRoleQuery(
    { clubId: safeClubId, eventId: safeEventId },
    { skip: !safeClubId || !safeEventId || isAdmin || isClubManager },
  );

  const role = isAdmin ? "ADMIN" : isClubManager ? "CLUB_MANAGER" : myRole?.role ?? null;
  const policies = myRole?.policies ?? [];

  const normalize = (s: string) => s.toLowerCase().replace(/[_\s]/g, "");
  const can = (policyName: string) =>
    (isAdmin || isClubManager) ||
    policies.some((p) => normalize(p) === normalize(policyName));

  if (isAdmin || isClubManager) {
    return {
      role,
      policies,
      can,
      isAdmin: true,
      isCollaborator: true,
      isLoading: false,
      ...ALL_TRUE,
      hasAnyPermission: true,
    };
  }

  const perms = Object.fromEntries(
    (Object.entries(POLICY_MAP) as [PermKey, string][]).map(([key, policy]) => [
      key,
      can(policy),
    ]),
  ) as Record<PermKey, boolean>;

  return {
    role,
    policies,
    can,
    isAdmin: false,
    isCollaborator: role != null,
    isLoading,
    ...perms,
    hasAnyPermission: role != null,
  };
>>>>>>> origin/kien
}
