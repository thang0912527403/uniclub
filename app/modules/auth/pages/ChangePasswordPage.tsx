import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { AuthLayout, FormInput, FormButton } from '../';
import { useChangePasswordMutation } from '~/cores/api';
import { logoutUser } from '~/utils/auth';

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
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
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
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
    
    if (!validateForm()) return;
    
    try {
      await changePassword(formData).unwrap();
      setSuccess(true);
      
      logoutUser();
      
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err) {
      console.error('Change password failed:', err);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Đổi mật khẩu thành công!" 
        subtitle="Bạn sẽ được chuyển đến trang đăng nhập"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại với mật khẩu mới.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Đang chuyển hướng...</span>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Đổi mật khẩu" 
      subtitle="Cập nhật mật khẩu của bạn"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Mật khẩu hiện tại"
          type="password"
          name="currentPassword"
          placeholder="••••••••"
          value={formData.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          icon={<LockIcon />}
          autoComplete="current-password"
        />

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

        {/* Password requirements */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Yêu cầu mật khẩu:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-2">
              <span className={formData.newPassword.length >= 6 ? 'text-green-500' : ''}>
                {formData.newPassword.length >= 6 ? '✓' : '○'}
              </span>
              Ít nhất 6 ký tự
            </li>
            <li className="flex items-center gap-2">
              <span className={/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : ''}>
                {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}
              </span>
              Có ít nhất 1 chữ hoa
            </li>
            <li className="flex items-center gap-2">
              <span className={/[0-9]/.test(formData.newPassword) ? 'text-green-500' : ''}>
                {/[0-9]/.test(formData.newPassword) ? '✓' : '○'}
              </span>
              Có ít nhất 1 số
            </li>
          </ul>
        </div>

        {/* Error message from API */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">
              Mật khẩu hiện tại không chính xác
            </p>
          </div>
        )}

        <FormButton type="submit" isLoading={isLoading}>
          Đổi mật khẩu
        </FormButton>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full mt-3 py-3 px-6 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Hủy
        </button>
      </form>
    </AuthLayout>
  );
};

export default ChangePasswordPage;
