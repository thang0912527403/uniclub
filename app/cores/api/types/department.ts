export interface Department {
  DepartmentId: number;
  Name: string;
  Description: string;
}

export interface DepartmentCreateRequest {
  ClubId: number;
  Name: string;
  Description?: string;
}

// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
// }

export interface UserDepartmentRole {
  clubRoleId: number;
  roleName: string;
  description: string;
  level: number;
}

export interface UserDepartment {
  departmentId: number;
  departmentName: string;
  description: string;
  departmentRole: string | null;
  roles: UserDepartmentRole[];
  createdAt?: string;
  roleCount?: number;
  memberCount?: number;
}

export interface DepartmentMember {
  clubMemberId: number;
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  studentId: string | null;
  status: string;
  joinDate: string;
  departmentRole: string | null;
  departmentRoles?: UserDepartmentRole[];
}