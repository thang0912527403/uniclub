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
    useGetClubMemberByIdQuery,
    useUpdateMemberRoleMutation,
} from '~/cores/api';
import { useGetClubStructureRolesQuery } from '~/cores/api/clubRoleApi';
import type { ClubRole } from '~/cores/api/types';
import { getMemberRoleIds, getMemberRoleNames } from '~/cores/api/types/clubMember';


/* ─── Level Badge ─────────────────────────────────────────────────────────── */
function LevelBadge({ level }: { level: number }) {
    const colors =
        level <= 1
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700 shadow-sm shadow-amber-500/10'
            : level <= 3
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

    const icon = level <= 1 ? 'fa-crown' : level <= 3 ? 'fa-star' : 'fa-circle';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 ${colors} uppercase tracking-wider`}>
            <i className={`fas ${icon} text-[8px]`} />
            Cấp {level}
        </span>
    );
}

/* ─── Role Card ───────────────────────────────────────────────────────────── */
function RoleCard({
    role,
    isSelected,
    isCurrent,
    onClick,
}: {
    role: ClubRole;
    isSelected: boolean;
    isCurrent: boolean;
    onClick: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            tabIndex={0}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group outline-none
                ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 shadow-md shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 border border-gray-100 dark:border-gray-700 shadow-sm'
                    }`}>
                    <i className="fas fa-shield-alt text-base" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                            {role.roleName}
                        </span>
                        <LevelBadge level={role.level} />
                        {isCurrent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
                                <i className="fas fa-check text-[9px]" />
                                Hiện tại
                            </span>
                        )}
                    </div>
                    {role.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {role.description}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                        <i className="fas fa-users text-[10px] mr-1" />
                        {role.memberCount ?? 0} thành viên
                    </p>
                </div>

                {/* Selection indicator */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                    {isSelected && <i className="fas fa-check text-white text-[9px]" />}
                </div>
            </div>

            {/* Policies preview */}
            {role.policies && role.policies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">
                        <i className="fas fa-key text-[10px] mr-1" />
                        {role.policies.length} quyền hạn
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {(isExpanded ? role.policies : role.policies.slice(0, 4)).map((p) => (
                            <span key={p.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-[9px] font-bold border border-gray-200 dark:border-gray-600/50 animate-in fade-in slide-in-from-top-1 duration-300">
                                {p.title}
                            </span>
                        ))}
                        {role.policies.length > 4 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white rounded-md text-[9px] font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                                {isExpanded ? (
                                    <>
                                        <i className="fas fa-chevron-up mr-1 text-[8px]" />
                                        Thu gọn
                                    </>
                                ) : (
                                    `+${role.policies.length - 4} nữa`
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Member Avatar ───────────────────────────────────────────────────────── */
function MemberAvatar({ fullName, avatar, clubMemberId }: { fullName: string; avatar: string | null; clubMemberId: number }) {
    if (avatar) {
        return <img src={avatar} alt={fullName} className="w-16 h-16 rounded-2xl object-cover" />;
    }
    const initials = fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
    const color = colors[clubMemberId % colors.length];
    return (
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-xl`}>
            {initials}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN MODULE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ClubMemberRoleModule() {
    const navigate = useNavigate();
    const { clubId: clubIdParam, memberId: memberIdParam } = useParams<{ clubId: string; memberId: string }>();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show } = useNotification();

    const clubId = Number(clubIdParam) || 0;
    const memberId = Number(memberIdParam) || 0;

    const { data: club } = useGetClubByIdQuery(clubId, { skip: !clubId });
    const { data: member, isLoading: isMemberLoading } = useGetClubMemberByIdQuery(
        { clubId, memberId },
        { skip: !clubId || !memberId }
    );
    const { data: roles, isLoading: isRolesLoading } = useGetClubStructureRolesQuery(clubId, { skip: !clubId });
    const [updateRole, { isLoading: isUpdating }] = useUpdateMemberRoleMutation();

    // Selected roles
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[] | undefined>(undefined);
    const [isEditing, setIsEditing] = useState(false);
    const [showAllRoles, setShowAllRoles] = useState(false);

    const currentRoles = member ? getMemberRoleIds(member) : [];
    const effectiveSelected = selectedRoleIds === undefined ? currentRoles : selectedRoleIds;

    const hasChanged = JSON.stringify([...effectiveSelected].sort()) !== JSON.stringify([...currentRoles].sort());

    const handleSave = async () => {
        try {
            await updateRole({ clubId, memberId, clubRoleIds: effectiveSelected }).unwrap();
            show({
                type: 'success',
                title: 'Cập nhật thành công!',
                message: effectiveSelected.length > 0
                    ? `Đã cập nhật vai trò cho ${member?.fullName}.`
                    : `Đã xóa vai trò của ${member?.fullName}.`,
                duration: 3000,
            });
            // Reset selected state to reflect new role
            setSelectedRoleIds(undefined);
            setIsEditing(false);
        } catch (err: any) {
            show({
                type: 'error',
                title: 'Thất bại',
                message: err?.data?.message ?? 'Không thể cập nhật vai trò.',
                duration: 4000,
            });
        }
    };

    const handleRemoveRole = () => {
        setSelectedRoleIds([]);
    };

    const isLoading = isMemberLoading || isRolesLoading;

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath="/clubs" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Vai trò thành viên"
                breadcrumb={`Pages / Clubs / ${club?.clubName ?? clubId} / Members / Roles`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="relative z-10">
                    {/* Back button */}
                    <button
                        onClick={() => navigate(`/clubs/${clubId}/members`)}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-all cursor-pointer group px-4 py-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <i className="fas fa-arrow-left text-xs group-hover:-translate-x-1 transition-transform" />
                        Quay lại danh sách thành viên
                    </button>

                {isLoading && <Loading />}

                {!isLoading && member && (
                    <div className="max-w-3xl mx-auto">

                        {/* Member card */}
                        <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] p-8 mb-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-indigo-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                    <div className="relative">
                                        <MemberAvatar
                                            fullName={member.fullName}
                                            avatar={member.avatar}
                                            clubMemberId={member.clubMemberId}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate tracking-tight mb-0.5">
                                        {member.fullName}
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        <i className="far fa-envelope text-[11px]" />
                                        {member.email}
                                    </p>
                                    {member.studentId && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-[10px] mt-1.5 border border-gray-200/50 dark:border-gray-700 uppercase tracking-wider">
                                            <i className="fas fa-id-card text-[9px]" />
                                            ID: {member.studentId}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    {(() => {
                                        const roleNames = member ? getMemberRoleNames(member) : [];
                                        if (roleNames.length > 0) return (
                                            <div className="flex flex-wrap justify-end gap-1.5 max-w-[320px]">
                                                {(showAllRoles ? roleNames : roleNames.slice(0, 2)).map((name, i) => (
                                                    <span key={i} className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-[11px] font-bold whitespace-nowrap animate-in fade-in zoom-in duration-500 border border-blue-100 dark:border-blue-800 shadow-sm shadow-blue-500/5">
                                                        <i className="fas fa-shield-alt text-[9px] text-blue-500" />
                                                        {name}
                                                    </span>
                                                ))}
                                                {!showAllRoles && roleNames.length > 2 && (
                                                    <button onClick={() => setShowAllRoles(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-[11px] font-bold hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-sm active:scale-95">
                                                        +{roleNames.length - 2} nữa
                                                    </button>
                                                )}
                                                {showAllRoles && roleNames.length > 2 && (
                                                    <button onClick={() => setShowAllRoles(false)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl text-[10px] font-bold hover:text-gray-600 transition-all cursor-pointer border border-transparent hover:border-gray-200">
                                                        <i className="fas fa-chevron-up text-[8px]" />
                                                        Thu gọn
                                                    </button>
                                                )}
                                            </div>
                                        );
                                        return (
                                            <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 rounded-xl text-[11px] font-bold italic border border-gray-100 dark:border-gray-800 shadow-inner">
                                                <i className="fas fa-user-secret text-[10px]" />
                                                Chưa có vai trò
                                            </span>
                                        );
                                    })()}
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase
                                        ${member.status?.toUpperCase() === 'ACTIVE'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${member.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`} />
                                        {member.status?.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : member.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Role selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                            
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20 transition-transform hover:scale-110 duration-300">
                                        <i className="fas fa-shield-check" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {isEditing ? 'Thiết lập vai trò' : 'Quyền hạn hiện tại'}
                                        </h2>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5 opacity-80">
                                            {isEditing ? `Hệ thống: ${roles?.length ?? 0} Roles` : `Thành viên: ${currentRoles.length} Roles`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider border-2 border-blue-100 dark:border-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 transition-all duration-300 shadow-sm hover:shadow-blue-500/20 active:scale-95 group cursor-pointer"
                                        >
                                            <i className="fas fa-user-edit text-[10px] transition-transform group-hover:rotate-12" />
                                            Thiết lập vai trò
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setSelectedRoleIds(undefined);
                                                }}
                                                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 uppercase tracking-wide cursor-pointer"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={!hasChanged || isUpdating}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:shadow-none group relative overflow-hidden cursor-pointer"
                                            >
                                                {isUpdating ? (
                                                    <i className="fas fa-spinner fa-spin text-[10px]" />
                                                ) : (
                                                    <i className="fas fa-check-circle text-[10px] group-hover:scale-125 transition-transform" />
                                                )}
                                                {isUpdating ? 'Đang lưu' : 'Lưu lại'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* No role option */}
                            {isEditing && (
                                <div className="px-6 pt-4">
                                    <button
                                        onClick={handleRemoveRole}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer mb-3
                                            ${effectiveSelected.length === 0
                                                ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-400 dark:border-gray-500'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30 hover:border-gray-200 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                            ${effectiveSelected.length === 0 ? 'bg-gray-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                            <i className="fas fa-ban text-sm" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Hủy tất cả vai trò</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium italic">Thành viên sẽ không còn bất kỳ quyền hạn nào</p>
                                        </div>
                                        <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                            ${effectiveSelected.length === 0 ? 'bg-gray-900 dark:bg-white border-transparent' : 'border-gray-300 dark:border-gray-700 group-hover:border-gray-400'}`}>
                                            {effectiveSelected.length === 0 && <i className="fas fa-check text-white dark:text-gray-900 text-[10px]" />}
                                        </div>
                                    </button>

                                    <div className="w-full h-px bg-gray-100 dark:bg-gray-700 mb-3" />
                                </div>
                            )}

                            {/* Role list */}
                            <div className={`px-6 pb-4 ${!isEditing ? 'pt-4' : ''}`}>
                                {!roles || roles.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                        <i className="fas fa-shield-alt text-4xl mb-3 opacity-30" />
                                        <p className="text-sm">Câu lạc bộ chưa có vai trò nào.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {[...roles]
                                            .sort((a, b) => a.level - b.level)
                                            .map((role) => (
                                                <RoleCard
                                                    key={role.clubRoleId}
                                                    role={role}
                                                    isSelected={effectiveSelected.includes(role.clubRoleId)}
                                                    isCurrent={currentRoles.includes(role.clubRoleId)}
                                                    onClick={() => {
                                                        if (!isEditing) return;
                                                        const current = effectiveSelected;
                                                        if (current.includes(role.clubRoleId)) {
                                                            setSelectedRoleIds(current.filter(id => id !== role.clubRoleId));
                                                        } else {
                                                            setSelectedRoleIds([...current, role.clubRoleId]);
                                                        }
                                                    }}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer actions */}
                            <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/20 relative z-10">
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 tracking-widest font-bold uppercase flex items-center gap-2">
                                    <i className="fas fa-calendar-alt opacity-50" />
                                    Gia nhập: {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                                </div>
                                {isEditing && hasChanged && (
                                    <div className="flex items-center gap-2 text-[10px] text-amber-500 dark:text-amber-400 font-black animate-pulse uppercase tracking-wider">
                                        <i className="fas fa-exclamation-triangle" />
                                        Thay đổi chưa được lưu
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Member not found */}
                {!isLoading && !member && (
                    <div className="max-w-md mx-auto mt-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-user-slash text-gray-400 text-2xl" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Không tìm thấy thành viên</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Thành viên không tồn tại hoặc đã bị xóa.</p>
                        <button
                            onClick={() => navigate(`/clubs/${clubId}/members`)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer"
                        >
                            Quay lại
                        </button>
                    </div>
                )}
                </div>
            </main>
        </div>
    );
}
