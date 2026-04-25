export interface ClubRolePolicy {
    id: number;
    title: string;
    description: string;
    policyGroupId: number;
}

export interface ClubRole {
    clubRoleId: number;
    roleName: string;
    description?: string;
    level: number;
    memberCount: number;
    policies: ClubRolePolicy[];
    clubId?: number;
    createdAt?: string;
}

export interface ClubDepartment {
    departmentId: number;
    departmentName: string;
    description?: string;
    manager: ClubRole | null;
    roles: ClubRole[];
}

export interface ClubStructure {
    standaloneRoles: ClubRole[];
    departments: ClubDepartment[];
}

export interface ClubRoleUserItem {
    clubMemberId: number;
    userId: string;
    fullName: string;
    email: string;
    avatar: string | null;
    studentId: string | null;
    clubId: number;
    roles: {
        clubRoleId: number;
        roleName: string;
        level: number;
        assignedAt: string;
    }[];
    joinDate: string;
    status: string;
    assignedBy: string | null;
    departments: string[];
}