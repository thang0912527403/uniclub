import React from "react";

interface ConfirmDeleteModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  message,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-150">
      {/* Icon header */}
      <div className="flex flex-col items-center pt-6 pb-4 px-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
          <i className="fa-solid fa-trash text-red-500 text-lg" />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-white text-center">
          Xác nhận xóa
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-6 pb-5">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-trash text-xs" />
          Xóa
        </button>
      </div>
    </div>
  </div>
);
