import { useState } from "react";
import Cookies from "js-cookie";
import { Link, Navigate } from "react-router";
import {
  useGetManagedClubsQuery,
  useGetUserAllClubsQuery,
  useGetUserRoleQuery,
} from "~/cores/api/userApi";
import { getUserId, setClubId } from "~/utils/auth";
import { SettingButton } from "~/components/SettingButton";
import type { Club } from "~/cores/api/types";
import {
  useCheckPendingRequestQuery,
  useGetClubRequestsByUserIdQuery,
} from "~/cores/api/clubRequestApi";
import type { ClubCreationRequest } from "~/cores/api/clubRequestApi";
import { useNavigate } from "react-router";

/* ─── RequestDetailModal ──────────────────────────────────────────────────── */
function RequestDetailModal({
  request,
  onClose,
}: {
  request: ClubCreationRequest;
  onClose: () => void;
}) {
  const status = request.status?.toLowerCase();
  const statusStyle =
    status === "pending"
      ? "bg-amber-100 text-amber-700"
      : status === "approved"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-red-100 text-red-700";
  const dot =
    status === "pending"
      ? "bg-amber-500"
      : status === "approved"
        ? "bg-emerald-500"
        : "bg-red-500";
  const label =
    status === "pending"
      ? "Đang chờ"
      : status === "approved"
        ? "Đã duyệt"
        : "Từ chối";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900 text-base">
            Chi tiết yêu cầu
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Tên câu lạc bộ
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              {request.clubName}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Mô tả
            </span>
            <span className="text-sm text-zinc-700 leading-relaxed">
              {request.description || (
                <span className="text-zinc-400 italic">Không có</span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Lý do
            </span>
            <span className="text-sm text-zinc-700 leading-relaxed">
              {request.reason || (
                <span className="text-zinc-400 italic">Không có</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Trạng thái
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold w-fit ${statusStyle}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Ngày tạo
              </span>
              <span className="text-sm text-zinc-600">
                {new Date(request.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ClubCard (Bento Card) ───────────────────────────────────────────────── */
function ClubCard({ club }: { club: Club }) {
  const navigate = useNavigate();

  const handleSelect = () => {
    setClubId(club.clubId);
    navigate("/dashboard");
  };

  const isActive = club.status.toLowerCase() === "active";

  return (
    <div
      onClick={handleSelect}
      className="group relative bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)] hover:border-orange-300 hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* ── Badges (top-right) ── */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shadow-sm ${
            isActive ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-200" : "bg-amber-200"}`}
          />
          {isActive ? "Hoạt động" : "Đang chờ"}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            club.isPublic
              ? "bg-zinc-100 text-zinc-600"
              : "bg-orange-50 text-orange-600"
          }`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {club.isPublic ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            )}
          </svg>
          {club.isPublic ? "Công khai" : "Riêng tư"}
        </span>
      </div>

      {/* ── Icon / Logo ── */}
      <div className="flex items-center justify-center pt-8 pb-4 px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow duration-300">
          {club.logoUrl ? (
            <img
              src={club.logoUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <span
            className={`text-white font-bold text-2xl ${club.logoUrl ? "hidden" : ""}`}
          >
            {club.clubName[0].toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Club Info ── */}
      <div className="flex flex-col items-center text-center px-5 pb-5 flex-1 gap-2">
        <h3 className="font-bold text-zinc-900 text-base leading-snug group-hover:text-orange-500 transition-colors duration-200 line-clamp-2">
          {club.clubName}
        </h3>

        {club.shortName && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700">
            {club.shortName}
          </span>
        )}

        {club.address && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
            <svg
              className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{club.address}</span>
          </div>
        )}
      </div>

      {/* ── Bottom accent bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

/* ─── ClubCardSkeleton ────────────────────────────────────────────────────── */
function ClubCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden animate-pulse">
      <div className="flex items-center justify-center pt-8 pb-4 px-6">
        <div className="w-20 h-20 rounded-2xl bg-zinc-200" />
      </div>
      <div className="flex flex-col items-center px-5 pb-5 gap-2">
        <div className="h-5 bg-zinc-200 rounded-lg w-3/4" />
        <div className="h-4 bg-zinc-100 rounded-full w-1/3" />
        <div className="h-3 bg-zinc-100 rounded w-2/3 mt-1" />
      </div>
      <div className="h-1 w-full bg-zinc-100" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MyClubsModule() {
  const userId = getUserId();
  const {
    data: clubs,
    isLoading,
    error,
  } = useGetUserAllClubsQuery(userId, {
    skip: !userId,
  });

  const { data: hasPendingRequest } = useCheckPendingRequestQuery(userId, {
    skip: !userId,
  });

  const { data: managedClubs } = useGetManagedClubsQuery(getUserId());
  const { data: userRoles } = useGetUserRoleQuery(userId);
  const isAdmin = userRoles?.includes("Admin") ?? false;

  const { data: userRequests, isLoading: requestLoading } =
    useGetClubRequestsByUserIdQuery(userId, {
      skip: !userId,
    });

  const [selectedRequest, setSelectedRequest] =
    useState<ClubCreationRequest | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const PAGE_SIZE = 6;

  const totalCount = clubs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pagedClubs =
    clubs?.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
      {/* ── Breadcrumb Nav ── */}
      <nav className="px-6 md:px-12 pt-6">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Trang chủ
          </Link>
        </div>
      </nav>

      {/* ── Page Header ── */}
      <header className="px-6 md:px-12 pt-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            Câu lạc bộ của tôi
          </h1>
          <div className="h-1.5 w-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mt-3" />
          <p className="text-zinc-500 mt-3 text-base">
            Chọn câu lạc bộ bạn muốn quản lý
          </p>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 px-6 md:px-12 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <ClubCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
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
              <p className="text-zinc-700 font-semibold text-lg">
                Không thể tải dữ liệu
              </p>
              <p className="text-sm text-zinc-500 mt-1">Vui lòng thử lại sau</p>
            </div>
          )}

          {/* Club Cards Grid */}
          {!isLoading && clubs && clubs.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedClubs.map((club) => (
                  <ClubCard key={club.clubId} club={club} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200">
                  <p className="text-sm text-zinc-500">
                    Hiển thị{" "}
                    <span className="font-semibold text-zinc-700">
                      {(pageIndex - 1) * PAGE_SIZE + 1}–
                      {Math.min(pageIndex * PAGE_SIZE, totalCount)}
                    </span>{" "}
                    trong{" "}
                    <span className="font-semibold text-zinc-700">
                      {totalCount}
                    </span>{" "}
                    câu lạc bộ
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPageIndex(1)}
                      disabled={pageIndex === 1}
                      className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
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
                          d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                      disabled={pageIndex === 1}
                      className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - pageIndex) <= 1,
                      )
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="px-2 text-zinc-400 text-sm"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPageIndex(p as number)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                              pageIndex === p
                                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                    <button
                      onClick={() =>
                        setPageIndex((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={pageIndex === totalPages}
                      className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPageIndex(totalPages)}
                      disabled={pageIndex === totalPages}
                      className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
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
                          d="M13 5l7 7-7 7M6 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && clubs && clubs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-zinc-700 font-semibold text-lg">
                Chưa tham gia câu lạc bộ nào
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                Hãy tham gia một câu lạc bộ để bắt đầu
              </p>
              <Link
                to="/public/clubs"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200 hover:shadow-orange-500/40"
              >
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Khám phá câu lạc bộ
              </Link>
            </div>
          )}

          {/* ── CTA: Create Club Request ── */}
          {!hasPendingRequest && !isAdmin && (
            <div className="mt-12 flex flex-col items-center">
              {/* Floating plus icon */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>

              <p className="text-sm text-zinc-500 text-center mb-4 max-w-sm">
                Bạn muốn thành lập một cộng đồng mới? Hãy bắt đầu ngay hôm nay!
              </p>

              <Link
                to="/club/request"
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 active:scale-[0.97]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Gửi yêu cầu mở câu lạc bộ
              </Link>
            </div>
          )}

          {/* ── Club Requests Table ── */}
          {userRequests && userRequests.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                Yêu cầu mở câu lạc bộ của bạn
              </h2>

              <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[26%]" />
                    <col className="w-[26%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Tên câu lạc bộ
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Lý do
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {userRequests.map((req) => {
                      const status = req.status?.toLowerCase();
                      const style =
                        status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700";
                      const dot =
                        status === "pending"
                          ? "bg-amber-500"
                          : status === "approved"
                            ? "bg-emerald-500"
                            : "bg-red-500";
                      const label =
                        status === "pending"
                          ? "Đang chờ"
                          : status === "approved"
                            ? "Đã duyệt"
                            : "Từ chối";
                      return (
                        <tr
                          key={req.requestId}
                          onClick={() => setSelectedRequest(req)}
                          className="hover:bg-orange-50/50 transition-colors duration-150 cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-semibold text-zinc-900 truncate">
                            {req.clubName}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 truncate">
                            {req.description || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 truncate">
                            {req.reason || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold ${style}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${dot}`}
                              />
                              {label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 text-xs">
                            {new Date(req.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingButton />
    </div>
  );
}
