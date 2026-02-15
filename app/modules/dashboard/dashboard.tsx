import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import {
  useGetDashboardStatsQuery,
  useGetRevenueDataQuery,
  useGetActivitiesQuery,
  useGetProductsQuery,
} from '~/cores/api';

export default function DashboardModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueDataQuery();
  const { data: activities, isLoading: activitiesLoading } = useGetActivitiesQuery();
  const { data: products, isLoading: productsLoading } = useGetProductsQuery();

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
    <div className="min-h-screen">
      <SettingButton />

      <Sidebar 
        currentPath="/dashboard"
        isOpen={isSidebarOpen}
      />

      <HeaderBar 
        title="Dashboard"
        breadcrumb="Pages / Dashboard"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{card.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
                  <p className="text-xs text-green-500 mt-2">
                    {card.change} <span className="text-gray-500 dark:text-gray-400">{card.changeText}</span>
                  </p>
                </div>
                <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <i className={`fas ${card.icon} text-white text-xl`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Website Views</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Campaign Performance</p>
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
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <i className="far fa-clock"></i>
              <span>campaign sent 2 days ago</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daily Sales</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">(+15%) increase in today sales</p>
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
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <i className="far fa-clock"></i>
              <span>updated 4 min ago</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Completed Tasks</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Campaign Performance</p>
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
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <i className="far fa-clock"></i>
              <span>just updated</span>
            </div>
          </div>
        </div>

        {/* Projects & Orders Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projects</h3>
              <button className="text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-check text-green-500"></i>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">30 done</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">this month</span>
            </div>

            <div className="space-y-4">
              {productsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                products?.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{project.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{project.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Orders overview</h3>
              <button className="text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg">
                <i className="fas fa-cog"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-arrow-up text-green-500"></i>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">24%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">this month</span>
            </div>

            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"></div>
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
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{activity.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</div>
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
