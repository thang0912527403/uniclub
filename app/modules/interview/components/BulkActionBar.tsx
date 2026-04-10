import React from "react";

interface BulkActionBarProps {
  selectedCount: number;
  activeTab: string;
  onConfirmAll?: () => void;
  onCancelAll?: () => void;
  onBulkCreateSchedule?: () => void;
  onBulkAssignInterviewers?: () => void;
  onBulkStartInterview?: () => void;
  onBulkComplete?: () => void;
  onClearSelection: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  activeTab,
  onConfirmAll,
  onCancelAll,
  onBulkCreateSchedule,
  onBulkAssignInterviewers,
  onBulkStartInterview,
  onBulkComplete,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-2xl shadow-2xl shadow-gray-900/30 border border-gray-700 dark:border-gray-600 flex-wrap justify-center">
        {/* Count badge */}
        <div className="flex items-center gap-2 mr-1">
          <span className="flex items-center justify-center w-7 h-7 bg-orange-500 rounded-full text-sm font-bold flex-shrink-0">
            {selectedCount}
          </span>
          <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
            đã chọn
          </span>
        </div>

        <div className="w-px h-6 bg-gray-700 dark:bg-gray-600 flex-shrink-0" />

        {/* ─── REVIEWED tab ────────────────────────────────────── */}
        {activeTab === "Reviewed" && onBulkCreateSchedule && (
          <button
            onClick={onBulkCreateSchedule}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Tạo lịch PV
          </button>
        )}

        {/* ─── SCHEDULED tab ───────────────────────────────────── */}
        {activeTab === "Confirmed" && onBulkAssignInterviewers && (
          <button
            onClick={onBulkAssignInterviewers}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Phân interviewer
          </button>
        )}

        {/* ─── CONFIRMED tab ───────────────────────────────────── */}
        {activeTab === "Confirmed" && onBulkStartInterview && (
          <button
            onClick={onBulkStartInterview}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Bắt đầu PV
          </button>
        )}

        {/* ─── IN PROGRESS tab ─────────────────────────────────── */}
        {activeTab === "InProgress" && onBulkComplete && (
          <button
            onClick={onBulkComplete}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Hoàn thành
          </button>
        )}

        {/* ─── Cancel — available on Scheduled + Confirmed ─────── */}
        {["Scheduled", "Confirmed"].includes(activeTab) && onCancelAll && (
          <button
            onClick={onCancelAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Hủy đã chọn
          </button>
        )}

        <div className="w-px h-6 bg-gray-700 dark:bg-gray-600 flex-shrink-0" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Bỏ chọn
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BulkActionBar;
