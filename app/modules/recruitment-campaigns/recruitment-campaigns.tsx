import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';

export default function RecruitmentCampaignsModule() {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const { data: campaigns, isLoading, error } = useGetRecruitmentCampaignsQuery();

  return (
    <div className="min-h-screen">
      {/* Settings Button - Fixed bottom right */}
      <SettingButton />

      <Sidebar 
        currentPath="/recruitment-campaigns"
        isOpen={isSidebarOpen}
      />

      <HeaderBar 
        title="Quản lý Chiến dịch Tuyển dụng"
        breadcrumb="Pages / Recruitment Campaigns"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Loading State */}
        {isLoading && (
          <Loading />
        )}

        {/* Error State */}
        {error && (
          <Error title="Lỗi khi tải danh sách chiến dịch tuyển dụng." error={error} />
        )}

        {/* Stats Overview */}
        {!isLoading && campaigns && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-bullhorn text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Campaigns</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active Campaigns</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaigns.filter(c => c.status === 'active').length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Upcoming</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaigns.filter(c => c.status === 'upcoming').length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-archive text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Completed</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaigns.filter(c => c.status === 'completed').length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                  <i className="fas fa-plus mr-2"></i>
                  Tạo chiến dịch mới
                </button>
                <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                  <i className="fas fa-filter mr-2"></i>
                  Lọc
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none">
                  <option>Tất cả trạng thái</option>
                  <option>Đang hoạt động</option>
                  <option>Sắp diễn ra</option>
                  <option>Đã hoàn thành</option>
                </select>
              </div>
            </div>

            {/* Campaigns Grid */}
            {campaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.campaignId} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/recruitment-campaigns/${campaign.campaignId}`)}
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                      {campaign.imageUrl ? (
                        <img 
                          src={campaign.imageUrl} 
                          alt={campaign.campaignName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <i className="fas fa-bullhorn text-5xl mb-2 opacity-50"></i>
                            <p className="text-sm font-semibold opacity-75">{campaign.campaignName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{campaign.campaignName}</h3>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            campaign.status === 'active' 
                              ? 'bg-green-500 text-white' 
                              : campaign.status === 'upcoming'
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {campaign.status === 'active' ? 'Đang hoạt động' : 
                             campaign.status === 'upcoming' ? 'Sắp diễn ra' : 
                             'Đã hoàn thành'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar text-sm text-gray-500 dark:text-gray-400"></i>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                          </span>
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
            {campaigns.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
                <i className="fas fa-bullhorn text-6xl text-gray-500 dark:text-gray-400 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có chiến dịch tuyển dụng nào</h3>
                <p className="text-gray-500 dark:text-gray-400">Tạo chiến dịch tuyển dụng đầu tiên để bắt đầu</p>
              </div>
            )}

            {/* Pagination */}
            {campaigns.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button className="px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">1</button>
                <button className="px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">2</button>
                <button className="px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">3</button>
                <button className="px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
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
