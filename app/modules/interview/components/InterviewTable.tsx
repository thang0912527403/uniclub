import React from "react";
import type {
  InterviewScheduleResponse,
  ApplicationResponseDto,
} from "~/cores/api";
import { useGetUserByIdQuery } from "~/cores/api";

interface InterviewTableProps {
  interviews: InterviewScheduleResponse[];
  applications: ApplicationResponseDto[];
  activeTab: string;
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onRowClick: (interview: InterviewScheduleResponse) => void;
  onApplicationClick: (application: ApplicationResponseDto) => void;
  // Pagination
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// ─── User Name Cell ──────────────────────────────────────────────
const UserNameCell: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: user, isFetching } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  if (isFetching) {
    return (
      <span className="text-gray-400 text-xs animate-pulse">Đang tải...</span>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 overflow-hidden">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          (user?.fullName?.[0] || userId.slice(0, 2)).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {user?.fullName || "Ứng viên"}
        </p>
        <p className="text-[10px] text-gray-400 font-mono truncate">
          {userId.slice(0, 12)}...
        </p>
      </div>
    </div>
  );
};

// ─── Interviewer Avatar ──────────────────────────────────────────
const InterviewerAvatar: React.FC<{
  userId: string;
  hasConfirmed?: boolean;
  role?: string;
}> = ({ userId, hasConfirmed, role }) => {
  const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });
  return (
    <div
      className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-sm ${
        hasConfirmed
          ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
          : "bg-gradient-to-br from-blue-400 to-blue-600"
      }`}
      title={`${user?.fullName || userId.slice(0, 8)} (${role})${
        hasConfirmed ? " ✓" : ""
      }`}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.fullName}
          className="w-full h-full object-cover"
        />
      ) : (
        (user?.fullName?.[0] || userId.slice(0, 2)).toUpperCase()
      )}
    </div>
  );
};

// ─── Status Badge ────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  Reviewed: {
    label: "Đã duyệt",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  Scheduled: {
    label: "Đã lên lịch",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
  },
  Confirmed: {
    label: "Đã xác nhận",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  InProgress: {
    label: "Đang PV",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
  },
  Completed: {
    label: "Hoàn thành",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
  },
  Rescheduled: {
    label: "Dời lịch",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = statusConfig[status] || {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
};

// ─── Feedback Progress ───────────────────────────────────────────
const FeedbackProgress: React.FC<{ interview: InterviewScheduleResponse }> = ({
  interview,
}) => {
  const total = interview.assignments?.length || 0;
  const done =
    interview.assignments?.filter((a) => a.feedbackSubmittedAt).length || 0;

  if (total === 0) return <span className="text-xs text-gray-400">—</span>;

  const pct = Math.round((done / total) * 100);
  const color =
    pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-500" : "bg-gray-300";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden min-w-[40px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
};

// ─── Skeleton Row ────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3.5">
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
    <td className="px-4 py-3.5 flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="space-y-1.5">
        <div className="w-24 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-16 h-2.5 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </td>
    <td className="px-4 py-3.5">
      <div className="w-32 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
    <td className="px-4 py-3.5">
      <div className="w-28 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
    <td className="px-4 py-3.5">
      <div className="w-12 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
    <td className="px-4 py-3.5">
      <div className="w-16 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
    <td className="px-4 py-3.5">
      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </td>
    <td className="px-4 py-3.5">
      <div className="w-20 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </td>
  </tr>
);

// ─── Main Table ──────────────────────────────────────────────────
const InterviewTable: React.FC<InterviewTableProps> = ({
  interviews,
  applications,
  activeTab,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onApplicationClick,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const isReviewedTab = activeTab === "Reviewed";
  const totalPages = Math.ceil(totalItems / pageSize);

  // ─── Empty state ─────────────────────────────────────────────
  if (
    !isLoading &&
    ((isReviewedTab && applications.length === 0) ||
      (!isReviewedTab && interviews.length === 0))
  ) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            Chưa có dữ liệu
          </p>
          <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
            Không tìm thấy ứng viên nào trong mục này.
          </p>
        </div>
      </div>
    );
  }

  // ─── Reviewed applications tab ───────────────────────────────
  if (isReviewedTab) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={
                      applications.length > 0 &&
                      selectedIds.size === applications.length
                    }
                    onChange={onToggleSelectAll}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ứng viên
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Form
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày nộp
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày duyệt
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : applications.map((app) => (
                    <tr
                      key={app.applicationId}
                      className="group hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                      onClick={() => onApplicationClick(app)}
                    >
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.applicationId)}
                          onChange={() => onToggleSelect(app.applicationId)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <UserNameCell userId={app.userId} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        Form #{app.formId}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(app.submissionDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {app.reviewedAt
                          ? new Date(app.reviewedAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status="Reviewed" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplicationClick(app);
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-all hover:shadow-md"
                        >
                          Tạo lịch PV
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  }

  // ─── Interview table (all other tabs) ────────────────────────
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  checked={
                    interviews.length > 0 &&
                    selectedIds.size === interviews.length
                  }
                  onChange={onToggleSelectAll}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ứng viên
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tiêu đề
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ngày phỏng vấn
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thời lượng
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                PV viên
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Đánh giá
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phòng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : interviews.map((iv) => {
                  const cleanDescription = iv.description?.trim() || "";
                  const slotCount = iv.proposedTimeSlots?.length || 0;
                  return (
                    <tr
                      key={iv.id}
                      className="group hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                      onClick={() => onRowClick(iv)}
                    >
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(iv.id)}
                          onChange={() => onToggleSelect(iv.id)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <UserNameCell userId={iv.candidateUserId} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                          {iv.title}
                        </p>
                        {cleanDescription && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                            {cleanDescription}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {iv.scheduledAt &&
                        new Date(iv.scheduledAt).getFullYear() > 1970 ? (
                          <>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {new Date(iv.scheduledAt).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {new Date(iv.scheduledAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {iv.durationMinutes} phút
                      </td>
                      <td className="px-4 py-3.5">
                        {iv.assignments?.length ? (
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {iv.assignments.slice(0, 3).map((a) => (
                                <InterviewerAvatar
                                  key={a.id}
                                  userId={a.interviewerUserId}
                                  hasConfirmed={a.hasConfirmed}
                                  role={a.role}
                                />
                              ))}
                            </div>
                            {iv.assignments.length > 3 && (
                              <span className="ml-1.5 text-[11px] text-gray-400 font-medium">
                                +{iv.assignments.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-red-400">
                            <i className="fa-solid fa-user-slash"></i>Chưa phân
                            interviewer
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <FeedbackProgress interview={iv} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={iv.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {iv.meetingRoom && iv.status !== "Scheduled" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-green-700 dark:text-green-400">
                              {iv.meetingRoom.roomCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

// ─── Pagination Component ────────────────────────────────────────
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 gap-3">
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Hiển thị {startItem}-{endItem} / {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-400 outline-none"
        >
          <option value={10}>10/trang</option>
          <option value={20}>20/trang</option>
          <option value={50}>50/trang</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {getPageNumbers().map((page, i) =>
          page === "ellipsis" ? (
            <span key={`e${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                page === currentPage
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InterviewTable;
