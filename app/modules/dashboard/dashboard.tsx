import { useState } from 'react';
import { ApiStatusButton } from '~/components/ApiStatusButton';
import { Sidebar } from '~/components/Sidebar';
import {
  useGetDashboardStatsQuery,
  useGetRevenueDataQuery,
  useGetActivitiesQuery,
  useGetProductsQuery,
} from '~/cores/api';

export default function DashboardModule() {
  const [isDark, setIsDark] = useState(false); // Theme cho content
  const [isSidebarDark, setIsSidebarDark] = useState(true); // Theme cho sidebar

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueDataQuery();
  const { data: activities, isLoading: activitiesLoading } = useGetActivitiesQuery();
  const { data: products, isLoading: productsLoading } = useGetProductsQuery();

  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
  const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = isDark 
    ? 'bg-[#1a1d2e] border-gray-700 text-white' 
    : 'bg-white border-gray-200 text-gray-900';
  const iconClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  const apiStatuses = [
    { name: 'Dashboard Stats', isLoading: statsLoading },
    { name: 'Revenue Data', isLoading: revenueLoading },
    { name: 'Activities', isLoading: activitiesLoading },
    { name: 'Products', isLoading: productsLoading },
  ];

  const statsCards = [
    { title: 'Bookings', value: '281', change: '+55%', changeText: 'than last week', icon: 'fa-bookmark', color: 'bg-gray-800' },
    { title: "Today's Users", value: '2,300', change: '+3%', changeText: 'than last month', icon: 'fa-chart-bar', color: 'bg-blue-500' },
    { title: 'Revenue', value: '34k', change: '+1%', changeText: 'than yesterday', icon: 'fa-shopping-cart', color: 'bg-green-500' },
    { title: 'Followers', value: '+91', change: 'Just updated', changeText: '', icon: 'fa-users', color: 'bg-pink-500' },
  ];

  const websiteViewsData = [
    { label: 'M', value: 50 },
    { label: 'T', value: 20 },
    { label: 'W', value: 30 },
    { label: 'T', value: 40 },
    { label: 'F', value: 20 },
    { label: 'S', value: 50 },
    { label: 'S', value: 30 },
  ];

  return (
    <div className="flex min-h-screen">
      <ApiStatusButton
        apiStatuses={apiStatuses}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        position="bottom-right"
      />

      <Sidebar 
        isDark={isSidebarDark} 
        currentPath="/dashboard"
        onToggleSidebarTheme={() => setIsSidebarDark(!isSidebarDark)}
      />

      <main className={`flex-1 p-6 ${bgClass} transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`text-sm ${textSecondaryClass}`}>Pages / Dashboard</p>
            <h1 className={`text-xl font-bold ${textClass}`}>Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search here"
              className={`pl-4 pr-4 py-2 rounded-lg border outline-none w-64 text-sm ${inputClass}`}
            />
            <button className={`p-2 rounded-lg ${hoverClass}`}>
              <i className={`fas fa-user ${iconClass}`}></i>
            </button>
            <button className={`p-2 rounded-lg ${hoverClass}`}>
              <i className={`fas fa-cog ${iconClass}`}></i>
            </button>
            <button className={`p-2 rounded-lg ${hoverClass}`}>
              <i className={`fas fa-bell ${iconClass}`}></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((card, index) => (
            <div key={index} className={`${cardClass} rounded-xl shadow-md p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${textSecondaryClass} uppercase mb-1`}>{card.title}</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{card.value}</h3>
                  <p className="text-xs text-green-500 mt-2">
                    {card.change} <span className={textSecondaryClass}>{card.changeText}</span>
                  </p>
                </div>
                <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <i className={`fas ${card.icon} text-white text-xl`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className={`${cardClass} rounded-xl shadow-md p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-bold ${textClass} mb-1`}>Website Views</h3>
              <p className={`text-xs ${textSecondaryClass}`}>Last Campaign Performance</p>
            </div>
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 flex items-end justify-between gap-2">
              {websiteViewsData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-white/30 rounded-t hover:bg-white/50 transition-all"
                    style={{ height: `${item.value}%` }}
                  ></div>
                  <span className="text-xs text-white/80">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <i className="far fa-clock"></i>
              <span>campaign sent 2 days ago</span>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl shadow-md p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-bold ${textClass} mb-1`}>Daily Sales</h3>
              <p className={`text-xs ${textSecondaryClass}`}>(+15%) increase in today sales</p>
            </div>
            <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                <path
                  d="M0,100 L40,90 L80,110 L120,70 L160,100 L200,80 L240,90 L280,60 L300,80"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  opacity="0.8"
                />
                <path
                  d="M0,100 L40,90 L80,110 L120,70 L160,100 L200,80 L240,90 L280,60 L300,80 L300,150 L0,150 Z"
                  fill="white"
                  opacity="0.1"
                />
              </svg>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <i className="far fa-clock"></i>
              <span>updated 4 min ago</span>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl shadow-md p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-bold ${textClass} mb-1`}>Completed Tasks</h3>
              <p className={`text-xs ${textSecondaryClass}`}>Last Campaign Performance</p>
            </div>
            <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                <path
                  d="M0,80 L40,90 L80,60 L120,100 L160,70 L200,90 L240,85 L280,70 L300,90"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  opacity="0.8"
                />
                <path
                  d="M0,80 L40,90 L80,60 L120,100 L160,70 L200,90 L240,85 L280,70 L300,90 L300,150 L0,150 Z"
                  fill="white"
                  opacity="0.1"
                />
              </svg>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <i className="far fa-clock"></i>
              <span>just updated</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${cardClass} rounded-xl shadow-md p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${textClass}`}>Projects</h3>
              <button className={`text-gray-400 ${hoverClass} p-2 rounded-lg`}>
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-check text-green-500"></i>
              <span className={`text-sm font-semibold ${textClass}`}>30 done</span>
              <span className={`text-xs ${textSecondaryClass}`}>this month</span>
            </div>

            <div className="space-y-4">
              {productsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse rounded`}></div>
                  ))}
                </div>
              ) : (
                products?.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${textClass}`}>{project.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`flex-1 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs ${textSecondaryClass}`}>{project.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${cardClass} rounded-xl shadow-md p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${textClass}`}>Orders overview</h3>
              <button className={`text-gray-400 ${hoverClass} p-2 rounded-lg`}>
                <i className="fas fa-cog"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-arrow-up text-green-500"></i>
              <span className={`text-sm font-semibold ${textClass}`}>24%</span>
              <span className={`text-xs ${textSecondaryClass}`}>this month</span>
            </div>

            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse rounded`}></div>
                  ))}
                </div>
              ) : (
                activities?.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'payment' ? 'bg-green-500' :
                      activity.type === 'sale' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${textClass}`}>{activity.title}</div>
                      <div className={`text-xs ${textSecondaryClass} mt-1`}>{activity.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
