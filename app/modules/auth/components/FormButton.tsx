import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  fullWidth = true,
  disabled,
  className = '',
  type = 'submit',
  ...props
}) => {
  const baseClasses = 'py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-4 focus:ring-gray-300',
    outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50 focus:ring-4 focus:ring-orange-300',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default FormButton;
