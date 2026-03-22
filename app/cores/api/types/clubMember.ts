export interface ClubMember {
    clubMemberId: number;
    userId: string;
    fullName: string;
    email: string;
    avatar: string | null;
    studentId: string | null;
    clubId: number;
    clubRoleId: number | null;
    roleName: string | null;
    joinDate: string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    assignedBy: string | null;
    departments: string[];
}
