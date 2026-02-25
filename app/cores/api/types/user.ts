export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  avatar?: string | null;
  studentId?: string | null;
  major?: string | null;
  joinDate?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
// }