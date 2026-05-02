import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useCreateClubRequestMutation, useCheckPendingRequestQuery, type CreateClubRequestDto } from '~/cores/api/clubRequestApi';
import { useGetManagedClubsQuery, useGetUserRoleQuery } from '~/cores/api/userApi';
import { getUserId } from '~/utils/auth';
import { Loading } from '~/components/Loading';

interface ConfirmModalProps {
    clubName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

function ConfirmModal({ clubName, onConfirm, onCancel, isSubmitting }: ConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500">
                        <i className="fa-solid fa-paper-plane text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900">Xác nhận gửi yêu cầu</h3>
                        <p className="text-sm text-zinc-500">CLB: {clubName}</p>
                    </div>
                </div>
                <p className="text-zinc-600 mb-8 leading-relaxed">
                    Bạn có chắc muốn gửi yêu cầu thành lập câu lạc bộ <span className="font-semibold text-orange-500">"{clubName}"</span>? Yêu cầu sẽ được xét duyệt trong 3–5 ngày làm việc.
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
                        Xác nhận gửi
                    </button>
                </div>
            </div>
        </div>
    );
}

interface SuccessModalProps {
    clubName: string;
    onClose: () => void;
}

function SuccessModal({ clubName, onClose }: SuccessModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                    <i className="fa-solid fa-check text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Gửi yêu cầu thành công!</h3>
                <p className="text-zinc-500 text-sm mb-6">
                    Yêu cầu thành lập câu lạc bộ <span className="font-semibold text-orange-500">"{clubName}"</span> đã được gửi. Chúng tôi sẽ xét duyệt và thông báo kết quả sớm nhất.
                </p>
                <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all cursor-pointer"
                >
                    Về trang câu lạc bộ của tôi
                </button>
            </div>
        </div>
    );
}

const CreateClubRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ clubName: '', description: '', reason: '' });
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createRequest] = useCreateClubRequestMutation();
    const currentUserId = getUserId();

    const { data: hasPendingRequest, isLoading: pendingLoading } = useCheckPendingRequestQuery(currentUserId, { skip: !currentUserId });
    const { data: managedClubs, isLoading: managedLoading } = useGetManagedClubsQuery(currentUserId);
    const { data: userRoles, isLoading: rolesLoading } = useGetUserRoleQuery(currentUserId);
    const isAdmin = userRoles?.includes('Admin') ?? false;

    if (pendingLoading || managedLoading || rolesLoading) return <Loading />;
    if (hasPendingRequest || (managedClubs?.length ?? 0) > 0 || isAdmin) return <Navigate to="/403" />;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clubName.trim()) return;
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const data: CreateClubRequestDto = {
            userId: currentUserId,
            clubName: formData.clubName,
            description: formData.description,
            reason: formData.reason,
        };
        try {
            await createRequest(data).unwrap();
            setShowConfirm(false);
            setShowSuccess(true);
        } catch (error) {
            console.error(error);
            setShowConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        navigate('/manage-clubs');
    };

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-orange-500 transition-colors"
                    onClick={() => window.history.back()}
                >
                    <i className="fa-solid fa-arrow-left" />
                    Quay lại danh sách
                </button>

                <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden border border-zinc-200">
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

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-2">
                                Tên câu lạc bộ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <i className="fa-solid fa-quote-left" />
                                </span>
                                <input
                                    type="text"
                                    name="clubName"
                                    required
                                    value={formData.clubName}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: CLB Lập trình Sáng tạo"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-2">
                                Mô tả ngắn gọn
                            </label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Câu lạc bộ hoạt động về lĩnh vực gì? Mục tiêu chính là gì?..."
                                className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-2">
                                Lý do muốn thành lập CLB
                            </label>
                            <textarea
                                name="reason"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Tại sao trường/tổ chức cần có câu lạc bộ này?..."
                                className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={!formData.clubName.trim()}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-paper-plane" />
                                Gửi yêu cầu tạo CLB
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-circle-info text-orange-500 mt-1" />
                        <p className="text-xs text-orange-800">Yêu cầu sẽ được xét duyệt trong 3-5 ngày làm việc.</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-shield-check text-amber-500 mt-1" />
                        <p className="text-xs text-amber-800">Đảm bảo tên câu lạc bộ không vi phạm quy chuẩn văn hóa.</p>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <ConfirmModal
                    clubName={formData.clubName}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {showSuccess && (
                <SuccessModal
                    clubName={formData.clubName}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    );
};

export default CreateClubRequestPage;
