import React from 'react';
import { Calendar, User, Bookmark, ChevronRight, Globe } from 'lucide-react';
import { useGetClubPostsQuery } from '~/cores/api';
import { useNavigate } from 'react-router';

const ClubNewsFeed = () => {
    const navigate = useNavigate();
    const { data: posts = [], isLoading, isError } = useGetClubPostsQuery();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="bg-[#fcfcfc] py-8 px-4">
                <div className="max-w-4xl mx-auto">

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bản tin câu lạc bộ</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                        <p className="mt-2 text-sm text-gray-500">Cập nhật những tin tức mới nhất từ các CLB trong UNIC</p>
                    </div>

                    <div className="py-6 flex items-center justify-center text-sm text-gray-600">Đang tải...</div>

                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-[#fcfcfc] py-8 px-4">
                <div className="max-w-4xl mx-auto">

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bản tin câu lạc bộ</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                        <p className="mt-2 text-sm text-gray-500">Cập nhật những tin tức mới nhất từ các CLB trong UNIC</p>
                    </div>

                    <div className="py-6 flex items-center justify-center text-sm text-gray-600">Lỗi khi tải dữ liệu</div>

                </div>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="bg-[#fcfcfc] py-8 px-4">
                <div className="max-w-4xl mx-auto">

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bản tin câu lạc bộ</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                        <p className="mt-2 text-sm text-gray-500">Cập nhật những tin tức mới nhất từ các CLB trong UNIC</p>
                    </div>

                    <div className="py-6 flex items-center justify-center text-sm text-gray-600">Không có bài viết nào để hiển thị</div>

                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fcfcfc] min-h-screen py-16 px-4">
            <div className="max-w-6xl mx-auto">

                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Bản tin câu lạc bộ</h2>
                    <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="mt-4 text-gray-500 font-medium">Cập nhật những tin tức mới nhất từ các CLB trong UNIC</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {posts.map((post, index) => (
                        <div
                            key={post.postId}
                            className={`group relative flex flex-col ${index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
                        >
                            {/* Image Container */}
                            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-[2.5rem] shadow-lg shadow-orange-100/50">
                                <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100 mb-12">
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                                {/* Badge Club Name (Góc trên trái) */}
                                <div className="absolute top-6 left-6 bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Globe size={14} />
                                    {post.clubName}
                                </div>
                            </div>

                            {/* Content Box (Floating) */}
                            <div className="relative -mt-20 mx-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 transition-all duration-300 group-hover:-translate-y-2">
                                <div className="flex items-center gap-3 mb-3 text-orange-600 font-bold text-xs uppercase">
                                    <span className="bg-orange-50 px-3 py-1 rounded-lg italic">#{post.postId} New Post</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> {formatDate(post.postDate)}
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                                    {post.title}
                                </h3>

                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed italic">
                                    "{post.caption}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <User size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{post.userName}</span>
                                    </div>

                                    <button className="flex items-center gap-1 text-orange-600 font-bold text-sm hover:gap-2 transition-all"
                                        onClick={() => navigate(`/club/posts/${post.postId}`)}
                                    >
                                        Xem thêm <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group cursor-pointer"
                        onClick={() => navigate("/club/posts")}
                    >
                        Xem tất cả bản tin
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ClubNewsFeed;