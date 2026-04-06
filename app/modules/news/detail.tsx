import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Footer } from '../home/components';
import Navbar from '../../components/Navbar';
import { useGetClubPostByIdQuery, useGetAllClubPostsQuery } from '~/cores/api/clubApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    return `${d} ngày trước`;
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = {
        Published: 'Đã xuất bản',
        Draft: 'Nháp',
        Active: 'Đang hoạt động',
    };
    return map[status] ?? status;
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'Published':
        case 'Active': return 'bg-green-100 text-green-700';
        case 'Draft': return 'bg-gray-100 text-gray-600';
        default: return 'bg-orange-100 text-orange-700';
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const NewsDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: post, isLoading, error } = useGetClubPostByIdQuery({ postId: Number(id) });
    const { data: allPosts = [] } = useGetAllClubPostsQuery();

    /* Related posts: same club, exclude current, max 4 */
    const relatedPosts = React.useMemo(() => {
        if (!post) return [];
        return allPosts
            .filter((p) => p.clubName === post.clubName && p.postId !== post.postId)
            .sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime())
            .slice(0, 4);
    }, [allPosts, post]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="pt-20 flex-1">
                {/* Loading */}
                {isLoading && (
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <div className="animate-pulse space-y-6">
                            <div className="h-72 bg-gray-200 rounded-2xl" />
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                        </div>
                    </div>
                )}

                {/* Error */}
                {(!isLoading && (error || !post)) && (
                    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">Không tìm thấy bài viết</h3>
                        <button
                            onClick={() => navigate('/public/news')}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition cursor-pointer"
                        >
                            ← Quay lại danh sách
                        </button>
                    </div>
                )}

                {!isLoading && post && (
                    <>
                        {/* Hero image (same layout as PublicEventDetailPage) */}
                        <div className="relative w-full h-72 md:h-96 bg-gradient-to-br from-orange-400 to-orange-600">
                            {post.imageUrl && (
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getStatusStyle(post.status)}`}>
                                    {getStatusLabel(post.status)}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow">
                                    {post.title}
                                </h1>
                            </div>
                        </div>

                        {/* Back button + Content (3-col like event detail) */}
                        <div className="max-w-5xl mx-auto px-6 py-10">
                            <button
                                onClick={() => navigate('/public/news')}
                                className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium mb-8 transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Quay lại danh sách tin tức
                            </button>

                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Left: Content (2 cols) */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Caption / Sapo */}
                                    {post.caption && (
                                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                            <p className="text-lg text-gray-600 italic leading-relaxed border-l-4 border-orange-500 pl-4">
                                                {post.caption}
                                            </p>
                                        </div>
                                    )}

                                    {/* Main content */}
                                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-800 mb-4">Nội dung bài viết</h2>
                                        <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {post.content || 'Chưa có nội dung cho bài viết này.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Info card (1 col, sticky) */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-24 space-y-4">
                                        <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Thông tin bài viết</h3>

                                        <InfoRow icon="calendar" label="Ngày đăng" value={formatDate(post.postDate)} />
                                        <InfoRow icon="clock" label="Thời gian" value={timeAgo(post.postDate)} />
                                        <InfoRow icon="club" label="Câu lạc bộ" value={post.clubName} />
                                        {post.userName && (
                                            <InfoRow icon="user" label="Tác giả" value={post.userName} />
                                        )}

                                        <button
                                            onClick={() => navigate('/public/news')}
                                            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg cursor-pointer"
                                        >
                                            ← Xem thêm tin tức
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Related Posts */}
                            {relatedPosts.length > 0 && (
                                <div className="mt-16">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                        Bài viết liên quan từ {post.clubName}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {relatedPosts.map((rp) => (
                                            <div
                                                key={rp.postId}
                                                onClick={() => navigate(`/public/news/${rp.postId}`)}
                                                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                                            >
                                                {rp.imageUrl ? (
                                                    <img src={rp.imageUrl} alt={rp.title} className="w-full h-36 object-cover" />
                                                ) : (
                                                    <div className="w-full h-36 bg-gradient-to-br from-orange-400 to-orange-600" />
                                                )}
                                                <div className="p-4">
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                                                        {rp.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(rp.postDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

/* ─── InfoRow (same pattern as event detail) ───────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    const icons: Record<string, React.ReactNode> = {
        calendar: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        clock: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        club: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        user: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    };
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">{icons[icon]}</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-700 font-medium">{value}</p>
            </div>
        </div>
    );
}

export default NewsDetailPage;
