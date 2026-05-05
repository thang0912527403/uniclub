import React, { useState, useMemo } from "react";
import {
  usePublishResultsMutation,
  useGetPublishStatusQuery,
} from "~/cores/api/interviewApi";
import { useGetUserByIdQuery } from "~/cores/api";
import { useClubRole } from "~/hooks/useClubRole";

// ─── Inline user name resolver ───────────────────────────────────
const UserNameInline: React.FC<{ userId: string; fallback?: string }> = ({
  userId,
  fallback,
}) => {
  const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });
  return <>{user?.fullName || fallback || userId.slice(0, 8) + "…"}</>;
};

// ─── Decision badge ──────────────────────────────────────────────
const DecisionBadge: React.FC<{ decision: string }> = ({ decision }) => {
  const config: Record<string, { label: string; cls: string; icon: string }> = {
    Accept: {
      label: "Duyệt",
      cls: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "fa-circle-check",
    },
    Reject: {
      label: "Loại",
      cls: "bg-red-100 text-red-700 border-red-200",
      icon: "fa-circle-xmark",
    },
    Waitlist: {
      label: "Chờ",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
      icon: "fa-clock",
    },
  };
  const c = config[decision] || config.Waitlist;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${c.cls}`}
    >
      <i className={`fa-solid ${c.icon} text-[9px]`} />
      {c.label}
    </span>
  );
};

// ─── Props ───────────────────────────────────────────────────────
interface PublishResultModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: number;
  clubId?: number;
  onSuccess?: () => void;
}

const PublishResultModal: React.FC<PublishResultModalProps> = ({
  open,
  onClose,
  campaignId,
  clubId,
  onSuccess,
}) => {
  const { can } = useClubRole();
  const canPublishResults = can("manageresults");
  const [publishResults, { isLoading }] = usePublishResultsMutation();
  const { data: publishStatus } = useGetPublishStatusQuery(campaignId);

  const [mode, setMode] = useState<"Now" | "Schedule">("Now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ─── Candidate selection ──────────────────────────────────────
  const allDecisions = useMemo(
    () => publishStatus?.decisions ?? [],
    [publishStatus],
  );

  // Only unpublished decisions can be selected
  const selectableDecisions = useMemo(
    () => allDecisions.filter((d) => d.publishStatus !== "Published"),
    [allDecisions],
  );

  const alreadyPublished = useMemo(
    () => allDecisions.filter((d) => d.publishStatus === "Published"),
    [allDecisions],
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Auto-select all when decisions load
  React.useEffect(() => {
    if (selectableDecisions.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(selectableDecisions.map((d) => d.id)));
    }
  }, [selectableDecisions]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableDecisions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableDecisions.map((d) => d.id)));
    }
  };

  const selectedAcceptCount = selectableDecisions.filter(
    (d) => selectedIds.has(d.id) && d.decision === "Accept",
  ).length;

  // ─── Publish ──────────────────────────────────────────────────
  const handlePublish = async () => {
    setError(null);

    if (selectedIds.size === 0) {
      setError("Vui lòng chọn ít nhất một ứng viên để công bố");
      return;
    }

    if (mode === "Schedule" && !scheduledAt) {
      setError("Vui lòng chọn thời gian công bố");
      return;
    }

    try {
      await publishResults({
        campaignId,
        dto: {
          mode,
          scheduledAt:
            mode === "Schedule" ? new Date(scheduledAt).toISOString() : null,
          decisionIds: Array.from(selectedIds),
        },
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError("Công bố thất bại");
      console.error("Failed to publish results:", err);
    }
  };

  if (!open) return null;

  const hasDecisions = selectableDecisions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <i className="fa-solid fa-bullhorn text-blue-500 text-lg" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Công bố kết quả
          </h3>
        </div>

        {error && (
          <div className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ─── Candidate Checklist ─── */}
        {hasDecisions ? (
          <div className="flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Chọn ứng viên công bố ({selectedIds.size}/
                {selectableDecisions.length})
              </p>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                {selectedIds.size === selectableDecisions.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700">
              {selectableDecisions.map((d) => (
                <label
                  key={d.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                    selectedIds.has(d.id)
                      ? "bg-blue-50/50 dark:bg-blue-900/10"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={() => toggleSelect(d.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 flex-shrink-0"
                  />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                    {d.candidateUserId.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium flex-1 truncate">
                    <UserNameInline userId={d.candidateUserId} />
                  </span>
                  <DecisionBadge decision={d.decision} />
                </label>
              ))}
            </div>

            {/* Auto-add to club note */}
            {clubId && selectedAcceptCount > 0 && (
              <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs">
                  <i className="fa-solid fa-user-plus text-[10px]" />
                  <span>
                    <strong>{selectedAcceptCount}</strong> ứng viên được duyệt
                    sẽ tự động thêm vào câu lạc bộ.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 px-4 py-5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-center">
            <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-lg mb-1.5 block" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
              Chưa có quyết định nào để công bố.
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Hãy gửi quyết định Duyệt / Loại / Chờ cho các ứng viên trước.
            </p>
          </div>
        )}

        {/* Already published note */}
        {alreadyPublished.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-xs text-green-700 dark:text-green-300">
            <i className="fa-solid fa-check-double mr-1" />
            {alreadyPublished.length} ứng viên đã công bố trước đó.
          </div>
        )}

        {/* ─── Mode + Schedule + Channels ─── */}
        {hasDecisions && (
          <>
            {/* Mode toggle */}
            <div className="flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phương thức
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("Now")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    mode === "Now"
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <i className="fa-solid fa-paper-plane" /> Công bố ngay
                </button>
                <button
                  type="button"
                  onClick={() => setMode("Schedule")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    mode === "Schedule"
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <i className="fa-solid fa-calendar-check" /> Lên lịch
                </button>
              </div>
            </div>

            {mode === "Schedule" && (
              <div className="flex-shrink-0">
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

          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {hasDecisions ? "Hủy" : "Đóng"}
          </button>
          {hasDecisions && canPublishResults && (
            <button
              onClick={handlePublish}
              disabled={isLoading || selectedIds.size === 0}
              className={`px-5 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "Now"
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-yellow-500 to-orange-500"
              }`}
            >
              {isLoading
                ? "Đang xử lý..."
                : mode === "Now"
                  ? `Công bố ${selectedIds.size} ứng viên`
                  : "Lên lịch"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishResultModal;
