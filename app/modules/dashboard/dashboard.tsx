import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import AdminDashboard from './AdminDashboard';
import ClubManagerDashboard from './ClubManagerDashboard';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';



export default function DashboardModule() {
  const { isAdmin } = useCurrentUser();
  const { isClubManager, isLoading } = useClubRole();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

   return (
   <div className="min-h-screen">
    <Sidebar currentPath="/dashboard" isOpen={isSidebarOpen} onClose={toggleSidebar} />
    <HeaderBar
        title="Admin Dashboard"
        breadcrumb="Pages / Dashboard"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
   <AdminDashboard isSidebarOpen={isSidebarOpen} />;

   </div>);
   
   


  if (isClubManager) return <ClubManagerDashboard />;

}