import { useMemo, useState } from "react";
import Cookies from "js-cookie";
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
} from "recharts";
import { Loading } from "~/components/Loading";
import { Error } from "~/components/Error";
import {
  useGetClubReportSummaryQuery,
  useGetClubReportAnalyticsQuery,
} from "~/cores/api";

const CHART_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#EAB308",
  "#06B6D4",
  "#EF4444",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-xl text-sm">
      {label && (
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-blue-500 dark:text-blue-400">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ClubManagerDashboard() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const clubId = Number(Cookies.get("clubId")) || 0;
  const hasClubId = clubId > 0;

  const {
    data: apiData,
    isLoading,
    isFetching,
    error,
  } = useGetClubReportSummaryQuery(
    { clubId, year, month },
    { skip: !hasClubId },
  );
  const {
    data: analyticsApiData,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
    error: analyticsError,
  } = useGetClubReportAnalyticsQuery({ clubId, year }, { skip: !hasClubId });

  const data = apiData?.success === true ? apiData.data.clubReport : null;
  const analyticsData =
    analyticsApiData?.success === true ? analyticsApiData.data : null;
  const showLoading =
    isLoading || isFetching || isAnalyticsLoading || isAnalyticsFetching;

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i),
    [now],
  );
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    [],
  );

  const statCards = useMemo(() => {
    if (!data) return [];
    const activeRate =
      data.totalMembers > 0
        ? ((data.activeMembers / data.totalMembers) * 100).toFixed(0)
        : "0";

    return [
      {
        key: "totalMembers",
        label: "Total Members",
        value: data.totalMembers,
        sub: `${data.totalDepartments} departments`,
        icon: "fa-users",
        gradient: "from-blue-500 to-blue-600",
        iconBg: "bg-blue-50 dark:bg-blue-900/30",
        iconColor: "text-blue-500",
      },
      {
        key: "activeMembers",
        label: "Active Members",
        value: data.activeMembers,
        sub: `${activeRate}% active rate`,
        icon: "fa-user-check",
        gradient: "from-emerald-500 to-teal-500",
        iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
        iconColor: "text-emerald-500",
      },
      {
        key: "upcomingEvents",
        label: "Events This Month",
        value: data.totalEventsInMonth,
        sub: "Scheduled events",
        icon: "fa-calendar-alt",
        gradient: "from-amber-400 to-orange-500",
        iconBg: "bg-amber-50 dark:bg-amber-900/30",
        iconColor: "text-amber-500",
      },
      {
        key: "totalEvents",
        label: "Total Events",
        value: data.eventReport.totalOrganizedEvents,
        sub: `${data.eventReport.totalRegisteredButNotCheckedIn} not checked-in`,
        icon: "fa-calendar-check",
        gradient: "from-purple-500 to-violet-600",
        iconBg: "bg-purple-50 dark:bg-purple-900/30",
        iconColor: "text-purple-500",
      },
      {
        key: "attendanceRate",
        label: "Attendance Rate",
        value: `${Number(data.eventReport.overallAttendanceRatePercent).toFixed(1)}%`,
        sub: "Overall check-in rate",
        icon: "fa-chart-line",
        gradient: "from-rose-500 to-pink-600",
        iconBg: "bg-rose-50 dark:bg-rose-900/30",
        iconColor: "text-rose-500",
      },
    ];
  }, [data]);

  const memberGrowthData = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.membershipGrowth.growthByMonth.map((item) => ({
      month: `T${item.month}`,
      "New Members": item.newMembers,
    }));
  }, [analyticsData]);

  const eventParticipationData = useMemo(() => {
    if (!data) return [];
    const notIn = Math.max(0, data.eventReport.totalRegisteredButNotCheckedIn);
    const checkedIn = Math.max(0, data.activeMembers - notIn);
    return [
      { name: "Checked In", value: checkedIn },
      { name: "Not Checked In", value: notIn },
    ].filter((d) => d.value > 0);
  }, [data]);

  const departmentData = useMemo(() => {
    if (!data) return [];
    return [...data.memberReport.membersByDepartment]
      .sort((a, b) => b.memberCount - a.memberCount)
      .map((item) => ({
        name: item.departmentName,
        Members: item.memberCount,
      }));
  }, [data]);

  if (!hasClubId) {
    return <Error title="Missing clubId in cookies." error={{ status: 400 }} />;
  }
  if (showLoading) return <Loading message="Loading dashboard..." />;
  if (error || analyticsError) {
    return (
      <Error
        title="Failed to load dashboard data."
        error={error ?? analyticsError}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page header + filter */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activity Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Club performance metrics for the selected period
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Month
            </span>
            <select
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Year
            </span>
            <select
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="absolute -right-8 -top-8 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 bottom-0 w-72 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-bar text-sm" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {month}/{year} Summary
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Real-time club statistics
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Members", value: data.totalMembers },
              { label: "Departments", value: data.totalDepartments },
              { label: "Roles", value: data.totalRoles },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center min-w-[76px]"
              >
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
            <div className="p-5">
              <div
                className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}
              >
                <i className={`fas ${card.icon} ${card.iconColor}`} />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {card.value as string | number}
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                {card.label}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Member Growth – area chart */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Member Growth
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                New members per month –{" "}
                {analyticsData?.membershipGrowth.year ?? year}
              </p>
            </div>
            {analyticsData?.membershipGrowth.bestGrowthMonth && (
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full whitespace-nowrap">
                Peak T{analyticsData.membershipGrowth.bestGrowthMonth} ·{" "}
                {analyticsData.membershipGrowth.bestGrowthCount} new
              </span>
            )}
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={memberGrowthData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="New Members"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#areaBlue)"
                  dot={{
                    r: 3.5,
                    fill: "#3B82F6",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 5.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Participation – donut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Event Participation
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Check-in status this month
            </p>
          </div>
          {eventParticipationData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <i className="fas fa-calendar-times text-4xl opacity-30" />
              <span className="text-sm">No event data</span>
            </div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventParticipationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {eventParticipationData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-auto space-y-2">
                {eventParticipationData.map((item, i) => {
                  const total = eventParticipationData.reduce(
                    (s, d) => s + d.value,
                    0,
                  );
                  const pct =
                    total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: CHART_COLORS[i] }}
                        />
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
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

      {/* Department Distribution – horizontal bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Department Distribution
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Members per department
            </p>
          </div>
          <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full">
            {departmentData.length} dept.
          </span>
        </div>
        <div style={{ height: Math.max(180, departmentData.length * 42) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentData}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
                strokeOpacity={0.5}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Members" radius={[0, 5, 5, 0]} maxBarSize={22}>
                {departmentData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
