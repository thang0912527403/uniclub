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
    useRemoveMemberMutation,
    useToggleMemberStatusMutation,
    useAddMemberMutation,
    useGetMemberJoinedDepartmentsQuery,
    useGetMemberNotJoinedDepartmentsQuery,
    useLazySearchUsersQuery,
    type ClubMember,
} from '~/cores/api';
import { getMemberRoleNames } from '~/cores/api/types/clubMember';
import { useAddMemberToDepartmentMutation, useRemoveMemberFromDepartmentMutation } from '~/cores/api/departmentApi';

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function MemberAvatar({ member, size = 'md' }: { member: ClubMember | { clubMemberId: number; fullName: string; avatar: string | null }; size?: 'sm' | 'md' }) {
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    if (member.avatar) {
        return <img src={member.avatar} alt={member.fullName} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
    }
    const initials = member.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
    const color = colors[member.clubMemberId % colors.length];
    return (
        <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
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
            {active ? 'Hoạt động' : status === 'INACTIVE' ? 'Vô hiệu hóa' : (status ?? 'N/A')}
        </span>
    );
}

function StatusToggleConfirmModal({
    member,
    onConfirm,
    onCancel,
    isLoading,
}: {
    member: ClubMember;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const isActive = member.status?.toUpperCase() === 'ACTIVE';
    const nextAction = isActive ? 'deactivate' : 'activate';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        <i className={`fas ${isActive ? 'fa-user-slash' : 'fa-user-check'} text-xl`} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {isActive ? 'Deactive thành viên' : 'Active thành viên'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.fullName}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Bạn có chắc muốn <span className="font-semibold text-gray-900 dark:text-white">{nextAction}</span> thành viên này không?
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer ${isActive ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
                    >
                        {isLoading && <i className="fas fa-spinner fa-spin" />}
                        {isActive ? 'Xác nhận Deactive' : 'Xác nhận Active'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Role Navigate Button ────────────────────────────────────────────────── */
function RoleCell({ member, clubId }: { member: ClubMember; clubId: number }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(`/clubs/${clubId}/members/${member.clubMemberId}/roles`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all cursor-pointer group shadow-sm border border-purple-200 dark:border-purple-800"
            title="Xem vai trò"
        >
            <i className="fas fa-shield-alt text-[11px]" />
            <span>Xem vai trò</span>
            <i className="fas fa-chevron-right text-[9px] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-0.5" />
        </button>
    );
}

/* ─── Add to Department Modal ─────────────────────────────────────────────── */
function AddToDepartmentModal({ member, clubId, onClose }: { member: ClubMember; clubId: number; onClose: () => void }) {
    const { show } = useNotification();
    const { data: departments, isLoading } = useGetMemberNotJoinedDepartmentsQuery({ clubId, memberId: member.clubMemberId });
    const [addMember, { isLoading: isAdding }] = useAddMemberToDepartmentMutation();
    const [selected, setSelected] = useState<number | null>(null);

    const handleAdd = async () => {
        if (!selected) return;
        try {
            await addMember({ clubId, departmentId: selected, memberId: member.clubMemberId }).unwrap();
            show({ type: 'success', title: 'Thành công!', message: `Đã thêm ${member.fullName} vào phòng ban.`, duration: 3000 });
            onClose();
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể thêm vào phòng ban.', duration: 4000 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Thêm vào phòng ban</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.fullName}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div className="px-6 py-4 max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><i className="fas fa-spinner fa-spin text-blue-500 text-xl" /></div>
                    ) : !departments || departments.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                            <i className="fas fa-building text-3xl mb-2 opacity-30 block" />
                            Thành viên đã tham gia tất cả phòng ban.
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Chọn phòng ban muốn thêm thành viên vào:</p>
                            <div className="space-y-2">
                                {departments.map((dept: any, i: number) => {
                                    const deptId = dept.DepartmentId ?? dept.departmentId;
                                    const deptName = dept.Name ?? dept.name ?? dept.departmentName ?? '—';
                                    const deptDesc = dept.Description ?? dept.description;
                                    return (
                                        <button
                                            key={deptId ?? i}
                                            onClick={() => setSelected(selected === deptId ? null : deptId)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer border-2 ${selected === deptId
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                                }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-sitemap text-blue-500 dark:text-blue-400 text-sm" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{deptName}</p>
                                                {deptDesc && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deptDesc}</p>}
                                            </div>
                                            {selected === deptId && (
                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-check text-white text-[10px]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        Hủy
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selected || isAdding}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isAdding && <i className="fas fa-spinner fa-spin" />}
                        Thêm vào phòng ban
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Kick from Department Modal ──────────────────────────────────────────── */
function KickFromDepartmentModal({ member, clubId, onClose }: { member: ClubMember; clubId: number; onClose: () => void }) {
    const { show } = useNotification();
    const { data: departments, isLoading } = useGetMemberJoinedDepartmentsQuery({ clubId, memberId: member.clubMemberId });
    const [removeMember, { isLoading: isRemoving }] = useRemoveMemberFromDepartmentMutation();
    const [confirmDept, setConfirmDept] = useState<any | null>(null);

    const handleRemove = async () => {
        if (!confirmDept) return;
        const deptId = confirmDept.DepartmentId ?? confirmDept.departmentId;
        const deptName = confirmDept.Name ?? confirmDept.name ?? confirmDept.departmentName ?? '—';
        try {
            await removeMember({ clubId, departmentId: deptId, memberId: member.clubMemberId }).unwrap();
            show({ type: 'success', title: 'Đã xóa', message: `${member.fullName} đã được xóa khỏi "${deptName}".`, duration: 3000 });
            setConfirmDept(null);
            if (!departments || departments.length <= 1) onClose();
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể xóa khỏi phòng ban.', duration: 4000 });
        }
    };

    if (confirmDept) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDept(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                            <i className="fas fa-user-minus text-xl" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Xác nhận xóa khỏi phòng ban</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{confirmDept.Name}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        Bạn có chắc muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{member.fullName}</span> khỏi phòng ban <span className="font-semibold text-gray-900 dark:text-white">"{confirmDept.Name}"</span>? Thành viên vẫn còn trong câu lạc bộ.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setConfirmDept(null)} disabled={isRemoving} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                            Hủy
                        </button>
                        <button onClick={handleRemove} disabled={isRemoving} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer">
                            {isRemoving && <i className="fas fa-spinner fa-spin" />}
                            Xác nhận xóa
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Xóa khỏi phòng ban</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.fullName}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div className="px-6 py-4 max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><i className="fas fa-spinner fa-spin text-red-400 text-xl" /></div>
                    ) : !departments || departments.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                            <i className="fas fa-building text-3xl mb-2 opacity-30 block" />
                            Thành viên chưa tham gia phòng ban nào.
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Chọn phòng ban muốn xóa thành viên khỏi:</p>
                            <div className="space-y-2">
                                {departments.map((dept: any, i: number) => {
                                    const deptId = dept.DepartmentId ?? dept.departmentId;
                                    const deptName = dept.Name ?? dept.name ?? dept.departmentName ?? '—';
                                    const deptDesc = dept.Description ?? dept.description;
                                    return (
                                        <button
                                            key={deptId ?? i}
                                            onClick={() => setConfirmDept(dept)}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer border-2 border-transparent hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 flex items-center justify-center flex-shrink-0 transition-colors">
                                                <i className="fas fa-sitemap text-gray-500 dark:text-gray-400 group-hover:text-red-500 text-sm transition-colors" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{deptName}</p>
                                                {deptDesc && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deptDesc}</p>}
                                            </div>
                                            <i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 group-hover:text-red-400 text-xs transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    Bấm vào phòng ban để xóa thành viên khỏi phòng ban đó.
                </div>
            </div>
        </div>
    );
}

/* ─── Add Member Modal ────────────────────────────────────────────────────── */
function AddMemberModal({ clubId, existingMemberUserIds, onClose }: { clubId: number; existingMemberUserIds: string[]; onClose: () => void }) {
    const { show } = useNotification();
    const [query, setQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [searchUsers, { data: results, isLoading: isSearching, isUninitialized }] = useLazySearchUsersQuery();
    const [addMember, { isLoading: isAdding }] = useAddMemberMutation();

    const handleSearch = () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        setSelectedUserId(null);
        searchUsers(trimmed);
    };

    const filteredResults = (results ?? []).filter((u) => !existingMemberUserIds.includes(u.userId));

    const handleAdd = async () => {
        if (!selectedUserId) return;
        try {
            await addMember({ clubId, userId: selectedUserId }).unwrap();
            show({ type: 'success', title: 'Thành công!', message: 'Đã thêm thành viên vào câu lạc bộ.', duration: 3000 });
            onClose();
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể thêm thành viên.', duration: 4000 });
        }
    };

    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Thêm thành viên</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tìm người dùng theo tên hoặc email</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Nhập tên hoặc email..."
                                autoFocus
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={!query.trim() || isSearching}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSearching ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
                            Tìm
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-4 min-h-[80px] max-h-72 overflow-y-auto">
                    {isSearching ? (
                        <div className="py-6 flex justify-center"><i className="fas fa-spinner fa-spin text-blue-500 text-xl" /></div>
                    ) : isUninitialized ? null : filteredResults.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-400">
                            <i className="fas fa-user-slash text-3xl mb-2 opacity-30 block" />
                            Không tìm thấy người dùng phù hợp.
                        </div>
                    ) : (
                        <div className="space-y-1.5 py-1">
                            {filteredResults.map((user) => (
                                <button
                                    key={user.userId}
                                    onClick={() => setSelectedUserId(selectedUserId === user.userId ? null : user.userId)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer border-2 ${selectedUserId === user.userId
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-700/40 hover:border-blue-300'
                                        }`}
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className={`w-9 h-9 rounded-full ${colors[user.userId.charCodeAt(0) % colors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                            {user.fullName?.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() ?? '?'}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}{user.studentId ? ` · ${user.studentId}` : ''}</p>
                                    </div>
                                    {selectedUserId === user.userId && (
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-check text-white text-[10px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        Hủy
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedUserId || isAdding}
                        className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isAdding && <i className="fas fa-spinner fa-spin" />}
                        <i className="fas fa-user-plus text-[13px]" />
                        Thêm thành viên
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Kick from Club Modal ────────────────────────────────────────────────── */
function KickFromClubModal({ member, clubId, onClose, onSuccess }: { member: ClubMember; clubId: number; onClose: () => void; onSuccess: () => void }) {
    const { show } = useNotification();
    const [removeMember, { isLoading }] = useRemoveMemberMutation();

    const handleRemove = async () => {
        try {
            await removeMember({ clubId, memberId: member.clubMemberId }).unwrap();
            show({ type: 'success', title: 'Đã xóa khỏi CLB', message: `${member.fullName} đã bị xóa khỏi câu lạc bộ.`, duration: 3000 });
            onSuccess();
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể xóa thành viên.', duration: 4000 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                        <i className="fas fa-user-slash text-xl" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Xóa khỏi câu lạc bộ</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.fullName}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Bạn có chắc muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{member.fullName}</span> khỏi câu lạc bộ? Hành động này sẽ xóa thành viên khỏi tất cả phòng ban và không thể hoàn tác.
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        Hủy
                    </button>
                    <button onClick={handleRemove} disabled={isLoading} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer">
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
type ModalType = 'addMember' | 'addDept' | 'kickDept' | 'kickClub';

export default function ClubMembersModule() {
    const navigate = useNavigate();
    const { clubId: clubIdParam } = useParams<{ clubId: string }>();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const clubId = Number(clubIdParam) || 0;

    const { data: club } = useGetClubByIdQuery(clubId, { skip: !clubId });
    const { data: members, isLoading, error } = useGetClubMembersQuery(clubId, { skip: !clubId });

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [activeModal, setActiveModal] = useState<{ type: ModalType; member: ClubMember } | null>(null);
    const [statusTarget, setStatusTarget] = useState<ClubMember | null>(null);
    const [toggleMemberStatus, { isLoading: isTogglingStatus }] = useToggleMemberStatusMutation();
    const { show } = useNotification();

    const roleOptions = Array.from(
        new Set((members ?? []).flatMap(getMemberRoleNames).filter(Boolean))
    ) as string[];

    const filtered = (members ?? []).filter((m) => {
        const matchesSearch =
            m.fullName.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase()) ||
            (m.studentId ?? '').toLowerCase().includes(search.toLowerCase());
        const memberRoles = getMemberRoleNames(m);
        const matchesRole = roleFilter === '' || memberRoles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    const closeModal = () => setActiveModal(null);

    const handleToggleStatus = async () => {
        if (!statusTarget) return;

        const isCurrentlyActive = statusTarget.status?.toUpperCase() === 'ACTIVE';
        const nextIsActive = !isCurrentlyActive;

        try {
            await toggleMemberStatus({
                clubId,
                memberId: statusTarget.clubMemberId,
                isActive: nextIsActive,
            }).unwrap();

            show({
                type: 'success',
                title: 'Cập nhật trạng thái thành công',
                message: `${statusTarget.fullName} đã được ${nextIsActive ? 'active' : 'deactive'}.`,
                duration: 3000,
            });
            setStatusTarget(null);
        } catch (err: any) {
            show({
                type: 'error',
                title: 'Cập nhật trạng thái thất bại',
                message: err?.data?.message ?? 'Không thể cập nhật trạng thái thành viên.',
                duration: 4000,
            });
        }
    };

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath="/clubs" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Thành viên Câu lạc bộ"
                breadcrumb={`Pages / Clubs / ${club?.clubName ?? club?.shortName} / Members`}
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
                    <button
                        onClick={() => setActiveModal({ type: 'addMember', member: null as any })}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-lg shadow-green-500/20 transition-all cursor-pointer"
                    >
                        <i className="fas fa-user-plus" />
                        Thêm thành viên
                    </button>
                </div>

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
                                    placeholder="Tìm theo tên, email..."
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
                                    {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
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
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai trò CLB</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tham gia</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {filtered.map((member) => (
                                            <tr key={member.clubMemberId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar member={member} />
                                                        <span className="font-medium text-gray-900 dark:text-white">{member.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.email}</td>
                                                <td className="px-4 py-3">
                                                    <RoleCell member={member} clubId={clubId} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                    {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setStatusTarget(member)}
                                                        className="cursor-pointer"
                                                        title="Đổi trạng thái thành viên"
                                                    >
                                                        <StatusBadge status={member.status} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Thêm vào phòng ban */}
                                                        <button
                                                            onClick={() => setActiveModal({ type: 'addDept', member })}
                                                            title="Thêm vào phòng ban"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer"
                                                        >
                                                            <i className="fas fa-folder-plus text-[11px]" />
                                                            Thêm ban
                                                        </button>
                                                        {/* Xóa khỏi phòng ban */}
                                                        <button
                                                            onClick={() => setActiveModal({ type: 'kickDept', member })}
                                                            title="Xóa khỏi phòng ban"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer"
                                                        >
                                                            <i className="fas fa-folder-minus text-[11px]" />
                                                            Xóa ban
                                                        </button>
                                                        {/* Xóa khỏi CLB */}
                                                        <button
                                                            onClick={() => setActiveModal({ type: 'kickClub', member })}
                                                            title="Xóa khỏi câu lạc bộ"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer"
                                                        >
                                                            <i className="fas fa-user-slash text-[11px]" />
                                                            Xóa CLB
                                                        </button>
                                                    </div>
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

            {/* Modals */}
            {activeModal?.type === 'addMember' && (
                <AddMemberModal
                    clubId={clubId}
                    existingMemberUserIds={(members ?? []).map((m) => m.userId)}
                    onClose={closeModal}
                />
            )}
            {activeModal?.type === 'addDept' && (
                <AddToDepartmentModal member={activeModal.member} clubId={clubId} onClose={closeModal} />
            )}
            {activeModal?.type === 'kickDept' && (
                <KickFromDepartmentModal member={activeModal.member} clubId={clubId} onClose={closeModal} />
            )}
            {activeModal?.type === 'kickClub' && (
                <KickFromClubModal member={activeModal.member} clubId={clubId} onClose={closeModal} onSuccess={closeModal} />
            )}
            {statusTarget && (
                <StatusToggleConfirmModal
                    member={statusTarget}
                    onConfirm={handleToggleStatus}
                    onCancel={() => setStatusTarget(null)}
                    isLoading={isTogglingStatus}
                />
            )}
        </div>
    );
}
