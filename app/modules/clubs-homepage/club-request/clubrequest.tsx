import React, { useState } from 'react';
import { useCreateClubRequestMutation, type CreateClubRequestDto } from '~/cores/api/clubRequestApi';
import { getUserId } from '~/utils/auth';

const CreateClubRequestPage: React.FC = () => {
    const [formData, setFormData] = useState({
        clubName: '',
        description: '',
        reason: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createRequest] = useCreateClubRequestMutation();
    const currentUserId = getUserId();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clubName.trim()) return;

        setIsSubmitting(true);
        const data: CreateClubRequestDto = {
            userId: currentUserId,
            clubName: formData.clubName,
            description: formData.description,
            reason: formData.reason
        };
        // Giả lập gọi API
        try {
            console.log('Submitting request:', formData);
            await createRequest(data).unwrap();
            alert('Yêu cầu tạo câu lạc bộ đã được gửi thành công!');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-2xl mx-auto">
                {/* Nút quay lại */}
                <button className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    onClick={() => window.history.back()}
                >
                    <i className="fa-solid fa-arrow-left" />
                    Quay lại danh sách
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    {/* Header với Gradient */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <i className="fa-solid fa-users-plus text-3xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Đăng ký thành lập Câu lạc bộ</h1>
                                <p className="text-orange-50/80 text-sm">Hãy chia sẻ ý tưởng của bạn để xây dựng cộng đồng</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Tên CLB */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Tên câu lạc bộ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <i className="fa-solid fa-quote-left" />
                                </span>
                                <input
                                    type="text"
                                    name="clubName"
                                    required
                                    value={formData.clubName}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: CLB Lập trình Sáng tạo"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Mô tả CLB */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Mô tả ngắn gọn
                            </label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Câu lạc bộ hoạt động về lĩnh vực gì? Mục tiêu chính là gì?..."
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Lý do thành lập */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Lý do muốn thành lập CLB
                            </label>
                            <textarea
                                name="reason"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Tại sao trường/tổ chức cần có câu lạc bộ này?..."
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.clubName.trim()}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <i className="fa-solid fa-spinner fa-spin" />
                                ) : (
                                    <i className="fa-solid fa-paper-plane" />
                                )}
                                Gửi yêu cầu tạo CLB
                            </button>
                        </div>
                    </form>
                </div>

                {/* Thông tin thêm bên dưới card */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 dark:bg-orange-500/5 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-circle-info text-orange-500 mt-1" />
                        <p className="text-xs text-orange-800 dark:text-orange-200/70">Yêu cầu sẽ được xét duyệt trong 3-5 ngày làm việc.</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/5 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-shield-check text-amber-500 mt-1" />
                        <p className="text-xs text-amber-800 dark:text-amber-200/70">Đảm bảo tên câu lạc bộ không vi phạm quy chuẩn văn hóa.</p>
                    </div>
                    {/* <div className="bg-blue-50 dark:bg-blue-500/5 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-envelope-open-text text-blue-500 mt-1" />
                        <p className="text-xs text-blue-800 dark:text-blue-200/70">Kết quả xét duyệt sẽ được gửi qua email cá nhân.</p>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default CreateClubRequestPage;