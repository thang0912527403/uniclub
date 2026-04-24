export interface ClubMemberRole {
    clubRoleId: number;
    roleName: string;
    level: number;
    assignedAt: string;
}

export interface ClubMember {
    clubMemberId: number;
    userId: string;
    fullName: string;
    email: string;
    avatar: string | null;
    studentId: string | null;
    clubId: number;
    roles?: ClubMemberRole[];
    clubRoleId?: number | null;
    clubRoleIds?: number[];
    roleName?: string | null;
    roleNames?: string[];
    /** API may return a single role as a full object under this key */
    departmentRole?: { clubRoleId: number; roleName: string; description?: string; level: number } | null;
    joinDate: string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    assignedBy: string | null;
    departments: string[];
}

/** Safely resolve all role name strings from any ClubMember shape the API may return */
export function getMemberRoleNames(m: ClubMember): string[] {
    if (m.roles && m.roles.length > 0) return m.roles.map(r => r.roleName);
    if (m.roleNames && m.roleNames.length > 0) return m.roleNames;
    if (m.departmentRole?.roleName) return [m.departmentRole.roleName];
    if (typeof m.roleName === 'string' && m.roleName) return [m.roleName];
    return [];
}

/** Safely resolve all role IDs from any ClubMember shape the API may return */
export function getMemberRoleIds(m: ClubMember): number[] {
    if (m.roles && m.roles.length > 0) return m.roles.map(r => r.clubRoleId);
    if (m.clubRoleIds && m.clubRoleIds.length > 0) return m.clubRoleIds;
    if (m.departmentRole?.clubRoleId) return [m.departmentRole.clubRoleId];
    if (m.clubRoleId) return [m.clubRoleId];
    return [];
}
