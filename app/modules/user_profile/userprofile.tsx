import { useNavigate } from 'react-router';
import { useSidebarToggle } from '../../hooks/useSidebarToggle';
import Navbar from './components/navbar';
import ProfileHeader from './components/profileHeader';
import { useGetCurrentUserQuery, useGetUserByIdQuery } from '~/cores/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const {data: me} = useGetCurrentUserQuery();
  //47457723-6435-4C62-8797-08DE67F399A1
  const { data: user, isLoading, error } = useGetUserByIdQuery(me?.userId || '');

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

            {/* <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Thống kê</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <div className="text-xl font-bold text-[#f26522]">05</div>
                  <div className="text-xs text-gray-500">CLB Tham gia</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <div className="text-xl font-bold text-[#f26522]">12</div>
                  <div className="text-xs text-gray-500">Sự kiện</div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Main Content */}
          {/* <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">CLB của tôi</h2>
              <button className="text-[#f26522] font-semibold hover:underline">Xem tất cả</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myClubs.map((club, index) => (
                <ClubCard key={index} {...club} />
              ))}
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;