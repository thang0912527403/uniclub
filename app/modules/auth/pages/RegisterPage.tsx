import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout, FormInput, FormButton } from '../';
import { useRegisterMutation, type RegisterRequest } from '~/cores/api';

// Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    
    if (!formData.fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Họ tên phải từ 2-100 ký tự';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ cái viết hoa';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ cái viết thường';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ số';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      }).unwrap();
      
      setSuccess(true);
    } catch (err) {
      console.error('Register failed:', err);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Đăng ký thành công!" 
        subtitle="Vui lòng kiểm tra email để xác thực tài khoản"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Chúng tôi đã gửi email xác thực đến <strong>{formData.email}</strong>. 
            Vui lòng kiểm tra hộp thư và nhấn vào link xác thực.
          </p>
          <Link
            to="/auth/login"
            className="inline-block py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Đến trang đăng nhập
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Đăng ký" 
      subtitle="Tạo tài khoản mới để bắt đầu"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Họ và tên"
          type="text"
          name="fullName"
          placeholder="Nguyễn Văn A"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          icon={<UserIcon />}
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        <FormInput
          label="Xác nhận mật khẩu"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />

        {/* Terms checkbox */}
        <label className="flex items-start mb-6 cursor-pointer">
          <input
            type="checkbox"
            required
            className="w-4 h-4 mt-0.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="ml-2 text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <a href="#" className="text-orange-600 hover:underline">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="#" className="text-orange-600 hover:underline">Chính sách bảo mật</a>
          </span>
        </label>

        {/* Error message from API */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">
              Email đã được sử dụng hoặc có lỗi xảy ra
            </p>
          </div>
        )}

        <FormButton type="submit" isLoading={isLoading}>
          Đăng ký
        </FormButton>

        {/* Login link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Đã có tài khoản?{' '}
          <Link
            to="/auth/login"
            className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
