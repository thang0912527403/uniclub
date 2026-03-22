import { Outlet, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '~/utils/auth';

export default function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setAuthenticated(loggedIn);
    setAuthChecked(true);

    if (!loggedIn) {
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth/login?redirect=${redirectPath}`, { replace: true });
    }
  }, [location, navigate]);

  if (!authChecked) {
    return null;
  }

  if (!authenticated) {
    return null;
  }

  return <Outlet />;
}
