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
  role?: string | null;
  createdAt?: string | null;
}

/** Map từ CreateUserDto (backend) */
export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  studentId?: string | null;
  major?: string | null;
  dateOfBirth?: string | null; // "YYYY-MM-DD"
  gender?: string | null;
  address?: string | null;
}

/** Map từ UpdateUserDto (backend) */
export interface UpdateUserDto {
  fullName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  avatar?: string | null;
  major?: string | null;
  studentId?: string | null;
  status?: string | null;
}
