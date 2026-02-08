import React, { useState } from 'react';
import { Link } from 'react-router';
import { AuthLayout, FormInput, FormButton } from '../';
import { useForgotPasswordMutation } from '~/cores/api';

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ForgotPasswordPage: React.FC = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError('Email là bắt buộc');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    try {
      await forgotPassword({ email }).unwrap();
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password failed:', err);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Kiểm tra email" 
        subtitle="Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Nếu tài khoản với email <strong>{email}</strong> tồn tại, 
            bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong vài phút.
          </p>
          <Link
            to="/auth/login"
            className="inline-block py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Quên mật khẩu" 
      subtitle="Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Email"
          type="email"
          name="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={error}
          icon={<EmailIcon />}
          autoComplete="email"
        />

        <FormButton type="submit" isLoading={isLoading}>
          Gửi hướng dẫn
        </FormButton>

        <p className="text-center text-gray-600 text-sm mt-6">
          Nhớ mật khẩu rồi?{' '}
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

export default ForgotPasswordPage;
