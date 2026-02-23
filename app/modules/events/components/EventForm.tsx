import { useState, useRef, useCallback } from 'react';

interface EventFormProps {
    initialData?: {
        eventId?: number;
        eventName?: string;
        description?: string;
        location?: string;
        imageUrl?: string;
        startDate?: string;
        endDate?: string;
        clubId?: number;
    };
    /** data includes optional `image: File` if user selected a file */
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
    mode?: 'create' | 'edit';
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_MB = 5;

export function EventForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isDark = false,
    mode = 'create'
}: EventFormProps) {
    const [formData, setFormData] = useState({
        eventName: initialData?.eventName || '',
        description: initialData?.description || '',
        location: initialData?.location || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        clubId: initialData?.clubId || undefined,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl || '');
    const [imageError, setImageError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const inputClass = isDark
        ? 'bg-[#1a1d2e] border-gray-700 text-white focus:border-blue-400'
        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500';
    const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
        if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
        else if (formData.eventName.length > 200) newErrors.eventName = 'Event name cannot exceed 200 characters';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.location && formData.location.length > 200) newErrors.location = 'Location cannot exceed 200 characters';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate))
            newErrors.endDate = 'End date must be after start date';
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
            // Pass the File object — parent mutation will package it into FormData
            image: selectedFile ?? undefined,
        };
        if (mode === 'edit' && initialData?.eventId) submitData.eventId = initialData.eventId;

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Event Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.eventName ? 'border-red-500' : ''}`}
                    placeholder="Enter event name"
                />
                {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
            </div>

            {/* Description */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Enter event description"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Location */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Location
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.location ? 'border-red-500' : ''}`}
                    placeholder="Enter event location"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Image Picker */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Event Image
                    <span className={`ml-2 text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        (jpg, png, gif, webp · max {MAX_MB}MB · tùy chọn)
                    </span>
                </label>

                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${isDark
                            ? 'border-gray-600 hover:border-blue-500 bg-[#1a1d2e]'
                            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                        } ${previewUrl ? 'p-2' : 'p-8'}`}
                >
                    {previewUrl ? (
                        <div className="relative group">
                            <img
                                src={previewUrl}
                                alt="Event preview"
                                className="w-full h-48 object-cover rounded-lg"
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

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.startDate ? 'border-red-500' : ''}`}
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass} ${errors.endDate ? 'border-red-500' : ''}`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>
            </div>

            {/* Actions */}
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
                    Cancel
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
                    {mode === 'create' ? 'Create Event' : 'Update Event'}
                </button>
            </div>
        </form>
    );
}
