interface HeaderBarProps {
  title?: string;
  breadcrumb?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isDark?: boolean;
}

export function HeaderBar({
  title = "Dashboard",
  breadcrumb = "Pages / Dashboard",
  isSidebarOpen = true,
  onToggleSidebar
}: HeaderBarProps) {
  return (
    <header
      className={`fixed top-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 backdrop-blur-sm bg-opacity-95 left-0 ${
        isSidebarOpen ? 'md:left-64' : 'md:left-0'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              <i className="fas fa-bars text-gray-600 dark:text-gray-400 text-lg"></i>
            </button>
          )}
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{breadcrumb}</p>
            <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <input
            type="text"
            placeholder="Search here"
            className="hidden md:block pl-4 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none w-64 text-sm"
          />
          <button className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="User">
            <i className="fas fa-user text-gray-600 dark:text-gray-400"></i>
          </button>
          <button className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block" aria-label="Settings">
            <i className="fas fa-cog text-gray-600 dark:text-gray-400"></i>
          </button>
          <button className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block" aria-label="Notifications">
            <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
