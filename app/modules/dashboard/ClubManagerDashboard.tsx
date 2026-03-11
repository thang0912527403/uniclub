import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';
import { useGetApplicationsByClubQuery } from '~/cores/api/applicationApi';
import { useGetRecruitmentCampaignsByClubIdQuery } from '~/cores/api/recruitmentCampaignApi';
import { useGetInterviewsQuery } from '~/cores/api/interviewApi';
import { useGetClubByIdQuery } from '~/cores/api/clubApi';

// ─── Animated Counter ──────────────────────────────────────────────────────
function AnimCounter({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.ceil(to / 55));
    const t = setInterval(() => { n = Math.min(n + step, to); setV(n); if (n >= to) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{v.toLocaleString()}</>;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, gradient, sub, delay, loading }:
  { title: string; value: number; icon: string; gradient: string; sub: string; delay: number; loading?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 group transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{title}</p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900 dark:text-white"><AnimCounter to={value} /></h3>
          )}
          <p className="text-xs text-gray-400 mt-2">{sub}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <i className={`fas ${icon} text-white text-xl`} />
        </div>
      </div>
      <div className={`h-1 ${gradient}`} />
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    Pending:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-400',   label: 'Chờ duyệt' },
    Interview: { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-400',         dot: 'bg-sky-500',     label: 'Phỏng vấn' },
    Accepted:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Chấp nhận' },
    Rejected:  { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400',         dot: 'bg-red-500',     label: 'Từ chối' },
  };
  const c = m[status] ?? m.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Interview Countdown ────────────────────────────────────────────────────
function Countdown({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const upd = () => {
      const ms = new Date(dateStr).getTime() - Date.now();
      if (ms <= 0) { setLabel('Đã qua'); return; }
      const h = Math.floor(ms / 3600000), m2 = Math.floor((ms % 3600000) / 60000);
      setLabel(h > 48 ? `${Math.floor(h / 24)} ngày nữa` : h > 0 ? `${h}h ${m2}m nữa` : `${m2}m nữa`);
    };
    upd(); const t = setInterval(upd, 60000); return () => clearInterval(t);
  }, [dateStr]);
  return <span className="font-bold text-sky-600 dark:text-sky-400">{label}</span>;
}

// ─── Quick Action ──────────────────────────────────────────────────────────
function QA({ icon, label, to, g }: { icon: string; label: string; to: string; g: string }) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${g} hover:scale-105 active:scale-95 transition-all shadow group`}>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
        <i className={`fas ${icon} text-white text-lg`} />
      </div>
      <span className="text-[11px] font-bold text-white text-center leading-tight">{label}</span>
    </Link>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function ClubManagerDashboard() {
  const { isOpen, toggle } = useSidebarToggle();
  const { user } = useCurrentUser();
  const { clubManagerMembership } = useClubRole();
  const clubId = clubManagerMembership?.clubId;

  // ── Fetch data scoped to this club only ────────────────────────────────
  const { data: club } = useGetClubByIdQuery(clubId ?? 0, { skip: !clubId });

  const { data: allApplications = [], isLoading: appsLoading } =
    useGetApplicationsByClubQuery({ clubId: clubId ?? 0 }, { skip: !clubId });

  const { data: myCampaigns = [], isLoading: campaignsLoading } =
    useGetRecruitmentCampaignsByClubIdQuery(clubId ?? 0, { skip: !clubId });

  const { data: allInterviews = [], isLoading: interviewsLoading } =
    useGetInterviewsQuery();

  // ── Filter to this club only ───────────────────────────────────────────
  const myCampaignIds = useMemo(() => new Set(myCampaigns.map(c => c.campaignId)), [myCampaigns]);

  // Filter interviews via campaignId belonging to this club
  const myInterviews = useMemo(
    () => allInterviews.filter(iv => myCampaignIds.has(iv.campaignId)),
    [allInterviews, myCampaignIds]
  );

  // Upcoming interviews (future, sorted asc)
  const upcomingInterviews = useMemo(
    () => myInterviews
      .filter(iv => new Date(iv.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3),
    [myInterviews]
  );

  // Latest applications (newest first by submissionDate)
  const latestApplications = useMemo(
    () => [...allApplications]
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 5),
    [allApplications]
  );

  // Pending app count
  const pendingCount = allApplications.filter(a => a.status === 'Pending').length;
  // Active campaigns
  const activeCampaigns = myCampaigns.filter(c => c.status === 'Active' || c.status === 'Open');

  const dataLoading = appsLoading || campaignsLoading || interviewsLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <SettingButton />
      <Sidebar currentPath="/dashboard" isOpen={isOpen} />
      <HeaderBar
        title={club?.clubName ? club.clubName : 'Quản lý Câu lạc bộ'}
        breadcrumb="Trang chủ / Dashboard"
        isSidebarOpen={isOpen}
        onToggleSidebar={toggle}
      />

      <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isOpen ? 'ml-64' : 'ml-0'}`}>

        {/* Hero */}
        <div className="relative rounded-3xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 mb-8 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 75% 50%, white 0%, transparent 55%)' }} />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sky-100 text-sm font-medium">Xin chào, Club Manager</span>
                {club && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {club.clubName}
                  </span>
                )}
              </div>
              <h1 className="text-white text-2xl font-black">{user?.fullName ?? 'Club Manager'}</h1>
              <p className="text-sky-100 text-sm mt-1">
                {pendingCount > 0 ? (
                  <><strong className="text-white">{pendingCount} đơn</strong> đang chờ xét duyệt · </>
                ) : 'Không có đơn chờ · '}
                <strong className="text-white">{upcomingInterviews.length} phỏng vấn</strong> sắp tới
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link to="/applications" className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl backdrop-blur-sm transition-all">
                <i className="fas fa-file-alt mr-1.5" />Duyệt đơn
              </Link>
              <Link to="/interview/schedule" className="bg-white text-sky-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-sky-50 transition-all shadow">
                <i className="fas fa-calendar-check mr-1.5" />Lịch phỏng vấn
              </Link>
            </div>
          </div>
        </div>

        {/* Stats — scoped to this club */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Tổng đơn nộp"  value={allApplications.length} icon="fa-file-alt"      gradient="bg-gradient-to-br from-sky-500 to-blue-700"    sub="CLB này"         delay={0}   loading={appsLoading} />
          <StatCard title="Chờ xét duyệt" value={pendingCount}           icon="fa-hourglass-half" gradient="bg-gradient-to-br from-amber-500 to-orange-600" sub="Cần xử lý"        delay={80}  loading={appsLoading} />
          <StatCard title="Chiến dịch"    value={activeCampaigns.length} icon="fa-solid fa-flag"  gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" sub="Đang mở"         delay={160} loading={campaignsLoading} />
          <StatCard title="Phỏng vấn"     value={upcomingInterviews.length} icon="fa-microphone"  gradient="bg-gradient-to-br from-emerald-500 to-teal-700" sub="Sắp diễn ra"     delay={240} loading={interviewsLoading} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Latest Applications */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Đơn ứng tuyển mới nhất</h3>
              <Link to="/applications" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium">
                Xem tất cả <i className="fas fa-arrow-right ml-1" />
              </Link>
            </div>
            {appsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : latestApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <i className="fas fa-inbox text-4xl mb-3 opacity-30" />
                <p className="text-sm">Chưa có đơn nào cho CLB này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestApplications.map(app => (
                  <div key={app.applicationId}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow">
                      <i className="fas fa-user text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        Đơn #{app.applicationId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Form #{app.formId} · {new Date(app.submissionDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <Badge status={app.status} />
                    <i className="fas fa-chevron-right text-gray-300 group-hover:text-sky-500 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-5">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              <QA icon="fa-file-alt"       label="Duyệt đơn"   to="/applications"          g="bg-gradient-to-br from-amber-500 to-orange-600" />
              <QA icon="fa-calendar-check" label="Phỏng vấn"   to="/interview/schedule"    g="bg-gradient-to-br from-sky-500 to-blue-700" />
              <QA icon="fa-solid fa-flag"  label="Chiến dịch"  to="/recruitment-campaigns" g="bg-gradient-to-br from-indigo-500 to-indigo-700" />
              <QA icon="fa-newspaper"      label="Bài đăng"    to="/club/manage-posts"     g="bg-gradient-to-br from-emerald-500 to-teal-700" />
              <QA icon="fa-calendar"       label="Sự kiện"     to="/events"                g="bg-gradient-to-br from-pink-500 to-rose-700" />
              <QA icon="fa-users"          label="Thành viên"  to="/members"               g="bg-gradient-to-br from-violet-500 to-purple-700" />
            </div>
          </div>
        </div>

        {/* Upcoming Interviews + Campaign Progress */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Upcoming Interviews (filtered to this club's campaigns) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-5">
              <i className="fas fa-calendar-check text-sky-500 mr-2" />Phỏng vấn sắp tới
            </h3>
            {interviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <i className="fas fa-calendar-xmark text-4xl mb-3 opacity-30" />
                <p className="text-sm">Không có phỏng vấn sắp tới</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map(iv => (
                  <div key={iv.id} className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-100 dark:border-sky-900/40">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow">
                      <i className="fas fa-microphone text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{iv.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        Ứng viên: {iv.candidateUserId.slice(0, 8)}…
                        {iv.description ? ` · ${iv.description}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(iv.scheduledAt).toLocaleString('vi-VN', {
                          weekday: 'short', day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {' · '}<Countdown dateStr={iv.scheduledAt} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns of this club */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Chiến dịch của CLB</h3>
              <Link to="/recruitment-campaigns" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium">
                Chi tiết
              </Link>
            </div>
            {campaignsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}
              </div>
            ) : myCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <i className="fas fa-flag text-4xl mb-3 opacity-30" />
                <p className="text-sm">Chưa có chiến dịch nào</p>
                <Link to="/recruitment-campaigns" className="mt-3 text-xs text-sky-600 font-medium hover:underline">
                  + Tạo chiến dịch mới
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myCampaigns.slice(0, 4).map(c => {
                  const isActive = c.status === 'Active' || c.status === 'Open';
                  const total = allApplications.filter(a => a.formId && myCampaignIds.has(c.campaignId)).length;
                  return (
                    <div key={c.campaignId} className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl p-2 -mx-2 transition-colors cursor-pointer">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.campaignName}</p>
                        <p className="text-xs text-gray-400">
                          {total} đơn ·{' '}
                          <span className={isActive ? 'text-emerald-500 font-medium' : 'text-gray-400'}>
                            {isActive ? 'Đang mở' : c.status}
                          </span>
                          {' · '}HSD: {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
