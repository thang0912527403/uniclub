import { useNavigate } from 'react-router';
import { useExpandedMenu } from '~/hooks/useExpandedMenu';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubRole } from '~/hooks/useClubRole';

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
  currentPath?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isDark?: boolean;
  onToggleSidebarTheme?: () => void;
}

// ─── Admin nav: system-wide management ────────────────────────────────────
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: 'fa-th-large', url: '/dashboard' },
  {
    label: 'Quản lý Người dùng',
    icon: 'fa-user-cog',
    subItems: [
      { label: 'Tất cả người dùng', url: '/users' },
    ],
  },
  {
    label: 'Quản lý Câu lạc bộ',
    icon: 'fa-building',
    subItems: [
      { label: 'Tất cả CLB', url: '/clubs' }
    ],
  },
  {
    label: 'Chiến dịch Tuyển sinh',
    icon: 'fa-solid fa-flag',
    subItems: [
      { label: 'Tất cả chiến dịch', url: '/recruitment-campaigns' }
    ],
  },
  {
    label: 'Sự kiện',
    icon: 'fa-calendar',
    subItems: [
      { label: 'Tất cả sự kiện', url: '/events' },
      { label: 'Tạo sự kiện', url: '/events/create' },
      { label: 'Lịch sự kiện', url: '/events/calendar' },
      { label: 'Báo cáo sự kiện', url: '/events/reports' },
    ],
  },
  {
    label: 'Quản lý Quỹ',
    icon: 'fa-wallet',
    subItems: [
      { label: 'Tổng quan', url: '/funds' },
      { label: 'Giao dịch', url: '/funds/transactions' },
      { label: 'Báo cáo', url: '/funds/reports' },
      { label: 'Cài đặt', url: '/funds/settings' },
    ],
  },
];

// ─── ClubManager nav: club-level management ────────────────────────────────
const clubManagerNavItems: NavItem[] = [
  { label: 'Dashboard', icon: 'fa-th-large', url: '/dashboard' },
  {
    label: 'Câu lạc bộ',
    icon: 'fa-building',
    subItems: [
      { label: 'Bài đăng CLB', url: '/club/manage-posts' },
      { label: 'Bài viết công khai', url: '/club/posts' },
    ],
  },
  {
    label: 'Tuyển sinh',
    icon: 'fa-solid fa-flag',
    subItems: [
      { label: 'Chiến dịch tuyển sinh', url: '/recruitment-campaigns' },
      { label: 'Duyệt đơn ứng tuyển', url: '/applications' },
    ],
  },
  {
    label: 'Phỏng vấn',
    icon: 'fa-calendar-check',
    subItems: [
      { label: 'Lịch phỏng vấn', url: '/interview/schedule' },
      { label: 'Phòng phỏng vấn', url: '/interview/room' },
    ],
  },
  {
    label: 'Sự kiện',
    icon: 'fa-calendar',
    subItems: [
      { label: 'Sự kiện CLB', url: '/events' },
      { label: 'Tạo sự kiện', url: '/events/create' },
      { label: 'Lịch sự kiện', url: '/events/calendar' },
    ],
  },
  {
    label: 'Thành viên',
    icon: 'fa-users',
    subItems: [
      { label: 'Tất cả thành viên', url: '/members' },
      { label: 'Vai trò thành viên', url: '/members/roles' },
    ],
  },
  {
    label: 'Bộ phận',
    icon: 'fa-sitemap',
    subItems: [
      { label: 'Tất cả bộ phận', url: '/department' },
    ],
  },
  {
    label: 'Quản lý Quỹ',
    icon: 'fa-wallet',
    subItems: [
      { label: 'Tổng quan', url: '/funds' },
      { label: 'Giao dịch', url: '/funds/transactions' },
      { label: 'Báo cáo', url: '/funds/reports' },
      { label: 'Cài đặt', url: '/funds/settings' },
    ],
  },
];

export function Sidebar({
  currentPath = '/dashboard',
  isOpen = true,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { toggleExpand, isExpanded } = useExpandedMenu();
  const sidebarRef = useRef<HTMLElement>(null);
  const isRestoringRef = useRef(false);

  const { isAdmin } = useCurrentUser();
  const { isClubManager } = useClubRole();

  const navItems = isAdmin ? adminNavItems : clubManagerNavItems;
  const accentActive = isAdmin
    ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-r-4 border-violet-400 text-white font-semibold shadow-lg'
    : 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-r-4 border-sky-400 text-white font-semibold shadow-lg';
  const accentSubActive = isAdmin
    ? 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 border-l-4 border-violet-400 text-white font-semibold'
    : 'bg-gradient-to-r from-sky-500/30 to-blue-500/30 border-l-4 border-sky-400 text-white font-semibold';
  const logoGradient = isAdmin
    ? 'bg-gradient-to-br from-violet-500 to-purple-700'
    : 'bg-gradient-to-br from-sky-500 to-blue-700';

  useEffect(() => {
    if (sidebarRef.current && typeof window !== 'undefined') {
      const savedScrollPosition = sessionStorage.getItem('sidebarScrollPosition');
      if (savedScrollPosition) {
        isRestoringRef.current = true;
        requestAnimationFrame(() => {
          if (sidebarRef.current) {
            sidebarRef.current.scrollTop = parseInt(savedScrollPosition, 10);
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          }
        });
      }
    }
  }, [currentPath, isOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (!isRestoringRef.current) {
        sessionStorage.setItem('sidebarScrollPosition', sidebar.scrollTop.toString());
      }
    };

    sidebar.addEventListener('scroll', handleScroll, { passive: true });
    return () => sidebar.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {isOpen && onClose && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng menu"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}
      <aside
        ref={sidebarRef}
        className={`w-64 min-w-[256px] max-w-[256px] h-screen fixed left-0 top-0 z-50 p-4 bg-slate-800 transition-all duration-300 overflow-y-auto overflow-x-hidden scrollbar-hide ${isOpen ? 'translate-x-0' : '-translate-x-full'
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

      <div className="flex items-center gap-2 mb-2 px-2">
        <div className={`w-8 h-8 ${logoGradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <span className="font-bold text-lg text-white truncate">
          UniClub
        </span>
      </div>

      <div className="px-2 mb-6">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${logoGradient} text-white shadow`}>
          <i className={`fas ${isAdmin ? 'fa-shield-alt' : 'fa-user-tie'} text-[9px]`} />
          {isAdmin ? 'Quản trị viên' : isClubManager ? 'Quản lý CLB' : 'Thành viên'}
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
                  className={`w-full flex cursor-pointer items-center justify-between px-4 py-3 transition-all ${expanded ? '' : 'rounded-lg'
                    } ${isSubItemActive || expanded
                      ? 'text-white'
                      : 'text-white/70 hover:bg-white/5'
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
                  onClick={() => {
                    if (item.url) {
                      onClose?.();
                      navigate(item.url);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                    ? accentActive
                    : 'text-white/70 hover:bg-white/5'
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
                        onClick={() => {
                          onClose?.();
                          navigate(subItem.url);
                        }}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all text-sm cursor-pointer ${isSubActive
                          ? accentSubActive
                          : 'text-white/80 hover:bg-slate-700 hover:text-white'
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
    </aside>
    </>
  );
}