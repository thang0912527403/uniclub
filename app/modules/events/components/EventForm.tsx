import { useState } from 'react';

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
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
    mode?: 'create' | 'edit';
}

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
        imageUrl: initialData?.imageUrl || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        clubId: initialData?.clubId || undefined,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const inputClass = isDark
        ? 'bg-[#1a1d2e] border-gray-700 text-white'
        : 'bg-white border-gray-300 text-gray-900';

    const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.eventName.trim()) {
            newErrors.eventName = 'Event name is required';
        } else if (formData.eventName.length > 200) {
            newErrors.eventName = 'Event name cannot exceed 200 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (formData.location && formData.location.length > 200) {
            newErrors.location = 'Location cannot exceed 200 characters';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end < start) {
                newErrors.endDate = 'End date must be after start date';
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
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            clubId: formData.clubId || undefined,
        };

        if (mode === 'edit' && initialData?.eventId) {
            submitData.eventId = initialData.eventId;
        }

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Event Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.eventName ? 'border-red-500' : ''
                        }`}
                    placeholder="Enter event name"
                />
                {errors.eventName && (
                    <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>
                )}
            </div>

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.description ? 'border-red-500' : ''
                        }`}
                    placeholder="Enter event description"
                />
                {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
            </div>

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Location
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.location ? 'border-red-500' : ''
                        }`}
                    placeholder="Enter event location"
                />
                {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
            </div>

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Image URL
                </label>
                <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass}`}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

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
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.startDate ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.startDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                    )}
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
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.endDate ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.endDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                    )}
                </div>
            </div>

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
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                    {mode === 'create' ? 'Create Event' : 'Update Event'}
                </button>
            </div>
        </form>
    );
}
