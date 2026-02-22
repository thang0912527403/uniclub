interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Đang tải dữ liệu..." }: LoadingProps) {
  const textClass =  'dark:text-white text-gray-900';
  const textSecondaryClass ='dark:text-gray-400 text-gray-500';

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <i className={`fas fa-spinner fa-spin text-4xl ${textClass} mb-4`}></i>
        <p className={textSecondaryClass}>{message}</p>
      </div>
    </div>
  );
}
