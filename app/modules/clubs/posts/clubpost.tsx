import React, { useState, useRef } from "react";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { SettingButton } from "~/components/SettingButton";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import {
  // useGetClubPostByClubIdQuery,
  useGetClubPostsQuery,
  useCreateClubPostMutation,
  useUpdateClubPostMutation,
  useDeleteClubPostMutation,
  useGetClubPostsByClubIdQuery,
} from "~/cores/api/clubApi";
import { getUserId, getClubId } from "~/utils/auth";
import { useClubRole } from "~/hooks/useClubRole";
import { useNavigate } from "react-router";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  FileImage,
  LayoutGrid,
  List,
  TrendingUp,
  FileText,
  CheckCircle2,
  EyeOff as HideIcon,
  Calendar,
  User,
  ArrowUpRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Design system (ui-ux-promax skill)
   Style    : #39 Bento Grids + #19 Soft UI Evolution
   Colors   : orange-500 primary (match homepage)
              White cards, zinc-50 background
   Effects  : elevation-1: 0 2px 8px rgba(0,0,0,0.06)
              elevation-2: 0 8px 24px rgba(0,0,0,0.10)
              hover:shadow on cards, hover:-translate-y-0.5
              transitions 150-300ms
   Rules    : cursor-pointer, 44px min touch targets
              Lucide icons only, alt text on all images
══════════════════════════════════════════════════════════ */

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 flex items-center gap-4 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-shadow duration-200">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${gradient}`}
      >
        <Icon size={20} className="text-white" strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-zinc-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── Status Badge ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const isInactive = status === "inactive" || status === "DRAFT";
  if (isInactive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wide">
        <HideIcon size={9} /> {status === "DRAFT" ? "Nháp" : "Đã ẩn"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wide">
      <CheckCircle2 size={9} /> Công khai
    </span>
  );
}

/* ── Create Post Modal ─────────────────────────────────── */
export function CreatePostModal({
  onClose,
  clubId,
  userId,
  eventId,
  campaignId,
}: {
  onClose: () => void;
  clubId: number;
  userId: string;
  eventId?: number | null;
  campaignId?: number | null;
}) {
  const [createClubPost, { isLoading }] = useCreateClubPostMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    caption: "",
    content: "",
    status: "PUBLISHED",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const applyFile = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) applyFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Tiêu đề không được để trống!");
    const fd = new FormData();
    fd.append("clubId", String(clubId));
    fd.append("userId", userId);
    fd.append("title", form.title);
    fd.append("caption", form.caption);
    fd.append("content", form.content);
    fd.append("status", form.status);
    if (eventId) fd.append("eventId", String(eventId));
    if (campaignId) fd.append("campaignId", String(campaignId));
    if (imageFile) fd.append("imageFile", imageFile);
    try {
      await createClubPost(fd).unwrap();
      onClose();
    } catch {
      alert("Tạo bài viết thất bại!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-zinc-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Tạo bài viết mới
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Điền đầy đủ thông tin để đăng bài
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-500"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tiêu đề <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Mô tả ngắn
            </label>
            <input
              type="text"
              name="caption"
              value={form.caption}
              onChange={handleChange}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all italic"
              placeholder="Một dòng dẫn dắt..."
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nội dung
            </label>
            <textarea
              name="content"
              rows={5}
              value={form.content}
              onChange={handleChange}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all leading-relaxed resize-none"
              placeholder="Nội dung bài viết..."
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Ảnh minh họa
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) applyFile(f);
              }}
            />
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden group shadow-sm">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    Đổi ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer hover:bg-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl py-10 flex flex-col items-center gap-2.5 cursor-pointer transition-all ${dragOver ? "border-orange-400 bg-orange-50 text-orange-500" : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-orange-300 hover:text-orange-400 hover:bg-orange-50/50"}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${dragOver ? "bg-orange-100" : "bg-zinc-100"}`}
                >
                  <FileImage size={22} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">
                    Kéo thả hoặc nhấn để chọn ảnh
                  </p>
                  <p className="text-[10px] mt-0.5 opacity-60">
                    JPG, PNG, WEBP · tối đa 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Trạng thái
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer transition-all"
            >
              <option value="PUBLISHED">✅ Công khai</option>
              <option value="DRAFT">📝 Nháp</option>
              <option value="inactive">🚫 Ẩn</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══ Main Module ══════════════════════════════════════════════ */
export default function ClubPostModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { currentClub, can } = useClubRole();
  const clubId = currentClub?.clubId ?? getClubId();
  const canCreatePost = can("createpost");
  const canEditPost = can("editpost");
  const canDeletePost = can("deletepost");
  const { data: clubPosts = [], isLoading } = useGetClubPostsByClubIdQuery(
    clubId,
    { skip: !clubId },
  );
  const [deleteClubPost] = useDeleteClubPostMutation();
  const [updateClubPost] = useUpdateClubPostMutation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const userId = getUserId();
  const published = clubPosts.filter(
    (p) => p.status !== "inactive" && p.status !== "DRAFT",
  ).length;
  const hidden = clubPosts.filter((p) => p.status === "inactive").length;

  const handleDelete = async (postId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deleteClubPost(postId).unwrap();
    } catch {
      alert("Xóa thất bại!");
    }
  };

  const handleToggleStatus = async (postId: number, status: string) => {
    const fd = new FormData();
    fd.append("status", status === "inactive" ? "PUBLISHED" : "inactive");
    try {
      await updateClubPost({ id: postId, formData: fd }).unwrap();
    } catch {
      alert("Cập nhật thất bại!");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900">
      <SettingButton />
      <Sidebar currentPath="/club/post" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Quản lý Bảng tin"
        breadcrumb="Pages / Club Management / Posts"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {showModal && clubId > 0 && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          clubId={clubId}
          userId={userId}
        />
      )}

      <main
        className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Tổng bài viết"
            value={clubPosts.length}
            icon={FileText}
            gradient="bg-gradient-to-br from-zinc-700 to-zinc-900"
          />
          <StatCard
            label="Công khai"
            value={published}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            label="Đã ẩn"
            value={hidden}
            icon={EyeOff}
            gradient="bg-gradient-to-br from-red-400 to-rose-600"
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Danh sách bài viết
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {clubPosts.length} bài viết trong hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex bg-white border border-zinc-200 rounded-xl p-1 gap-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-600"}`}
                aria-label="Dạng danh sách"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-600"}`}
                aria-label="Dạng lưới"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
            {canCreatePost && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={15} /> Tạo bài mới
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div
            className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"} animate-pulse`}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`bg-zinc-200 rounded-2xl ${viewMode === "grid" ? "h-64" : "h-24"}`}
              />
            ))}
          </div>
        ) : clubPosts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 text-center py-20 px-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp
                size={28}
                className="text-orange-400"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="font-bold text-zinc-900 mb-1">
              Chưa có bài viết nào
            </h3>
            <p className="text-sm text-zinc-400 mb-5">
              Hãy đăng bài viết đầu tiên của câu lạc bộ
            </p>
            {canCreatePost && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                <Plus size={15} /> Tạo ngay
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubPosts.map((post) => (
              <div
                key={post.postId}
                className={`group bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 border ${post.status === "inactive" ? "border-red-100 opacity-70" : "border-zinc-100"}`}
              >
                {/* Image */}
                <div className="relative h-40 bg-zinc-100 overflow-hidden">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                      <FileImage
                        size={32}
                        className="text-orange-200"
                        strokeWidth={1}
                      />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={post.status} />
                  </div>
                </div>
                {/* Body */}
                <div className="p-4">
                  <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-snug mb-1">
                    {post.title}
                  </h3>
                  {post.caption && (
                    <p className="text-xs text-zinc-400 italic line-clamp-1 mb-3">
                      — {post.caption}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {post.userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(post.postDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                {(canEditPost || canDeletePost) && (
                <div className="px-4 pb-4 flex items-center gap-2 border-t border-zinc-50 pt-3">
                  {canEditPost && (
                    <button
                      onClick={() => navigate(`/club/post/edit/${post.postId}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-semibold text-zinc-600 transition-colors cursor-pointer"
                    >
                      <Pencil size={12} /> Sửa
                    </button>
                  )}
                  {canEditPost && (
                    <button
                      onClick={() =>
                        handleToggleStatus(post.postId, post.status || "")
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${post.status === "inactive" ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-zinc-50 text-zinc-500 hover:bg-amber-50 hover:text-amber-600"}`}
                    >
                      {post.status === "inactive" ? (
                        <Eye size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                      {post.status === "inactive" ? "Hiện" : "Ẩn"}
                    </button>
                  )}
                  {canDeletePost && (
                    <button
                      onClick={() => handleDelete(post.postId)}
                      className="w-7 h-7 flex items-center justify-center bg-zinc-50 hover:bg-red-50 hover:text-red-500 rounded-lg text-zinc-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {clubPosts.map((post) => (
              <div
                key={post.postId}
                className={`group bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 overflow-hidden border ${post.status === "inactive" ? "border-red-100 opacity-70" : "border-zinc-100"}`}
              >
                <div className="flex items-stretch">
                  {/* Thumbnail */}
                  <div className="w-28 sm:w-36 shrink-0 bg-zinc-100 overflow-hidden">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 min-h-[88px]">
                        <FileImage
                          size={22}
                          className="text-orange-200"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4 py-3.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="flex-1 font-bold text-zinc-900 text-sm line-clamp-1 leading-snug">
                          {post.title}
                        </h3>
                        <StatusBadge status={post.status} />
                      </div>
                      {post.caption && (
                        <p className="text-xs text-zinc-400 italic line-clamp-1 mb-1">
                          — {post.caption}
                        </p>
                      )}
                      {post.content && (
                        <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">
                          {post.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {post.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(post.postDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 px-3 border-l border-zinc-50">
                    {canEditPost && (
                      <button
                        onClick={() => navigate(`/club/post/edit/${post.postId}`)}
                        title="Chỉnh sửa"
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {canEditPost && (
                      <button
                        onClick={() =>
                          handleToggleStatus(post.postId, post.status || "")
                        }
                        title={post.status === "inactive" ? "Hiện bài" : "Ẩn bài"}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${post.status === "inactive" ? "text-green-500 hover:bg-green-50" : "text-zinc-400 hover:text-amber-500 hover:bg-amber-50"}`}
                      >
                        {post.status === "inactive" ? (
                          <Eye size={15} />
                        ) : (
                          <EyeOff size={15} />
                        )}
                      </button>
                    )}
                    {canDeletePost && (
                      <button
                        onClick={() => handleDelete(post.postId)}
                        title="Xóa"
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        navigate(`/club/${clubId}/posts/${post.postId}`)
                      }
                      title="Xem bài"
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
