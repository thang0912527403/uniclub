import { useNavigate } from 'react-router';
import { useSidebarToggle } from '../../hooks/useSidebarToggle';
import Navbar from '../../components/Navbar';
import ProfileHeader from './components/profileHeader';
import InterviewStatusTracker from './components/InterviewStatusTracker';
import { useGetCurrentUserQuery, useGetUserByIdQuery } from '~/cores/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const {data: me} = useGetCurrentUserQuery();
  const { data: user, isLoading, error } = useGetUserByIdQuery(me?.userId || '',
    {
      skip: !me?.userId,
    }
  );

  console.log(user);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <ProfileHeader user={user} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Thông tin cá nhân</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>📧 {user?.email}</p>
                <p>📞 {user?.phoneNumber}</p>
                <p>🏫 {user?.major}</p>
                <p>🆔 MSSV: {user?.studentId}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Interview Status Tracker */}
            {me?.userId && (
              <InterviewStatusTracker userId={me.userId} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
