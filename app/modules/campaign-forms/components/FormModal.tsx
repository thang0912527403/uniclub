import React, { useState } from "react";
import type { ApplicationFormResponseDto } from "~/cores/api";

interface FormModalProps {
  campaignId: number;
  editing: ApplicationFormResponseDto | null;
  onClose: () => void;
  onCreate: (f: {
    campaignId: number;
    formName: string;
    formTitle: string;
    description: string;
  }) => void;
  onUpdate: (id: number, f: ApplicationFormResponseDto) => void;
  isSaving: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  campaignId,
  editing,
  onClose,
  onCreate,
  onUpdate,
  isSaving,
}) => {
  const [name, setName] = useState(editing?.formName ?? "");
  const [title, setTitle] = useState(editing?.formTitle ?? "");
  const [desc, setDesc] = useState(editing?.description ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      onUpdate(editing.formId, {
        ...editing,
        formName: name,
        formTitle: title,
        description: desc,
      });
    } else {
      onCreate({
        campaignId,
        formName: name,
        formTitle: title,
        description: desc,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold">
            {editing ? "Chỉnh sửa biểu mẫu" : "Tạo biểu mẫu mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tên biểu mẫu <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên định danh của form..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tiêu đề hiển thị
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề người dùng thấy..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Mô tả biểu mẫu..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <i className="fa-solid fa-spinner fa-spin" />
              ) : (
                <i className="fa-solid fa-check" />
              )}
              {editing ? "Lưu thay đổi" : "Tạo biểu mẫu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
