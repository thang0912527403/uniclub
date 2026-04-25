export const ITEMS_PER_PAGE = 6;

export const STATUS_TABS = [
  { key: "all", label: "Tất cả", icon: "fa-layer-group" },
  { key: "active", label: "Đang hoạt động", icon: "fa-circle-check" },
  { key: "upcoming", label: "Sắp diễn ra", icon: "fa-clock" },
  { key: "completed", label: "Đã hoàn thành", icon: "fa-flag-checkered" },
] as const;

export type StatusTabKey = (typeof STATUS_TABS)[number]["key"];

export function getStatusConfig(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Đang hoạt động",
        bg: "bg-emerald-500/15",
        text: "text-emerald-600 dark:text-emerald-400",
        dot: "bg-emerald-500",
      };
    case "upcoming":
      return {
        label: "Sắp diễn ra",
        bg: "bg-violet-500/15",
        text: "text-violet-600 dark:text-violet-400",
        dot: "bg-violet-500",
      };
    case "completed":
      return {
        label: "Đã hoàn thành",
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

export function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
