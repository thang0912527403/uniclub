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
    clubId: number;
    createdAt?: string;
}