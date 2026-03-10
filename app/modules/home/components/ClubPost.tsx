import React from 'react';
import { Clock, User, ArrowRight, TrendingUp } from 'lucide-react';
import { useGetClubPostsQuery } from '~/cores/api';
import { useNavigate } from 'react-router';

/*
 * UI Design System (from ui-ux-promax skill)
 * ─────────────────────────────────────────────
 * Style     : #66 Editorial Grid / Magazine
 * Colors    : #71 Magazine/Blog adapted to homepage orange-500
 * Primary   : #18181B (zinc-900) text, #F4F4F5 (zinc-100) bg
 * Accent    : #EA580C (orange-600) / #F97316 (orange-500)
 * Effects   : elevation-2 (0 4px 6px), elevation-3 (0 10px 20px)
 *             gradient overlays for image legibility
 *             smooth transitions 200-300ms
 * Typography: Inter (bold headings) / weight 700→400 hierarchy
 * Grid      : asymmetric CSS Grid, named areas, varied card spans
 * Rules     : cursor-pointer, 44px min touch, alt text, aria-label
 * ─────────────────────────────────────────────
 */

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 60) return `${m} phút`;
    if (h < 24) return `${h} giờ`;
    return `${d} ngày`;
}

/* ── Skeleton ─────────────────────────────── */
function Skeleton() {
    return (
        <section className="py-12 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-zinc-200 rounded w-40 mb-8" />
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-7 h-[420px] bg-zinc-200 rounded-2xl" />
                        <div className="col-span-5 flex flex-col gap-4">
                            <div className="flex-1 bg-zinc-200 rounded-2xl" />
                            <div className="flex-1 bg-zinc-200 rounded-2xl" />
                        </div>
                        <div className="col-span-4 h-56 bg-zinc-200 rounded-2xl" />
                        <div className="col-span-4 h-56 bg-zinc-200 rounded-2xl" />
                        <div className="col-span-4 h-56 bg-zinc-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── Image with fallback ──────────────────── */
function PostImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
    if (!src) {
        return (
            <div className={`bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center ${className ?? 'w-full h-full'}`}>
                <TrendingUp className="text-orange-300" size={32} strokeWidth={1.5} />
            </div>
        );
    }
    return <img src={src} alt={alt} loading="lazy" className={className ?? 'w-full h-full object-cover'} />;
}

/* ── Club badge ───────────────────────────── */
function ClubBadge({ name }: { name: string }) {
    return (
        <span className="inline-flex items-center bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
            {name}
        </span>
    );
}

/* ── Meta row ─────────────────────────────── */
function Meta({ userName, postDate }: { userName?: string; postDate: string }) {
    return (
        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5">
            {userName && (
                <span className="flex items-center gap-1 font-medium text-zinc-500">
                    <User size={11} />
                    {userName}
                </span>
            )}
            <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(postDate)} trước
            </span>
        </div>
    );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
const ClubNewsFeed = () => {
    const navigate = useNavigate();
    const { data: posts = [], isLoading, isError } = useGetClubPostsQuery();

    if (isLoading) return <Skeleton />;
    if (isError || posts.length === 0) return null;

    const go = (id: number) => navigate(`/club/posts/${id}`);

    /* Layout slots */
    const hero = posts[0];
    const sub1 = posts[1];
    const sub2 = posts[2];
    const row = posts.slice(3, 6);       // 3 medium cards
    const mini = posts.slice(6, 10);     // 4 mini list items

    return (
        <section className="py-10 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <div className="w-8 h-1 bg-orange-500 rounded-full" />
                            <div className="w-5 h-1 bg-orange-300 rounded-full" />
                        </div>
                        <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight uppercase">
                            Bản tin câu lạc bộ
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/club/posts')}
                        className="group flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors duration-200 cursor-pointer"
                    >
                        Xem tất cả
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>
                </div>

                {/* ══════════════════════════════════
                    TOP SECTION: Hero (7 cols) + 2 sub (5 cols)
                    ══════════════════════════════════ */}
                <div className="grid grid-cols-12 gap-4 mb-4">

                    {/* Hero card – overlaid gradient, big title */}
                    {hero && (
                        <article
                            onClick={() => go(hero.postId)}
                            className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-2xl cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-shadow duration-300"
                            aria-label={hero.title}
                            style={{ minHeight: '400px' }}
                        >
                            {/* Image */}
                            <div className="absolute inset-0">
                                <PostImg
                                    src={hero.imageUrl}
                                    alt={hero.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                />
                            </div>
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/40 to-transparent" />

                            {/* Content anchored to bottom */}
                            <div className="absolute inset-x-0 bottom-0 p-6">
                                <ClubBadge name={hero.clubName} />
                                <h3 className="mt-2.5 text-xl md:text-2xl font-bold text-white leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors duration-200">
                                    {hero.title}
                                </h3>
                                {hero.caption && (
                                    <p className="mt-1.5 text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                                        {hero.caption}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                                    {hero.userName && (
                                        <span className="flex items-center gap-1">
                                            <User size={11} />
                                            {hero.userName}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {timeAgo(hero.postDate)} trước
                                    </span>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* 2 Sub cards stacked */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                        {[sub1, sub2].map((post, i) => post && (
                            <article
                                key={post.postId}
                                onClick={() => go(post.postId)}
                                className="flex-1 relative overflow-hidden rounded-2xl cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.13)] transition-shadow duration-300"
                                aria-label={post.title}
                                style={{ minHeight: '190px' }}
                            >
                                {/* Image */}
                                <div className="absolute inset-0">
                                    <PostImg
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                                    />
                                </div>
                                {/* Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-900/30 to-transparent" />

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <ClubBadge name={post.clubName} />
                                    <h4 className="mt-2 text-sm md:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors duration-200">
                                        {post.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                                        <Clock size={10} />
                                        {timeAgo(post.postDate)} trước
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════
                    BOTTOM SECTION: 3 medium cards + mini sidebar
                    ══════════════════════════════════ */}
                {row.length > 0 && (
                    <div className="grid grid-cols-12 gap-4">

                        {/* 3 medium cards */}
                        {row.map((post) => (
                            <article
                                key={post.postId}
                                onClick={() => go(post.postId)}
                                className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl overflow-hidden cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
                                aria-label={post.title}
                            >
                                {/* Thumbnail */}
                                <div className="h-40 overflow-hidden">
                                    <PostImg
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
                                    />
                                </div>
                                {/* Body */}
                                <div className="p-4">
                                    <ClubBadge name={post.clubName} />
                                    <h4 className="mt-2 text-sm font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors duration-200">
                                        {post.title}
                                    </h4>
                                    <Meta userName={post.userName} postDate={post.postDate} />
                                </div>
                            </article>
                        ))}

                        {/* Mini list sidebar */}
                        {mini.length > 0 && (
                            <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
                                    <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tin khác</span>
                                </div>
                                <div className="space-y-0">
                                    {mini.map((post, idx) => (
                                        <div
                                            key={post.postId}
                                            onClick={() => go(post.postId)}
                                            className={`flex gap-3 cursor-pointer group py-3 ${idx < mini.length - 1 ? 'border-b border-zinc-100' : ''}`}
                                        >
                                            <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0">
                                                <PostImg
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-semibold text-zinc-800 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors duration-200">
                                                    {post.title}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                                                    <Clock size={9} />
                                                    {timeAgo(post.postDate)} trước
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/club/posts')}
                                    className="mt-4 w-full text-center text-xs font-bold text-orange-500 hover:text-orange-600 py-2 border border-orange-200 hover:border-orange-400 rounded-xl transition-all duration-200 cursor-pointer hover:bg-orange-50"
                                >
                                    Xem thêm →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ClubNewsFeed;