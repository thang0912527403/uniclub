import React, { useState } from 'react';
import { ConfirmDialog } from '~/components/ConfirmDialog';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubPostsQuery } from '~/cores/api/clubApi';
import { data, useNavigate } from 'react-router';
import { useUpdateClubPostMutation, useDeleteClubPostMutation, useCreateClubPostMutation } from '~/cores/api/clubApi';
import { useGetCurrentUserQuery } from '~/cores/api/authApi';

export default function ClubPostModule() {
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const [postContent, setPostContent] = useState('');
    const { data: clubPosts = [], isLoading } = useGetClubPostsQuery();
    const { data: currentUser } = useGetCurrentUserQuery();
    console.log(currentUser);
    const [deleteClubPost] = useDeleteClubPostMutation();
    const [updateClubPost] = useUpdateClubPostMutation();
    const [createClubPost, { isLoading: isCreating }] = useCreateClubPostMutation();
    const navigate = useNavigate();

    // confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const clubStats = [
        { title: 'Tổng bài viết', value: clubPosts.length, icon: 'fa-paper-plane', color: 'bg-gray-800' },
        { title: 'Đang hiển thị', value: clubPosts.filter(p => p.status !== 'inactive').length, icon: 'fa-check-circle', color: 'bg-green-500' },
        { title: 'Đã ẩn', value: clubPosts.filter(p => p.status === 'inactive').length, icon: 'fa-eye-slash', color: 'bg-red-500' },
    ];

    const handleCreatePost = async () => {
        const title = postContent.trim();
        if (!title) {
            alert('Nội dung bài viết không được để trống!');
            return;
        }

        if (title.length > 200) {
            alert('Tiêu đề không được vượt quá 200 ký tự.');
            return;
        }

        if (!clubPosts || clubPosts.length === 0) {
            alert('Không tìm thấy câu lạc bộ để gắn bài viết. Vui lòng chọn câu lạc bộ trước.');
            return;
        }

        const clubId = clubPosts[0].clubId;

        const formDataToSend = new FormData();
        formDataToSend.append('clubId', String(clubId));
        formDataToSend.append('userId', currentUser?.userId || '');
        formDataToSend.append('title', title);
        formDataToSend.append('caption', '');
        formDataToSend.append('content', '');
        formDataToSend.append('status', 'PUBLISHED');

        try {
            await createClubPost(formDataToSend).unwrap();
            setPostContent('');
        } catch (err) {
            console.error(err);
            alert('Tạo bài viết thất bại!');
        }
    };

    const handleEdit = (postId: number) => {
        navigate(`/club/post/edit/${postId}`);
    };

    const handleDelete = async (postId: number) => {
        setPendingDeleteId(postId);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingDeleteId === null) return;
        try {
            await deleteClubPost(pendingDeleteId).unwrap();
            window.location.reload();
        } catch (err) {
            console.error(err);
        } finally {
            setConfirmOpen(false);
            setPendingDeleteId(null);
        }
    };

    const handleToggleStatus = async (postId: number, currentStatus: string) => {
        const formDataToSend = new FormData();
        formDataToSend.append("status", currentStatus === "active" ? "inactive" : "active");

        try {
            await updateClubPost({
                id: postId,
                formData: formDataToSend
            }).unwrap();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/club-posts" isOpen={isSidebarOpen} />

            <HeaderBar
                title="Quản lý Bảng tin"
                breadcrumb="Pages / Club Management / Feed"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>

                {/* 1. Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {clubStats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center justify-between border-l-4 border-blue-500">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">{stat.title}</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg text-white`}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Post Action */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                <h3 className="font-bold text-gray-800 dark:text-white">Tạo thông báo mới</h3>
                            </div>
                            <textarea
                                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                placeholder="Viết gì đó..."
                                rows={3}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            ></textarea>
                            <div className="flex justify-between items-center mt-4">
                                <button className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                                    <i className="fas fa-image text-lg"></i>
                                    Thêm hình ảnh
                                </button>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={isCreating}
                                    className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-8 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                                >
                                    {isCreating ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
                                </button>
                            </div>
                        </div>

                        {/* Posts List */}
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
                            </div>
                        ) : (
                            clubPosts.map((post) => (
                                <div
                                    key={post.postId}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border transition-all ${post.status === 'inactive' ? 'opacity-60 grayscale-[0.5] border-red-200 dark:border-red-900' : 'border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    {/* Post Header */}
                                    <div className="p-4 flex items-center justify-between border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {post.userName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{post.userName}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{post.postDate}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons: Edit & Inactive */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(post.postId)}
                                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                                title="Chỉnh sửa bài viết"
                                            >
                                                <i className="fas fa-edit text-sm"></i>
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(post.postId, post.status || 'active')}
                                                className={`p-2 rounded-lg transition-colors ${post.status === 'inactive'
                                                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                                                    }`}
                                                title={post.status === 'inactive' ? "Kích hoạt lại" : "Ngưng hoạt động"}
                                            >
                                                <i className={`fas ${post.status === 'inactive' ? 'fa-play-circle' : 'fa-power-off'} text-sm`}></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.postId)}
                                                className={`p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30`}
                                                title={post.status === 'inactive' ? "Kích hoạt lại" : "Ngưng hoạt động"}
                                            >
                                                <i className={`fas fa-trash text-sm`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Post Body */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                                {post.title}
                                            </h2>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${post.status === 'inactive' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {post.status === 'inactive' ? 'Đã ẩn' : 'Công khai'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-blue-500 italic"># {post.caption}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{post.content}</p>
                                    </div>

                                    {/* Image Area */}
                                    <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100 mb-12">
                                        {post.imageUrl && (
                                            <img
                                                src={post.imageUrl}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Widgets */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <i className="fas fa-tools text-blue-500"></i> Thao tác nhanh
                            </h3>
                            {/* <div className="grid grid-cols-2 gap-2">
                                <button className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center hover:bg-blue-500 hover:text-white transition-all group">
                                    <i className="fas fa-download mb-1 group-hover:scale-110"></i>
                                    <p className="text-[10px] font-bold">Xuất báo cáo</p>
                                </button>
                                <button className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center hover:bg-blue-500 hover:text-white transition-all group">
                                    <i className="fas fa-trash-alt mb-1 group-hover:scale-110 text-red-500 group-hover:text-white"></i>
                                    <p className="text-[10px] font-bold">Thùng rác</p>
                                </button>
                            </div> */}
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Xóa bài viết"
                message="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
                type="danger"
                confirmText="Xóa"
                onConfirm={confirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
            />
        </div>
    );
}