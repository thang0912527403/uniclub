import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubRoleUsersQuery } from '~/cores/api';
import { getClubId as getStoredClubId } from '~/utils/auth';
import type { ClubRoleUserItem } from '~/cores/api/types/clubRole';

function getInitials(name: string) {
    return (
        name
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .slice(-2)
            .join('')
            .toUpperCase() || '?'
    );
}

function UserAvatar({ user }: { user: ClubRoleUserItem }) {
    if (user.avatar) {
        return <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />;
    }

    const gradientPool = ['from-blue-500 to-indigo-500', 'from-emerald-500 to-green-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-orange-500'];
    const gradient = gradientPool[user.clubMemberId % gradientPool.length];

    return (
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center`}>
            {getInitials(user.fullName)}
        </div>
    );
}

function RoleBadge({ roleName }: { roleName: string }) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            <i className="fas fa-shield-alt text-[10px] mr-1.5" />
            {roleName}
        </span>
    );
}

export default function ClubRoleUsersMembersModule() {
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const [searchParams] = useSearchParams();
    const { id, clubId: clubIdParam, roleId: roleIdParam } = useParams();

    const resolvedClubId =
        Number(clubIdParam) ||
        Number(id) ||
        Number(searchParams.get('clubId')) ||
        getStoredClubId() ||
        0;
    const resolvedRoleId = Number(roleIdParam) || Number(searchParams.get('roleId')) || 0;

    const { data: users = [], isLoading, error } = useGetClubRoleUsersQuery(
        { clubId: resolvedClubId, roleId: resolvedRoleId },
        { skip: !resolvedClubId || !resolvedRoleId },
    );

    const [search, setSearch] = useState('');

    const roleName = useMemo(() => {
        const firstWithRole = users.find((user) => user.roles.some((role) => role.clubRoleId === resolvedRoleId));
        return firstWithRole?.roles.find((role) => role.clubRoleId === resolvedRoleId)?.roleName ?? `Role #${resolvedRoleId}`;
    }, [users, resolvedRoleId]);

    const filteredUsers = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return users;

        return users.filter((user) => {
            const roleNames = user.roles.map((role) => role.roleName).join(' ').toLowerCase();
            return (
                user.fullName.toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword) ||
                (user.studentId ?? '').toLowerCase().includes(keyword) ||
                roleNames.includes(keyword)
            );
        });
    }, [users, search]);

    const hasInvalidParams = !resolvedClubId || !resolvedRoleId;

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath="/club-roles" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Thành viên theo vai trò"
                breadcrumb={`Pages / Club Roles / ${resolvedRoleId || 'Unknown'} / Members`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách thành viên theo vai trò</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {resolvedRoleId ? (
                                <>
                                    <RoleBadge roleName={roleName} /> <span className="ml-2">{users.length} thành viên</span>
                                </>
                            ) : (
                                'Thiếu thông tin vai trò'
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <i className="fas fa-arrow-left mr-2" />
                        Quay lại
                    </button>
                </div>

                {hasInvalidParams && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-4 text-amber-700 dark:text-amber-300 text-sm">
                        <i className="fas fa-exclamation-circle mr-2" />
                        Thiếu `clubId` hoặc `roleId` để tải danh sách thành viên.
                    </div>
                )}

                {isLoading && <Loading />}
                {!hasInvalidParams && !isLoading && error && <Error title="Không thể tải thành viên theo vai trò." error={error} />}

                {!hasInvalidParams && !isLoading && !error && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên, email, MSSV, vai trò..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                Hiển thị {filteredUsers.length}/{users.length}
                            </span>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">
                                <i className="fas fa-users text-4xl mb-3 opacity-40" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {users.length === 0 ? 'Vai trò này chưa có thành viên.' : 'Không tìm thấy thành viên phù hợp.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thành viên</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">MSSV</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vai trò</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.clubMemberId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar user={user} />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.studentId ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {user.roles.map((role) => (
                                                            <span
                                                                key={`${user.clubMemberId}-${role.clubRoleId}`}
                                                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${role.clubRoleId === resolvedRoleId
                                                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                                    }`}
                                                            >
                                                                {role.roleName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.status?.toLowerCase() === 'active'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        {user.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
