import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { getClubId, isLoggedIn } from '~/utils/auth';
import { useGetUserDepartmentsQuery, useGetDepartmentsQuery, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from '~/cores/api';
import { useClubRole } from '~/hooks/useClubRole';
import { useNotification } from '~/components/Notification';
import { validateDepartmentForm, type DepartmentFormData } from '~/utils/validation/schemas/departmentSchema';
import type { UserDepartment } from '~/cores/api/types';

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<number, { gradient: string; badge: string; icon: string; label: string }> = {
    0: { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-500 text-white', icon: 'fa-user', label: 'Chưa phân cấp' },
    1: { gradient: 'from-amber-500 to-yellow-500', badge: 'bg-amber-500 text-white', icon: 'fa-crown', label: 'Cấp 1' },
    2: { gradient: 'from-sky-500 to-blue-500', badge: 'bg-sky-500 text-white', icon: 'fa-user-tie', label: 'Cấp 2' },
    3: { gradient: 'from-emerald-500 to-green-500', badge: 'bg-emerald-500 text-white', icon: 'fa-users', label: 'Cấp 3' },
};

function getLevelConfig(level: number) {
    return LEVEL_CONFIG[level] || { gradient: 'from-purple-500 to-indigo-500', badge: 'bg-purple-500 text-white', icon: 'fa-layer-group', label: `Cấp ${level}` };
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditDepartmentModal({ dept, clubId, onClose }: { dept: UserDepartment; clubId: number; onClose: () => void }) {
    const { show: showNotification } = useNotification();
    const [updateDepartment, { isLoading }] = useUpdateDepartmentMutation();

    const [formData, setFormData] = useState<DepartmentFormData>({
        name: dept.departmentName,
        description: dept.description && dept.description !== 'string' ? dept.description : '',
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});

    const handleChange = (field: keyof DepartmentFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateDepartmentForm(formData);
        if (!validation.success) {
            setFormErrors(validation.errors);
            return;
        }
        try {
            await updateDepartment({
                clubId,
                id: dept.departmentId,
                department: { Name: validation.data.name, Description: validation.data.description },
            }).unwrap();
            showNotification({ type: 'success', title: 'Cập nhật thành công!', message: `Ban "${validation.data.name}" đã được cập nhật.`, duration: 3000 });
            onClose();
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({ type: 'error', title: 'Cập nhật thất bại!', message: rtkErr?.data?.message ?? 'Vui lòng thử lại sau.', duration: 4000 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <i className="fas fa-edit text-amber-600 dark:text-amber-400"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa ban</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{dept.departmentName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Tên ban <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            maxLength={100}
                            placeholder="Nhập tên ban..."
                            className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${
                                formErrors.name ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                            }`}
                        />
                        {formErrors.name && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                <i className="fas fa-exclamation-circle"></i>{formErrors.name}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.name.length}/100</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
                        <textarea
                            value={formData.description ?? ''}
                            onChange={e => handleChange('description', e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Nhập mô tả ban (tuỳ chọn)..."
                            className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none ${
                                formErrors.description ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                            }`}
                        />
                        {formErrors.description && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                <i className="fas fa-exclamation-circle"></i>{formErrors.description}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 text-right">{(formData.description ?? '').length}/500</p>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} disabled={isLoading}
                            className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                            Hủy
                        </button>
                        <button type="submit" disabled={isLoading}
                            className="cursor-pointer px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                            {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteDepartmentModal({ dept, clubId, onClose }: { dept: UserDepartment; clubId: number; onClose: () => void }) {
    const { show: showNotification } = useNotification();
    const [deleteDepartment, { isLoading }] = useDeleteDepartmentMutation();

    const handleConfirm = async () => {
        try {
            await deleteDepartment({ clubId, id: dept.departmentId }).unwrap();
            showNotification({ type: 'success', title: 'Xóa ban thành công!', message: `Ban "${dept.departmentName}" đã được xóa.`, duration: 3000 });
            onClose();
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({ type: 'error', title: 'Xóa ban thất bại!', message: rtkErr?.data?.message ?? 'Vui lòng thử lại sau.', duration: 4000 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/40 flex-shrink-0">
                        <i className="fas fa-trash-alt text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xóa ban</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{dept.departmentName}</p>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Bạn có chắc muốn xóa ban <span className="font-semibold text-gray-900 dark:text-white">"{dept.departmentName}"</span>?
                    Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={isLoading}
                        className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                        Hủy
                    </button>
                    <button onClick={handleConfirm} disabled={isLoading}
                        className="cursor-pointer px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                        Xóa ban
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Department Card ──────────────────────────────────────────────────────────

function DepartmentCard({ dept, onEdit, onDelete }: { dept: UserDepartment; onEdit: (d: UserDepartment) => void; onDelete: (d: UserDepartment) => void }) {
    const navigate = useNavigate();
    const primaryRole = dept.roles?.[0];
    const levelConfig = primaryRole !== undefined ? getLevelConfig(primaryRole.level) : null;

    return (
        <div
            onClick={() => navigate(`/department/${dept.departmentId}`)}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer"
        >
            {/* Color strip */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

            <div className="p-5 flex flex-col h-full">
                {/* Top: Icon + Name + CreatedAt */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                        <i className="fas fa-sitemap text-lg"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {dept.departmentName}
                        </h3>
                        {/* <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {dept.createdAt ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    <i className="far fa-calendar-alt text-[8px]"></i>
                                    {new Date(dept.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    <i className="far fa-calendar-alt text-[8px]"></i>
                                    Không xác định
                                </span>
                            )}
                            {levelConfig && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${levelConfig.badge}`}>
                                    <i className={`fas ${levelConfig.icon} text-[8px]`}></i>
                                    {levelConfig.label}
                                </span>
                            )}
                        </div> */}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                    {dept.description && dept.description !== 'string' ? dept.description : 'Chưa có mô tả'}
                </p>

                {/* Bottom Stats & Actions */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <i className="fas fa-users text-blue-500 text-[10px]"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">{dept.memberCount ?? 0}</span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Thành viên</span>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                <i className="fas fa-user-tag text-amber-500 text-[10px]"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">{dept.roleCount ?? dept.roles?.length ?? 0}</span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Vai trò</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(dept); }}
                            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-all shadow-sm"
                            title="Sửa"
                        >
                            <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(dept); }}
                            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-all shadow-sm"
                            title="Xóa"
                        >
                            <i className="fas fa-trash-alt text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllDepartmentsModule() {
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const clubId = getClubId();
    const loggedIn = isLoggedIn();
    const { isClubManager } = useClubRole();

    const { data: allDeptData, isLoading: allLoading, error: allError } = useGetDepartmentsQuery(
        clubId,
        { skip: !isClubManager || !loggedIn || !clubId || clubId <= 0 }
    );
    const { data: userDeptData, isLoading: userLoading, error: userError } = useGetUserDepartmentsQuery(
        { clubId },
        { skip: isClubManager || !loggedIn || !clubId || clubId <= 0 }
    );

    const departments = isClubManager ? allDeptData : userDeptData;
    const isLoading = isClubManager ? allLoading : userLoading;
    const error = isClubManager ? allError : userError;
    console.log('Fetched departments:', departments);
    const [search, setSearch] = useState('');
    const [editTarget, setEditTarget] = useState<UserDepartment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserDepartment | null>(null);

    const allDepartments = departments ?? [];
    const filteredDepartments = allDepartments.filter((d) =>
        d.departmentName.toLowerCase().includes(search.toLowerCase()) ||
        (d.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/department" isOpen={isSidebarOpen} />
            <HeaderBar
                title="Quản lý Ban / Bộ phận"
                breadcrumb="Pages / Departments"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 px-6 pb-8 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* No club guard */}
                {!clubId && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center mt-6">
                        <div className="w-20 h-20 mx-auto mb-5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-building text-3xl text-blue-500"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa chọn câu lạc bộ</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Vui lòng chọn hoặc tham gia câu lạc bộ để xem danh sách Ban / Bộ phận.
                        </p>
                    </div>
                )}

                {clubId > 0 && (
                    <>
                        {/* Search + Actions bar */}
                        <div className="flex items-center gap-4 mb-6 flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm kiếm theo tên hoặc mô tả ban..."
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {!isLoading && filteredDepartments.length > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {filteredDepartments.length === allDepartments.length
                                            ? `${allDepartments.length} ban`
                                            : `${filteredDepartments.length} / ${allDepartments.length} ban`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        {isLoading ? (
                            <Loading />
                        ) : error ? (
                            <Error title="Lỗi khi tải danh sách bộ phận." error={error} />
                        ) : filteredDepartments.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center">
                                <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                                    <i className={`fas ${search ? 'fa-search' : 'fa-sitemap'} text-3xl text-gray-300 dark:text-gray-500`}></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {search ? 'Không tìm thấy ban / bộ phận' : 'Chưa có ban / bộ phận nào'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {search
                                        ? `Không có kết quả phù hợp với "${search}"`
                                        : 'Câu lạc bộ chưa có ban nào. Hãy tạo ban đầu tiên!'}
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
                                {filteredDepartments.map((dept) => (
                                    <DepartmentCard
                                        key={dept.departmentId}
                                        dept={dept}
                                        onEdit={setEditTarget}
                                        onDelete={setDeleteTarget}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modals */}
            {editTarget && clubId > 0 && (
                <EditDepartmentModal dept={editTarget} clubId={clubId} onClose={() => setEditTarget(null)} />
            )}
            {deleteTarget && clubId > 0 && (
                <DeleteDepartmentModal dept={deleteTarget} clubId={clubId} onClose={() => setDeleteTarget(null)} />
            )}
        </div>
    );
}
