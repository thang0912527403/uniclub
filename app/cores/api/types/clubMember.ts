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
    joinDate: string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    assignedBy: string | null;
    departments: string[];
}
