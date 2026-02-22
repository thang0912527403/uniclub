import { useEffect } from 'react';
import { useNavigate } from 'react-router';

interface ErrorProps {
  error: any;
  title?: string;
}

export function Error({ error, title = 'Lỗi khi tải dữ liệu' }: ErrorProps) {
  const navigate = useNavigate();
  const cardClass = 'dark:bg-[#242838] bg-white';

  useEffect(() => {
    if (!('status' in error)) return;
    if (error.status === 401) navigate('/401');
    if (error.status === 403) navigate('/403');
  }, [error, navigate]);

  if ('status' in error && (error.status === 401 || error.status === 403)) {
    return null;
  }

  return (
    <div className={`${cardClass} rounded-xl shadow-md p-6 mb-6`}>
      <div className="flex items-center gap-3 text-red-500">
        <i className="fas fa-exclamation-circle text-2xl"></i>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm">
            {'status' in error ? `Error ${error.status}` : 'Network error'}
          </p>
        </div>
      </div>
    </div>
  );
}
