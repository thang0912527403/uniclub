import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import AdminDashboard from './AdminDashboard';
import ClubManagerDashboard from './ClubManagerDashboard';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';

export default function DashboardModule() {
  const { isAdmin } = useCurrentUser();
  const { isClubManager, isLoading } = useClubRole();
  const navigate = useNavigate();
  // Regular users (not Admin, not ClubManager) → redirect to profile
  useEffect(() => {
    if (!isAdmin && !isLoading && !isClubManager) {
      navigate('/profile', { replace: true });
    }
  }, [isAdmin, isClubManager, isLoading, navigate]);

  // Admin → system dashboard
  if (isAdmin) return <AdminDashboard />;

  // Still fetching club role → wait silently
  if (isLoading) return null;

  // User with Club Manager role in any club
  if (isClubManager) return <ClubManagerDashboard />;

  navigate('/auth/login', { replace: true });
}
