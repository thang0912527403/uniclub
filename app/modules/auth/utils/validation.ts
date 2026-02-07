// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 số');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Confirm password validation
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

// Full name validation
export const validateFullName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Form field validation
export const validateField = (
  fieldName: string,
  value: string,
  confirmValue?: string
): string | null => {
  switch (fieldName) {
    case 'email':
      if (!value) return 'Email là bắt buộc';
      if (!isValidEmail(value)) return 'Email không hợp lệ';
      return null;

    case 'password':
      if (!value) return 'Mật khẩu là bắt buộc';
      const passwordValidation = validatePasswordStrength(value);
      if (!passwordValidation.isValid) {
        return passwordValidation.errors[0];
      }
      return null;

    case 'confirmPassword':
      if (!value) return 'Xác nhận mật khẩu là bắt buộc';
      if (confirmValue && !validatePasswordMatch(confirmValue, value)) {
        return 'Mật khẩu không khớp';
      }
      return null;

    case 'fullName':
      if (!value) return 'Họ tên là bắt buộc';
      if (!validateFullName(value)) return 'Họ tên phải có ít nhất 2 ký tự';
      return null;

    default:
      return null;
  }
};
