import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Footer from '~/modules/home/components/Footer';
import Navbar from "../../components/Navbar";
import { useGetClubPostsQuery } from "~/cores/api/clubApi";
import type { ClubPostResponseDto } from "~/cores/api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function getDay(dateStr: string) {
  return new Date(dateStr).getDate().toString().padStart(2, "0");
}

function getMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", { month: "short" });
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

/* ─── NewsCardPublic ──────────────────────────────────────────────────────── */
function NewsCardPublic({
  post,
  onClick,
}: {
  post: ClubPostResponseDto;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col"
    >
      {/* Image / Gradient Placeholder */}
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-white opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
      )}

      {/* Date badge strip */}
      <div className="bg-orange-500 text-white px-4 py-2 flex items-center gap-3">
        <div className="text-center min-w-[44px]">
          <div className="text-2xl font-bold leading-none">
            {getDay(post.postDate)}
          </div>
          <div className="text-xs uppercase tracking-wide">
            {getMonth(post.postDate)}
          </div>
        </div>
        <span className="text-orange-200 text-sm">·</span>
        <div className="text-sm text-orange-100 line-clamp-1">
          {timeAgo(post.postDate)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-2">
        <span className="self-start px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          {post.clubName}
        </span>

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>

        {post.caption && (
          <p className="text-sm text-gray-500 line-clamp-2">{post.caption}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto">
          <svg
            className="w-4 h-4 text-orange-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>

          <span className="line-clamp-1">
            {post.userName ? post.userName : "Anonymous"}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function NewsSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="h-10 bg-orange-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
        <div className="h-10 bg-gray-200 rounded-xl mt-4" />
      </div>
    </div>
  );
}

/* ─── SORT OPTIONS ─────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "az", label: "A → Z" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data: posts = [], isLoading, error } = useGetClubPostsQuery();

  /* Unique club names for filter tabs */
  const clubNames = useMemo(() => {
    const set = new Set(posts.map((p) => p.clubName));
    return Array.from(set).sort();
  }, [posts]);

  /* Filter + Sort */
  const filtered = useMemo(() => {
    let result = posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.caption ?? "").toLowerCase().includes(search.toLowerCase()) ||
        p.clubName.toLowerCase().includes(search.toLowerCase());
      const matchClub = clubFilter === "Tất cả" || p.clubName === clubFilter;
      return matchSearch && matchClub;
    });

    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.postDate).getTime() - new Date(a.postDate).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.postDate).getTime() - new Date(b.postDate).getTime(),
        );
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title, "vi"));
        break;
    }
    return result;
  }, [posts, search, clubFilter, sortBy]);

  /* Pagination */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero Banner (same as PublicEventsPage) ── */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 pt-28 pb-12 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            Bản tin nổi bật
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Khám phá <span className="text-orange-500">Tin tức</span> của UNI
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Cập nhật hoạt động, câu chuyện cảm hứng và thông báo mới nhất từ các
            câu lạc bộ trong trường.
          </p>
        </div>
      </section>

      {/* ── Filters (same sticky style as events) ── */}
      <section className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm tin tức, câu lạc bộ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Club filter tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setClubFilter("Tất cả");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${clubFilter === "Tất cả"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                  }`}
              >
                Tất cả
              </button>
              {clubNames.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setClubFilter(name);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${clubFilter === name
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                    }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-gray-100 text-gray-600 pl-3 pr-8 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── News Grid ── */}
      <section className="flex-1 py-12 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Count */}
          {!isLoading && !error && (
            <p className="text-sm text-gray-500 mb-6">
              Tìm thấy{" "}
              <span className="font-semibold text-orange-500">
                {filtered.length}
              </span>{" "}
              bài viết
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <NewsSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Không tải được dữ liệu
              </h3>
              <p className="text-gray-500 text-sm">Vui lòng thử lại sau.</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Không có bài viết nào
              </h3>
              <p className="text-gray-500 text-sm">
                Hãy thử tìm kiếm khác hoặc xóa bộ lọc.
              </p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && paginated.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginated.map((post) => (
                <NewsCardPublic
                  key={post.postId}
                  post={post}
                  onClick={() => navigate(`/public/news/${post.postId}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ← Trang trước
              </button>
              <span className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Trang sau →
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewsPage;
