import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, FormInput, FormButton } from "../";
import {
  useLoginMutation,
  useGoogleLoginMutation,
  type LoginRequest,
} from "~/cores/api";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { API_URLS } from "~/cores/api/baseApi";
import { loginUser } from "~/utils/auth";
// Icons
const EmailIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading, error: googleError }] =
    useGoogleLoginMutation();

  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
    deviceInfo: navigator.userAgent.substring(0, 100),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await login(formData).unwrap();
      const payload = response?.data ?? response;

      if (payload?.accessToken) {
        loginUser(payload as any);
        const redirectTo =
          new URLSearchParams(window.location.search).get("redirect") ||
          "/home";
        navigate(redirectTo);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) return;
      const response = await googleLogin({
        idToken: credentialResponse.credential,
      }).unwrap();
      const payload = response?.data ?? response;
      if (payload?.accessToken) {
        loginUser(payload as any);
        const redirectTo =
          new URLSearchParams(window.location.search).get("redirect") ||
          "/home";
        navigate(redirectTo);
      }
    } catch (err) {
      console.error("Google Login failed:", err);
    }
  };

  const loginErrorMessage =
    error &&
    ((error as { data?: { message?: string } })?.data?.message ||
      (error as { data?: { title?: string } })?.data?.title ||
      "Email hoặc mật khẩu không chính xác");

  return (
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng bạn quay lại!">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Email"
          type="email"
          name="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={<EmailIcon />}
          autoComplete="email"
        />

        <FormInput
          label="Mật khẩu"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="current-password"
        />

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Error message from API */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">
              {loginErrorMessage}
            </p>
          </div>
        )}

        <FormButton type="submit" isLoading={isLoading}>
          Đăng nhập
        </FormButton>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">hoặc</span>
          </div>
        </div>

        {/* Social login buttons */}
        <div className="flex justify-center w-full">
          <GoogleOAuthProvider clientId="144572249357-2pskh68p98cet91g0ttlsek3etp5iuo3.apps.googleusercontent.com">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google Login Failed")}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </GoogleOAuthProvider>
        </div>

        {/* Register link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Chưa có tài khoản?{" "}
          <Link
            to="/auth/register"
            className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
