import { useGetMyEventRoleQuery } from '~/cores/api';

/**
 * Per-event permission hook.
 * Calls GET /club/{clubId}/events/{eventId}/my-role to fetch the
 * current user's role and granted policies for this specific event.
 *
 * @returns `can(policyName)` – granular permission check
 * @returns `isAdmin` – true if club manager or system admin
 * @returns `isCollaborator` – true if user has any event role
 */
export function useEventPermission(clubId: number | undefined, eventId: number) {
    const { data, isLoading } = useGetMyEventRoleQuery(
        { clubId: clubId ?? 0, eventId },
        { skip: !clubId || !eventId }
    );

    const role = data?.role ?? null;
    const policies = data?.policies ?? [];

    /** Check if user has a specific event policy (case-insensitive). Wildcard '*' grants all. */
    const can = (policy: string) =>
        policies.includes('*') || policies.some((p: string) => p?.toLowerCase() === policy.toLowerCase());

    /** True when role is ADMIN (club manager or system admin) */
    const isAdmin = role === 'ADMIN';

    /** True when the user has any role in the event */
    const isCollaborator = role != null;

    return { role, policies, can, isAdmin, isCollaborator, isLoading };
}
