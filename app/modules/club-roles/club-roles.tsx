import { useState } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubStructureRolesQuery } from '~/cores/api/clubRoleApi';
import { getClubId } from '~/utils/auth';
import { PolicyPanel } from './components/PolicyPanel';
import type { ClubRole } from '~/cores/api';

const LEVEL_CONFIG: Record<number, { gradient: string; badge: string; icon: string; label: string }> = {
    0: { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-500', icon: 'fa-user', label: 'Chưa phân cấp' },
    1: { gradient: 'from-amber-500 to-yellow-500', badge: 'bg-amber-500', icon: 'fa-crown', label: 'Cấp 1' },
    2: { gradient: 'from-sky-500 to-blue-500', badge: 'bg-sky-500', icon: 'fa-user-tie', label: 'Cấp 2' },
    3: { gradient: 'from-emerald-500 to-green-500', badge: 'bg-emerald-500', icon: 'fa-users', label: 'Cấp 3' },
};

function getLevelConfig(level: number) {
    return LEVEL_CONFIG[level] || { gradient: 'from-purple-500 to-indigo-500', badge: 'bg-purple-500', icon: 'fa-layer-group', label: `Cấp ${level}` };
}

function PolicyProgressBar({ count, max }: { count: number; max: number }) {
    const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${
                    pct === 0 ? 'bg-gray-300 dark:bg-gray-600' :
                    pct < 30 ? 'bg-red-400' :
                    pct < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(pct, 2)}%` }}
            />
        </div>
    );
}

function RoleCard({
    role,
    maxPolicies,
    onView,
    onEdit,
}: {
    role: ClubRole;
    maxPolicies: number;
    onView: () => void;
    onEdit: () => void;
}) {
    const config = getLevelConfig(role.level);
    const policyCount = role.policies.length;

    return (
        <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300">
            {/* Color strip */}
            <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

            <div className="p-5">
                {/* Top: Avatar + Name + Level */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <i className={`fas ${config.icon} text-lg`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{role.roleName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${config.badge}`}>
                                <i className={`fas ${config.icon} text-[8px]`}></i>
                                {config.label}
                            </span>
                            {role.memberCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    <i className="fas fa-users text-[8px]"></i>
                                    {role.memberCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {role.description && role.description !== 'string' ? role.description : 'Chưa có mô tả'}
                </p>

                {/* Policy stats */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            <i className="fas fa-key mr-1.5 text-[10px]"></i>
                            Quyền được gán
                        </span>
                        <span className={`text-xs font-bold ${
                            policyCount === 0 ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                            {policyCount}
                        </span>
                    </div>
                    <PolicyProgressBar count={policyCount} max={maxPolicies} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button onClick={onView}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                        <i className="fas fa-eye text-xs text-purple-500"></i>
                        Xem quyền
                    </button>
                    <button onClick={onEdit}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-semibold shadow-sm">
                        <i className="fas fa-key text-xs"></i>
                        Phân quyền
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ClubRolesModule() {
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const clubId = getClubId();
    const { data: roles, isLoading, error } = useGetClubStructureRolesQuery(clubId, {
        skip: !clubId,
    });

    const [policyTarget, setPolicyTarget] = useState<{ role: ClubRole; readOnly: boolean } | null>(null);
    const [search, setSearch] = useState('');

    const allRoles = roles ?? [];
    const filteredRoles = allRoles.filter((r) =>
        r.roleName.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const maxPolicies = Math.max(...allRoles.map(r => r.policies.length), 1);
    const totalPolicies = allRoles.reduce((s, r) => s + r.policies.length, 0);
    const rolesWithPolicies = allRoles.filter(r => r.policies.length > 0).length;
    const rolesWithoutPolicies = allRoles.length - rolesWithPolicies;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/club-roles" isOpen={isSidebarOpen} />
            <HeaderBar
                title="Phân quyền Vai Trò"
                breadcrumb="Pages / Club Roles"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 px-6 pb-8 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                {/* Stats Cards */}
                {!isLoading && !error && allRoles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                <i className="fas fa-id-badge text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Tổng vai trò</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{allRoles.length}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
                                <i className="fas fa-key text-amber-600 dark:text-amber-400"></i>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Tổng quyền</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalPolicies}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                                <i className="fas fa-check-circle text-emerald-600 dark:text-emerald-400"></i>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Đã phân quyền</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{rolesWithPolicies}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Chưa phân quyền</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{rolesWithoutPolicies}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search + Filter bar */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc mô tả..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        )}
                    </div>
                    {!isLoading && filteredRoles.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {filteredRoles.length === allRoles.length
                                ? `${allRoles.length} vai trò`
                                : `${filteredRoles.length} / ${allRoles.length} vai trò`}
                        </p>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <Loading />
                ) : error ? (
                    <Error title="Lỗi khi tải danh sách vai trò." error={error} />
                ) : filteredRoles.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center">
                        <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                            <i className={`fas ${search ? 'fa-search' : 'fa-shield-alt'} text-3xl text-gray-300 dark:text-gray-500`}></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {search ? 'Không tìm thấy vai trò' : 'Chưa có vai trò nào'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {search
                                ? `Không có vai trò nào phù hợp với "${search}"`
                                : 'Hãy tạo vai trò trong trang Cấu trúc câu lạc bộ trước'}
                        </p>
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredRoles.map((role) => (
                            <RoleCard
                                key={role.clubRoleId}
                                role={role}
                                maxPolicies={maxPolicies}
                                onView={() => setPolicyTarget({ role, readOnly: true })}
                                onEdit={() => setPolicyTarget({ role, readOnly: false })}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Policy Panel */}
            {policyTarget && (
                <PolicyPanel
                    role={policyTarget.role}
                    readOnly={policyTarget.readOnly}
                    onClose={() => setPolicyTarget(null)}
                />
            )}
        </div>
    );
}
