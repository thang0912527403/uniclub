import React, { useState } from "react";
import {
  useGetFormsByCampaignQuery,
  useGetApplicationsByCampaignQuery,
  useGetQuestionsByFormQuery,
  useUpdateApplicationStatusMutation,
} from "~/cores/api";
import type {
  ApplicationResponseDto,
  ApplicationFormResponseDto,
} from "~/cores/api";
import { statusConfig, APPS_PER_PAGE } from "./constants";
import { StatusBadge, ApplicationStatusActions, BulkActionBar } from "./StatusActions";
import { InlineAnswerRow } from "./InlineAnswerRow";
import { AnswerPanel } from "./AnswerPanel";

// Wrapper so we can fetch questions per form lazily
const AnswerViewerForApp: React.FC<{
  clubId: number;
  app: ApplicationResponseDto;
  forms: ApplicationFormResponseDto[];
  onClose: () => void;
}> = ({ clubId, app, onClose }) => {
  const { data: questions = [] } = useGetQuestionsByFormQuery({
    clubId,
    formId: app.formId,
  });
  return (
    <AnswerPanel
      clubId={clubId}
      application={app}
      questions={questions}
      onClose={onClose}
    />
  );
};

interface ApplicationsTabProps {
  campaignId: number;
  clubId: number;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  campaignId,
  clubId,
}) => {
  const { data: forms = [] } = useGetFormsByCampaignQuery({
    clubId,
    campaignId,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<ApplicationResponseDto | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { data: applications = [], isLoading } =
    useGetApplicationsByCampaignQuery({
      clubId,
      campaignId,
      status: statusFilter || undefined,
    });
  const [updateStatus] = useUpdateApplicationStatusMutation();

  // ── Derived data ──
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    Object.keys(statusConfig).forEach((k) => {
      counts[k] = 0;
    });
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const filteredApps = React.useMemo(() => {
    let result = [...applications];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.applicationId.toString().includes(q) ||
          a.userId.toLowerCase().includes(q) ||
          forms
            .find((f) => f.formId === a.formId)
            ?.formTitle?.toLowerCase()
            .includes(q),
      );
    }
    return result;
  }, [applications, searchQuery, forms]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApps.length / APPS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedApps = filteredApps.slice(
    (safePage - 1) * APPS_PER_PAGE,
    safePage * APPS_PER_PAGE,
  );

  // ── Handlers ──
  const handleStatusChange = async (
    app: ApplicationResponseDto,
    newStatus: string,
  ) => {
    try {
      await updateStatus({
        clubId,
        id: app.applicationId,
        body: { status: newStatus },
      }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedApps.map((a) => a.applicationId)));
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    const promises = Array.from(selectedIds).map((id) =>
      updateStatus({ clubId, id, body: { status: newStatus } })
        .unwrap()
        .catch(console.error),
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const statuses = ["", "PENDING", "APPROVED", "REJECTED", "SUCCESS"];
  const allSelected =
    pagedApps.length > 0 && selectedIds.size === pagedApps.length;
  const TABLE_COL_COUNT = 6;

  return (
    <div className="space-y-4">
      {/* ── Stats Summary ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(statusConfig).map(([k, v]) => (
          <div
            key={k}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${v.cls}`}
          >
            {v.label}: <span className="font-bold">{statusCounts[k] ?? 0}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-500 font-medium">
          <i className="fa-solid fa-users mr-1" />
          Tổng: {applications.length} đơn
        </span>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {s ? (statusConfig[s]?.label ?? s) : "Tất cả"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm theo ID, userId..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-[10px]" />
            </button>
          )}
        </div>

        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
          {filteredApps.length} kết quả
        </span>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onBulkStatus={handleBulkStatus}
        />
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <i className="fa-regular fa-folder-open text-5xl mb-3 block" />
          <p className="font-medium">
            {searchQuery
              ? "Không tìm thấy đơn phù hợp"
              : "Không có đơn ứng tuyển nào"}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-semibold"
            >
              <i className="fas fa-arrow-rotate-left mr-1" />
              Xóa tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Form
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nộp lúc
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {pagedApps.map((app) => {
                  const isExpanded = expandedIds.has(app.applicationId);
                  return (
                    <React.Fragment key={app.applicationId}>
                      <tr
                        className={`hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors ${isExpanded ? "bg-violet-50/30 dark:bg-violet-900/10" : ""}`}
                      >
                        <td className="px-3 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.applicationId)}
                            onChange={() => toggleSelect(app.applicationId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                          #{app.applicationId}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 text-xs">
                          {forms.find((f) => f.formId === app.formId)
                            ?.formTitle ?? `Form #${app.formId}`}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(app.submissionDate).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <ApplicationStatusActions
                              currentStatus={app.status}
                              onChangeStatus={(newStatus) =>
                                handleStatusChange(app, newStatus)
                              }
                            />

                            <button
                              onClick={() => toggleExpand(app.applicationId)}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                isExpanded
                                  ? "bg-violet-500 text-white shadow-sm"
                                  : "text-violet-600 hover:text-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                              }`}
                              title={
                                isExpanded
                                  ? "Thu gọn"
                                  : "Mở rộng xem câu trả lời"
                              }
                            >
                              <i
                                className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}
                              />
                              {isExpanded ? "Thu gọn" : "Xem"}
                            </button>
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all flex items-center gap-1.5"
                              title="Xem chi tiết trong modal"
                            >
                              <i className="fa-solid fa-expand text-[10px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <InlineAnswerRow
                          clubId={clubId}
                          application={app}
                          colSpan={TABLE_COL_COUNT}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <span className="text-xs text-gray-500">
                Trang {safePage}/{totalPages} · {filteredApps.length} đơn
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (safePage <= 3) {
                      page = i + 1;
                    } else if (safePage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = safePage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                          safePage === page
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer modal */}
      {selectedApp && (
        <AnswerViewerForApp
          clubId={clubId}
          app={selectedApp}
          forms={forms}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
};
