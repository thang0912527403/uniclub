import { useState } from 'react';

interface SessionFormProps {
    eventId: number;
    clubId: number;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
}

export function SessionForm({
    eventId,
    clubId,
    onSubmit,
    onCancel,
    isLoading = false,
    isDark = false
}: SessionFormProps) {
    const [formData, setFormData] = useState({
        sessionName: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const inputClass = isDark
        ? 'bg-[#1a1d2e] border-gray-700 text-white'
        : 'bg-white border-gray-300 text-gray-900';

    const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.sessionName.trim()) {
            newErrors.sessionName = 'Tên phiên không được để trống';
        } else if (formData.sessionName.length > 100) {
            newErrors.sessionName = 'Tên phiên không được vượt quá 100 ký tự';
        }

        if (!formData.startTime) {
            newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
        }

        if (!formData.endTime) {
            newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
        }

        if (formData.startTime && formData.endTime) {
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            if (end <= start) {
                newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        const submitData = {
            eventId,
            clubId,
            sessionName: formData.sessionName,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
            location: formData.location || undefined,
            description: formData.description || undefined,
        };

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên phiên */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Tên phiên <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="sessionName"
                    value={formData.sessionName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.sessionName ? 'border-red-500' : ''
                        }`}
                    placeholder="VD: Phiên khai mạc, Workshop kỹ năng..."
                />
                {errors.sessionName && (
                    <p className="text-red-500 text-sm mt-1">{errors.sessionName}</p>
                )}
            </div>

            {/* Thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.startTime ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.startTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Thời gian kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.endTime ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.endTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                    )}
                </div>
            </div>

            {/* Địa điểm phiên */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Địa điểm <span className={`text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(tùy chọn)</span>
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass}`}
                    placeholder="Địa điểm của phiên này (nếu khác địa điểm chính)"
                />
            </div>

            {/* Mô tả phiên */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Mô tả <span className={`text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(tùy chọn)</span>
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass}`}
                    placeholder="Nội dung chi tiết của phiên này..."
                />
            </div>

            {/* Nút hành động */}
            <div className="flex gap-4 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className={`px-6 py-2 rounded-lg border ${isDark
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        } transition-colors disabled:opacity-50`}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading && <i className="fas fa-spinner fa-spin" />}
                    Thêm phiên
                </button>
            </div>
        </form>
    );
}
