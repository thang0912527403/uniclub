import React from 'react';
import Navbar from './components/navbar';
import ProfileHeader from './components/profileHeader';
import ClubCard from './components/clubCard';

const UserProfile = () => {
  const myClubs = [
    {
      title: "Công nghệ & Robot",
      category: "Kỹ thuật",
      description: "Xây dựng robot sáng tạo và khám phá công nghệ tiên tiến.",
      members: 450,
      events: 12,
      iconColor: "bg-orange-500",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500"
    },
    {
      title: "Câu lạc bộ Nhiếp ảnh",
      category: "Nghệ thuật & Truyền thông",
      description: "Ghi lại khoảnh khắc, học kỹ thuật và thể hiện sự sáng tạo.",
      members: 380,
      events: 15,
      iconColor: "bg-orange-600",
      image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?w=500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Thông tin cá nhân</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>📧 email@student.edu.vn</p>
                <p>📞 0987 654 321</p>
                <p>🏫 Khoa Công nghệ Thông tin</p>
                <p>🆔 MSSV: 21000123</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">CLB của tôi</h2>
              <button className="text-[#f26522] font-semibold hover:underline">Xem tất cả</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myClubs.map((club, index) => (
                <ClubCard key={index} {...club} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;