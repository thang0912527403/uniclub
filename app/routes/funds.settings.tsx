import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';

export default function FundsSettingsPage() {
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
  const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="min-h-screen">
      <Sidebar
        currentPath="/funds/settings"
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      <HeaderBar
        title="Fund Settings"
        breadcrumb="Pages / Manage Funds / Settings"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className={`${cardClass} rounded-lg shadow-md p-12 text-center`}>
          <i className="fas fa-cog text-6xl text-gray-400 mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>
            Fund Settings
          </h2>
          <p className="text-gray-500">
            Fund configuration and settings coming soon...
          </p>
        </div>
      </main>
    </div>
  );
}
