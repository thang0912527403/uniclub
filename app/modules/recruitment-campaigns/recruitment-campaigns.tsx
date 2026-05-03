import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { SettingButton } from "~/components/SettingButton";
import { Loading } from "~/components/Loading";
import { Error } from "~/components/Error";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useNotification } from "~/components/Notification";
import {
  useGetRecruitmentCampaignsQuery,
  useGetRecruitmentCampaignsByClubIdQuery,
  useCreateRecruitmentCampaignMutation,
  useUpdateRecruitmentCampaignMutation,
  useDeleteRecruitmentCampaignMutation,
} from "~/cores/api";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useClubRole } from "~/hooks/useClubRole";
import type { RecruitmentCampaign } from "~/cores/api/types";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const ITEMS_PER_PAGE = 6;
const STATUS_TABS = [
  { key: "all", label: "Tất cả", icon: "fa-layer-group" },
  { key: "open", label: "Đang mở", icon: "fa-circle-check" },
  { key: "close", label: "Đã đóng", icon: "fa-circle-xmark" },
] as const;

type StatusTabKey = (typeof STATUS_TABS)[number]["key"];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getStatusConfig(status: string) {
  switch (status) {
    case "open":
      return {
        label: "Đang mở",
        bg: "bg-emerald-500/15",
        text: "text-emerald-600 dark:text-emerald-400",
        dot: "bg-emerald-500",
      };
    case "close":
      return {
        label: "Đã đóng",
        bg: "bg-slate-500/15",
        text: "text-slate-600 dark:text-slate-400",
        dot: "bg-slate-500",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-500/15",
        text: "text-gray-600 dark:text-gray-400",
        dot: "bg-gray-500",
      };
  }
}

function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: string;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}
        >
          <i className={`fas ${icon} text-white text-sm`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Card (Grid view) ── */
function CampaignCard({
  campaign,
  onNavigate,
  onManageForm,
  onEdit,
  onDelete,
  onToggle,
}: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
  onManageForm: (id: number, e: React.MouseEvent) => void;
  onEdit?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
  onDelete?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
  onToggle?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={(e) => onManageForm(campaign.campaignId, e)}
    >
      {/* Image / Fallback */}
      <div className="h-44 relative overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <div className="text-center text-white/80">
              <i className="fas fa-bullhorn text-4xl mb-2 opacity-60" />
              <p className="text-xs font-medium opacity-70 px-4 line-clamp-1">
                {campaign.campaignName}
              </p>
            </div>
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={campaign.status} />
        </div>
        {/* Edit / Delete overlay (managers only) */}
        {(onEdit || onDelete) && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={(e) => onEdit(campaign, e)}
                title="Chỉnh sửa"
                className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 dark:bg-gray-800/90 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 shadow-sm transition-colors"
              >
                <i className="fas fa-pen text-[11px]" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => onDelete(campaign, e)}
                title="Xóa"
                className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 dark:bg-gray-800/90 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 shadow-sm transition-colors"
              >
                <i className="fas fa-trash text-[11px]" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {campaign.campaignName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {campaign.description || "Chưa có mô tả"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <i className="far fa-calendar-alt" />
            <span>
              {formatDateVN(campaign.startDate)} –{" "}
              {formatDateVN(campaign.endDate)}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {onToggle && (
              <button
                onClick={(e) => onToggle(campaign, e)}
                title={
                  campaign.status === "open"
                    ? "Đóng chiến dịch"
                    : "Mở chiến dịch"
                }
                className="cursor-pointer flex items-center gap-1.5 group/toggle"
              >
                <span
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${campaign.status === "open" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${campaign.status === "open" ? "translate-x-4" : "translate-x-0"}`}
                  />
                </span>
                <span
                  className={`text-xs font-medium ${campaign.status === "open" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {campaign.status === "open" ? "Mở" : "Đóng"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Table Row (Table view) ── */
function CampaignTableRow({
  campaign,
  onNavigate,
  onManageForm,
  onEdit,
  onDelete,
  onToggle,
}: {
  campaign: RecruitmentCampaign;
  onNavigate: (id: number) => void;
  onManageForm: (id: number, e: React.MouseEvent) => void;
  onEdit?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
  onDelete?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
  onToggle?: (campaign: RecruitmentCampaign, e: React.MouseEvent) => void;
}) {
  return (
    <tr
      className="group border-b border-gray-100 dark:border-gray-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer transition-colors duration-150"
      onClick={(e) => onManageForm(campaign.campaignId, e)}
    >
      {/* Name + image */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500">
            {campaign.imageUrl ? (
              <img
                src={campaign.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-bullhorn text-white text-xs opacity-70" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {campaign.campaignName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[240px]">
              {campaign.description || "—"}
            </p>
          </div>
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={campaign.status} />
      </td>
      {/* Dates */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDateVN(campaign.startDate)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDateVN(campaign.endDate)}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onToggle && (
            <button
              onClick={(e) => onToggle(campaign, e)}
              title={
                campaign.status === "open" ? "Đóng chiến dịch" : "Mở chiến dịch"
              }
              className="cursor-pointer flex items-center gap-1.5"
            >
              <span
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${campaign.status === "open" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${campaign.status === "open" ? "translate-x-4" : "translate-x-0"}`}
                />
              </span>
              <span
                className={`text-xs font-medium ${campaign.status === "open" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
              >
                {campaign.status === "open" ? "Mở" : "Đóng"}
              </span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => onEdit(campaign, e)}
              title="Chỉnh sửa"
              className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              <i className="fas fa-pen text-[11px]" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => onDelete(campaign, e)}
              title="Xóa"
              className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <i className="fas fa-trash text-[11px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Pagination ── */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 5) {
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

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <i className="fas fa-chevron-left text-xs" />
      </button>
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentPage === p
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <i className="fas fa-chevron-right text-xs" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// CRUD Modals
// ──────────────────────────────────────────────

type CampaignFormData = {
  campaignName: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl: string;
  linkCampaign: string;
  content: string;
};

const EMPTY_FORM: CampaignFormData = {
  campaignName: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "open",
  imageUrl: "",
  linkCampaign: "",
  content: "",
};

function toISODate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString();
}

// Map frontend lowercase status to backend expected uppercase values
function toBackendStatus(status: string): string {
  if (status === 'close') return 'CLOSED';
  if (status === 'open')  return 'OPEN';
  return status.toUpperCase();
}

function toInputDate(isoStr: string) {
  if (!isoStr) return "";
  return isoStr.slice(0, 10);
}

/* ── Campaign Form Modal (Create / Edit) ── */
function CampaignFormModal({
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  initial?: RecruitmentCampaign | null;
  onClose: () => void;
  onSave: (data: CampaignFormData) => Promise<void>;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CampaignFormData>(() =>
    initial
      ? {
          campaignName: initial.campaignName,
          description: initial.description ?? "",
          startDate: toInputDate(initial.startDate),
          endDate: toInputDate(initial.endDate),
          status: initial.status,
          imageUrl: initial.imageUrl ?? "",
          linkCampaign: initial.linkCampaign ?? "",
          content: initial.content ?? "",
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof CampaignFormData, string>>
  >({});

  const LIMITS = {
    campaignName: 100,
    description: 300,
    content: 5000,
  } as const;
  const URL_REGEX =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  const set =
    (field: keyof CampaignFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const today = new Date().toISOString().slice(0, 10);

  const validate = () => {
    const errs: Partial<Record<keyof CampaignFormData, string>> = {};

    // campaignName
    if (!form.campaignName.trim()) {
      errs.campaignName = "Vui lòng nhập tên chiến dịch";
    } else if (form.campaignName.trim().length > LIMITS.campaignName) {
      errs.campaignName = `Tối đa ${LIMITS.campaignName} ký tự`;
    }

    // description
    if (form.description.length > LIMITS.description) {
      errs.description = `Tối đa ${LIMITS.description} ký tự`;
    }

    // content
    if (form.content.length > LIMITS.content) {
      errs.content = `Tối đa ${LIMITS.content} ký tự`;
    }

    // startDate
    if (!form.startDate) {
      errs.startDate = "Vui lòng chọn ngày bắt đầu";
    } else {
      const startChanged =
        !isEdit || form.startDate !== toInputDate(initial!.startDate);
      if (startChanged && form.startDate < today) {
        errs.startDate = "Ngày bắt đầu phải từ hôm nay trở đi";
      }
    }

    // endDate
    if (!form.endDate) {
      errs.endDate = "Vui lòng chọn ngày kết thúc";
    } else if (form.startDate && form.endDate < form.startDate) {
      errs.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    }

    // imageUrl
    if (form.imageUrl && !URL_REGEX.test(form.imageUrl)) {
      errs.imageUrl =
        "URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)";
    }

    // linkCampaign
    if (form.linkCampaign && !URL_REGEX.test(form.linkCampaign)) {
      errs.linkCampaign =
        "URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)";
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    await onSave(form);
  };

  const inputCls = (field: keyof CampaignFormData) =>
    `w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border ${
      errors[field] ? "border-red-500" : "border-gray-200 dark:border-gray-700"
    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <i
                className={`fas ${isEdit ? "fa-pen" : "fa-plus"} text-indigo-600 dark:text-indigo-400 text-sm`}
              />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {isEdit ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch mới"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Tên chiến dịch{" "}
                <span className="text-red-500 normal-case">*</span>
              </label>
              <input
                type="text"
                value={form.campaignName}
                onChange={set("campaignName")}
                placeholder="VD: Tuyển thành viên HK1 2025..."
                className={inputCls("campaignName")}
              />
              {errors.campaignName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.campaignName}
                </p>
              )}
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Ngày bắt đầu{" "}
                  <span className="text-red-500 normal-case">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={set("startDate")}
                  className={inputCls("startDate")}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Ngày kết thúc{" "}
                  <span className="text-red-500 normal-case">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={set("endDate")}
                  className={inputCls("endDate")}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={set("status")}
                className={inputCls("status")}
              >
                <option value="open">Mở</option>
                <option value="close">Đóng</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Mô tả ngắn
              </label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={2}
                placeholder="Mô tả ngắn gọn về chiến dịch..."
                className={`${inputCls("description")} resize-none`}
              />
            </div>

            {/* Image URL + Link row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  URL ảnh bìa
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={set("imageUrl")}
                  placeholder="https://..."
                  className={inputCls("imageUrl")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Link chiến dịch
                </label>
                <input
                  type="url"
                  value={form.linkCampaign}
                  onChange={set("linkCampaign")}
                  placeholder="https://..."
                  className={inputCls("linkCampaign")}
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Nội dung chi tiết
              </label>
              <textarea
                value={form.content}
                onChange={set("content")}
                rows={5}
                placeholder="Nội dung chi tiết của chiến dịch tuyển dụng..."
                className={`${inputCls("content")} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/30"
            >
              {isSaving && <i className="fas fa-spinner fa-spin text-xs" />}
              {isEdit ? "Lưu thay đổi" : "Tạo chiến dịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteConfirmModal({
  campaign,
  onClose,
  onConfirm,
  isDeleting,
}: {
  campaign: RecruitmentCampaign;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-triangle-exclamation text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Xóa chiến dịch?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bạn có chắc muốn xóa chiến dịch{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  "{campaign.campaignName}"
                </span>
                ? Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-red-500/30"
          >
            {isDeleting && <i className="fas fa-spinner fa-spin text-xs" />}
            Xóa chiến dịch
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function RecruitmentCampaignsModule() {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin } = useCurrentUser();
  const { currentClub } = useClubRole();
  const clubId = currentClub?.clubId ?? 0;
  const canManage = !isAdmin && clubId !== 0;
  const { show: notify } = useNotification();

  // ── API ──
  const {
    data: adminCampaigns,
    isLoading: adminLoading,
    error: adminError,
  } = useGetRecruitmentCampaignsQuery(undefined, { skip: !isAdmin });
  const {
    data: clubCampaigns,
    isLoading: clubLoading,
    error: clubError,
  } = useGetRecruitmentCampaignsByClubIdQuery(clubId, {
    skip: isAdmin || clubId === 0,
  });
  const [createCampaign, { isLoading: isCreating }] =
    useCreateRecruitmentCampaignMutation();
  const [updateCampaign, { isLoading: isUpdating }] =
    useUpdateRecruitmentCampaignMutation();
  const [deleteCampaign, { isLoading: isDeleting }] =
    useDeleteRecruitmentCampaignMutation();

  const campaigns = isAdmin ? adminCampaigns : clubCampaigns;
  const isLoading = isAdmin ? adminLoading : clubLoading;
  const error = isAdmin ? adminError : clubError;

  // ── Local state ──
  const [activeTab, setActiveTab] = useState<StatusTabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<RecruitmentCampaign | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentCampaign | null>(
    null,
  );

  // ── Derived data ──
  const statusCounts = useMemo(() => {
    if (!campaigns) return { all: 0, open: 0, close: 0 };
    return {
      all: campaigns.length,
      open: campaigns.filter((c) => c.status === "open").length,
      close: campaigns.filter((c) => c.status === "close").length,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    let result = [...campaigns];
    if (activeTab !== "all") {
      result = result.filter((c) => c.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.campaignName.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [campaigns, activeTab, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedCampaigns = filteredCampaigns.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // ── Handlers ──
  const handleTabChange = useCallback((tab: StatusTabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleNavigate = useCallback(
    (id: number) => {
      navigate(`/recruitment-campaigns/${id}`);
    },
    [navigate],
  );

  const handleManageForm = useCallback(
    (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/campaign-forms/${id}`);
    },
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null);
    setModalMode("create");
  }, []);

  const handleOpenEdit = useCallback(
    (campaign: RecruitmentCampaign, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTarget(campaign);
      setModalMode("edit");
    },
    [],
  );

  const handleOpenDelete = useCallback(
    (campaign: RecruitmentCampaign, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteTarget(campaign);
    },
    [],
  );

  const handleSave = useCallback(
    async (data: CampaignFormData) => {
      try {
        if (modalMode === "create") {
          await createCampaign({
            clubId,
            campaignName: data.campaignName,
            description: data.description,
            startDate: toISODate(data.startDate),
            endDate: toISODate(data.endDate),
            status: toBackendStatus(data.status),
            imageUrl: data.imageUrl,
            linkCampaign: data.linkCampaign,
            content: data.content,
          }).unwrap();
          notify({
            type: "success",
            title: "Tạo chiến dịch thành công!",
            message: `Chiến dịch "${data.campaignName}" đã được tạo.`,
            duration: 3000,
          });
        } else if (modalMode === "edit" && editTarget) {
          await updateCampaign({
            clubId: editTarget.clubId,
            id: editTarget.campaignId,
            data: {
              campaignName: data.campaignName,
              description: data.description,
              startDate: toISODate(data.startDate),
              endDate: toISODate(data.endDate),
              status: toBackendStatus(data.status),
              imageUrl: data.imageUrl,
              linkCampaign: data.linkCampaign,
              content: data.content,
            },
          }).unwrap();
          notify({
            type: "success",
            title: "Cập nhật thành công!",
            message: `Chiến dịch "${data.campaignName}" đã được cập nhật.`,
            duration: 3000,
          });
        }
        setModalMode(null);
        setEditTarget(null);
      } catch (err) {
        const rtkErr = err as { data?: { message?: string } };
        notify({
          type: "error",
          title: "Thao tác thất bại",
          message: rtkErr?.data?.message ?? "Vui lòng thử lại.",
          duration: 4000,
        });
      }
    },
    [modalMode, editTarget, clubId, createCampaign, updateCampaign, notify],
  );

  const handleToggleStatus = useCallback(
    async (campaign: RecruitmentCampaign, e: React.MouseEvent) => {
      e.stopPropagation();
      const nextStatus = campaign.status === "open" ? "close" : "open";
      try {
        await updateCampaign({
          clubId: campaign.clubId,
          id: campaign.campaignId,
          data: {
            campaignName: campaign.campaignName,
            description: campaign.description,
            startDate: toISODate(campaign.startDate),
            endDate: toISODate(campaign.endDate),
            status: toBackendStatus(nextStatus),
            imageUrl: campaign.imageUrl,
            linkCampaign: campaign.linkCampaign,
            content: campaign.content,
          },
        }).unwrap();
        notify({
          type: "success",
          title:
            nextStatus === "open" ? "Đã mở chiến dịch" : "Đã đóng chiến dịch",
          message: `"${campaign.campaignName}" chuyển sang ${nextStatus === "open" ? "Đang mở" : "Đã đóng"}.`,
          duration: 3000,
        });
      } catch (err) {
        const rtkErr = err as { data?: { message?: string } };
        notify({
          type: "error",
          title: "Thao tác thất bại",
          message: rtkErr?.data?.message ?? "Vui lòng thử lại.",
          duration: 4000,
        });
      }
    },
    [updateCampaign, notify],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCampaign({ clubId: deleteTarget.clubId, id: deleteTarget.campaignId }).unwrap();
      notify({
        type: "success",
        title: "Đã xóa chiến dịch",
        message: `"${deleteTarget.campaignName}" đã bị xóa.`,
        duration: 3000,
      });
      setDeleteTarget(null);
    } catch (err) {
      const rtkErr = err as { data?: { message?: string } };
      notify({
        type: "error",
        title: "Xóa thất bại",
        message: rtkErr?.data?.message ?? "Vui lòng thử lại.",
        duration: 4000,
      });
    }
  }, [deleteTarget, deleteCampaign, notify]);

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/recruitment-campaigns" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Quản lý Chiến dịch Tuyển dụng"
        breadcrumb="Pages / Recruitment Campaigns"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        {/* Loading */}
        {isLoading && <Loading />}

        {/* Error */}
        {error && (
          <Error
            title="Lỗi khi tải danh sách chiến dịch tuyển dụng."
            error={error}
          />
        )}

        {/* Content */}
        {!isLoading && campaigns && (
          <>
            {/* ────── Stats Cards ────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon="fa-bullhorn"
                label="Tổng chiến dịch"
                value={statusCounts.all}
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />
              <StatCard
                icon="fa-circle-check"
                label="Đang mở"
                value={statusCounts.open}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                icon="fa-circle-xmark"
                label="Đã đóng"
                value={statusCounts.close}
                gradient="bg-gradient-to-br from-slate-500 to-slate-600"
              />
            </div>

            {/* ────── Action Bar ────── */}
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 mb-6">
              {/* Top row: tabs + view toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.key
                          ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <i className={`fas ${tab.icon} text-[10px]`} />
                      {tab.label}
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          activeTab === tab.key
                            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {statusCounts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title="Xem dạng lưới"
                  >
                    <i className="fas fa-grid-2 text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title="Xem dạng bảng"
                  >
                    <i className="fas fa-list text-sm" />
                  </button>
                </div>
              </div>

              {/* Bottom row: search + count */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chiến dịch..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <i className="fas fa-times text-xs" />
                    </button>
                  )}
                </div>

                {/* Results count */}
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block">
                  {filteredCampaigns.length} kết quả
                </span>

                {/* Create button — managers only */}
                {canManage && (
                  <button
                    onClick={handleOpenCreate}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/30 whitespace-nowrap"
                  >
                    <i className="fas fa-plus text-xs" />
                    Tạo chiến dịch
                  </button>
                )}
              </div>
            </div>

            {/* ────── Campaigns Grid View ────── */}
            {viewMode === "grid" && pagedCampaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pagedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    onNavigate={handleNavigate}
                    onManageForm={handleManageForm}
                    onEdit={canManage ? handleOpenEdit : undefined}
                    onDelete={canManage ? handleOpenDelete : undefined}
                    onToggle={canManage ? handleToggleStatus : undefined}
                  />
                ))}
              </div>
            )}

            {/* ────── Campaigns Table View ────── */}
            {viewMode === "table" && pagedCampaigns.length > 0 && (
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chiến dịch
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Bắt đầu
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kết thúc
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCampaigns.map((campaign) => (
                        <CampaignTableRow
                          key={campaign.campaignId}
                          campaign={campaign}
                          onNavigate={handleNavigate}
                          onManageForm={handleManageForm}
                          onEdit={canManage ? handleOpenEdit : undefined}
                          onDelete={canManage ? handleOpenDelete : undefined}
                          onToggle={canManage ? handleToggleStatus : undefined}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ────── Empty State ────── */}
            {filteredCampaigns.length === 0 && (
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bullhorn text-2xl text-gray-400 dark:text-gray-500" />
                </div>
                {searchQuery || activeTab !== "all" ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Không tìm thấy chiến dịch
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("all");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <i className="fas fa-arrow-rotate-left text-xs" />
                      Xóa bộ lọc
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Chưa có chiến dịch tuyển dụng nào
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tạo chiến dịch tuyển dụng đầu tiên để bắt đầu
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ────── Pagination ────── */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      {/* ── Create / Edit Modal ── */}
      {modalMode !== null && (
        <CampaignFormModal
          initial={modalMode === "edit" ? editTarget : null}
          onClose={() => {
            setModalMode(null);
            setEditTarget(null);
          }}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          campaign={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
