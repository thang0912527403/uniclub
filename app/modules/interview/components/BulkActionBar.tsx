import React from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  activeTab: string;
  onConfirmAll?: () => void;
  onCancelAll?: () => void;
  onBulkCreateSchedule?: () => void;
  onClearSelection: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  activeTab,
  onConfirmAll,
  onCancelAll,
  onBulkCreateSchedule,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
      <div className="flex items-center gap-3 px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-2xl shadow-2xl shadow-gray-900/30 border border-gray-700 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 bg-orange-500 rounded-full text-sm font-bold">
            {selectedCount}
          </span>
          <span className="text-sm font-medium text-gray-300">đã chọn</span>
        </div>

        <div className="w-px h-6 bg-gray-700 dark:bg-gray-600" />

        {/* Tab-specific actions */}
        {activeTab === 'Scheduled' && onConfirmAll && (
          <button
            onClick={onConfirmAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Xác nhận tất cả
          </button>
        )}

        {activeTab === 'Reviewed' && onBulkCreateSchedule && (
          <button
            onClick={onBulkCreateSchedule}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Tạo lịch PV hàng loạt
          </button>
        )}

        {['Scheduled', 'Confirmed'].includes(activeTab) && onCancelAll && (
          <button
            onClick={onCancelAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Hủy đã chọn
          </button>
        )}

        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-colors"
        >
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
