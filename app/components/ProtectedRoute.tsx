import { Outlet, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '~/utils/auth';

export default function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isLoggedIn()) {
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth/login?redirect=${redirectPath}`, { replace: true });
    }
  }, [location, navigate]);

  // Nếu chưa mounted (SSR) hoặc chưa đăng nhập, tuyệt đối không render nội dung bên trong (Outlet)
  if (!isMounted || !isLoggedIn()) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200"></div>
          <p className="text-slate-400 text-sm italic">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
