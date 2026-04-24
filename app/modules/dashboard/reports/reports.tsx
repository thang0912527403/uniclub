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
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubReportSummaryQuery } from '~/cores/api';

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

function StatCard({
  label,
  value,
  sub,
  icon,
  gradient,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
          <i className={`fas ${icon} ${iconColor}`} />
        </div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ title, sub, badge }: { title: string; sub?: string; badge?: string }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {badge && (
        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function DashboardReportsModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const clubId = Number(Cookies.get('clubId')) || 0;
  const hasClubId = clubId > 0;

  const { data: summaryResponse, isLoading, isFetching, error } = useGetClubReportSummaryQuery(
    { clubId, year, month },
    { skip: !hasClubId },
  );

  const d = summaryResponse?.success ? summaryResponse.data.clubReport : null;
  const isPageLoading = isLoading || isFetching;

  const yearOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i), [now]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Member status pie
  const memberStatusData = useMemo(() => {
    if (!d) return [];
    return [
      { name: 'Active', value: d.memberReport.activeMembers },
      { name: 'Inactive', value: d.memberReport.inactiveMembers },
    ].filter(x => x.value > 0);
  }, [d]);

  // New members monthly trend
  const newMembersData = useMemo(() => {
    if (!d) return [];
    return d.memberReport.newMembersByMonth.map(item => ({
      month: `T${item.month}`,
      'New Members': item.newMembers,
    }));
  }, [d]);

  // Department distribution
  const departmentData = useMemo(() => {
    if (!d) return [];
    return [...d.memberReport.membersByDepartment]
      .sort((a, b) => b.memberCount - a.memberCount)
      .map(item => ({ name: item.departmentName, Members: item.memberCount }));
  }, [d]);

  // Recruitment applicants by round
  const recruitmentByRound = useMemo(() => {
    if (!d?.recruitmentInterviewReport?.applicantsByRound?.length) return [];
    return d.recruitmentInterviewReport.applicantsByRound.map(r => ({
      name: r.round,
      Applicants: r.count,
    }));
  }, [d]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/dashboard/reports" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Reports"
        breadcrumb="Pages / Dashboard / Reports"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Header + filter */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Club Reports</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed breakdown for the selected period</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Month</span>
              <select
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
              >
                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
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
        </div>

        {!hasClubId && <Error title="Missing clubId in cookies." error={{ status: 400 }} />}
        {isPageLoading && <Loading message="Loading reports..." />}
        {!isPageLoading && error && <Error title="Failed to load report data." error={error} />}

        {!isPageLoading && !error && d && (
          <>
            {/* ── Members ────────────────────────────────────────────── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Members</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Members" value={d.totalMembers}
                sub={`${d.totalDepartments} departments`}
                icon="fa-users" gradient="from-blue-500 to-blue-600"
                iconBg="bg-blue-50 dark:bg-blue-900/30" iconColor="text-blue-500"
              />
              <StatCard
                label="Active Members" value={d.memberReport.activeMembers}
                sub={`${d.totalMembers > 0 ? ((d.memberReport.activeMembers / d.totalMembers) * 100).toFixed(0) : 0}% active rate`}
                icon="fa-user-check" gradient="from-emerald-500 to-teal-500"
                iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconColor="text-emerald-500"
              />
              <StatCard
                label="Inactive Members" value={d.memberReport.inactiveMembers}
                sub="Members without activity"
                icon="fa-user-slash" gradient="from-rose-400 to-rose-600"
                iconBg="bg-rose-50 dark:bg-rose-900/30" iconColor="text-rose-500"
              />
              <StatCard
                label="Total Roles" value={d.totalRoles}
                sub="Defined club roles"
                icon="fa-id-badge" gradient="from-violet-500 to-purple-600"
                iconBg="bg-violet-50 dark:bg-violet-900/30" iconColor="text-violet-500"
              />
            </div>

            {/* ── Events ─────────────────────────────────────────────── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Events</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Events This Month" value={d.totalEventsInMonth}
                sub="Scheduled in period"
                icon="fa-calendar-alt" gradient="from-amber-400 to-orange-500"
                iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-500"
              />
              <StatCard
                label="Total Organized" value={d.eventReport.totalOrganizedEvents}
                sub="All-time organized"
                icon="fa-calendar-check" gradient="from-sky-500 to-cyan-500"
                iconBg="bg-sky-50 dark:bg-sky-900/30" iconColor="text-sky-500"
              />
              <StatCard
                label="Not Checked In" value={d.eventReport.totalRegisteredButNotCheckedIn}
                sub="Registered but absent"
                icon="fa-user-times" gradient="from-orange-400 to-red-500"
                iconBg="bg-orange-50 dark:bg-orange-900/30" iconColor="text-orange-500"
              />
              <StatCard
                label="Attendance Rate"
                value={`${Number(d.eventReport.overallAttendanceRatePercent).toFixed(1)}%`}
                sub="Overall check-in rate"
                icon="fa-chart-line" gradient="from-teal-500 to-emerald-600"
                iconBg="bg-teal-50 dark:bg-teal-900/30" iconColor="text-teal-500"
              />
            </div>

            {/* ── Finance ────────────────────────────────────────────── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Finance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Approved Income" value={formatCurrency(d.totalApprovedIncomeInMonth)}
                sub="This month"
                icon="fa-arrow-trend-up" gradient="from-green-500 to-emerald-600"
                iconBg="bg-green-50 dark:bg-green-900/30" iconColor="text-green-500"
              />
              <StatCard
                label="Approved Expense" value={formatCurrency(d.totalApprovedExpenseInMonth)}
                sub="This month"
                icon="fa-arrow-trend-down" gradient="from-red-400 to-rose-600"
                iconBg="bg-red-50 dark:bg-red-900/30" iconColor="text-red-500"
              />
              <StatCard
                label="Net Balance"
                value={formatCurrency(d.totalApprovedIncomeInMonth - d.totalApprovedExpenseInMonth)}
                sub="Income − Expense"
                icon="fa-scale-balanced" gradient="from-indigo-500 to-blue-600"
                iconBg="bg-indigo-50 dark:bg-indigo-900/30" iconColor="text-indigo-500"
              />
              <StatCard
                label="Pending Refunds" value={d.pendingFundRefundRequestsInMonth}
                sub={`${d.totalFundRefundRequestsInMonth} total requests`}
                icon="fa-clock-rotate-left" gradient="from-amber-500 to-yellow-500"
                iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-500"
              />
            </div>

            {/* ── Charts ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* New members trend */}
              <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <SectionTitle title="New Members Trend" sub={`Monthly new member registrations – ${year}`} />
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={newMembersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="New Members"
                        stroke="#22C55E"
                        strokeWidth={2.5}
                        fill="url(#areaGreen)"
                        dot={{ r: 3.5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 5.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Member status donut */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                <SectionTitle title="Member Status" sub="Active vs Inactive breakdown" />
                {memberStatusData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No member data</div>
                ) : (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={memberStatusData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={4}
                            strokeWidth={0}
                          >
                            {memberStatusData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-auto space-y-2">
                      {memberStatusData.map((item, i) => {
                        const total = memberStatusData.reduce((s, x) => s + x.value, 0);
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
                              <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
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

            {/* Department Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <SectionTitle
                title="Department Distribution"
                sub="Member count per department"
                badge={`${departmentData.length} dept.`}
              />
              <div style={{ height: Math.max(180, departmentData.length * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={130} />
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

            {/* Recruitment + Announcements */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recruitment summary */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <SectionTitle title="Recruitment Summary" sub="Interview & application statistics" />
                {d.recruitmentInterviewReport ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Total Applicants', value: d.recruitmentInterviewReport.totalApplicants, color: 'text-blue-500' },
                        { label: 'Passed', value: d.recruitmentInterviewReport.passCount, color: 'text-emerald-500' },
                        { label: 'Failed', value: d.recruitmentInterviewReport.failCount, color: 'text-rose-500' },
                        { label: 'Pass Rate', value: `${Number(d.recruitmentInterviewReport.passRatePercent).toFixed(1)}%`, color: 'text-amber-500' },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <div className={`text-xl font-extrabold ${item.color}`}>{item.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    {recruitmentByRound.length > 0 ? (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={recruitmentByRound} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Applicants" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-20 text-gray-400 text-xs">No applicants by round</div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No recruitment data</div>
                )}
              </div>

              {/* Announcements */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <SectionTitle title="Announcements" sub="Notification and communication stats" />
                {d.announcementReport ? (
                  <>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                        <div className="text-3xl font-extrabold">{d.announcementReport.totalAnnouncements}</div>
                        <div className="text-white/70 text-xs mt-1">Total Sent</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {d.announcementReport.recipientGroups.map((group, i) => {
                        const total = d.announcementReport.recipientGroups.reduce((s, g) => s + g.count, 0);
                        const pct = total > 0 ? (group.count / total) * 100 : 0;
                        return (
                          <div key={group.groupName}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="text-gray-600 dark:text-gray-400">{group.groupName}</span>
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white">{group.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: CHART_COLORS[i % CHART_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No announcement data</div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
