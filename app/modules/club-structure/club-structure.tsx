import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';

interface Member {
  id: number;
  name: string;
  avatar?: string;
  role: string;
}

interface Department {
  id: number;
  name: string;
  icon: string;
  color: string;
  head?: Member;
  members: Member[];
}

interface OrgLevel {
  level: number;
  title: string;
  members: Member[];
}

// Mock data - sẽ được thay bằng API sau
const mockLevels: OrgLevel[] = [
  {
    level: 1,
    title: 'Club Manager',
    members: [
      { id: 1, name: 'Nguyễn Văn A', role: 'Chủ nhiệm CLB', avatar: '' },
    ],
  },
  {
    level: 2,
    title: 'Vice Manager',
    members: [
      { id: 2, name: 'Trần Thị B', role: 'Phó Chủ nhiệm Nội vụ', avatar: '' },
      { id: 3, name: 'Lê Văn C', role: 'Phó Chủ nhiệm Ngoại vụ', avatar: '' },
    ],
  },
];

const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Ban Truyền thông',
    icon: 'fa-bullhorn',
    color: 'from-blue-500 to-cyan-500',
    head: { id: 4, name: 'Phạm Thị D', role: 'Trưởng ban' },
    members: [
      { id: 10, name: 'Nguyễn Thị K', role: 'Thành viên' },
      { id: 11, name: 'Lê Văn L', role: 'Thành viên' },
      { id: 12, name: 'Trần Văn M', role: 'Thành viên' },
    ],
  },
  {
    id: 2,
    name: 'Ban Sự kiện',
    icon: 'fa-calendar-alt',
    color: 'from-purple-500 to-pink-500',
    head: { id: 5, name: 'Hoàng Văn E', role: 'Trưởng ban' },
    members: [
      { id: 13, name: 'Đỗ Thị N', role: 'Thành viên' },
      { id: 14, name: 'Vũ Văn O', role: 'Thành viên' },
    ],
  },
  {
    id: 3,
    name: 'Ban Hậu cần',
    icon: 'fa-boxes',
    color: 'from-green-500 to-emerald-500',
    head: { id: 6, name: 'Đặng Thị F', role: 'Trưởng ban' },
    members: [
      { id: 15, name: 'Bùi Văn P', role: 'Thành viên' },
      { id: 16, name: 'Ngô Thị Q', role: 'Thành viên' },
      { id: 17, name: 'Dương Văn R', role: 'Thành viên' },
      { id: 18, name: 'Lý Thị S', role: 'Thành viên' },
    ],
  },
  {
    id: 4,
    name: 'Ban Tài chính',
    icon: 'fa-coins',
    color: 'from-yellow-500 to-orange-500',
    head: { id: 7, name: 'Vương Văn G', role: 'Trưởng ban' },
    members: [
      { id: 19, name: 'Mai Thị T', role: 'Thành viên' },
      { id: 20, name: 'Cao Văn U', role: 'Thành viên' },
    ],
  },
  {
    id: 5,
    name: 'Ban Nhân sự',
    icon: 'fa-user-tie',
    color: 'from-red-500 to-rose-500',
    head: { id: 8, name: 'Trịnh Thị H', role: 'Trưởng ban' },
    members: [
      { id: 21, name: 'Phan Văn V', role: 'Thành viên' },
      { id: 22, name: 'Đinh Thị W', role: 'Thành viên' },
      { id: 23, name: 'Hồ Văn X', role: 'Thành viên' },
    ],
  },
  {
    id: 6,
    name: 'Ban Đối ngoại',
    icon: 'fa-handshake',
    color: 'from-indigo-500 to-blue-500',
    head: { id: 9, name: 'Ngô Văn I', role: 'Trưởng ban' },
    members: [
      { id: 24, name: 'Tạ Thị Y', role: 'Thành viên' },
      { id: 25, name: 'Lương Văn Z', role: 'Thành viên' },
    ],
  },
];

function AvatarCircle({ name, size = 'md', gradient }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; gradient?: string }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${gradient || 'from-blue-500 to-purple-500'} shadow-lg ring-4 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
}

function ConnectorLine({ type }: { type: 'vertical' | 'horizontal-spread' }) {
  if (type === 'vertical') {
    return (
      <div className="flex justify-center">
        <div className="w-0.5 h-10 bg-gray-300 dark:bg-gray-600"></div>
      </div>
    );
  }
  return null;
}

function PersonCard({ member, level, gradient }: { member: Member; level: number; gradient?: string }) {
  const levelBadges: Record<number, { bg: string; label: string }> = {
    1: { bg: 'bg-amber-500', label: 'Level 1' },
    2: { bg: 'bg-sky-500', label: 'Level 2' },
    3: { bg: 'bg-emerald-500', label: 'Level 3' },
  };

  const badge = levelBadges[level] || { bg: 'bg-gray-500', label: `Level ${level}` };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 text-center hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 duration-200">
      <div className="flex justify-center mb-3">
        <AvatarCircle name={member.name||'N/A'} size={level === 1 ? 'xl' : 'lg'} gradient={gradient} />
      </div>
      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{member.name||'N/A'}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{member.role}</p>
      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${badge.bg}`}>
        {badge.label}
      </span>
    </div>
  );
}

const PAGE_SIZE = 3;

function DepartmentCard({ dept, expanded, onToggle }: { dept: Department; expanded: boolean; onToggle: () => void }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset khi đóng lại
  const handleToggle = () => {
    if (expanded) {
      setVisibleCount(PAGE_SIZE);
    }
    onToggle();
  };

  const visibleMembers = dept.members.slice(0, visibleCount);
  const remaining = dept.members.length - visibleCount;
  const hasMore = remaining > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dept.color} flex items-center justify-center shadow`}>
            <i className={`fas ${dept.icon} text-white`}></i>
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{dept.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dept.members.length + (dept.head ? 1 : 0)} thành viên
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-emerald-500">
            Level 3
          </span>
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-gray-400 text-xs transition-transform`}></i>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* Department Head */}
          {dept.head && (
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <AvatarCircle name={dept.head.name} size="sm" gradient={dept.color} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{dept.head.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{dept.head.role}</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  <i className="fas fa-crown mr-1 text-[8px]"></i>
                  Trưởng ban
                </span>
              </div>
            </div>
          )}

          {/* Members List - Lazy loaded 3 at a time */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleMembers.map((member) => (
              <div key={member.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <AvatarCircle name={member.name} size="sm" gradient="from-gray-400 to-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More / Show Less */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3">
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
              >
                <i className="fas fa-chevron-down mr-1 text-xs"></i>
                Xem thêm ({remaining} người)
              </button>
            )}
            {visibleCount > PAGE_SIZE && (
              <button
                onClick={() => setVisibleCount(PAGE_SIZE)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium cursor-pointer"
              >
                <i className="fas fa-chevron-up mr-1 text-xs"></i>
                Thu gọn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubStructureModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());

  const toggleDept = (deptId: number) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDepts(new Set(mockDepartments.map(d => d.id)));
  };

  const collapseAll = () => {
    setExpandedDepts(new Set());
  };

  const totalMembers = mockLevels.reduce((sum, l) => sum + l.members.length, 0)
    + mockDepartments.reduce((sum, d) => sum + d.members.length + (d.head ? 1 : 0), 0);

  return (
    <div className="min-h-screen">
      <SettingButton />

      <Sidebar
        currentPath={`/clubs/${id}/structure`}
        isOpen={isSidebarOpen}
      />

      <HeaderBar
        title="Cấu trúc Câu lạc bộ"
        breadcrumb={`Pages / Clubs / ${id} / Structure`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Back & Actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/clubs/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-expand-alt mr-2"></i>Mở tất cả
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-compress-alt mr-2"></i>Thu gọn
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-crown text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ban chủ nhiệm</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockLevels.reduce((s, l) => s + l.members.length, 0)}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-sitemap text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Phòng ban</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockDepartments.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng thành viên</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-layer-group text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cấp bậc</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">3</h3>
            </div>
          </div>
        </div>

        {/* ======== ORG CHART ======== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            <i className="fas fa-sitemap mr-2 text-blue-500"></i>
            Sơ đồ tổ chức
          </h2>

          {/* === LEVEL 1: Club Manager === */}
          <div className="flex justify-center mb-2">
            <div className="w-56">
              <PersonCard
                member={mockLevels[0].members[0]}
                level={1}
                gradient="from-amber-500 to-yellow-500"
              />
            </div>
          </div>

          {/* Connector: Level 1 → Level 2 */}
          <ConnectorLine type="vertical" />

          {/* Horizontal connector bar */}
          <div className="flex justify-center px-16">
            <div className={`h-0.5 bg-gray-300 dark:bg-gray-600`} style={{ width: `${Math.max((mockLevels[1].members.length - 1) * 280, 0)}px` }}></div>
          </div>

          {/* Vertical drops to each Vice Manager */}
          <div className="flex justify-center gap-8 px-4">
            {mockLevels[1].members.map((_, i) => (
              <div key={i} className="w-56 flex justify-center">
                <div className="w-0.5 h-5 bg-gray-300 dark:bg-gray-600"></div>
              </div>
            ))}
          </div>

          {/* === LEVEL 2: Vice Managers === */}
          <div className="flex justify-center gap-8 mb-2 px-4">
            {mockLevels[1].members.map((member) => (
              <div key={member.id} className="w-56">
                <PersonCard
                  member={member}
                  level={2}
                  gradient="from-sky-500 to-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Connector: Level 2 → Level 3 (Departments) */}
          <ConnectorLine type="vertical" />

          {/* === LEVEL 3: Departments === */}
          <div className="mt-2">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
              <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-semibold">
                Level 3 — Phòng ban
              </span>
              <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDepartments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  expanded={expandedDepts.has(dept.id)}
                  onToggle={() => toggleDept(dept.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
            Chú thích cấp bậc
          </h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Level 1</strong> — Chủ nhiệm CLB (Club Manager)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Level 2</strong> — Phó Chủ nhiệm (Vice Manager)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Level 3</strong> — Trưởng ban / Thành viên (Departments)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
