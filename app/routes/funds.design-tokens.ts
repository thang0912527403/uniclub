export const fundTokens = {
  space: {
    card: 'p-4 md:p-6',
    section: 'space-y-6',
    grid: 'gap-4',
    stack: 'gap-2',
  },

  type: {
    pageTitle: 'text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50',
    sectionTitle: 'text-base font-semibold text-slate-900 dark:text-slate-100',
    body: 'text-sm text-slate-600 dark:text-slate-300',
    muted: 'text-xs text-slate-500 dark:text-slate-400',
    label: 'text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400',
  },
  card: {
    base: 'rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/95 shadow-sm',
    hover: 'transition-colors duration-200',
    fundCard: 'rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/90 shadow-sm hover:shadow-md hover:border-amber-500/30 dark:hover:border-amber-500/40 transition-all duration-200 cursor-pointer',
  },
  btn: {
    primary: 'min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 text-slate-900 font-semibold shadow-sm hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    cta: 'min-h-[44px] px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold shadow-sm hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors duration-200 cursor-pointer',
    ghost: 'min-h-[44px] p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors duration-200 cursor-pointer',
  },
  status: {
    approved: 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    pending: 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    rejected: 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    closed: 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
  },
  input: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200',
  z: {
    dropdown: 10,
    sticky: 20,
    modal: 50,
  },
} as const;
