import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubByIdQuery, useUpdateClubMutation } from '~/cores/api';
import { useNotification } from '~/components/Notification';
import { validateClubForm, type ClubFormData } from '~/utils/validation';


export default function ClubEditModule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

    const { data: club, isLoading: isLoadingClub, error: loadError } = useGetClubByIdQuery(Number(id));
    const [updateClub, { isLoading: isUpdating }] = useUpdateClubMutation();
    const { show: showNotification } = useNotification();

    const [formData, setFormData] = useState<ClubFormData>({
        clubName: '',
        shortName: '',
        description: '',
        email: '',
        phoneNumber: '',
        address: '',
        websiteUrl: '',
        facebookUrl: '',
        logoUrl: '',
        coverImageUrl: '',
        foundedDate: new Date().toISOString().split('T')[0],
        isActive: true,
        isPublic: true,
    });

    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClubFormData, string>>>({});

    useEffect(() => {
        if (club) {
            setFormData({
                clubName: club.clubName ?? '',
                shortName: club.shortName ?? '',
                description: club.description ?? '',
                email: club.email ?? '',
                phoneNumber: club.phoneNumber ?? '',
                address: club.address ?? '',
                websiteUrl: club.websiteUrl ?? '',
                facebookUrl: club.facebookUrl ?? '',
                logoUrl: club.logoUrl ?? '',
                coverImageUrl: club.coverImageUrl ?? '',
                foundedDate: club.foundedDate
                    ? new Date(club.foundedDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                isActive: club.isActive ?? true,
                isPublic: club.isPublic ?? true,
            });
        }
    }, [club]);

    const handleInputChange = (field: keyof ClubFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateClubForm(formData);
        if (!validation.success) {
            setFormErrors(validation.errors);
            return;
        }

        try {
            await updateClub({ id: Number(id), club: formData }).unwrap();
            showNotification({
                type: 'success',
                title: 'Cập nhật thành công!',
                message: `Câu lạc bộ “${formData.clubName}” đã được cập nhật.`,
                duration: 3000,
            });
            navigate(`/clubs/${id}`);
        } catch (err) {
            const rtkErr = err as { data?: { message?: string } };
            showNotification({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: rtkErr?.data?.message ?? 'Vui lòng thử lại.',
                duration: 4000,
            });
        }
    };

    return (
        <div className="min-h-screen">
            {/* Settings Button - Fixed bottom right */}
            <SettingButton />

            <Sidebar
                currentPath="/clubs"
                isOpen={isSidebarOpen}
            />

            <HeaderBar
                title="Chỉnh sửa Câu lạc bộ"
                breadcrumb="Pages / Clubs / Edit"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            {/* Main Content */}
            <main className={`pt-24 px-6 py-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                }`}>

                {/* Loading state */}
                {isLoadingClub && (
                    <div className="flex items-center justify-center py-20">
                        <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
                    </div>
                )}

                {/* Error loading state */}
                {loadError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                        <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                        <p className="text-red-600 dark:text-red-400">Lỗi khi tải thông tin câu lạc bộ</p>
                    </div>
                )}

                {!isLoadingClub && club && (
                    <div className="w-full">
                        {/* Title */}
                        <div className="mb-6">
                            <button
                                onClick={() => navigate(`/clubs/${id}`)}
                                className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 flex items-center gap-2"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chỉnh Sửa Câu Lạc Bộ</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cập nhật thông tin câu lạc bộ của bạn</p>
                        </div>


                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Cover Image Upload */}
                            <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                                {formData.coverImageUrl ? (
                                    <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-white">
                                        <i className="fas fa-upload text-4xl mb-2 opacity-70"></i>
                                        <p className="text-sm opacity-90">Tải ảnh bìa</p>
                                    </div>
                                )}

                                {/* Logo Upload */}
                                <div className="absolute bottom-4 left-4 w-20 h-20 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border-4 border-gray-50 dark:border-gray-900">
                                    {formData.logoUrl ? (
                                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <i className="fas fa-building text-gray-400 dark:text-gray-500 text-2xl"></i>
                                    )}
                                </div>
                            </div>

                            {/* URL Inputs for Images */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">URL Logo</label>
                                    <div className="relative">
                                        <i className="fas fa-image absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                        <input
                                            type="url"
                                            value={formData.logoUrl}
                                            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </div>
                                    {formErrors.logoUrl && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.logoUrl}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">URL Ảnh Bìa</label>
                                    <div className="relative">
                                        <i className="fas fa-image absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                        <input
                                            type="url"
                                            value={formData.coverImageUrl}
                                            onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                            placeholder="https://example.com/cover.png"
                                        />
                                    </div>
                                    {formErrors.coverImageUrl && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.coverImageUrl}</p>}
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-blue-500"></i>
                                    Thông Tin Cơ Bản
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Tên Câu Lạc Bộ *</label>
                                            <input
                                                type="text"
                                                value={formData.clubName}
                                                onChange={(e) => handleInputChange('clubName', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.clubName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="VD: CLB Tin Học"
                                            />
                                            {formErrors.clubName && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.clubName}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Tên Viết Tắt *</label>
                                            <input
                                                type="text"
                                                value={formData.shortName}
                                                onChange={(e) => handleInputChange('shortName', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.shortName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="VD: CLBTH"
                                            />
                                            {formErrors.shortName && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.shortName}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Mô Tả *</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={3}
                                            className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none`}
                                            placeholder="Mô tả về câu lạc bộ..."
                                        />
                                        {formErrors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.description}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Ngày Thành Lập</label>
                                        <div className="relative">
                                            <i className="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-white"></i>
                                            <input
                                                type="date"
                                                value={formData.foundedDate}
                                                onChange={(e) => handleInputChange('foundedDate', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* isPublic Toggle */}
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Trạng Thái</label>
                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-globe text-blue-500"></i>
                                                <span className="text-gray-900 dark:text-white text-sm">Công khai</span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Mọi người đều có thể tìm thấy CLB</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isPublic}
                                                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* isActive Toggle */}
                                    <div>
                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-check-circle text-green-500"></i>
                                                <span className="text-gray-900 dark:text-white text-sm">Hoạt động</span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Câu lạc bộ đang hoạt động</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                                    <i className="fas fa-address-book text-blue-500"></i>
                                    Thông Tin Liên Hệ
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Email *</label>
                                        <div className="relative">
                                            <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="club@example.com"
                                            />
                                        </div>
                                        {formErrors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Số Điện Thoại *</label>
                                        <div className="relative">
                                            <i className="fas fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="0123 456 789"
                                            />
                                        </div>
                                        {formErrors.phoneNumber && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.phoneNumber}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Facebook</label>
                                        <div className="relative">
                                            <i className="fab fa-facebook absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                            <input
                                                type="url"
                                                value={formData.facebookUrl}
                                                onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.facebookUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="https://facebook.com/club"
                                            />
                                        </div>
                                        {formErrors.facebookUrl && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.facebookUrl}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Website</label>
                                        <div className="relative">
                                            <i className="fas fa-globe absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                            <input
                                                type="url"
                                                value={formData.websiteUrl}
                                                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.websiteUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="https://club.com"
                                            />
                                        </div>
                                        {formErrors.websiteUrl && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.websiteUrl}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">Địa Chỉ *</label>
                                        <div className="relative">
                                            <i className="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                className={`w-full bg-gray-50 dark:bg-gray-900 border ${formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                                                placeholder="55 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội"
                                            />
                                        </div>
                                        {formErrors.address && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.address}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/clubs/${id}`)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    disabled={isUpdating}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i>
                                            Lưu Thay Đổi
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
