import { useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubReportAnalyticsQuery, useGetClubReportSummaryQuery } from '~/cores/api';

const CHART_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EAB308', '#06B6D4', '#EF4444'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-xl text-sm">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-blue-500 dark:text-blue-400">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardAnalyticsModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const clubId = Number(Cookies.get('clubId')) || 0;
  const hasClubId = clubId > 0;

  const {
    data: analyticsResponse,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
    error: analyticsError,
  } = useGetClubReportAnalyticsQuery({ clubId, year }, { skip: !hasClubId });

  const { data: summaryResponse } = useGetClubReportSummaryQuery(
    { clubId, year, month: now.getMonth() + 1 },
    { skip: !hasClubId },
  );

  const analyticsData = analyticsResponse?.success ? analyticsResponse.data : null;
  const summaryData = summaryResponse?.success ? summaryResponse.data.clubReport : null;

  const isLoading = isAnalyticsLoading || isAnalyticsFetching;

  const yearOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i), [now]);

  const memberGrowthData = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.membershipGrowth.growthByMonth.map(item => ({
      month: `T${item.month}`,
      'New Members': item.newMembers,
    }));
  }, [analyticsData]);

  const departmentData = useMemo(() => {
    if (!summaryData) return [];
    return [...summaryData.memberReport.membersByDepartment]
      .sort((a, b) => b.memberCount - a.memberCount)
      .map(item => ({ name: item.departmentName, value: item.memberCount }));
  }, [summaryData]);

  const retentionRate = analyticsData?.retention.activeRetentionRatePercent ?? 0;
  const bestMonth = analyticsData?.membershipGrowth.bestGrowthMonth;
  const bestCount = analyticsData?.membershipGrowth.bestGrowthCount ?? 0;

  const kpiCards = analyticsData
    ? [
        {
          label: 'Best Growth Month',
          value: bestMonth ? `Month ${bestMonth}` : 'N/A',
          sub: bestMonth ? `${bestCount} new members` : 'No growth recorded',
          icon: 'fa-trophy',
          gradient: 'from-amber-400 to-yellow-500',
          iconBg: 'bg-amber-50 dark:bg-amber-900/30',
          iconColor: 'text-amber-500',
        },
        {
          label: 'Peak New Members',
          value: bestCount,
          sub: bestMonth ? `In month ${bestMonth}` : '—',
          icon: 'fa-users-line',
          gradient: 'from-blue-500 to-indigo-600',
          iconBg: 'bg-blue-50 dark:bg-blue-900/30',
          iconColor: 'text-blue-500',
        },
        {
          label: 'Active Retention',
          value: `${Number(retentionRate).toFixed(1)}%`,
          sub: `${analyticsData.retention.activeMembers} of ${analyticsData.retention.totalMembers} active`,
          icon: 'fa-heart-pulse',
          gradient: 'from-emerald-500 to-teal-500',
          iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-500',
        },
        {
          label: 'Inactive After 3M',
          value: analyticsData.retention.inactiveAfter3Months,
          sub: 'Members with no activity',
          icon: 'fa-user-clock',
          gradient: 'from-rose-400 to-rose-600',
          iconBg: 'bg-rose-50 dark:bg-rose-900/30',
          iconColor: 'text-rose-500',
        },
      ]
    : [];

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/dashboard/analytics" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Analytics"
        breadcrumb="Pages / Dashboard / Analytics"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Header + filter */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Growth trends and retention insights</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm px-4 py-2.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Year</span>
            <select
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {!hasClubId && <Error title="Missing clubId in cookies." error={{ status: 400 }} />}
        {isLoading && <Loading message="Loading analytics..." />}
        {!isLoading && analyticsError && <Error title="Failed to load analytics." error={analyticsError} />}

        {!isLoading && hasClubId && !analyticsError && analyticsData && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {kpiCards.map(card => (
                <div key={card.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                  <div className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
                      <i className={`fas ${card.icon} ${card.iconColor}`} />
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{card.value as string | number}</div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{card.label}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Retention visual */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Retention Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Active vs. at-risk members</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
                  {Number(retentionRate).toFixed(1)}% retained
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Retention bar */}
                <div className="md:col-span-2 space-y-4">
                  {[
                    {
                      label: 'Active Members',
                      value: analyticsData.retention.activeMembers,
                      total: analyticsData.retention.totalMembers,
                      color: '#22C55E',
                      bg: 'bg-emerald-500',
                    },
                    {
                      label: 'Inactive After 3 Months',
                      value: analyticsData.retention.inactiveAfter3Months,
                      total: analyticsData.retention.totalMembers,
                      color: '#EF4444',
                      bg: 'bg-rose-500',
                    },
                  ].map(item => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
                            <span className="text-gray-400">/ {item.total}</span>
                            <span className="font-semibold" style={{ color: item.color }}>{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Retention donut */}
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: analyticsData.retention.activeMembers },
                          { name: 'Inactive 3M', value: analyticsData.retention.inactiveAfter3Months },
                        ].filter(x => x.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        <Cell fill="#22C55E" />
                        <Cell fill="#EF4444" />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Member Growth area */}
              <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Membership Growth</h3>
                    <p className="text-xs text-gray-400 mt-0.5">New registrations by month – {analyticsData.membershipGrowth.year}</p>
                  </div>
                  {bestMonth && (
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full whitespace-nowrap">
                      Peak T{bestMonth} · {bestCount}
                    </span>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memberGrowthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="New Members"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#analyticsBlue)"
                        dot={{ r: 3.5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 5.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department distribution donut */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Department Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Members per department</p>
                </div>
                {departmentData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No department data</div>
                ) : (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {departmentData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-auto space-y-1.5 overflow-y-auto max-h-40">
                      {departmentData.map((item, i) => {
                        const total = departmentData.reduce((s, d) => s + d.value, 0);
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
                              <span className="text-gray-400">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Monthly bar chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mt-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Monthly Breakdown</h3>
                  <p className="text-xs text-gray-400 mt-0.5">New members per month</p>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberGrowthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="New Members" radius={[5, 5, 0, 0]} maxBarSize={36}>
                      {memberGrowthData.map((item, i) => (
                        <Cell
                          key={i}
                          fill={item['New Members'] === bestCount && bestCount > 0 ? '#F59E0B' : '#3B82F6'}
                          fillOpacity={item['New Members'] === bestCount && bestCount > 0 ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {bestMonth && (
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 text-center">
                  <i className="fas fa-star mr-1" />
                  Highlighted bar = best growth month (T{bestMonth})
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
