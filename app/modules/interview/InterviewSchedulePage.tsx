import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import KanbanBoard from './components/KanbanBoard';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';
import Cookies from 'js-cookie';

const InterviewSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { data: campaigns = [], isLoading: campaignsLoading } = useGetRecruitmentCampaignsQuery();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Get current user from cookie
  const userCookie = Cookies.get('user');
  let currentUserId = '';
  try {
    if (userCookie) {
      const user = JSON.parse(userCookie);
      currentUserId = user.userId || '';
    }
  } catch { /* ignore */ }

  const activeCampaignId = selectedCampaignId || campaigns[0]?.campaignId;

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/interview/schedule" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Lịch phỏng vấn"
        breadcrumb="Interview / Schedule"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-clipboard-list text-orange-500"></i> Kanban phỏng vấn
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Kéo thả ứng viên để phân lịch phỏng vấn
              </p>
            </div>

            {/* Campaign selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Chiến dịch:
              </label>
              {campaignsLoading ? (
                <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={activeCampaignId || ''}
                  onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all min-w-[200px]"
                >
                  {campaigns.map((c) => (
                    <option key={c.campaignId} value={c.campaignId}>
                      {c.campaignName || `Campaign #${c.campaignId}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hướng dẫn:</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-yellow-500" />
              Kéo ứng viên đã duyệt → Đã lên lịch
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-blue-500" />
              Click vào card để xem chi tiết
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-green-500" />
              Kéo để cập nhật trạng thái
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {activeCampaignId ? (
          <KanbanBoard
            campaignId={activeCampaignId}
            currentUserId={currentUserId}
            onNavigateToRoom={(roomCode) => navigate(`/interview/room/${roomCode}`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">Chưa có chiến dịch tuyển dụng</p>
            <p className="text-sm mt-1">Vui lòng tạo chiến dịch tuyển dụng trước.</p>
          </div>
        )}
      </main>

      {/* Custom scrollbar + animation styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default InterviewSchedulePage;
