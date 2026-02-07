import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AuthLayout, FormButton } from '../';
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from '~/cores/api';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'invalid'>('verifying');
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus('invalid');
        return;
      }
      
      try {
        await verifyEmail({ email, verificationToken: token }).unwrap();
        setStatus('success');
      } catch (err) {
        console.error('Verify email failed:', err);
        setStatus('error');
      }
    };
    
    verify();
  }, [token, email, verifyEmail]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    try {
      await resendEmail({ email }).unwrap();
      setResendSuccess(true);
    } catch (err) {
      console.error('Resend email failed:', err);
    }
  };

  // Loading state
  if (status === 'verifying') {
    return (
      <AuthLayout 
        title="Đang xác thực..." 
        subtitle="Vui lòng đợi trong giây lát"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="animate-spin h-12 w-12 text-orange-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Đang xác thực email của bạn...</p>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <AuthLayout 
        title="Xác thực thành công!" 
        subtitle="Tài khoản của bạn đã được kích hoạt"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Chào mừng bạn đến với UniClub! Bạn có thể đăng nhập ngay bây giờ.
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

  // Invalid link state
  if (status === 'invalid') {
    return (
      <AuthLayout 
        title="Link không hợp lệ" 
        subtitle="Link xác thực không hợp lệ"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Link xác thực không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại.
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

  // Error state (expired or already used)
  return (
    <AuthLayout 
      title="Xác thực thất bại" 
      subtitle="Link xác thực đã hết hạn hoặc đã được sử dụng"
    >
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        {resendSuccess ? (
          <>
            <p className="text-gray-600 mb-6">
              Email xác thực mới đã được gửi đến <strong>{email}</strong>. 
              Vui lòng kiểm tra hộp thư.
            </p>
            <Link
              to="/auth/login"
              className="inline-block py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Link xác thực đã hết hạn hoặc đã được sử dụng. 
              Bạn có thể yêu cầu gửi lại email xác thực.
            </p>
            <FormButton 
              onClick={handleResendEmail} 
              isLoading={isResending}
              type="button"
            >
              Gửi lại email xác thực
            </FormButton>
            <p className="text-center text-gray-600 text-sm mt-4">
              <Link
                to="/auth/login"
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
