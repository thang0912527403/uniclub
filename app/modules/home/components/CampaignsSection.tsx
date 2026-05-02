import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useGetRecruitmentCampaignsQuery } from '~/cores/api';
import type { RecruitmentCampaign } from '~/cores/api';
import { Calendar, Clock, Megaphone, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

/*
 * ui-ux-promax skill
 * Style  : #60 Glassmorphism cards on vibrant gradient band
 * Layout : Infinite auto-scroll marquee + pause on hover
 *          Manual scroll arrows ← →
 * Colors : orange-500 accent, white glass cards, zinc palette
 */

function daysLeft(endDate: string): number {
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}
function formatDate(d: string) {
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ── Live badge ────────────────────────────── */
function LiveBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Đang mở
        </span>
    );
}

/* ── Deadline pill ─────────────────────────── */
function DeadlinePill({ endDate }: { endDate: string }) {
    const d = daysLeft(endDate);
    const cls = d <= 3
        ? 'bg-red-500/90 text-white'
        : d <= 7
        ? 'bg-amber-500/90 text-white'
        : 'bg-black/40 text-white';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${cls}`}>
            <Clock size={9} />
            {d === 0 ? 'Hôm nay' : `Còn ${d} ngày`}
        </span>
    );
}

/* ── Campaign Card (full-bleed image, overlay text) ── */
function CampaignCard({ campaign }: { campaign: RecruitmentCampaign }) {
    return (
        <Link
            to={`/campaign/${campaign.campaignId}`}
            className="group relative flex-shrink-0 w-[280px] sm:w-[300px] h-[360px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.22)] hover:-translate-y-1.5 transition-all duration-300"
            aria-label={campaign.campaignName}
        >
            {/* Background */}
            <div className="absolute inset-0">
                {campaign.imageUrl
                    ? <img
                        src={campaign.imageUrl}
                        alt={campaign.campaignName}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                        loading="lazy"
                    />
                    : <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-rose-500 flex items-center justify-center">
                        <Megaphone size={56} className="text-white/25" strokeWidth={1} />
                    </div>
                }
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-900/40 to-transparent" />
            {/* Subtle color wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                <LiveBadge />
                <DeadlinePill endDate={campaign.endDate} />
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 p-5">
                {/* Club name / category */}
                <p className="text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                    Tuyển thành viên
                </p>
                <h3 className="font-extrabold text-white text-base leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors duration-200 mb-2.5">
                    {campaign.campaignName}
                </h3>

                {/* Date row */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Calendar size={10} className="text-orange-400" />
                    <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
                </div>

                {/* Hover CTA bar */}
                <div className="mt-3 overflow-hidden h-0 group-hover:h-8 transition-all duration-300 ease-out">
                    <div className="flex items-center gap-1.5 text-orange-400 text-xs font-bold">
                        Xem chi tiết
                        <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ── Skeleton ──────────────────────────────── */
function Skeleton() {
    return (
        <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="animate-pulse mb-8">
                    <div className="h-5 bg-zinc-200 rounded-full w-40 mb-3" />
                    <div className="h-8 bg-zinc-100 rounded-xl w-72" />
                </div>
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-shrink-0 w-[300px] h-[360px] bg-zinc-100 rounded-2xl" />
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═════════════════════════════════════════════════════════
   MAIN
   ═════════════════════════════════════════════════════════ */
export default function CampaignsSection() {
    const { data: campaigns = [], isLoading } = useGetRecruitmentCampaignsQuery();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);

    const active = campaigns.filter(c => {
        const s = c.status?.toLowerCase();
        return s === 'open' || s === 'active';
    });

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 8);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll, { passive: true });
            checkScroll();
        }
        return () => el?.removeEventListener('scroll', checkScroll);
    }, [active.length]);

    const scroll = (dir: 'left' | 'right') =>
        scrollRef.current?.scrollBy({ left: dir === 'right' ? 330 : -330, behavior: 'smooth' });

    if (isLoading) return <Skeleton />;
    if (active.length === 0) return null;

    return (
        <section className="py-10 sm:py-14 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* ── Header ── */}
                <div className="flex items-end justify-between mb-7">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={13} className="text-orange-500" />
                            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Đang tuyển dụng</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
                            Chiến dịch tuyển thành viên
                        </h2>
                        <p className="mt-1.5 text-sm text-zinc-500">
                            Nộp hồ sơ trước khi hết hạn — bấm vào để xem chi tiết
                        </p>
                    </div>

                    {/* Scroll buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canLeft}
                            aria-label="Cuộn trái"
                            className="w-10 h-10 rounded-xl border-2 border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canRight}
                            aria-label="Cuộn phải"
                            className="w-10 h-10 rounded-xl border-2 border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Scroll row ── */}
                <div className="relative">
                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {active.map(c => <CampaignCard key={c.campaignId} campaign={c} />)}
                    </div>

                    {/* Right fade edge */}
                    {canRight && (
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent" />
                    )}
                    {/* Left fade edge */}
                    {canLeft && (
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent" />
                    )}
                </div>

                {/* ── Scroll indicator dots ── */}
                {active.length > 3 && (
                    <div className="flex justify-center mt-5 gap-1.5">
                        {Array.from({ length: Math.min(active.length, 6) }).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
