import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { SettingButton } from '~/components/SettingButton';
import { useCurrentUser } from '~/hooks/useCurrentUser';

// ─── Animated Number ───────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{value.toLocaleString()}{suffix}</>;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  change: string;
  positive: boolean;
  gradient: string;
  icon: string;
  delay: number;
}
function StatCard({ title, value, suffix, change, positive, gradient, icon, delay }: StatCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group
      ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              <AnimatedNumber target={value} suffix={suffix} />
            </h3>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? 'text-emerald-500' : 'text-red-400'}`}>
              <i className={`fas fa-arrow-${positive ? 'up' : 'down'} text-[10px]`} />
              <span>{change}</span>
            </div>
          </div>
          <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <i className={`fas ${icon} text-white text-xl`} />
          </div>
        </div>
      </div>
      <div className={`h-1 ${gradient}`} />
    </div>
  );
}

// ─── Mini Bar Chart ─────────────────────────────────────────────────────────
const monthlyData = [
  { month: 'T8', apps: 42 }, { month: 'T9', apps: 65 }, { month: 'T10', apps: 51 },
  { month: 'T11', apps: 88 }, { month: 'T12', apps: 72 }, { month: 'T1', apps: 95 },
  { month: 'T2', apps: 110 }, { month: 'T3', apps: 134 },
];
const maxApps = Math.max(...monthlyData.map(d => d.apps));

function BarChart() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div className="flex items-end gap-2 h-36 pt-2">
      {monthlyData.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 hover:from-violet-500 hover:to-pink-400 transition-all duration-300 cursor-pointer relative group"
              style={{
                height: animated ? `${(d.apps / maxApps) * 100}%` : '0%',
                transition: `height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms`,
              }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-violet-700 dark:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.apps}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────
function DonutChart() {
  const segments = [
    { label: 'Passed', value: 45, color: '#10b981' },
    { label: 'Pending', value: 30, color: '#f59e0b' },
    { label: 'Failed', value: 25, color: '#f43f5e' },
  ];
  const total = segments.reduce((a, b) => a + b.value, 0);
  let cumulative = 0;
  const circumference = 2 * Math.PI * 40;
  return (
    <div className="flex items-center justify-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        {segments.map((seg, i) => {
          const dashArray = (seg.value / total) * circumference;
          const dashOffset = circumference - cumulative * (circumference / total);
          cumulative += seg.value;
          return (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={-(circumference - dashOffset)}
              className="transition-all duration-700"
            />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="white" className="dark:fill-gray-800" />
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{seg.label}</span>
            <span className="text-xs font-bold text-gray-800 dark:text-white ml-auto">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────
function QuickAction({ icon, label, to, gradient }: { icon: string; label: string; to: string; gradient: string }) {
  return (
    <Link to={to}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${gradient} hover:scale-105 active:scale-95 transition-all duration-200 shadow-md group`}>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
        <i className={`fas ${icon} text-white text-lg`} />
      </div>
      <span className="text-xs font-semibold text-white text-center leading-tight">{label}</span>
    </Link>
  );
}

// ─── Activity Item ─────────────────────────────────────────────────────────
const activities = [
  { icon: 'fa-user-plus', color: 'bg-emerald-500', title: 'Thành viên mới đăng ký', subtitle: '3 phút trước' },
  { icon: 'fa-file-alt', color: 'bg-violet-500', title: 'Đơn ứng tuyển CLB Robotics', subtitle: '12 phút trước' },
  { icon: 'fa-calendar-check', color: 'bg-sky-500', title: 'Phỏng vấn vừa được lên lịch', subtitle: '35 phút trước' },
  { icon: 'fa-bullhorn', color: 'bg-amber-500', title: 'Chiến dịch mới được tạo', subtitle: '1 giờ trước' },
  { icon: 'fa-check-circle', color: 'bg-pink-500', title: 'Ứng viên đã được chấp nhận', subtitle: '2 giờ trước' },
];

export default function AdminDashboard() {
  
  const { user } = useCurrentUser();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const stats: StatCardProps[] = [
    { title: 'Tổng Câu lạc bộ', value: 24, change: '+2 tháng này', positive: true, gradient: 'bg-gradient-to-br from-violet-500 to-purple-700', icon: 'fa-layer-group', delay: 0, suffix: '' },
    { title: 'Thành Viên', value: 1284, change: '+18% so với tháng trước', positive: true, gradient: 'bg-gradient-to-br from-sky-500 to-blue-700', icon: 'fa-users', delay: 100, suffix: '' },
    { title: 'Đơn ứng tuyển', value: 347, change: '+34% chiến dịch mới', positive: true, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-700', icon: 'fa-file-alt', delay: 200, suffix: '' },
    { title: 'Cuộc Phỏng Vấn', value: 89, change: '12 hôm nay', positive: true, gradient: 'bg-gradient-to-br from-pink-500 to-rose-700', icon: 'fa-microphone', delay: 300, suffix: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <SettingButton />
      
      
      <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>

        {/* Welcome Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-6 mb-8 overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
              <h1 className="text-white text-2xl font-extrabold">{user?.fullName ?? 'Admin'}</h1>
              <p className="text-violet-200 text-sm mt-1">Hôm nay có <strong>12 đơn mới</strong> chờ xét duyệt</p>
            </div>
            <div className="hidden md:flex gap-3">
              <Link to="/recruitment-campaigns"
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl backdrop-blur-sm transition-all">
                <i className="fas fa-plus mr-2" />Chiến dịch mới
              </Link>
              <Link to="/interview-schedule"
                className="bg-white text-violet-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-all shadow">
                <i className="fas fa-calendar mr-2" />Lịch phỏng vấn
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Charts + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Đơn ứng tuyển theo tháng</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tổng lượt đăng ký 8 tháng gần đây</p>
              </div>
              <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold px-3 py-1 rounded-full">
                +23% ↑
              </span>
            </div>
            <BarChart />
          </div>

          {/* Donut Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Kết quả phỏng vấn</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tháng hiện tại</p>
            </div>
            <DonutChart />
            <p className="text-center text-xs text-gray-400 mt-4">Dựa trên 89 cuộc phỏng vấn</p>
          </div>
        </div>

        {/* Quick Actions + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction icon="fa-layer-group" label="Quản lý CLB" to="/clubs" gradient="bg-gradient-to-br from-violet-500 to-purple-700" />
              <QuickAction icon="fa-bullhorn" label="Chiến dịch" to="/recruitment-campaigns" gradient="bg-gradient-to-br from-sky-500 to-blue-700" />
              <QuickAction icon="fa-microphone" label="Phỏng vấn" to="/interview-schedule" gradient="bg-gradient-to-br from-emerald-500 to-teal-700" />
              <QuickAction icon="fa-users" label="Người dùng" to="/users" gradient="bg-gradient-to-br from-pink-500 to-rose-700" />
              <QuickAction icon="fa-file-alt" label="Đơn nộp" to="/applications" gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
              <QuickAction icon="fa-calendar-alt" label="Sự kiện" to="/events" gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Hoạt động gần đây</h3>
              <button className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">Xem tất cả</button>
            </div>
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className={`w-9 h-9 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow`}>
                    <i className={`fas ${a.icon} text-white text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.subtitle}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
