import { useState } from 'react';

interface RegistrationFormProps {
    eventId: number;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDark?: boolean;
}

export function RegistrationForm({
    eventId,
    onSubmit,
    onCancel,
    isLoading = false,
    isDark = false
}: RegistrationFormProps) {
    const [formData, setFormData] = useState({
        registrationStartDate: '',
        registrationEndDate: '',
        maxAttendees: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const inputClass = isDark
        ? 'bg-[#1a1d2e] border-gray-700 text-white'
        : 'bg-white border-gray-300 text-gray-900';

    const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.registrationStartDate) {
            newErrors.registrationStartDate = 'Registration start date is required';
        }

        if (!formData.registrationEndDate) {
            newErrors.registrationEndDate = 'Registration end date is required';
        }

        if (formData.registrationStartDate && formData.registrationEndDate) {
            const start = new Date(formData.registrationStartDate);
            const end = new Date(formData.registrationEndDate);
            if (end <= start) {
                newErrors.registrationEndDate = 'End date must be after start date';
            }
        }

        if (formData.maxAttendees) {
            const maxAttendees = parseInt(formData.maxAttendees);
            if (isNaN(maxAttendees) || maxAttendees < 1) {
                newErrors.maxAttendees = 'Max attendees must be greater than 0';
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
            registrationStartDate: new Date(formData.registrationStartDate).toISOString(),
            registrationEndDate: new Date(formData.registrationEndDate).toISOString(),
            maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        };

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Registration Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="registrationStartDate"
                        value={formData.registrationStartDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.registrationStartDate ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.registrationStartDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.registrationStartDate}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                        Registration End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="registrationEndDate"
                        value={formData.registrationEndDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.registrationEndDate ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.registrationEndDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.registrationEndDate}</p>
                    )}
                </div>
            </div>

            <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Max Attendees (Optional)
                </label>
                <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg border outline-none ${inputClass} ${errors.maxAttendees ? 'border-red-500' : ''
                        }`}
                    placeholder="Leave empty for unlimited"
                />
                {errors.maxAttendees && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxAttendees}</p>
                )}
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
                    className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                    Open Registration
                </button>
            </div>
        </form>
    );
}
