import React, { useState } from "react";
import { Link } from "react-router";
import type { ApplicationFormResponseDto } from "~/cores/api";

interface FormCardProps {
  form: ApplicationFormResponseDto;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const FormCard: React.FC<FormCardProps> = ({
  form,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const applyUrl = `${window.location.origin}/application-form/${form.formId}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all group ${
        isSelected
          ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
            {form.formTitle || form.formName}
          </p>
          {form.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {form.description}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-2">
            <i className="fa-regular fa-clock mr-1" />
            {new Date(form.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            title="Sửa"
          >
            <i className="fa-solid fa-pen text-xs" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Xóa"
          >
            <i className="fa-solid fa-trash text-xs" />
          </button>
        </div>
      </div>

      {/* Apply / Share row */}
      <div
        className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          to={`/application-form/${form.formId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all"
        >
          <i className="fa-solid fa-pen-to-square text-[10px]" />
          Ứng tuyển
        </Link>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          title="Sao chép link ứng tuyển"
        >
          <i
            className={`fa-solid ${copied ? "fa-check" : "fa-link"} text-[10px]`}
          />
          {copied ? "Đã chép!" : "Sao chép link"}
        </button>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-500" />
      )}
    </div>
  );
};
