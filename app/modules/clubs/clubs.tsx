import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubsQuery } from '~/cores/api';

export default function ClubsModule() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarDark, setIsSidebarDark] = useState(true);
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const { data: clubs, isLoading, error } = useGetClubsQuery();

  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
  const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  const apiStatuses = [
    { name: 'Clubs Data', isLoading },
  ];

  return (
    <div className="min-h-screen">
      <ApiStatusButton
        apiStatuses={apiStatuses}
        isDark={isDark}
        onThemeToggle={toggleTheme}
        position="bottom-right"
      />

      <Sidebar 
        isDark={isSidebarDark} 
        currentPath="/clubs"
        onToggleSidebarTheme={() => setIsSidebarDark(!isSidebarDark)}
        isOpen={isSidebarOpen}
      />

      <HeaderBar 
        isDark={isDark}
        title="Quản lý Câu lạc bộ"
        breadcrumb="Pages / Clubs"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Loading State */}
        {isLoading && <Loading isDark={isDark} />}

        {/* Error State */}
        {error && <Error isDark={isDark} error={error} />}

        {/* Stats Overview */}
        {!isLoading && clubs && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className={`${cardClass} rounded-xl shadow-md p-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondaryClass} uppercase`}>Total Clubs</p>
                    <h3 className={`text-2xl font-bold ${textClass}`}>{clubs.length}</h3>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} rounded-xl shadow-md p-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-friends text-white text-xl"></i>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondaryClass} uppercase`}>Total Members</p>
                    <h3 className={`text-2xl font-bold ${textClass}`}>
                      {clubs.reduce((sum, club) => sum + club.memberCount, 0)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} rounded-xl shadow-md p-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-xl"></i>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondaryClass} uppercase`}>Active Clubs</p>
                    <h3 className={`text-2xl font-bold ${textClass}`}>
                      {clubs.filter(c => c.isActive).length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} rounded-xl shadow-md p-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-globe text-white text-xl"></i>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondaryClass} uppercase`}>Public Clubs</p>
                    <h3 className={`text-2xl font-bold ${textClass}`}>
                      {clubs.filter(c => c.isPublic).length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className={`${cardClass} rounded-xl shadow-md p-4 mb-6 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                  <i className="fas fa-plus mr-2"></i>
                  Tạo CLB mới
                </button>
                <button className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${textClass} ${hoverClass}`}>
                  <i className="fas fa-filter mr-2"></i>
                  Lọc
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select className={`px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-[#1a1d2e] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option>Tất cả trạng thái</option>
                  <option>Hoạt động</option>
                  <option>Không hoạt động</option>
                </select>
                <select className={`px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-[#1a1d2e] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option>Tất cả</option>
                  <option>Công khai</option>
                  <option>Riêng tư</option>
                </select>
              </div>
            </div>

            {/* Clubs Grid */}
            {clubs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <div 
                    key={club.clubId} 
                    className={`${cardClass} rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer`}
                    onClick={() => navigate(`/clubs/${club.clubId}`)}
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                      {club.coverImageUrl || club.logoUrl ? (
                        <img 
                          src={club.coverImageUrl || club.logoUrl} 
                          alt={club.clubName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <i className="fas fa-building text-5xl mb-2 opacity-50"></i>
                            <p className="text-sm font-semibold opacity-75">{club.clubName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-3">
                        <h3 className={`text-lg font-bold ${textClass} mb-2`}>{club.clubName}</h3>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {club.shortName || 'N/A'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            club.isActive 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}>
                            {club.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${textSecondaryClass} mb-4 line-clamp-2`}>
                        {club.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <i className={`fas fa-users text-sm ${textSecondaryClass}`}></i>
                          <span className={`text-sm ${textSecondaryClass}`}>{club.memberCount} thành viên</span>
                        </div>
                        <span className="text-blue-500 hover:text-blue-600 text-sm font-semibold">
                          Xem chi tiết →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {clubs.length === 0 && (
              <div className={`${cardClass} rounded-xl shadow-md p-12 text-center`}>
                <i className={`fas fa-building text-6xl ${textSecondaryClass} mb-4`}></i>
                <h3 className={`text-xl font-bold ${textClass} mb-2`}>Chưa có câu lạc bộ nào</h3>
                <p className={textSecondaryClass}>Tạo câu lạc bộ đầu tiên để bắt đầu</p>
              </div>
            )}

            {/* Pagination */}
            {clubs.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button className={`px-4 py-2 rounded-lg ${hoverClass} ${textClass}`}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">1</button>
                <button className={`px-4 py-2 rounded-lg ${hoverClass} ${textClass}`}>2</button>
                <button className={`px-4 py-2 rounded-lg ${hoverClass} ${textClass}`}>3</button>
                <button className={`px-4 py-2 rounded-lg ${hoverClass} ${textClass}`}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
