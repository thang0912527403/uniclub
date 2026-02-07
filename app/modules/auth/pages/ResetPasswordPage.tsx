import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AuthLayout, FormInput, FormButton } from '../';
import { useResetPasswordMutation } from '~/cores/api';

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [success, setSuccess] = useState(false);
  
  // Lấy token và email từ URL params
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      setErrors({ form: 'Link đặt lại mật khẩu không hợp lệ' });
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      await resetPassword({
        email,
        resetToken: token,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      }).unwrap();
      
      setSuccess(true);
    } catch (err) {
      console.error('Reset password failed:', err);
    }
  };

  // Kiểm tra URL params
  if (!token || !email) {
    return (
      <AuthLayout 
        title="Link không hợp lệ" 
        subtitle="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Vui lòng yêu cầu link đặt lại mật khẩu mới.
          </p>
          <Link
            to="/auth/forgot-password"
            className="inline-block py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Yêu cầu link mới
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout 
        title="Đặt lại mật khẩu thành công!" 
        subtitle="Mật khẩu của bạn đã được cập nhật"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
          <Link
            to="/auth/login"
            className="inline-block py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Đặt lại mật khẩu" 
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Mật khẩu mới"
          type="password"
          name="newPassword"
          placeholder="••••••••"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />

        <FormInput
          label="Xác nhận mật khẩu mới"
          type="password"
          name="confirmNewPassword"
          placeholder="••••••••"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          error={errors.confirmNewPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />

        {/* Error message from API */}
        {(error || errors.form) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">
              {errors.form || 'Link đã hết hạn hoặc không hợp lệ'}
            </p>
          </div>
        )}

        <FormButton type="submit" isLoading={isLoading}>
          Đặt lại mật khẩu
        </FormButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
