import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubStructureRolesQuery } from '~/cores/api/clubRoleApi';
import { getClubId } from '~/utils/auth';
import type { ClubRole, ClubRolePolicy } from '~/cores/api/types/clubRole';

const LEVEL_CONFIG: Record<number, { gradient: string; badge: string; label: string; icon: string }> = {
  0: { gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-500', label: 'Chưa phân cấp', icon: 'fa-user' },
  1: { gradient: 'from-amber-500 to-yellow-500', badge: 'bg-amber-500', label: 'Cấp 1', icon: 'fa-crown' },
  2: { gradient: 'from-sky-500 to-blue-500', badge: 'bg-sky-500', label: 'Cấp 2', icon: 'fa-user-tie' },
  3: { gradient: 'from-emerald-500 to-green-500', badge: 'bg-emerald-500', label: 'Cấp 3', icon: 'fa-users' },
};

function getLevelConfig(level: number) {
  return LEVEL_CONFIG[level] || { gradient: 'from-purple-500 to-indigo-500', badge: 'bg-purple-500', label: `Cấp ${level}`, icon: 'fa-layer-group' };
}

function AvatarCircle({ name, size = 'md', gradient }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; gradient?: string }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-20 h-20 text-xl' };
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase() || '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${gradient || 'from-blue-500 to-purple-500'} shadow-lg ring-4 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
}

function RoleCard({ role }: { role: ClubRole }) {
  const config = getLevelConfig(role.level);
  const [showPolicies, setShowPolicies] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 text-center hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 duration-200">
      <div className="flex justify-center mb-3">
        <AvatarCircle name={role.roleName} size="lg" gradient={config.gradient} />
      </div>
      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{role.roleName}</h4>
      {role.description && role.description !== 'string' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{role.description}</p>
      )}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${config.badge}`}>
          <i className={`fas ${config.icon} mr-1`}></i>
          {config.label}
        </span>
        {role.memberCount > 0 && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i className="fas fa-users mr-1"></i>
            {role.memberCount}
          </span>
        )}
      </div>

      {role.policies.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowPolicies(!showPolicies)}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
          >
            <i className={`fas fa-${showPolicies ? 'chevron-up' : 'shield-alt'} mr-1`}></i>
            {showPolicies ? 'Ẩn quyền' : `${role.policies.length} quyền`}
          </button>
          {showPolicies && (
            <div className="mt-2 text-left space-y-1">
              {role.policies.map((p: ClubRolePolicy) => (
                <div key={p.id} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <i className="fas fa-check-circle text-green-500 mt-0.5 text-[10px]"></i>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LevelSection({ level, roles, config }: { level: number; roles: ClubRole[]; config: ReturnType<typeof getLevelConfig> }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
        <span className={`px-4 py-1.5 text-white rounded-full text-xs font-semibold ${config.badge} flex items-center gap-1.5`}>
          <i className={`fas ${config.icon}`}></i>
          {config.label} — {roles.length} vai trò
        </span>
        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
      </div>

      <div className={`flex justify-center gap-6 flex-wrap ${roles.length === 1 ? '' : 'px-4'}`}>
        {roles.map((role) => (
          <div key={role.clubRoleId} className="w-56">
            <RoleCard role={role} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div className="flex justify-center">
      <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
    </div>
  );
}

function ListView({ roles, sortedLevels }: { roles: ClubRole[]; sortedLevels: [number, ClubRole[]][] }) {
  const [expandedPolicies, setExpandedPolicies] = useState<Set<number>>(new Set());

  const togglePolicies = (roleId: number) => {
    setExpandedPolicies(prev => {
      const next = new Set(prev);
      next.has(roleId) ? next.delete(roleId) : next.add(roleId);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vai trò</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cấp bậc</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thành viên</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quyền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {roles.map((role, idx) => {
            const config = getLevelConfig(role.level);
            const isExpanded = expandedPolicies.has(role.clubRoleId);
            return (
              <tr key={role.clubRoleId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${config.icon} text-white text-sm`}></i>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{role.roleName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {role.description && role.description !== 'string' ? role.description : <span className="italic opacity-50">—</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${config.badge}`}>
                    <i className={`fas ${config.icon} text-[10px]`}></i>
                    {config.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {role.memberCount}
                </td>
                <td className="px-6 py-4">
                  {role.policies.length > 0 ? (
                    <div>
                      <button
                        onClick={() => togglePolicies(role.clubRoleId)}
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                      >
                        <i className={`fas fa-${isExpanded ? 'chevron-up' : 'shield-alt'} mr-1`}></i>
                        {isExpanded ? 'Ẩn' : `${role.policies.length} quyền`}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1">
                          {role.policies.map((p) => (
                            <div key={p.id} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <i className="fas fa-check-circle text-green-500 mt-0.5 text-[10px]"></i>
                              <span>{p.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Không có</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ClubStructureModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const clubId = Number(id) || getClubId();
  const { data: roles = [], isLoading, error } = useGetClubStructureRolesQuery(clubId, { skip: !clubId });

  const levelMap = new Map<number, ClubRole[]>();
  roles.forEach((role) => {
    const existing = levelMap.get(role.level) || [];
    existing.push(role);
    levelMap.set(role.level, existing);
  });
  const sortedLevels = [...levelMap.entries()].sort(([a], [b]) => a - b);

  const uniqueLevels = sortedLevels.length;
  const totalPolicies = roles.reduce((sum, r) => sum + r.policies.length, 0);

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath={`/clubs/${id}/structure`} isOpen={isSidebarOpen} />
      <HeaderBar
        title="Cấu trúc Câu lạc bộ"
        breadcrumb={`Pages / Clubs / ${id} / Structure`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Back + View Toggle */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/clubs/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-sitemap"></i>
              Sơ đồ
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-list"></i>
              Danh sách
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-id-badge text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng vai trò</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-layer-group text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cấp bậc</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueLevels}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng thành viên</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {roles.reduce((s, r) => s + r.memberCount, 0)}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng quyền</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalPolicies}</h3>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center">
            <i className="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">Đang tải cấu trúc...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Không thể tải cấu trúc</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vui lòng thử lại sau</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && roles.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center">
            <i className="fas fa-sitemap text-3xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Chưa có vai trò nào</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hãy tạo vai trò cho câu lạc bộ</p>
          </div>
        )}

        {/* Content: Chart or List */}
        {!isLoading && !error && roles.length > 0 && viewMode === 'chart' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                <i className="fas fa-sitemap mr-2 text-blue-500"></i>
                Sơ đồ tổ chức
              </h2>

              {sortedLevels.map(([level, levelRoles], index) => {
                const config = getLevelConfig(level);
                return (
                  <div key={level}>
                    {index > 0 && <ConnectorLine />}
                    <LevelSection level={level} roles={levelRoles} config={config} />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                Chú thích cấp bậc
              </h3>
              <div className="flex flex-wrap gap-6">
                {sortedLevels.map(([level]) => {
                  const config = getLevelConfig(level);
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${config.badge}`}></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{config.label}</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && roles.length > 0 && viewMode === 'list' && (
          <>
            <ListView roles={roles} sortedLevels={sortedLevels} />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Hiển thị {roles.length} vai trò
            </p>
          </>
        )}
      </main>
    </div>
  );
}
