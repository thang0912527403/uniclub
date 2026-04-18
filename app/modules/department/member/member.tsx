import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import { getClubId, isLoggedIn } from '~/utils/auth';
import {
    useGetDepartmentMembersQuery,
    useGetDepartmentByIdQuery,
    useGetNonMembersQuery,
    useAddMemberToDepartmentMutation,
    useRemoveMemberFromDepartmentMutation,
} from '~/cores/api/departmentApi';
import type { DepartmentMember } from '~/cores/api/types/department';

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function MemberAvatar({ member }: { member: DepartmentMember }) {
    if (member.avatar) {
        return <img src={member.avatar} alt={member.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />;
    }
    const initials = member.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-cyan-500'];
    const color = colors[member.clubMemberId % colors.length];
    return (
        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
}

/* ─── Status Badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const active = status?.toUpperCase() === 'ACTIVE';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {active ? 'Hoạt động' : (status ?? 'N/A')}
        </span>
    );
}

/* ─── Add Member Modal ────────────────────────────────────────────────────── */
function AddMemberModal({ clubId, departmentId, onClose }: { clubId: number; departmentId: number; onClose: () => void }) {
    const { show } = useNotification();
    const { data: nonMembers, isLoading } = useGetNonMembersQuery({ clubId, departmentId });
    const [addMember, { isLoading: isAdding }] = useAddMemberToDepartmentMutation();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);

    const filtered = (nonMembers ?? []).filter((m) =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.studentId ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async () => {
        if (!selected) return;
        try {
            await addMember({ clubId, departmentId, memberId: selected }).unwrap();
            show({ type: 'success', title: 'Thành công!', message: 'Đã thêm thành viên vào phòng ban.', duration: 3000 });
            onClose();
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể thêm thành viên.', duration: 4000 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thêm thành viên</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Chọn thành viên chưa thuộc phòng ban này</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pt-4 pb-2">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email, MSSV..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="px-6 pb-4 max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><i className="fas fa-spinner fa-spin text-indigo-500 text-xl" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                            <i className="fas fa-users text-3xl mb-2 opacity-30 block" />
                            {search ? 'Không tìm thấy kết quả.' : 'Tất cả thành viên đã thuộc phòng ban này.'}
                        </div>
                    ) : (
                        <div className="space-y-1 mt-1">
                            {filtered.map((m) => (
                                <button
                                    key={m.clubMemberId}
                                    onClick={() => setSelected(selected === m.clubMemberId ? null : m.clubMemberId)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${selected === m.clubMemberId
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40 border-2 border-transparent'
                                        }`}
                                >
                                    <MemberAvatar member={m} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                                    </div>
                                    {m.studentId && <span className="text-xs text-gray-400 flex-shrink-0">{m.studentId}</span>}
                                    {selected === m.clubMemberId && (
                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-check text-white text-[10px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                        {selected ? <span className="text-indigo-600 font-medium">Đã chọn 1 thành viên</span> : 'Chưa chọn thành viên'}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                            Hủy
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!selected || isAdding}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer transition-all"
                        >
                            {isAdding && <i className="fas fa-spinner fa-spin" />}
                            Thêm vào phòng ban
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Confirm Kick Modal ──────────────────────────────────────────────────── */
function ConfirmKickModal({ member, onConfirm, onCancel, isLoading }: {
    member: DepartmentMember;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                        <i className="fas fa-user-minus text-xl" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Xóa khỏi phòng ban</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.fullName}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Bạn có chắc muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{member.fullName}</span> khỏi phòng ban này? Thành viên vẫn còn trong câu lạc bộ.
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        Hủy
                    </button>
                    <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer">
                        {isLoading && <i className="fas fa-spinner fa-spin" />}
                        Xác nhận xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DepartmentDetailModule() {
    const { id } = useParams<{ id: string }>();
    const departmentId = Number(id);
    const clubId = getClubId();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show } = useNotification();
    const loggedIn = isLoggedIn();

    const { data: departmentInfo, isLoading: isDeptLoading } = useGetDepartmentByIdQuery(
        { clubId, id: departmentId },
        { skip: !loggedIn || isNaN(departmentId) }
    );
    const { data: members, isLoading, error } = useGetDepartmentMembersQuery(
        { clubId, departmentId },
        { skip: !loggedIn || !clubId || clubId <= 0 || isNaN(departmentId) }
    );
    const [removeMember, { isLoading: isRemoving }] = useRemoveMemberFromDepartmentMutation();

    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [kickTarget, setKickTarget] = useState<DepartmentMember | null>(null);

    const allMembers = members ?? [];
    const filteredMembers = allMembers.filter((m) =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.studentId ?? '').toLowerCase().includes(search.toLowerCase())
    );
    const activeCount = allMembers.filter(m => m.status?.toLowerCase() === 'active').length;

    const handleKickConfirm = async () => {
        if (!kickTarget) return;
        try {
            await removeMember({ clubId, departmentId, memberId: kickTarget.clubMemberId }).unwrap();
            show({ type: 'success', title: 'Đã xóa thành viên', message: `${kickTarget.fullName} đã được xóa khỏi phòng ban.`, duration: 3000 });
            setKickTarget(null);
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể xóa thành viên.', duration: 4000 });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/department" isOpen={isSidebarOpen} />
            <HeaderBar
                title={departmentInfo?.Name ? `Bộ phận: ${departmentInfo.Name}` : 'Chi tiết Bộ phận'}
                breadcrumb={`Pages / Departments / ${departmentInfo?.Name ?? 'Members'}`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 px-6 pb-8 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <button
                    onClick={() => navigate('/department')}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit cursor-pointer"
                >
                    <i className="fas fa-arrow-left" />
                    Quay lại danh sách ban
                </button>

                {!clubId ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center">
                        <div className="w-20 h-20 mx-auto mb-5 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-building text-3xl text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa chọn câu lạc bộ</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng chọn câu lạc bộ để xem thành viên bộ phận.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        {!isLoading && !error && allMembers.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-users text-indigo-600 dark:text-indigo-400 text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Tổng thành viên</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{allMembers.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-user-check text-emerald-600 dark:text-emerald-400 text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Đang hoạt động</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{activeCount}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main container */}
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
                                        className="w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors cursor-pointer">
                                            <i className="fas fa-times text-xs" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex-shrink-0"
                                >
                                    <i className="fas fa-user-plus" />
                                    Thêm thành viên
                                </button>
                            </div>

                            {/* Content */}
                            {isLoading || isDeptLoading ? (
                                <div className="p-8"><Loading /></div>
                            ) : error ? (
                                <div className="p-8"><Error title="Lỗi khi tải danh sách thành viên." error={error} /></div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                                    <i className="fas fa-users text-4xl mb-3 opacity-30" />
                                    <p className="text-sm">{search ? 'Không tìm thấy thành viên nào phù hợp.' : 'Ban này chưa có thành viên.'}</p>
                                    {!search && (
                                        <button onClick={() => setShowAddModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer transition-all">
                                            <i className="fas fa-user-plus" />Thêm thành viên đầu tiên
                                        </button>
                                    )}
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
                                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {filteredMembers.map((member) => (
                                                <tr key={member.clubMemberId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
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
                                                    <td className="px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => setKickTarget(member)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer"
                                                            title="Xóa khỏi phòng ban"
                                                        >
                                                            <i className="fas fa-user-minus text-[11px]" />
                                                            Xóa khỏi ban
                                                        </button>
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

            {showAddModal && (
                <AddMemberModal
                    clubId={clubId}
                    departmentId={departmentId}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {kickTarget && (
                <ConfirmKickModal
                    member={kickTarget}
                    onConfirm={handleKickConfirm}
                    onCancel={() => setKickTarget(null)}
                    isLoading={isRemoving}
                />
            )}
        </div>
    );
}
