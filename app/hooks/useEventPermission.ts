import { useGetMyEventRoleQuery } from "~/cores/api/eventCollaboratorApi";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useClubRole } from "~/hooks/useClubRole";

/** All known event/attendance policy names */
const POLICY_MAP = {
  canEdit: "editevent",
  canDelete: "deleteevent",
  canManageSession: "managesession",
  canOpenRegistration: "openregistration",
  canStartComplete: "startevent",
  canApprove: "approveattendance",
  canCheckIn: "checkin",
  canManageTeam: "managecollaborator",
} as const;

type PermKey = keyof typeof POLICY_MAP;

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
        (m.clubRoles?.some(r =>
          Number(r.level) === 0 ||
          /^(manager|admin|club\s?manager|quản lý|chủ nhiệm)$/i.test(
            (r.roleName ?? "").trim(),
          )
        ) ||
        /^(manager|admin|club\s?manager|quản lý|chủ nhiệm)$/i.test(
          (m.roleName ?? "").trim(),
        )),
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
}
