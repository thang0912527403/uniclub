import { useState } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import {
    useCreateClubRoleMutation,
    useUpdateClubRoleMutation,
    useDeleteClubRoleMutation,
    type ClubRole,
} from '~/cores/api';
import { useGetClubRolesByClubIdQuery } from '~/cores/api/clubRoleApi';
import { getClubId } from '~/utils/auth';
import { validateClubRoleForm, type ClubRoleFormData } from '~/utils/validation';
import { PolicyPanel } from './components/PolicyPanel';
import { Error } from '~/components/Error';

/* ─── Role Form Modal ─────────────────────────────────────────────────────── */
interface RoleModalProps {
    initial?: ClubRole | null;
    onClose: () => void;
    onSave: (data: ClubRoleFormData) => Promise<void>;
    isSaving: boolean;
}

function RoleModal({ initial, onClose, onSave, isSaving }: RoleModalProps) {
    const isEdit = !!initial;
    const [form, setForm] = useState<ClubRoleFormData>({
        roleName: initial?.roleName ?? '',
        description: initial?.description ?? '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof ClubRoleFormData, string>>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateClubRoleForm(form);
        if (!validation.success) {
            setErrors(validation.errors);
            return;
        }
        setErrors({});
        await onSave(validation.data);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus'} text-blue-600 dark:text-blue-400`}></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên vai trò <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.roleName}
                            onChange={(e) => {
                                setForm((p) => ({ ...p, roleName: e.target.value }));
                                if (errors.roleName) setErrors((p) => ({ ...p, roleName: undefined }));
                            }}
                            placeholder="VD: Chủ nhiệm, Phó chủ nhiệm..."
                            className={`w-full rounded-lg px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border ${errors.roleName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                                } focus:outline-none focus:border-blue-500 transition-colors`}
                        />
                        {errors.roleName && (
                            <p className="text-red-500 text-xs mt-1">{errors.roleName}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mô tả
                        </label>
                        <textarea
                            value={form.description ?? ''}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="Mô tả quyền hạn và nhiệm vụ của vai trò..."
                            className="w-full rounded-lg px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="cursor-pointer px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSaving && <i className="fas fa-spinner fa-spin text-sm"></i>}
                            {isEdit ? 'Lưu thay đổi' : 'Thêm vai trò'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Delete Confirm Modal ────────────────────────────────────────────────── */
interface DeleteModalProps {
    role: ClubRole;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

function DeleteModal({ role, onConfirm, onCancel, isLoading }: DeleteModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <i className="fas fa-trash text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xóa vai trò</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{role.roleName}</p>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Bạn có chắc muốn xóa vai trò <span className="font-semibold">"{role.roleName}"</span>?
                    Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="cursor-pointer px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading && <i className="fas fa-spinner fa-spin text-sm"></i>}
                        Xóa vai trò
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Module ─────────────────────────────────────────────────────────── */
export default function ClubRolesModule() {
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { show: showNotification } = useNotification();
    const clubId = getClubId();
    console.log(clubId);
    const { data: roles, isLoading, error } = useGetClubRolesByClubIdQuery(clubId, {
        skip: !clubId,
    });
    const [createRole, { isLoading: isCreating }] = useCreateClubRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateClubRoleMutation();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteClubRoleMutation();

    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [selectedRole, setSelectedRole] = useState<ClubRole | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ClubRole | null>(null);
    const [policyTarget, setPolicyTarget] = useState<{ role: ClubRole; readOnly: boolean } | null>(null);
    const [search, setSearch] = useState('');

    const filteredRoles = (roles ?? []).filter((r) =>
        r.roleName.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (data: ClubRoleFormData) => {
        try {
            if (modalMode === 'create') {
                await createRole({ 
                    roleName: data.roleName, 
                    description: data.description,
                    clubId: clubId
                }).unwrap();
                showNotification({ type: 'success', title: 'Thêm vai trò thành công!', message: `Vai trò "${data.roleName}" đã được tạo.`, duration: 3000 });
            } else if (modalMode === 'edit' && selectedRole) {
                await updateRole({ id: selectedRole.clubRoleId, body: { roleName: data.roleName, description: data.description } }).unwrap();
                showNotification({ type: 'success', title: 'Cập nhật vai trò thành công!', message: `Vai trò "${data.roleName}" đã được cập nhật.`, duration: 3000 });
            }
            setModalMode(null);
            setSelectedRole(null);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({ type: 'error', title: 'Thao tác thất bại', message: rtkErr?.data?.message ?? 'Vui lòng thử lại.', duration: 4000 });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteRole(deleteTarget.clubRoleId).unwrap();
            showNotification({ type: 'success', title: 'Xóa vai trò thành công!', message: `Vai trò "${deleteTarget.roleName}" đã được xóa.`, duration: 3000 });
            setDeleteTarget(null);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({ type: 'error', title: 'Xóa vai trò thất bại', message: rtkErr?.data?.message ?? 'Vui lòng thử lại.', duration: 4000 });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />

            <Sidebar currentPath="/club-roles" isOpen={isSidebarOpen} />

            <HeaderBar
                title="Quản lý Vai Trò"
                breadcrumb="Pages / Club Roles"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main
                className={`pt-24 px-6 pb-8 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                    }`}
            >
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vai trò câu lạc bộ</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Quản lý các vai trò và quyền hạn trong câu lạc bộ
                        </p>
                    </div>
                    <button
                        onClick={() => { setSelectedRole(null); setModalMode('create'); }}
                        className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md"
                    >
                        <i className="fas fa-plus text-sm"></i>
                        Thêm vai trò
                    </button>
                </div>

                {/* Search bar */}
                <div className="relative mb-6 max-w-sm">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm vai trò..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Content */}
                {isLoading ? (
                    <Loading />
                ) : error ? (
                    <Error title="Lỗi khi tải danh sách câu lạc bộ." error={error} />
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        {filteredRoles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                                <i className="fas fa-shield-alt text-5xl mb-4 opacity-30"></i>
                                <p className="text-lg font-medium">
                                    {search ? 'Không tìm thấy vai trò phù hợp' : 'Chưa có vai trò nào'}
                                </p>
                                {!search && (
                                    <button
                                        onClick={() => { setSelectedRole(null); setModalMode('create'); }}
                                        className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                                    >
                                        Thêm vai trò đầu tiên
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên vai trò</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredRoles.map((role, idx) => (
                                        <tr
                                            key={role.clubRoleId}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                                        <i className="fas fa-shield-alt text-blue-600 dark:text-blue-400 text-sm"></i>
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{role.roleName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {role.description || <span className="italic opacity-50">Chưa có mô tả</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {role.createdAt
                                                    ? new Date(role.createdAt).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setPolicyTarget({ role, readOnly: true })}
                                                        title="Xem quyền"
                                                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                                                    >
                                                        <i className="fas fa-eye text-sm"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setPolicyTarget({ role, readOnly: false })}
                                                        title="Phân quyền"
                                                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
                                                    >
                                                        <i className="fas fa-key text-sm"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRole(role); setModalMode('edit'); }}
                                                        title="Chỉnh sửa"
                                                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                                                    >
                                                        <i className="fas fa-edit text-sm"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(role)}
                                                        title="Xóa"
                                                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                                                    >
                                                        <i className="fas fa-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Stats footer */}
                {!isLoading && !error && roles && roles.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Hiển thị {filteredRoles.length} / {roles.length} vai trò
                    </p>
                )}
            </main>

            {/* Modals */}
            {modalMode && (
                <RoleModal
                    initial={modalMode === 'edit' ? selectedRole : null}
                    onClose={() => { setModalMode(null); setSelectedRole(null); }}
                    onSave={handleSave}
                    isSaving={isCreating || isUpdating}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    role={deleteTarget}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}

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
