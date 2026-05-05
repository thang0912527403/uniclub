import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import { useClubRole } from '~/hooks/useClubRole';
import {
    useGetClubByIdQuery,
    useGetClubMembersQuery,
    useGetDepartmentsQuery,
    useGetDepartmentMembersQuery,
    type ClubMember,
} from '~/cores/api';
import { useSendBulkNotificationMutation } from '~/cores/api/notificationApi';
import { useGetCurrentUserQuery } from '~/cores/api/authApi';
import { getClubId } from '~/utils/auth';

type SendTarget = 'all' | 'department' | 'select';
type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

const NOTIFICATION_TYPES: { value: NotificationType; label: string; color: string }[] = [
    { value: 'INFO', label: 'Thông tin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'SUCCESS', label: 'Thành công', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'WARNING', label: 'Cảnh báo', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'ERROR', label: 'Lỗi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

type MemberLike = Pick<ClubMember, 'clubMemberId' | 'userId' | 'fullName' | 'email' | 'avatar'>;

function MemberCheckbox({
    member,
    checked,
    onChange,
    disabled = false,
}: {
    member: MemberLike;
    checked: boolean;
    onChange: (id: string, checked: boolean) => void;
    disabled?: boolean;
}) {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
    const color = colors[member.clubMemberId % colors.length];
    const initials = member.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

    return (
        <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border-2 ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'} ${checked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => !disabled && onChange(member.userId, e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 flex-shrink-0"
            />
            {member.avatar ? (
                <img src={member.avatar} alt={member.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
            </div>
        </label>
    );
}

export default function SendNotificationPage() {
    const { id: clubIdParam } = useParams<{ id: string }>();
    const clubId = Number(clubIdParam) || getClubId();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show } = useNotification();
    const { can } = useClubRole();

    const canSendNotification = can('updatememberstatus');

    const [target, setTarget] = useState<SendTarget>('all');
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const { data: club } = useGetClubByIdQuery(clubId, { skip: !clubId });
    const { data: members, isLoading: loadingMembers } = useGetClubMembersQuery(clubId, { skip: !clubId });
    const { data: departments } = useGetDepartmentsQuery(clubId, { skip: !clubId });
    const { data: rawDeptMembers } = useGetDepartmentMembersQuery(
        { clubId, departmentId: selectedDeptId! },
        { skip: !selectedDeptId }
    );
    const { data: currentUser } = useGetCurrentUserQuery();
    const [sendBulkNotification, { isLoading: isSending }] = useSendBulkNotificationMutation();
    const [memberSearch, setMemberSearch] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notifType, setNotifType] = useState<NotificationType>('INFO');
    const [isSent, setIsSent] = useState(false);

    const deptMembers = useMemo((): MemberLike[] =>
        (rawDeptMembers ?? []).map((dm) => ({
            clubMemberId: dm.clubMemberId,
            userId: dm.userId,
            fullName: dm.fullName,
            email: dm.email,
            avatar: dm.avatar,
        })),
        [rawDeptMembers]
    );

    useEffect(() => {
        if (target === 'department' && deptMembers.length > 0) {
            setSelectedUserIds(new Set(deptMembers.map((m) => m.userId)));
        }
    }, [deptMembers, target]);

    const visibleMembers = useMemo((): MemberLike[] => {
        const base = target === 'department' ? deptMembers : (members ?? []);
        if (!memberSearch.trim()) return base;
        const q = memberSearch.toLowerCase();
        return base.filter(
            (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        );
    }, [target, deptMembers, members, memberSearch]);

    const recipientUserIds = useMemo((): string[] => {
        if (target === 'all') return (members ?? []).map((m) => m.userId);
        return Array.from(selectedUserIds);
    }, [target, members, selectedUserIds]);

    const toggleMember = (userId: string, checked: boolean) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            checked ? next.add(userId) : next.delete(userId);
            return next;
        });
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(new Set(visibleMembers.map((m) => m.userId)));
        } else {
            setSelectedUserIds(new Set());
        }
    };


    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            show({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề và nội dung.', duration: 3000 });
            return;
        }
        if (recipientUserIds.length === 0) {
            show({ type: 'warning', title: 'Chưa chọn người nhận', message: 'Vui lòng chọn ít nhất một người nhận.', duration: 3000 });
            return;
        }

        try {
            await sendBulkNotification({
                userIds: recipientUserIds,
                title: title.trim() + " - " + "Thông báo từ " + (currentUser?.fullName ?? 'Ban quản trị'),
                message: message.trim(),
                type: notifType,
            }).unwrap();
            show({ type: 'success', title: 'Đã gửi!', message: `Thông báo đã được gửi đến ${recipientUserIds.length} người.`, duration: 4000 });
            setIsSent(true);
            setTitle('');
            setMessage('');
            setSelectedUserIds(new Set());
        } catch (err: any) {
            show({ type: 'error', title: 'Thất bại', message: err?.data?.message ?? 'Không thể gửi thông báo.', duration: 4000 });
        }
    };

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath={clubIdParam ? `/clubs/${clubId}/notifications/send` : "/club/notifications/send"} isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Gửi Thông báo"
                breadcrumb={`Pages / Clubs / ${club?.clubName ?? club?.shortName ?? ''} / Notifications / Send`}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <i className="fas fa-bell text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gửi Thông báo</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {club ? club.clubName : ''} — Gửi thông báo đến thành viên
                            </p>
                        </div>
                    </div>

                    {loadingMembers ? (
                        <Loading />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Compose */}
                            <div className="space-y-5">
                                {/* Notification type */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <i className="fas fa-tag text-blue-500" /> Loại thông báo
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {NOTIFICATION_TYPES.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => setNotifType(t.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${notifType === t.value ? `${t.color} border-current` : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title & message */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <i className="fas fa-pen text-blue-500" /> Nội dung
                                    </h2>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Tiêu đề</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => { setTitle(e.target.value); setIsSent(false); }}
                                            placeholder="Nhập tiêu đề thông báo..."
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nội dung</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => { setMessage(e.target.value); setIsSent(false); }}
                                            placeholder="Nhập nội dung thông báo..."
                                            rows={5}
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Summary + send */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Sẽ gửi đến <span className="font-bold text-gray-900 dark:text-white">{recipientUserIds.length}</span> người nhận
                                        </div>
                                        {isSent && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                                                <i className="fas fa-check-circle" /> Đã gửi thành công
                                            </span>
                                        )}
                                    </div>
                                    {canSendNotification && (
                                        <button
                                            onClick={handleSend}
                                            disabled={isSending || recipientUserIds.length === 0 || !title.trim() || !message.trim()}
                                            className="w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {isSending ? (
                                                <><i className="fas fa-spinner fa-spin" /> Đang gửi...</>
                                            ) : (
                                                <><i className="fas fa-paper-plane" /> Gửi thông báo</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right: Recipients */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                {/* Target selector */}
                                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <i className="fas fa-users text-blue-500" /> Người nhận
                                    </h2>
                                    <div className="flex gap-2 flex-wrap">
                                        {([
                                            { key: 'all', label: 'Toàn bộ CLB', icon: 'fa-users' },
                                            { key: 'department', label: 'Theo phòng ban', icon: 'fa-sitemap' },
                                            { key: 'select', label: 'Chọn thủ công', icon: 'fa-user-check' },
                                        ] as const).map((opt) => (
                                            <button
                                                key={opt.key}
                                                onClick={() => { setTarget(opt.key); setSelectedUserIds(new Set()); setSelectedDeptId(null); }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${target === opt.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}
                                            >
                                                <i className={`fas ${opt.icon} text-[11px]`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {target === 'department' && (
                                        <div className="mt-3">
                                            <select
                                                value={selectedDeptId ?? ''}
                                                onChange={(e) => { setSelectedDeptId(e.target.value ? Number(e.target.value) : null); setMemberSearch(''); setSelectedUserIds(new Set()); }}
                                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="">-- Chọn phòng ban --</option>
                                                {(departments ?? []).map((d, i) => {
                                                    const id = (d as any).DepartmentId ?? (d as any).departmentId ?? i;
                                                    const name = (d as any).Name ?? (d as any).name ?? '';
                                                    return <option key={id} value={id}>{name}</option>;
                                                })}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Member list */}
                                {target === 'department' && !selectedDeptId ? (
                                    <div className="flex flex-col items-center justify-center flex-1 py-10 text-center text-gray-500 dark:text-gray-400">
                                        <i className="fas fa-sitemap text-4xl mb-3 opacity-30" />
                                        <p className="text-sm">Chọn phòng ban để xem danh sách thành viên</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search + info row */}
                                        <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/50 space-y-2">
                                            {target != 'all' && (
                                                <div className="relative">
                                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                                    <input
                                                        type="text"
                                                        value={memberSearch}
                                                        onChange={(e) => setMemberSearch(e.target.value)}
                                                    placeholder="Lọc theo tên, email..."
                                                    className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            )}
                                            {target === 'all' && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                                    {visibleMembers.length} thành viên sẽ nhận thông báo
                                                </p>
                                            )}
                                            {target === 'select' && (
                                                <label className="flex items-center gap-2 px-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleMembers.length > 0 && visibleMembers.every((m) => selectedUserIds.has(m.userId))}
                                                        onChange={(e) => toggleAll(e.target.checked)}
                                                        className="w-4 h-4 rounded accent-blue-500"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                        Chọn tất cả ({visibleMembers.length})
                                                    </span>
                                                </label>
                                            )}
                                            {target === 'department' && selectedDeptId && (
                                                <label className="flex items-center gap-2 px-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleMembers.length > 0 && visibleMembers.every((m) => selectedUserIds.has(m.userId))}
                                                        onChange={(e) => toggleAll(e.target.checked)}
                                                        className="w-4 h-4 rounded accent-blue-500"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                        Chọn tất cả ({visibleMembers.length})
                                                    </span>
                                                </label>
                                            )}
                                        </div>

                                        <div className="overflow-y-auto flex-1 px-3 py-2 space-y-1 max-h-[420px]">
                                            {visibleMembers.length === 0 ? (
                                                <div className="py-8 text-center text-sm text-gray-400">
                                                    <i className="fas fa-users-slash text-3xl mb-2 opacity-30 block" />
                                                    Không có thành viên nào.
                                                </div>
                                            ) : (
                                                visibleMembers.map((m) => (
                                                    <MemberCheckbox
                                                        key={m.clubMemberId}
                                                        member={m}
                                                        checked={target === 'all' ? true : selectedUserIds.has(m.userId)}
                                                        onChange={target === 'all' ? () => {} : toggleMember}
                                                        disabled={target === 'all'}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
