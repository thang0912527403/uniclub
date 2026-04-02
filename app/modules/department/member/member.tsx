import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { getClubId, isLoggedIn } from '~/utils/auth';
import { useGetDepartmentMembersQuery, useGetDepartmentByIdQuery } from '~/cores/api/departmentApi';
import type { DepartmentMember } from '~/cores/api/types/department';

/* ─── Avatar placeholder ─────────────────────────────────────────────────── */
function MemberAvatar({ member }: { member: DepartmentMember }) {
    if (member.avatar) {
        return (
            <img
                src={member.avatar}
                alt={member.fullName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
        );
    }
    const initials = member.fullName
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase();
    const colors = [
        'bg-indigo-500', 'bg-purple-500', 'bg-blue-500',
        'bg-violet-500', 'bg-emerald-500', 'bg-cyan-500',
    ];
    const color = colors[member.clubMemberId % colors.length];
    return (
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
            {initials}
        </div>
    );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const active = status?.toUpperCase() === 'ACTIVE';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {active ? 'Hoạt động' : (status ?? 'N/A')}
        </span>
    );
}

export default function DepartmentDetailModule() {
    const { id } = useParams<{ id: string }>();
    const departmentId = Number(id);
    const clubId = getClubId();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const loggedIn = isLoggedIn();

    // Fetch department details
    const { data: departmentInfo, isLoading: isDeptLoading } = useGetDepartmentByIdQuery(departmentId, {
        skip: !loggedIn || isNaN(departmentId)
    });

    // Fetch members
    const { data: members, isLoading, error } = useGetDepartmentMembersQuery(
        { clubId, departmentId },
        { skip: !loggedIn || !clubId || clubId <= 0 || isNaN(departmentId) }
    );

    const [search, setSearch] = useState('');

    const allMembers = members ?? [];
    const filteredMembers = allMembers.filter((m) =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.studentId ?? '').toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const activeMembers = allMembers.filter(m => m.status?.toLowerCase() === 'active').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/department" isOpen={isSidebarOpen} />
            <HeaderBar
                title={departmentInfo?.Name ? `Bộ phận: ${departmentInfo.Name}` : "Chi tiết Bộ phận"}
                breadcrumb={`Pages / Departments / ${departmentInfo?.Name ?? 'Members'}`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 px-6 pb-8 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/department')}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit cursor-pointer"
                >
                    <i className="fas fa-arrow-left"></i>
                    Quay lại danh sách ban
                </button>

                {!clubId ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center mt-6">
                        <div className="w-20 h-20 mx-auto mb-5 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-building text-3xl text-indigo-500"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa chọn câu lạc bộ</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng chọn câu lạc bộ để xem thành viên bộ phận.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Header */}
                        {!isLoading && !error && allMembers.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-users text-indigo-600 dark:text-indigo-400 text-lg"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Tổng thành viên</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{allMembers.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-user-check text-emerald-600 dark:text-emerald-400 text-lg"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Đang hoạt động</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{activeMembers}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main List Container */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative flex-1">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm kiếm thành viên theo tên, email, MSSV..."
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors cursor-pointer">
                                            <i className="fas fa-times text-xs"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {isLoading || isDeptLoading ? (
                                <div className="p-8">
                                    <Loading />
                                </div>
                            ) : error ? (
                                <div className="p-8">
                                    <Error title="Lỗi khi tải danh sách thành viên." error={error} />
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                                    <i className="fas fa-users text-4xl mb-3 opacity-30" />
                                    <p className="text-sm">
                                        {search ? "Không tìm thấy thành viên nào phù hợp." : "Ban này chưa có thành viên."}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thành viên</th>
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">MSSV</th>
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai trò</th>
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tham gia</th>
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {filteredMembers.map((member) => (
                                                <tr
                                                    key={member.clubMemberId}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <MemberAvatar member={member} />
                                                            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[12rem]">{member.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[12rem]">{member.email}</td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                                        {member.studentId ?? <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {member.departmentRole ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                                {member.departmentRole.toLowerCase().includes('manager') || member.departmentRole.toLowerCase().includes('quản lý') ? <i className="fas fa-crown text-[10px] text-amber-500"></i> : null}
                                                                {member.departmentRole}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                Thành viên
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                                        {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <StatusBadge status={member.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {filteredMembers.length > 0 && (
                                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-xs text-gray-500 dark:text-gray-400">
                                    Hiển thị {filteredMembers.length} / {allMembers.length} thành viên
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
