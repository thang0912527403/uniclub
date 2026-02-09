import { useState } from 'react';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';

export default function RecruitmentCampaigns() {
  const [isDark, setIsDark] = useState(false);
  const { data: campaigns, isLoading, error } = useGetRecruitmentCampaignsQuery();

  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';

  // Helper function để kiểm tra URL hợp lệ
  const isValidUrl = (url: string) => {
    if (!url || url === 'string' || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} p-8`}>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('API Error:', error);
    return (
      <div className={`min-h-screen ${bgClass} p-8`}>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-red-800 font-semibold">Error loading campaigns</h3>
          <p className="text-red-600 text-sm mt-2">
            {error && 'status' in error ? `Error ${error.status}` : 'Error PARSING_ERROR'}
          </p>
          {error && 'error' in error && (
            <p className="text-red-500 text-xs mt-2">
              {JSON.stringify(error.error)}
            </p>
          )}
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-red-700 font-medium">Debug Info</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300 p-8`}>

      <h1 className={`text-3xl font-bold mb-6 ${textClass}`}>Recruitment Campaigns</h1>

      {campaigns && campaigns.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No campaigns available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.map((campaign) => (
            <div key={campaign.campaignId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image với fallback */}
              {isValidUrl(campaign.imageUrl) ? (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.campaignName}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <i className="fas fa-image text-white text-4xl opacity-50"></i>
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{campaign.campaignName}</h2>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {campaign.description && campaign.description !== 'string'
                    ? campaign.description
                    : 'No description available'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <i className="fas fa-calendar mr-2"></i>
                    <span>
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {campaign.status && campaign.status !== 'string' ? campaign.status : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Link chỉ hiển thị nếu hợp lệ */}
                {isValidUrl(campaign.linkCampaign) && (
                  <a
                    href={campaign.linkCampaign}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    View Campaign
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
