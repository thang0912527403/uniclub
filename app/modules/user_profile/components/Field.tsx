import React from "react";

interface FieldProps {
  label: string;
  icon: string;
  value: string;
  field: string;
  type?: string;
  editable: boolean;
  onChange: (val: string) => void;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  value,
  field,
  type = "text",
  editable,
  onChange,
  required = false,
}) => {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
        <i className={`fas ${icon} text-orange-500 w-4 text-center`} /> {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
        />
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
          {value || "—"}
        </p>
      )}
    </div>
  );
};

export default Field;
