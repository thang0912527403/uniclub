interface HeaderBarProps {
  isDark?: boolean;
  title?: string;
  breadcrumb?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function HeaderBar({
  isDark = false,
  title = "Dashboard",
  breadcrumb = "Pages / Dashboard",
  isSidebarOpen = true,
  onToggleSidebar
}: HeaderBarProps) {
  const bgClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = isDark
    ? 'bg-[#1a1d2e] border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const iconClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <header className={`fixed top-0 right-0 z-50 ${bgClass} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-md transition-all duration-300 backdrop-blur-sm bg-opacity-95 ${
      isSidebarOpen ? 'left-64' : 'left-0'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg ${hoverClass} transition-colors`}
            >
              <i className={`fas fa-bars ${iconClass} text-lg`}></i>
            </button>
          )}
          <div>
            <p className={`text-sm ${textSecondaryClass}`}>{breadcrumb}</p>
            <h1 className={`text-xl font-bold ${textClass}`}>{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search here"
            className={`pl-4 pr-4 py-2 rounded-lg border outline-none w-64 text-sm ${inputClass}`}
          />
          <button className={`p-2 rounded-lg ${hoverClass}`}>
            <i className={`fas fa-user ${iconClass}`}></i>
          </button>
          <button className={`p-2 rounded-lg ${hoverClass}`}>
            <i className={`fas fa-cog ${iconClass}`}></i>
          </button>
          <button className={`p-2 rounded-lg ${hoverClass}`}>
            <i className={`fas fa-bell ${iconClass}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
}
