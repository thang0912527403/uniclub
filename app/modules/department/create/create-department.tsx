import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useCreateDepartmentMutation } from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { validateDepartmentForm, type DepartmentFormData } from '~/utils/validation/schemas/departmentSchema';
import { getClubId } from '~/utils/auth';
import { useClubRole } from '~/hooks/useClubRole';

export default function CreateDepartmentModule() {
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const { can } = useClubRole();
    const clubId = getClubId();
    const [createDepartment, { isLoading }] = useCreateDepartmentMutation();
    const { show: showNotification } = useNotification();

    const canCreateDepartment = can('createdepartment');

    const [formData, setFormData] = useState<DepartmentFormData>({
        name: '',
        description: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});

    const handleInputChange = (field: keyof DepartmentFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clubId || clubId <= 0) {
            showNotification({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy câu lạc bộ. Vui lòng thử lại.' });
            return;
        }

        const validation = validateDepartmentForm(formData);
        if (!validation.success) {
            setFormErrors(validation.errors);
            return;
        }
        setFormErrors({});

        try {
            await createDepartment({
                clubId,
                department: {
                    Name: validation.data.name,
                    Description: validation.data.description,
                },
            }).unwrap();

            showNotification({
                type: 'success',
                title: 'Tạo ban thành công!',
                message: `Ban "${validation.data.name}" đã được tạo thành công.`,
                duration: 3000,
            });

            setTimeout(() => navigate('/department'), 1500);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({
                type: 'error',
                title: 'Tạo ban thất bại',
                message: rtkErr?.data?.message ?? 'Vui lòng kiểm tra lại thông tin và thử lại.',
            });
        }
    };

    return (
        <div className="min-h-screen">
            <SettingButton />
            <Sidebar currentPath="/department/create" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar
                title="Tạo Ban / Bộ phận mới"
                breadcrumb="Pages / Departments / Create"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 px-6 py-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="max-w-2xl w-full">
                    {/* Back + Title */}
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/department')}
                            className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-3 flex items-center gap-2 text-sm"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Quay lại
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tạo Ban / Bộ phận mới</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Điền thông tin để tạo ban mới trong câu lạc bộ</p>
                    </div>

                    {/* No club guard */}
                    {(!clubId || clubId <= 0) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa chọn câu lạc bộ</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng tham gia câu lạc bộ trước khi tạo ban.</p>
                        </div>
                    )}

                    {clubId > 0 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Main info card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-gray-900 dark:text-white font-semibold mb-5 flex items-center gap-2">
                                    <i className="fas fa-sitemap text-blue-500"></i>
                                    Thông tin ban
                                </h3>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Tên ban <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            maxLength={100}
                                            placeholder="VD: Ban Truyền thông"
                                            className={`w-full bg-gray-50 dark:bg-gray-900 border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                                                formErrors.name
                                                    ? 'border-red-500 dark:border-red-500'
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        />
                                        {formErrors.name && (
                                            <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1">
                                                <i className="fas fa-exclamation-circle"></i>
                                                {formErrors.name}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.name.length}/100</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Mô tả
                                        </label>
                                        <textarea
                                            value={formData.description ?? ''}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            maxLength={500}
                                            rows={4}
                                            placeholder="Mô tả về nhiệm vụ và vai trò của ban..."
                                            className={`w-full bg-gray-50 dark:bg-gray-900 border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none ${
                                                formErrors.description
                                                    ? 'border-red-500 dark:border-red-500'
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        />
                                        {formErrors.description && (
                                            <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1">
                                                <i className="fas fa-exclamation-circle"></i>
                                                {formErrors.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1 text-right">{(formData.description ?? '').length}/500</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/department')}
                                    disabled={isLoading}
                                    className="cursor-pointer px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                {canCreateDepartment && (
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="cursor-pointer px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                                        {isLoading ? 'Đang tạo...' : 'Tạo ban'}
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
