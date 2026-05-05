export const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: {
    label: "Chờ duyệt",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  REJECTED: {
    label: "Từ chối",
    cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  SUCCESS: {
    label: "Vào phỏng vấn",
    cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
};

export const APPS_PER_PAGE = 10;
