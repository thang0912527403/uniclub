import { useState } from 'react';
import { useNavigate } from 'react-router';

interface SubMenuItem {
  label: string;
  url: string;
}

interface NavItem {
  label: string;
  icon: string;
  url?: string;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  isDark?: boolean;
  currentPath?: string;
  onToggleSidebarTheme?: () => void;
}

export function Sidebar({
  isDark = true,
  currentPath = '/dashboard',
  onToggleSidebarTheme
}: SidebarProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const sidebarClass = isDark ? 'bg-[#2c3e50]' : 'bg-white border-r border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-white/70' : 'text-gray-600';
  const activeClass = isDark
    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-r-4 border-blue-500 text-white font-semibold shadow-lg'
    : 'bg-blue-50 border-r-4 border-blue-500 text-blue-600 font-semibold';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';
  const subItemClass = isDark ? 'text-white/60' : 'text-gray-500';
  const subItemHoverClass = isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900';
  const buttonClass = isDark
    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
    : 'bg-gradient-to-r from-blue-400 to-blue-500';

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-th-large', url: '/dashboard' },
    {
      label: 'Manage Club',
      icon: 'fa-building',
      subItems: [
        { label: 'View Club Info', url: '/club/info' },
        { label: 'Manage Club Name', url: '/club/name' },
        { label: 'Club Settings', url: '/club/settings' },
        { label: 'Club Members', url: '/club/members' },
        { label: 'Club Activities', url: '/club/activities' },
      ]
    },
    { label: 'Manage Department', icon: 'fa-sitemap', url: '/department' },
    { label: 'Manage Members', icon: 'fa-users', url: '/members' },
    { label: 'Manage Events', icon: 'fa-calendar', url: '/events' },
    { label: 'Manage Funds', icon: 'fa-wallet', url: '/funds' },
  ];

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isExpanded = (label: string) => expandedItems.includes(label);

  return (
    <aside className={`w-64 min-h-screen p-4 ${sidebarClass} transition-colors duration-300`}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
          <i className="fas fa-th text-white text-sm"></i>
        </div>
        <span className={`font-bold text-lg ${textClass}`}>
          UniClub
        </span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = currentPath === item.url;
          const expanded = isExpanded(item.label);
          const isSubItemActive = hasSubItems && item.subItems?.some(sub => sub.url === currentPath);

          return (
            <div key={item.label}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${isSubItemActive
                    ? activeClass
                    : `${textSecondaryClass} ${hoverClass}`
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`fas ${item.icon} w-5`}></i>
                    <span>{item.label}</span>
                  </div>
                  <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} text-xs transition-transform`}></i>
                </button>
              ) : (
                <button
                  onClick={() => item.url && navigate(item.url)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                    ? activeClass
                    : `${textSecondaryClass} ${hoverClass}`
                    }`}
                >
                  <i className={`fas ${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                </button>
              )}

              {hasSubItems && expanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => {
                    const isSubActive = currentPath === subItem.url;
                    return (
                      <button
                        key={subItem.url}
                        onClick={() => navigate(subItem.url)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm cursor-pointer ${isSubActive
                          ? activeClass
                          : `${subItemClass} ${subItemHoverClass}`
                          }`}
                      >
                        <i className="fas fa-circle text-xs w-5"></i>
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-8 space-y-3">
        <button className={`w-full px-4 py-3 ${buttonClass} text-white rounded-lg font-medium hover:shadow-lg transition-shadow`}>
          UPGRADE TO PRO
        </button>

        {onToggleSidebarTheme && (
          <button
            onClick={onToggleSidebarTheme}
            className={`w-full px-4 py-2 rounded-lg text-sm ${isDark
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} mr-2`}></i>
            Toggle Sidebar Theme
          </button>
        )}
      </div>
    </aside>
  );
}
