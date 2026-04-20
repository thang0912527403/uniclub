import React, { useState } from "react";
import { statusConfig } from "./constants";

// ── Status Badge ──
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const sConf = statusConfig[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-700",
  };
  const dotColor = sConf.cls.includes("amber")
    ? "bg-amber-500"
    : sConf.cls.includes("blue")
      ? "bg-blue-500"
      : sConf.cls.includes("red")
        ? "bg-red-500"
        : sConf.cls.includes("green")
          ? "bg-green-500"
          : "bg-gray-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${sConf.cls}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {sConf.label}
    </span>
  );
};

// ── Application Status Actions ──
export const ApplicationStatusActions: React.FC<{
  currentStatus: string;
  onChangeStatus: (newStatus: string) => void;
}> = ({ currentStatus, onChangeStatus }) => {
  const isPending = currentStatus === "PENDING";

  return (
    <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1.5">
      <button
        disabled={!isPending}
        onClick={(e) => {
          e.stopPropagation();
          onChangeStatus("SUCCESS");
        }}
        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border flex items-center ${
          !isPending
            ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
            : "bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800"
        }`}
        title="Chuyển sang Vào phỏng vấn"
      >
        <i className="fa-solid fa-check mr-1.5" />
        Vào phỏng vấn
      </button>
      <button
        disabled={!isPending}
        onClick={(e) => {
          e.stopPropagation();
          onChangeStatus("REJECTED");
        }}
        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border flex items-center ${
          !isPending
            ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
            : "bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800"
        }`}
        title="Từ chối"
      >
        <i className="fa-solid fa-xmark mr-1.5" />
        Từ chối
      </button>
    </div>
  );
};

// ── Bulk Action Bar ──
export const BulkActionBar: React.FC<{
  count: number;
  onClear: () => void;
  onBulkStatus: (status: string) => void;
}> = ({ count, onClear, onBulkStatus }) => {
  return (
    <div className="bg-indigo-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
          {count}
        </span>
        <span className="text-sm font-medium">đơn đã chọn</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBulkStatus("SUCCESS")}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <i className="fa-solid fa-check text-[10px]" />
          Vào phỏng vấn
        </button>
        <button
          onClick={() => onBulkStatus("REJECTED")}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <i className="fa-solid fa-xmark text-[10px]" />
          Từ chối
        </button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
        >
          Bỏ chọn
        </button>
      </div>
    </div>
  );
};
