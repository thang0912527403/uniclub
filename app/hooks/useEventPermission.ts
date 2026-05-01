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
} as const;

type PermKey = keyof typeof POLICY_MAP;

const ALL_TRUE  = Object.fromEntries(Object.keys(POLICY_MAP).map(k => [k, true]))  as Record<PermKey, boolean>;
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
}
