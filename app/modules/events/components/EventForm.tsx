import { useState, useRef, useCallback, useEffect } from 'react';


interface EventFormProps {
    initialData?: {
        eventId?: number;
        eventName?: string;
        description?: string;
        location?: string;
        meetLink?: string;
        imageUrl?: string;
        startDate?: string;
        endDate?: string;
        clubId?: number;
        requiresApproval?: boolean;
        isPublic?: boolean;
        isOnline?: boolean;
        maxAttendees?: number | null;
    };
    /** onChange là callback tùy chọn — dùng để đồng bộ state lên FullCalendar ở trang cha */
    onChange?: (data: any) => void;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
    mode?: 'create' | 'edit';
    /** id cho thẻ <form> — nút submit bên ngoài dùng form="{formId}" để kết nối */
    formId?: string;
    /** Ẩn nút Hủy + Submit gốc (dùng khi đã có nút tổng bên ngoài) */
    hideActions?: boolean;
}

/** Format Date → datetime-local value dùng LOCAL timezone (getHours, getMinutes). */
function dateToLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert ISO string (UTC) → datetime-local in local timezone. */
function isoToLocal(iso?: string): string {
    if (!iso) return '';
    try { return dateToLocal(new Date(iso)); } catch { return ''; }
}

/**
 * Format datetime-local value "YYYY-MM-DDTHH:MM" → "Ngày DD/MM/YYYY HH:mm"
 * Ví dụ: "2026-03-21T10:56" → "Ngày 21/03/2026 10:56"
 */
function formatViDate(localDT: string): string {
    if (!localDT) return '';
    try {
        // datetime-local không có timezone → parse as local
        const d = new Date(localDT);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `Ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return localDT; }
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_MB = 5;

export function EventForm({
    initialData,
    onChange,
    onSubmit,
    onCancel,
    isLoading = false,
    isDark = false,
    mode = 'create',
    formId,
    hideActions = false,
}: EventFormProps) {
    const [formData, setFormData] = useState({
        eventName: initialData?.eventName || '',
        description: initialData?.description || '',
        location: initialData?.location || '',
        meetLink: initialData?.meetLink || '',
        startDate: isoToLocal(initialData?.startDate),   // ✅ local time
        endDate: isoToLocal(initialData?.endDate),     // ✅ local time
        clubId: initialData?.clubId || undefined,
        requiresApproval: initialData?.requiresApproval ?? false,
        isPublic: initialData?.isPublic ?? true,
        isOnline: initialData?.isOnline ?? false,
        maxAttendees: initialData?.maxAttendees ?? '',
    });

    /**
     * Sync startDate / endDate khi parent cập nhật initialData (ví dụ kéo thả trên lịch).
     * Các field khác (eventName, description...) KHÔNG bị ghi đè vì user có thể đang nhập.
     */
    useEffect(() => {
        const newStart = isoToLocal(initialData?.startDate);
        const newEnd = isoToLocal(initialData?.endDate);
        setFormData(prev => {
            const hasChange =
                (newStart && newStart !== prev.startDate) ||
                (newEnd && newEnd !== prev.endDate);
            if (!hasChange) return prev;   // không re-render nếu không thay đổi
            return {
                ...prev,
                ...(newStart && newStart !== prev.startDate ? { startDate: newStart } : {}),
                ...(newEnd && newEnd !== prev.endDate ? { endDate: newEnd } : {}),
            };
        });
    }, [initialData?.startDate, initialData?.endDate]);


    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl || '');
    const [imageError, setImageError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    const inputClass = isDark
        ? 'bg-[#1a1d2e] border-gray-700 text-white focus:border-blue-400'
        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500';
    const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const next = { ...formData, [name]: value };
        setFormData(next);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        onChange?.(next);
    };

    const handleToggleOnline = (online: boolean) => {
        const next = { ...formData, isOnline: online, ...(online ? { isPublic: false } : {}) };
        setFormData(next);
        onChange?.(next);
    };

    const applyFile = useCallback((file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            setImageError('Chỉ chấp nhận file ảnh (jpg, png, gif, webp).');
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setImageError(`File không được vượt quá ${MAX_MB}MB.`);
            return;
        }
        setImageError('');
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) applyFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) applyFile(file);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.eventName.trim()) newErrors.eventName = 'Tên sự kiện không được để trống';
        else if (formData.eventName.length > 200) newErrors.eventName = 'Tên sự kiện không được vượt quá 200 ký tự';
        if (!formData.description.trim()) newErrors.description = 'Mô tả không được để trống';
        if (!formData.isOnline && formData.location && formData.location.length > 200)
            newErrors.location = 'Địa điểm không được vượt quá 200 ký tự';
        if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn thời gian bắt đầu';
        if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn thời gian kết thúc';
        if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate))
            newErrors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        if (formData.maxAttendees !== '' && Number(formData.maxAttendees) <= 0)
            newErrors.maxAttendees = 'Số lượng người phải lớn hơn 0';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const submitData: any = {
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            clubId: formData.clubId || undefined,
            image: selectedFile ?? undefined,
            maxAttendees: formData.maxAttendees !== '' ? parseInt(String(formData.maxAttendees), 10) : undefined,
        };
        if (mode === 'edit' && initialData?.eventId) submitData.eventId = initialData.eventId;

        onSubmit(submitData);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* ── 2 cột: Fields | Ảnh ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* CỘT PHẢI (order-2): Ảnh sự kiện */}
                <div className="lg:order-2">
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Ảnh sự kiện
                        <span className={`ml-2 text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            (jpg, png, gif, webp · tối đa {MAX_MB}MB · tùy chọn)
                        </span>
                    </label>

                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 h-full min-h-[260px] flex items-center justify-center ${isDark
                            ? 'border-gray-600 hover:border-blue-500 bg-[#1a1d2e]'
                            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                            } ${previewUrl ? 'p-2' : 'p-8'}`}
                    >
                        {previewUrl ? (
                            <div className="relative group w-full h-full">
                                <img
                                    src={previewUrl}
                                    alt="Xem trước ảnh sự kiện"
                                    className="w-full h-full object-cover rounded-lg min-h-[244px]"
                                    onError={() => setPreviewUrl('')}
                                />
                                <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white text-sm font-medium">Bấm để đổi ảnh</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <svg className={`mx-auto w-12 h-12 mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Kéo thả hoặc bấm để chọn ảnh
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    JPG, PNG, GIF, WEBP · tối đa {MAX_MB}MB
                                </p>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {imageError && <p className="text-red-500 text-sm mt-2">{imageError}</p>}
                    {selectedFile && !imageError && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Đã chọn: <span className="font-medium">{selectedFile.name}</span>
                            {' '}({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                {/* CỘT PHẢI: Tên, Mô tả, Hình thức, Địa điểm/MeetLink, Giới hạn */}
                <div className="space-y-5">
                    {/* Tên sự kiện */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                            Tên sự kiện <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.eventName ? 'border-red-500' : ''}`}
                            placeholder="Nhập tên sự kiện"
                        />
                        {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                            Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.description ? 'border-red-500' : ''}`}
                            placeholder="Nhập mô tả sự kiện"
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* Hình thức tổ chức */}
                    <div>
                        <label className={`block text-sm font-medium mb-3 ${labelClass}`}>
                            Hình thức tổ chức <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className={`flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border-2 transition-all ${!formData.isOnline
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'
                                }`}>
                                <input
                                    type="radio"
                                    name="isOnline"
                                    value="offline"
                                    checked={!formData.isOnline}
                                    onChange={() => handleToggleOnline(false)}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className={`text-sm font-medium ${!formData.isOnline ? 'text-blue-600' : labelClass}`}>
                                    Trực tiếp (Offline)
                                </span>
                            </label>
                            <label className={`flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border-2 transition-all ${formData.isOnline
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'
                                }`}>
                                <input
                                    type="radio"
                                    name="isOnline"
                                    value="online"
                                    checked={formData.isOnline}
                                    onChange={() => handleToggleOnline(true)}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className={`text-sm font-medium ${formData.isOnline ? 'text-blue-600' : labelClass}`}>
                                    Trực tuyến (Online)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Địa điểm — chỉ hiện khi Offline */}
                    {!formData.isOnline && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Địa điểm</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.location ? 'border-red-500' : ''}`}
                                placeholder="Nhập địa điểm tổ chức (VD: Hội trường A, ...)"
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>
                    )}

                    {/* Meeting Link — chỉ hiện khi Online */}
                    {formData.isOnline && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                Đường dẫn tham gia (Meeting Link)
                            </label>
                            <input
                                type="url"
                                name="meetLink"
                                value={formData.meetLink}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass}`}
                                placeholder="https://meet.google.com/... hoặc link Zoom, Teams..."
                            />
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Hệ thống cũng hỗ trợ phòng họp nội bộ WebRTC tích hợp sẵn.
                            </p>
                        </div>
                    )}

                    {/* Giới hạn số người */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                            Giới hạn số người tham gia
                            <span className={`ml-2 text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                (để trống = không giới hạn)
                            </span>
                        </label>
                        <div className="relative">
                            <i className={`fas fa-users absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                type="number"
                                name="maxAttendees"
                                min={1}
                                value={formData.maxAttendees}
                                onChange={handleChange}
                                className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.maxAttendees ? 'border-red-500' : ''}`}
                                placeholder="VD: 50"
                            />
                        </div>
                        {errors.maxAttendees && <p className="text-red-500 text-sm mt-1">{errors.maxAttendees}</p>}
                    </div>
                </div>
            </div>

            {/* Thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thời gian bắt đầu */}
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    {/* Custom wrapper: hiển thị format Việt Nam, click mở native picker */}
                    <div
                        className={`relative w-full rounded-lg border outline-none transition-colors cursor-pointer ${isDark ? 'bg-[#1a1d2e] border-gray-700' : 'bg-white border-gray-300'
                            } ${errors.startDate ? 'border-red-500' : ''}`}
                        onClick={() => startDateRef.current?.showPicker?.()}
                    >
                        <div className={`px-4 py-2 text-sm select-none ${formData.startDate
                            ? (isDark ? 'text-white' : 'text-gray-900')
                            : (isDark ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                            {formData.startDate
                                ? <><i className="fas fa-calendar-alt mr-2 text-blue-500" />{formatViDate(formData.startDate)}</>
                                : 'Chọn ngày giờ bắt đầu'
                            }
                        </div>
                        <input
                            ref={startDateRef}
                            type="datetime-local"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            tabIndex={-1}
                        />
                    </div>
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                {/* Thời gian kết thúc */}
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Thời gian kết thúc <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`relative w-full rounded-lg border outline-none transition-colors cursor-pointer ${isDark ? 'bg-[#1a1d2e] border-gray-700' : 'bg-white border-gray-300'
                            } ${errors.endDate ? 'border-red-500' : ''}`}
                        onClick={() => endDateRef.current?.showPicker?.()}
                    >
                        <div className={`px-4 py-2 text-sm select-none ${formData.endDate
                            ? (isDark ? 'text-white' : 'text-gray-900')
                            : (isDark ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                            {formData.endDate
                                ? <><i className="fas fa-calendar-alt mr-2 text-blue-500" />{formatViDate(formData.endDate)}</>
                                : 'Chọn ngày giờ kết thúc'
                            }
                        </div>
                        <input
                            ref={endDateRef}
                            type="datetime-local"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            tabIndex={-1}
                        />
                    </div>
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>
            </div>


            {/* Tùy chọn */}
            <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={formData.requiresApproval}
                        onChange={(e) => {
                            const next = { ...formData, requiresApproval: e.target.checked };
                            setFormData(next);
                            onChange?.(next);
                        }}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                    />
                    <span className={`text-sm ${labelClass}`}>
                        Đăng ký cần phê duyệt
                    </span>
                </label>
                <label className={`flex items-center gap-2 select-none ${formData.isOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => {
                            const next = { ...formData, isPublic: e.target.checked };
                            setFormData(next);
                            onChange?.(next);
                        }}
                        disabled={formData.isOnline}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                    />
                    <span className={`text-sm ${labelClass}`}>
                        Sự kiện công khai
                    </span>
                    {formData.isOnline && (
                        <span className="text-xs text-amber-500 italic">(Sự kiện online mặc định là nội bộ)</span>
                    )}
                </label>
            </div>

            {/* Nút hành động — ẩn khi hideActions=true (edit page có nút tổng bên ngoài) */}
            {!hideActions && (
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-lg border transition-colors disabled:opacity-50 ${isDark
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        )}
                        {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật sự kiện'}
                    </button>
                </div>
            )}
        </form>
    );
}
