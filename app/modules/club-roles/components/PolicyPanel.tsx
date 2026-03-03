import { useState, useEffect, useRef } from 'react';
import {
    useGetPolicyGroupsQuery,
    useGetPoliciesByGroupQuery,
    useGetClubRolePoliciesQuery,
    useUpdateClubRolePoliciesMutation,
} from '~/cores/api';
import type { ClubRole, PolicyGroup } from '~/cores/api';
import { useNotification } from '~/components/Notification';

/* ─── Single policy group row (lazy loads policies on expand) ────────────── */
interface PolicyGroupRowProps {
    group: PolicyGroup;
    selectedPolicyIds: Set<number>;
    readOnly: boolean;
    onToggle: (policyId: number) => void;
    onToggleAll: (policyIds: number[], selectAll: boolean) => void;
}

function PolicyGroupRow({ group, selectedPolicyIds, readOnly, onToggle, onToggleAll }: PolicyGroupRowProps) {
    const [expanded, setExpanded] = useState(false);
    const { data: policies, isLoading } = useGetPoliciesByGroupQuery(group.policyGroupId);

    const checkedCount = policies?.filter((p) => selectedPolicyIds.has(p.id)).length ?? 0;
    const total = policies?.length ?? 0;
    const allChecked = total > 0 && checkedCount === total;
    const someChecked = checkedCount > 0 && checkedCount < total;

    const selectAllRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someChecked;
        }
    }, [someChecked]);

    return (
        <div
            className={`border rounded-xl overflow-hidden transition-colors ${checkedCount > 0
                ? 'border-blue-400 dark:border-blue-600'
                : 'border-gray-200 dark:border-gray-700'
                }`}
        >
            {/* Group header */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={`cursor-pointer w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${checkedCount > 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Select-all checkbox */}
                    {!readOnly && policies && policies.length > 0 && (
                        <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleAll(policies.map((p) => p.id), e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-blue-600 flex-shrink-0 cursor-pointer"
                            title={allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        />
                    )}
                    <i
                        className={`fas fa-chevron-right text-xs w-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''
                            } ${checkedCount > 0 ? 'text-blue-500' : 'text-gray-400'
                            }`}
                    ></i>
                    <div className="min-w-0">
                        <p className={`text-sm truncate ${checkedCount > 0
                            ? 'font-bold text-blue-700 dark:text-blue-300'
                            : 'font-semibold text-gray-900 dark:text-white'
                            }`}>
                            {group.name}
                        </p>
                        {group.title && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.title}</p>
                        )}
                    </div>
                </div>
                {/* Badge — show even when collapsed if there are selected policies */}
                {policies && checkedCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 bg-blue-500 text-white">
                        {checkedCount}/{total}
                    </span>
                )}
                {policies && checkedCount === 0 && expanded && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        0/{total}
                    </span>
                )}
            </button>

            {expanded && (
                <div className="bg-gray-50/50 dark:bg-gray-900/30">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                            <i className="fas fa-spinner fa-spin text-sm"></i>
                            <span className="text-sm">Đang tải...</span>
                        </div>
                    ) : !policies || policies.length === 0 ? (
                        <p className="text-sm text-gray-400 italic px-4 py-4">
                            Không có policy nào trong nhóm này.
                        </p>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 p-3">
                            {policies.map((policy) => {
                                const checked = selectedPolicyIds.has(policy.id);
                                return (
                                    <label
                                        key={policy.id}
                                        title={policy.description ?? policy.title}
                                        className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${checked
                                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/25 dark:border-blue-600'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60'
                                            } ${readOnly
                                                ? 'cursor-default'
                                                : 'hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => !readOnly && onToggle(policy.id)}
                                            disabled={readOnly}
                                            className="mt-0.5 w-3.5 h-3.5 accent-blue-600 flex-shrink-0 cursor-pointer disabled:cursor-default"
                                        />
                                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                                            {policy.title}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main panel ─────────────────────────────────────────────────────────── */
interface PolicyPanelProps {
    role: ClubRole;
    readOnly?: boolean;
    onClose: () => void;
}

export function PolicyPanel({ role, readOnly = false, onClose }: PolicyPanelProps) {
    const { show: showNotification } = useNotification();

    const { data: groups, isLoading: groupsLoading } = useGetPolicyGroupsQuery();
    const { data: assignedIds, isLoading: assignedLoading } = useGetClubRolePoliciesQuery(
        role.clubRoleId
    );
    const [updatePolicies, { isLoading: isSaving }] = useUpdateClubRolePoliciesMutation();

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [seeded, setSeeded] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Seed checkboxes once assignedIds resolves (including empty array)
    useEffect(() => {
        if (assignedIds !== undefined) {
            setSelected(new Set(assignedIds));
            setSeeded(true);
            setDirty(false);
        }
    }, [assignedIds]);

    const handleToggle = (policyId: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(policyId) ? next.delete(policyId) : next.add(policyId);
            return next;
        });
        setDirty(true);
    };

    const handleToggleAll = (policyIds: number[], selectAll: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (selectAll) {
                policyIds.forEach((id) => next.add(id));
            } else {
                policyIds.forEach((id) => next.delete(id));
            }
            return next;
        });
        setDirty(true);
    };

    const handleSave = async () => {
        try {
            await updatePolicies({ roleId: role.clubRoleId, policyIds: [...selected] }).unwrap();
            showNotification({
                type: 'success',
                title: 'Cập nhật quyền thành công!',
                message: `Vai trò "${role.roleName}" đã được cập nhật quyền.`,
                duration: 3000,
            });
            setDirty(false);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({
                type: 'error',
                title: 'Cập nhật quyền thất bại',
                message: rtkErr?.data?.message ?? 'Vui lòng thử lại.',
                duration: 4000,
            });
        }
    };

    const isHeaderLoading = groupsLoading || assignedLoading;

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-lg h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
                style={{ animation: 'slideInRight 0.25s ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to   { transform: translateX(0);    opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <i className="fas fa-shield-alt text-blue-600 dark:text-blue-400 text-sm"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {role.roleName}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {readOnly ? 'Xem quyền' : 'Phân quyền'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {isHeaderLoading ? (
                        // Wait for BOTH groups AND assignedIds before rendering anything
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                            <i className="fas fa-spinner fa-spin text-2xl"></i>
                            <span className="text-sm">Đang tải danh sách quyền...</span>
                        </div>
                    ) : !groups || groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <i className="fas fa-lock text-3xl mb-2 opacity-30"></i>
                            <p className="text-sm">Không có nhóm quyền nào.</p>
                        </div>
                    ) : seeded ? (
                        // Render groups only after assignedIds is ready → checkboxes are pre-ticked correctly
                        groups.map((group) => (
                            <PolicyGroupRow
                                key={group.policyGroupId}
                                group={group}
                                selectedPolicyIds={selected}
                                readOnly={readOnly}
                                onToggle={handleToggle}
                                onToggleAll={handleToggleAll}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                            <i className="fas fa-spinner fa-spin text-2xl"></i>
                            <span className="text-sm">Đang tải quyền của vai trò...</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!readOnly && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
                        <p className="text-xs">
                            {dirty ? (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <i className="fas fa-circle text-[6px]"></i>
                                    Chưa lưu thay đổi
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <i className="fas fa-check-circle text-xs"></i>
                                    Đã đồng bộ
                                </span>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !dirty}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                {isSaving && <i className="fas fa-spinner fa-spin text-xs"></i>}
                                Lưu quyền
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
