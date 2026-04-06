// ==================== Auth Request DTOs ====================

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== Auth Response DTOs ====================

export interface UserInfo {
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  studentId?: string;
  major?: string;
  status?: string;
  roles?: string[];
  clubRoles?: { clubId: number; roleName: string; level: number }[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}
