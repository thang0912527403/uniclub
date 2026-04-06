import { Outlet, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '~/utils/auth';

export default function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => 
    typeof window !== 'undefined' ? isLoggedIn() : false
  );

  useEffect(() => {
    setIsMounted(true);
    const loggedIn = isLoggedIn();
    setAuthenticated(loggedIn);

    if (!loggedIn) {
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth/login?redirect=${redirectPath}`, { replace: true });
    }
  }, [location, navigate]);

  if (!isMounted) {
    return null;
  }

  if (!authenticated) {
    return null;
  }

  return <Outlet />;
}
