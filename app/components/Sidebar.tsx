import { useNavigate } from 'react-router';
import { useExpandedMenu } from '~/hooks/useExpandedMenu';
import { useEffect, useRef } from 'react';

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
  isOpen?: boolean;
}

export function Sidebar({
  isDark = true,
  currentPath = '/dashboard',
  onToggleSidebarTheme,
  isOpen = true
}: SidebarProps) {
  const navigate = useNavigate();
  const { toggleExpand, isExpanded } = useExpandedMenu();
  const sidebarRef = useRef<HTMLElement>(null);
  const isRestoringRef = useRef(false);

  // Restore scroll position sau mỗi lần navigate hoặc khi component mount
  useEffect(() => {
    if (sidebarRef.current && typeof window !== 'undefined') {
      const savedScrollPosition = sessionStorage.getItem('sidebarScrollPosition');
      if (savedScrollPosition) {
        isRestoringRef.current = true;
        // Sử dụng requestAnimationFrame để đảm bảo DOM đã render xong
        requestAnimationFrame(() => {
          if (sidebarRef.current) {
            sidebarRef.current.scrollTop = parseInt(savedScrollPosition, 10);
            // Reset flag sau một chút để cho phép lưu scroll mới
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          }
        });
      }
    }
  }, [currentPath, isOpen]); // Restore mỗi khi navigate (currentPath thay đổi) hoặc toggle sidebar

  // Lưu scroll position khi scroll
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || typeof window === 'undefined') return;

    const handleScroll = () => {
      // Chỉ lưu khi không đang restore
      if (!isRestoringRef.current) {
        sessionStorage.setItem('sidebarScrollPosition', sidebar.scrollTop.toString());
      }
    };

    sidebar.addEventListener('scroll', handleScroll, { passive: true });
    return () => sidebar.removeEventListener('scroll', handleScroll);
  }, []);

  const sidebarClass = isDark ? 'bg-[#2c3e50]' : 'bg-white border-r border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-white/70' : 'text-gray-600';
  const activeClass = isDark
    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-r-4 border-blue-500 text-white font-semibold shadow-lg'
    : 'bg-blue-50 border-r-4 border-blue-500 text-blue-600 font-semibold';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';
  const subMenuBgClass = isDark ? 'bg-[#1e2836]' : 'bg-gray-50';
  const subItemClass = isDark ? 'text-white/80' : 'text-gray-600';
  const subItemHoverClass = isDark ? 'hover:bg-[#2c3e50] hover:text-white' : 'hover:bg-white hover:text-gray-900';
  const subItemActiveClass = isDark
    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-l-4 border-blue-400 text-white font-semibold'
    : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 font-semibold';
  const buttonClass = isDark
    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
    : 'bg-gradient-to-r from-blue-400 to-blue-500';

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-th-large', url: '/dashboard' },
    {
      label: 'Manage Club',
      icon: 'fa-building',
      subItems: [
        { label: 'All Clubs', url: '/clubs' },
        { label: 'Your Club Info', url: '/club/info' },
        { label: 'Manage Club Name', url: '/club/name' },
        { label: 'Club Settings', url: '/club/settings' },
        { label: 'Club Members', url: '/club/members' },
        { label: 'Club Activities', url: '/club/activities' },
      ]
    },
    {
      label: 'Manage Department',
      icon: 'fa-sitemap',
      subItems: [
        { label: 'All Departments', url: '/department' },
        { label: 'Create Department', url: '/department/create' },
        { label: 'Department Roles', url: '/department/roles' },
        { label: 'Department Settings', url: '/department/settings' },
      ]
    },
    {
      label: 'Manage Members',
      icon: 'fa-users',
      subItems: [
        { label: 'All Members', url: '/members' },
        { label: 'Add Member', url: '/members/add' },
        { label: 'Member Roles', url: '/members/roles' },
        { label: 'Member Activity', url: '/members/activity' },
      ]
    },
    {
      label: 'Manage Events',
      icon: 'fa-calendar',
      subItems: [
        { label: 'All Events', url: '/events' },
        { label: 'Create Event', url: '/events/create' },
        { label: 'Event Calendar', url: '/events/calendar' },
        { label: 'Event Reports', url: '/events/reports' },
      ]
    },
    {
      label: 'Manage Funds',
      icon: 'fa-wallet',
      subItems: [
        { label: 'Budget Overview', url: '/funds' },
        { label: 'Transactions', url: '/funds/transactions' },
        { label: 'Expense Reports', url: '/funds/reports' },
        { label: 'Fund Settings', url: '/funds/settings' },
      ]
    },
  ];

  return (
    <aside 
      ref={sidebarRef} 
      className={`w-64 min-w-[256px] max-w-[256px] h-screen fixed left-0 top-0 p-4 ${sidebarClass} transition-all duration-300 overflow-y-auto overflow-x-hidden scrollbar-hide ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <span className={`font-bold text-lg ${textClass} truncate`}>
          UniClub
        </span>
      </div>

      <nav className="space-y-1 overflow-hidden">
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
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all ${expanded ? '' : 'rounded-lg'
                    } ${isSubItemActive || expanded
                      ? isDark ? 'text-white' : 'text-gray-900'
                      : `${textSecondaryClass} ${hoverClass}`
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <i className={`fas ${item.icon} w-5 flex-shrink-0`}></i>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} text-xs transition-transform flex-shrink-0`}></i>
                </button>
              ) : (
                <button
                  onClick={() => item.url && navigate(item.url)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                    ? activeClass
                    : `${textSecondaryClass} ${hoverClass}`
                    }`}
                >
                  <i className={`fas ${item.icon} w-5 flex-shrink-0`}></i>
                  <span className="truncate">{item.label}</span>
                </button>
              )}

              {hasSubItems && expanded && (
                <div className="px-4 pb-3 pt-1 space-y-0.5 overflow-hidden">
                  {item.subItems?.map((subItem) => {
                    const isSubActive = currentPath === subItem.url;
                    return (
                      <button
                        key={subItem.url}
                        onClick={() => navigate(subItem.url)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all text-sm cursor-pointer ${isSubActive
                          ? subItemActiveClass
                          : `${subItemClass} ${subItemHoverClass}`
                          }`}
                      >
                        <i className="fas fa-circle text-[6px] w-4 flex-shrink-0 opacity-60"></i>
                        <span className="truncate">{subItem.label}</span>
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
