import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useParams, useNavigate } from 'react-router';
import { useGetClubPostByIdQuery, useUpdateClubPostMutation } from '~/cores/api/clubApi';
import { ArrowLeft, FileImage, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';

/*
  ui-ux-promax skill — style #39 Bento Grid + #19 Soft UI Evolution
  Orange-500 accent, Zinc palette, elevation shadows
  Proper 2-column layout with side panel for image/status/actions
*/

/* ── Toast Notification ──────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold animate-in slide-in-from-top-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg}
            <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 cursor-pointer"><X size={14} /></button>
        </div>
    );
}

/* ── Input Field ─────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {label} {required && <span className="text-orange-500">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white";

/* ════════════════════════════════════════════════════════════ */
export default function EditClubPostModule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
    const [updateClubPost, { isLoading: isSaving }] = useUpdateClubPostMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({ title: '', caption: '', content: '', status: 'PUBLISHED' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const { data: post, isLoading, isError } = useGetClubPostByIdQuery(Number(id));

    useEffect(() => {
        if (post) {
            setForm({ title: post.title ?? '', caption: post.caption ?? '', content: post.content ?? '', status: post.status ?? 'PUBLISHED' });
            if (post.imageUrl) setImagePreview(post.imageUrl);
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const applyFile = (file: File) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) applyFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { setToast({ msg: 'Tiêu đề không được để trống!', type: 'error' }); return; }
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('caption', form.caption);
        fd.append('content', form.content);
        fd.append('status', form.status);
        if (imageFile) fd.append('imageFile', imageFile);
        try {
            await updateClubPost({ id: Number(id), formData: fd }).unwrap();
            setToast({ msg: 'Cập nhật thành công!', type: 'success' });
            setTimeout(() => navigate('/club/posts'), 1500);
        } catch {
            setToast({ msg: 'Cập nhật thất bại!', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-gray-900">
            <SettingButton />
            <Sidebar currentPath="/club-posts" isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <HeaderBar title="Chỉnh sửa bài viết" breadcrumb="Pages / Club Posts / Edit"
                isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Back */}
                <button onClick={() => navigate(-1)}
                    className="mb-6 group flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Quay lại danh sách
                </button>

                {isLoading ? (
                    <div className="max-w-5xl mx-auto animate-pulse">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-96 bg-zinc-200 rounded-3xl" />
                            <div className="space-y-4">
                                <div className="h-56 bg-zinc-200 rounded-3xl" />
                                <div className="h-32 bg-zinc-200 rounded-3xl" />
                            </div>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="max-w-xl mx-auto text-center py-20">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={26} className="text-red-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-zinc-900 mb-1">Không tìm thấy bài viết</h3>
                        <p className="text-sm text-zinc-400">Bài viết có thể đã bị xóa hoặc ID không hợp lệ.</p>
                        <button onClick={() => navigate(-1)}
                            className="mt-5 inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 transition-colors">
                            <ArrowLeft size={14} /> Quay lại
                        </button>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* ── Left: Main Content ── */}
                            <div className="lg:col-span-2 space-y-5">

                                {/* Title card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 border border-zinc-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                                        <h3 className="font-bold text-zinc-900 dark:text-white">Nội dung bài viết</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <Field label="Tiêu đề" required>
                                            <input type="text" name="title" value={form.title} onChange={handleChange} required
                                                className={`${inputCls} font-semibold`} placeholder="Nhập tiêu đề bài viết..." />
                                        </Field>

                                        <Field label="Mô tả ngắn (Caption)">
                                            <input type="text" name="caption" value={form.caption} onChange={handleChange}
                                                className={`${inputCls} italic`} placeholder="Một dòng dẫn dắt ngắn gọn..." />
                                        </Field>

                                        <Field label="Nội dung chi tiết">
                                            <textarea name="content" rows={10} value={form.content} onChange={handleChange}
                                                className={`${inputCls} leading-relaxed resize-none`}
                                                placeholder="Viết nội dung đầy đủ tại đây..." />
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right: Image + Status + Actions ── */}
                            <div className="space-y-5">

                                {/* Image card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 border border-zinc-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Ảnh minh họa</p>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f); }} />

                                    {imagePreview ? (
                                        <div className="relative group rounded-2xl overflow-hidden">
                                            <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
                                            {/* Image overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                    className="bg-white text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-zinc-100 transition-colors">
                                                    Đổi ảnh
                                                </button>
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-600 transition-colors">
                                                    Xóa
                                                </button>
                                            </div>
                                            {/* New file indicator */}
                                            {imageFile && (
                                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    Ảnh mới
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${dragOver ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-orange-300 hover:text-orange-400'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragOver ? 'bg-orange-100' : 'bg-zinc-100'}`}>
                                                <FileImage size={18} strokeWidth={1.5} />
                                            </div>
                                            <p className="text-xs font-semibold">Kéo thả hoặc nhấn chọn</p>
                                            <p className="text-[10px] opacity-60">JPG, PNG, WEBP · 10MB</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 border border-zinc-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Trạng thái</p>

                                    {/* Status radio buttons */}
                                    <div className="space-y-2">
                                        {[
                                            { value: 'PUBLISHED', label: 'Công khai', desc: 'Hiển thị cho tất cả', color: 'text-green-600', dot: 'bg-green-500' },
                                            { value: 'DRAFT', label: 'Nháp', desc: 'Chỉ bạn thấy', color: 'text-zinc-600', dot: 'bg-zinc-400' },
                                            { value: 'inactive', label: 'Ẩn', desc: 'Tạm ẩn khỏi bảng tin', color: 'text-red-500', dot: 'bg-red-400' },
                                        ].map(opt => (
                                            <label key={opt.value}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.status === opt.value ? 'border-orange-400 bg-orange-50' : 'border-zinc-100 hover:border-zinc-200 bg-white'}`}>
                                                <input type="radio" name="status" value={opt.value} checked={form.status === opt.value}
                                                    onChange={handleChange} className="hidden" />
                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold ${form.status === opt.value ? 'text-orange-600' : 'text-zinc-800'}`}>{opt.label}</p>
                                                    <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                                                </div>
                                                {form.status === opt.value && (
                                                    <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 border border-zinc-100 dark:border-gray-700 space-y-3">
                                    <button type="submit" disabled={isSaving}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer">
                                        <Save size={15} />
                                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <button type="button" onClick={() => navigate(-1)}
                                        className="w-full py-3 bg-zinc-100 dark:bg-gray-700 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors cursor-pointer">
                                        Hủy bỏ
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}