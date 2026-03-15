import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import {
    useGetClubByIdQuery,
    useGetClubMembersQuery,
    useUpdateMemberRoleMutation,
    type ClubMember,
} from '~/cores/api';
import { useGetClubRolesByClubIdQuery } from '~/cores/api/clubRoleApi';
import { getClubId } from '~/utils/auth';

/* ─── Avatar placeholder ─────────────────────────────────────────────────── */
function MemberAvatar({ member }: { member: ClubMember }) {
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
        'bg-blue-500', 'bg-purple-500', 'bg-green-500',
        'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
    ];
    const color = colors[member.clubMemberId % colors.length];
    return (
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const active = status === 'ACTIVE';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {active ? 'Hoạt động' : status}
        </span>
    );
}

/* ─── Inline role editor ─────────────────────────────────────────────────── */
interface RoleCellProps {
    member: ClubMember;
    clubId: number;
}

function RoleCell({ member, clubId }: RoleCellProps) {
    const { show } = useNotification();
    const { data: roles } = useGetClubRolesByClubIdQuery(clubId, {
        skip: !clubId,
    });
    const [updateRole, { isLoading }] = useUpdateMemberRoleMutation();

    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<number | null>(member.clubRoleId);

    const handleSave = async () => {
        try {
            await updateRole({ clubId, memberId: member.clubMemberId, clubRoleId: selected }).unwrap();
            show({
                type: 'success',
                title: 'Cập nhật vai trò thành công!',
                message: `${member.fullName} đã được cập nhật vai trò.`,
                duration: 3000,
            });
            setEditing(false);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            show({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: rtkErr?.data?.message ?? 'Vui lòng thử lại.',
                duration: 4000,
            });
        }
    };

    const handleCancel = () => {
        setSelected(member.clubRoleId);
        setEditing(false);
    };

    if (!editing) {
        return (
            <div className="flex items-center gap-2">
                {member.roleName ? (
                    <span className="inline-flex justify-center w-32 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium truncate">
                        {member.roleName}
                    </span>
                ) : (
                    <span className="inline-flex justify-center w-32 italic text-gray-300 dark:text-gray-600 text-xs">Chưa có vai trò</span>
                )}
                <button
                    onClick={() => setEditing(true)}
                    className="cursor-pointer transition-opacity w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Đổi vai trò"
                >
                    <i className="fas fa-pen text-[10px]" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={selected ?? ''}
                onChange={(e) => setSelected(e.target.value === '' ? null : Number(e.target.value))}
                className="text-xs px-2 py-1.5 bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-600 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                autoFocus
            >
                <option value="">— Không có vai trò —</option>
                {roles?.map((r) => (
                    <option key={r.clubRoleId} value={r.clubRoleId}>{r.roleName}</option>
                ))}
            </select>
            <button
                onClick={handleSave}
                disabled={isLoading}
                className="cursor-pointer w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
                title="Lưu"
            >
                {isLoading
                    ? <i className="fas fa-spinner fa-spin text-[10px]" />
                    : <i className="fas fa-check text-[10px]" />
                }
            </button>
            <button
                onClick={handleCancel}
                disabled={isLoading}
                className="cursor-pointer w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center transition-colors"
                title="Hủy"
            >
                <i className="fas fa-times text-[10px]" />
            </button>
        </div>
    );
}

/* ─── Main module ────────────────────────────────────────────────────────── */
export default function ClubMembersModule() {
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const clubId = getClubId();

    const { data: club } = useGetClubByIdQuery(clubId, {
        skip: !clubId,
    });
    const { data: members, isLoading, error } = useGetClubMembersQuery(clubId, {
        skip: !clubId,
    });

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const roleOptions = Array.from(
        new Set((members ?? []).map((m) => m.roleName).filter(Boolean))
    ) as string[];

    const filtered = (members ?? []).filter((m) => {
        const matchesSearch =
            m.fullName.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase()) ||
            (m.studentId ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === '' || m.roleName === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath="/clubs" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Thành viên Câu lạc bộ"
                breadcrumb={`Pages / Clubs / ${club?.clubName ?? clubId} / Members`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {club ? `${club.clubName} — Thành viên` : 'Thành viên'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {members ? `${members.length} thành viên` : ''}
                        </p>
                    </div>
                </div>

                {/* Loading / Error */}
                {isLoading && <Loading />}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
                        <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-2" />
                        <p className="text-red-600 dark:text-red-400">Không thể tải danh sách thành viên.</p>
                    </div>
                )}

                {!isLoading && members && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative flex-1">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên, email, MSSV..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            {roleOptions.length > 0 && (
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Tất cả vai trò</option>
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Table */}
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <i className="fas fa-users text-4xl mb-3 opacity-30" />
                                <p className="text-sm">Không tìm thấy thành viên nào.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thành viên</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">MSSV</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai trò</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tham gia</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {filtered.map((member) => (
                                            <tr
                                                key={member.clubMemberId}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar member={member} />
                                                        <span className="font-medium text-gray-900 dark:text-white">{member.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.email}</td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                    {member.studentId ?? <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <RoleCell member={member} clubId={clubId} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                    {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={member.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {filtered.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                Hiển thị {filtered.length}/{members.length} thành viên
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
