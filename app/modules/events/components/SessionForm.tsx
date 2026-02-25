import { useState } from 'react';

interface SessionFormProps {
    eventId: number;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
}

export function SessionForm({
    eventId,
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
            newErrors.sessionName = 'Session name is required';
        } else if (formData.sessionName.length > 100) {
            newErrors.sessionName = 'Session name cannot exceed 100 characters';
        }

        if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
        }

        if (!formData.endTime) {
            newErrors.endTime = 'End time is required';
        }

        if (formData.startTime && formData.endTime) {
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            if (end <= start) {
                newErrors.endTime = 'End time must be after start time';
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
            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Session Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="sessionName"
                    value={formData.sessionName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.sessionName ? 'border-red-500' : ''
                        }`}
                    placeholder="Enter session name"
                />
                {errors.sessionName && (
                    <p className="text-red-500 text-sm mt-1">{errors.sessionName}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Start Time <span className="text-red-500">*</span>
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
                        End Time <span className="text-red-500">*</span>
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

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Location
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass}`}
                    placeholder="Enter session location"
                />
            </div>

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass}`}
                    placeholder="Enter session description"
                />
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
                    Add Session
                </button>
            </div>
        </form>
    );
}
