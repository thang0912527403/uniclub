import React, { useState, useEffect } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useParams, useNavigate } from 'react-router';
import { useGetClubPostByIdQuery, useUpdateClubPostMutation } from '~/cores/api/clubApi';

export default function EditClubPostModule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const [updateClubPost] = useUpdateClubPostMutation();

    const [formData, setFormData] = useState({
        title: '',
        caption: '',
        content: '',
        imageUrl: null as string | null
    });

    const { data: post, isLoading, isError } = useGetClubPostByIdQuery(Number(id));

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                caption: post.caption || '',
                content: post.content || '',
                imageUrl: post.imageUrl || ''
            });
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("caption", formData.caption);
        formDataToSend.append("content", formData.content);

        if (formData.imageUrl) {
            formDataToSend.append("imageUrl", formData.imageUrl);
        }

        try {
            await updateClubPost({
                id: Number(id),
                formData: formDataToSend
            }).unwrap();

            alert("Cập nhật thành công!");
            navigate("/club/posts");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/club-posts" isOpen={isSidebarOpen} />

            <HeaderBar
                title="Chỉnh sửa bài viết"
                breadcrumb="Pages / Club Feed / Edit Post"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>

                {/* Nút quay lại nhanh */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <i className="fas fa-arrow-left"></i> QUAY LẠI DANH SÁCH
                </button>

                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Cột trái: Form nhập liệu chính */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <i className="fas fa-pen-nib text-blue-500"></i> Nội dung bài viết
                                </h3>

                                <div className="space-y-4">
                                    {/* Input Title */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Tiêu đề bài viết</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold"
                                            placeholder="Nhập tiêu đề ấn tượng..."
                                        />
                                    </div>

                                    {/* Input Caption */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Mô tả ngắn (Caption)</label>
                                        <input
                                            type="text"
                                            name="caption"
                                            value={formData.caption}
                                            onChange={handleChange}
                                            className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-blue-600 dark:text-blue-300 italic font-medium"
                                            placeholder="Dòng dẫn dắt bài viết..."
                                        />
                                    </div>

                                    {/* Input Content */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Nội dung chi tiết</label>
                                        <textarea
                                            name="content"
                                            rows={8}
                                            value={formData.content}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white leading-relaxed"
                                            placeholder="Nội dung đầy đủ bài viết..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Ảnh và Hành động */}
                        <div className="space-y-6">
                            {/* Ảnh đại diện bài viết */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Ảnh minh họa</h3>
                                <div className="relative group">
                                    {formData.imageUrl?.trim() && (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                        <button type="button" className="bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-bold shadow-lg">
                                            THAY ĐỔI ẢNH
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-3 text-[10px] text-gray-500 text-center italic">Định dạng hỗ trợ: JPG, PNG, WEBP</p>
                            </div>

                            {/* Nút hành động */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-3">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all"
                                >
                                    LƯU THAY ĐỔI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                >
                                    HỦY BỎ
                                </button>
                                <div className="pt-3 border-t dark:border-gray-700 mt-3 flex items-center justify-center gap-2 text-xs text-orange-500 font-bold">
                                    <i className="fas fa-info-circle"></i>
                                    <span>Bài viết sẽ tự động cập nhật</span>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}