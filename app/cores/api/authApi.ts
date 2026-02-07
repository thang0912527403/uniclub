import { baseApi } from './baseApi';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserInfo,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
} from './types/auth';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Đăng nhập
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Đăng ký
    register: builder.mutation<UserInfo, RegisterRequest>({
      query: (userData) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Refresh token
    refreshToken: builder.mutation<LoginResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: '/api/auth/refresh-token',
        method: 'POST',
        body: data,
      }),
    }),

    // Đăng xuất (revoke token)
    logout: builder.mutation<void, { refreshToken: string }>({
      query: (data) => ({
        url: '/api/auth/revoke-token',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Đăng xuất tất cả thiết bị
    logoutAllDevices: builder.mutation<void, void>({
      query: () => ({
        url: '/api/auth/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Đổi mật khẩu
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => ({
        url: '/api/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Quên mật khẩu
    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset mật khẩu
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Xác thực email
    verifyEmail: builder.mutation<void, VerifyEmailRequest>({
      query: (data) => ({
        url: '/api/auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),

    // Gửi lại email xác thực
    resendVerificationEmail: builder.mutation<void, { email: string }>({
      query: (data) => ({
        url: '/api/auth/resend-verification-email',
        method: 'POST',
        body: data,
      }),
    }),

    // Lấy thông tin user hiện tại
    getCurrentUser: builder.query<UserInfo, void>({
      query: () => '/api/auth/me',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useLogoutAllDevicesMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
} = authApi;
