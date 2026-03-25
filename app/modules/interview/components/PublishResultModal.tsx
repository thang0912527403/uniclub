import React, { useState } from 'react';
import { usePublishResultsMutation } from '~/cores/api/interviewApi';

interface PublishResultModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: number;
  onSuccess?: () => void;
}

const PublishResultModal: React.FC<PublishResultModalProps> = ({
  open, onClose, campaignId, onSuccess,
}) => {
  const [publishResults, { isLoading }] = usePublishResultsMutation();

  const [mode, setMode] = useState<'Now' | 'Schedule'>('Now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [emailNotify, setEmailNotify] = useState(true);
  const [inAppNotify, setInAppNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setError(null);

    if (mode === 'Schedule' && !scheduledAt) {
      setError('Vui lòng chọn thời gian công bố');
      return;
    }

    const channels: string[] = [];
    if (emailNotify) channels.push('Email');
    if (inAppNotify) channels.push('InApp');

    try {
      await publishResults({
        campaignId,
        dto: {
          mode,
          scheduledAt: mode === 'Schedule' ? new Date(scheduledAt).toISOString() : null,
          notificationChannels: channels.join(',') || null,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError('Công bố thất bại');
      console.error('Failed to publish results:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-bullhorn text-blue-500 text-lg" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Công bố kết quả</h3>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Mode toggle */}
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phương thức</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('Now')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                mode === 'Now'
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <i className="fa-solid fa-paper-plane" /> Công bố ngay
            </button>
            <button
              type="button"
              onClick={() => setMode('Schedule')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                mode === 'Schedule'
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <i className="fa-solid fa-calendar-check" /> Lên lịch
            </button>
          </div>
        </div>

        {/* Schedule date */}
        {mode === 'Schedule' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Thời gian công bố
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
        )}

        {/* Notification channels */}
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kênh thông báo</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <i className="fa-solid fa-envelope mr-1 text-gray-400" /> Email
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inAppNotify}
                onChange={(e) => setInAppNotify(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <i className="fa-solid fa-bell mr-1 text-gray-400" /> Thông báo trong ứng dụng
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'Now'
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : mode === 'Now' ? 'Công bố ngay' : 'Lên lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishResultModal;
