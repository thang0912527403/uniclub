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