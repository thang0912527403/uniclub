import { useGetUserPoliciesQuery } from '~/cores/api/policyApi';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';

/** Maps FE permission keys → DB policy Name values */
const POLICY_MAP = {
    canCreateEvent:        'createevent',
    canViewEvent:          'viewevent',
    canEditEvent:          'editevent',
    canDeleteEvent:        'deleteevent',
    canManageSession:      'managesession',
    canOpenRegistration:   'openregistration',
    canStartComplete:      'startevent',
    canCompleteEvent:      'completeevent',
    canManageCollaborator: 'managecollaborator',
    canViewAttendance:     'viewattendance',
    canApproveAttendance:  'approveattendance',
    canCheckIn:            'checkin',
    canAddMember:            'addmember',
    canUpdateMemberRole:       'updatememberrole',
    canUpdateMemberStatus:     'updatememberstatus',
    canRemoveMember:            'removemember',
    canAddMemberRole:       'addmemberrole',
    canRemoveMemberRole:    'removememberrole',
    canAddPolicy:            'addpolicy',
    canSetPolicy:            'setpolicy',
    canRevokePolicy:            'revokepolicy',
    
} as const;

type PolicyKey = keyof typeof POLICY_MAP;
type ClubPolicyResult = Record<PolicyKey, boolean> & {
    hasPolicy: (name: string) => boolean;
    isLoading: boolean;
};

const ALL_TRUE = Object.fromEntries(
    Object.keys(POLICY_MAP).map(k => [k, true])
) as Record<PolicyKey, boolean>;

const ALL_FALSE = Object.fromEntries(
    Object.keys(POLICY_MAP).map(k => [k, false])
) as Record<PolicyKey, boolean>;

/**
 * Returns club-level DB policy booleans for the current user.
 * Priority: System Admin > Club Manager > DB policy lookup.
 *
 * Usage:
 *   const { canCreateEvent, canEditEvent, canCheckIn } = useClubPolicy();
 */
export function useClubPolicy(): ClubPolicyResult {
    const { isAdmin, userId } = useCurrentUser();
    const { isClubManager } = useClubRole();

    const { data: policies, isLoading } = useGetUserPoliciesQuery(userId!, {
        skip: isAdmin || isClubManager || !userId,
    });

    // Admin or Club Manager → all permissions granted
    if (isAdmin || isClubManager) {
        return {
            ...ALL_TRUE,
            hasPolicy: () => true,
            isLoading: false,
        };
    }

    // Build lowercase Set for O(1) lookup
    const policyNames = new Set(
        (policies ?? []).map(p => p.name.toLowerCase())
    );

    const hasPolicy = (name: string) => policyNames.has(name.toLowerCase());

    const result = Object.fromEntries(
        (Object.entries(POLICY_MAP) as [PolicyKey, string][]).map(
            ([key, name]) => [key, hasPolicy(name)]
        )
    ) as Record<PolicyKey, boolean>;

    return {
        ...result,
        hasPolicy,
        isLoading,
    };
}
