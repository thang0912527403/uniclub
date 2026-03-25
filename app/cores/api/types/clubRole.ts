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