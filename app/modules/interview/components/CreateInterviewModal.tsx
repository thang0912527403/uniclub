import React, { useState } from "react";
import { message } from "antd";
import type { ApplicationResponseDto } from "~/cores/api";
import { useGetUserByIdQuery } from "~/cores/api";

const BulkCandidateRow: React.FC<{
  app: ApplicationResponseDto;
  index: number;
}> = ({ app, index }) => {
  const { data: user, isLoading } = useGetUserByIdQuery(app.userId, {
    skip: !app.userId,
  });
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 py-1 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">
        {index + 1}.
      </span>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0 overflow-hidden">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          (user?.fullName?.[0] || app.userId.slice(0, 2)).toUpperCase()
        )}
      </div>
      <span className="font-medium truncate flex-1">
        {isLoading ? (
          <span className="inline-block w-24 h-3.5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        ) : (
          user?.fullName || app.userId
        )}
      </span>
    </div>
  );
};

interface TimeSlot {
  id: string;
  date: string;
  time: string;
}

/** Stored as JSON in the description field for candidate to pick (DEPRECATED - now uses DB table) */
export interface ProposedSlots {
  proposedTimeSlots: { date: string; time: string }[];
}

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationResponseDto | null;
  /** Multiple applications for bulk mode */
  applications?: ApplicationResponseDto[];
  campaignId: number;
  currentUserId: string;
  onSubmit: (data: {
    applicationId: number;
    candidateUserId: string;
    campaignId: number;
    createdByUserId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes: number;
    proposedTimeSlots?: { date: string; time: string }[];
  }) => Promise<void>;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const CreateInterviewModal: React.FC<CreateInterviewModalProps> = ({
  isOpen,
  onClose,
  application,
  applications = [],
  campaignId,
  currentUserId,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-slot: admin proposes multiple time slots for candidate to choose
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: generateId(), date: "", time: "" },
  ]);
  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(
    application?.userId || "",
    { skip: !application?.userId },
  );
  const isBulkMode = applications.length > 0;
  const targetApps = isBulkMode
    ? applications
    : application
      ? [application]
      : [];

  if (!isOpen || targetApps.length === 0) return null;

  const addTimeSlot = () => {
    setTimeSlots((prev) => [...prev, { id: generateId(), date: "", time: "" }]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length <= 1) return;
    setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: "date" | "time", value: string) => {
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const validSlots = timeSlots.filter((s) => s.date && s.time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      message.warning("Vui lòng nhập tiêu đề");
      return;
    }
    if (validSlots.length === 0) {
      message.warning("Vui lòng thêm ít nhất 1 khung giờ");
      return;
    }

    const now = new Date();
    const hasPastSlot = validSlots.some((slot) => {
      const slotDate = new Date(`${slot.date}T${slot.time}`);
      return slotDate < now;
    });

    if (hasPastSlot) {
      message.warning("Không thể chọn ngày giờ trong quá khứ");
      return;
    }

    setIsSubmitting(true);
    let created = 0;
    let failed = 0;

    // Build proposed slots metadata to store in description
    const firstSlot = validSlots[0];
    const scheduledAt = new Date(
      `${firstSlot.date}T${firstSlot.time}`,
    ).toISOString();

    const proposedTimeSlots =
      validSlots.length > 1
        ? validSlots.map((s) => ({ date: s.date, time: s.time }))
        : undefined;

    try {
      // Create ONE interview per application (not per slot)
      for (const app of targetApps) {
        try {
          await onSubmit({
            applicationId: app.applicationId,
            candidateUserId: app.userId,
            campaignId,
            createdByUserId: currentUserId,
            title: title.trim(),
            description: description.trim() || undefined,
            scheduledAt,
            durationMinutes,
            proposedTimeSlots,
          });
          created++;
        } catch {
          failed++;
        }
      }

      if (created > 0) {
        const slotText =
          validSlots.length > 1
            ? ` (${validSlots.length} khung giờ đề xuất)`
            : "";
        message.success(
          `Đã tạo ${created} lịch phỏng vấn${slotText} thành công!`,
        );
      }
      if (failed > 0) {
        message.error(`${failed} lịch tạo thất bại`);
      }

      // Reset
      setTitle("");
      setDescription("");
      setTimeSlots([{ id: generateId(), date: "", time: "" }]);
      setDurationMinutes(60);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isBulkMode ? "Tạo lịch PV" : "Tạo lịch phỏng vấn"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {!isBulkMode && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden backdrop-blur-sm">
                    {userData?.avatar ? (
                      <img
                        src={userData.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (userData?.fullName?.[0] || "U").toUpperCase()
                    )}
                  </div>
                )}
                <p className="text-orange-100 text-sm">
                  {isBulkMode
                    ? `${targetApps.length} ứng viên đã chọn`
                    : `Ứng viên: ${userData?.fullName}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Vòng 1 – Phỏng vấn năng lực"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về buổi phỏng vấn..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Multi-slot Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Đề xuất khung giờ <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Thêm khung giờ
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {validSlots.length > 1
                ? "Ứng viên sẽ chọn 1 trong các khung giờ bên dưới"
                : "Thêm nhiều khung giờ để ứng viên có thể chọn thời gian phù hợp"}
            </p>

            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div key={slot.id} className="flex items-center gap-2 group">
                  <span
                    className={`text-xs font-bold w-5 text-center flex-shrink-0 ${
                      index === 0 && validSlots.length > 1
                        ? "text-orange-500"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <input
                    type="date"
                    min={(() => {
                      const d = new Date();
                      const offset = d.getTimezoneOffset() * 60000;
                      const localDate = new Date(d.getTime() - offset);
                      return localDate.toISOString().split("T")[0];
                    })()}
                    value={slot.date}
                    onChange={(e) =>
                      updateSlot(slot.id, "date", e.target.value)
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all text-sm"
                  />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) =>
                      updateSlot(slot.id, "time", e.target.value)
                    }
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all text-sm"
                  />
                  {timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {validSlots.length > 1 && (
              <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Tạo 1 lịch PV{isBulkMode ? ` / ứng viên` : ""} — ứng viên sẽ
                  chọn 1 trong {validSlots.length} khung giờ
                </p>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Thời lượng
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition-all text-sm"
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
              <option value={120}>120 phút</option>
            </select>
          </div>

          {/* Candidate Info */}
          {!isBulkMode && application && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Thông tin ứng viên
              </p>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium">Họ tên:</span>{" "}
                  {userData?.fullName}
                </p>
                <p>
                  <span className="font-medium">Ngày nộp:</span>{" "}
                  {new Date(application.submissionDate).toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Bulk mode: list of selected apps */}
          {isBulkMode && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Ứng viên đã chọn ({targetApps.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                {targetApps.map((app, idx) => (
                  <BulkCandidateRow
                    key={app.applicationId}
                    app={app}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || !title.trim() || validSlots.length === 0
              }
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium text-sm hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang tạo...
                </span>
              ) : (
                "Tạo lịch phỏng vấn"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CreateInterviewModal;
