import { useNavigate } from "react-router";
import { useExpandedMenu } from "~/hooks/useExpandedMenu";
import { useEffect, useRef } from "react";
import { getClubId } from "~/utils/auth";
import { useTranslation } from "react-i18next";

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
}

export function Sidebar({
  currentPath = "/dashboard",
  isOpen = true,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { toggleExpand, isExpanded } = useExpandedMenu();
  const sidebarRef = useRef<HTMLElement>(null);
  const isRestoringRef = useRef(false);

  // Restore scroll position
  useEffect(() => {
    if (sidebarRef.current && typeof window !== "undefined") {
      const savedScrollPosition = sessionStorage.getItem(
        "sidebarScrollPosition",
      );
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

  // Save scroll position
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || typeof window === "undefined") return;

    const handleScroll = () => {
      if (!isRestoringRef.current) {
        sessionStorage.setItem(
          "sidebarScrollPosition",
          sidebar.scrollTop.toString(),
        );
      }
    };

    sidebar.addEventListener("scroll", handleScroll, { passive: true });
    return () => sidebar.removeEventListener("scroll", handleScroll);
  }, []);

  const { t } = useTranslation("common");
  const handleNavigate = (url?: string) => {
    if (!url) return;
    navigate(url);
    onClose?.();
  };

  const navItems: NavItem[] = [
    { label: t("sidebar.dashboard"), icon: "fa-th-large", url: "/dashboard" },
    {
      label: t("sidebar.manageClub.title"),
      icon: "fa-building",
      subItems: [
        { label: t("sidebar.manageClub.allClubs"), url: "/clubs" },
        {
          label: t("sidebar.manageClub.clubStructure"),
          url: `/clubs/${getClubId() || 1}/organization`,
        },
        { label: t("sidebar.manageClub.clubRoles"), url: "/club-roles" },
        { label: t("sidebar.manageClub.yourClubInfo"), url: "/club/info" },
        { label: t("sidebar.manageClub.manageClubName"), url: "/club/name" },
        {
          label: t("sidebar.manageClub.recruitmentCampaigns"),
          url: "/club/recruitment-campaigns",
        },
        { label: t("sidebar.manageClub.clubMembers"), url: "/club/members" },
        {
          label: t("sidebar.manageClub.clubActivities"),
          url: "/club/activities",
        },
      ],
    },
    {
      label: t("sidebar.manageDepartment.title"),
      icon: "fa-sitemap",
      subItems: [
        {
          label: t("sidebar.manageDepartment.allDepartments"),
          url: "/department",
        },
        {
          label: t("sidebar.manageDepartment.createDepartment"),
          url: "/department/create",
        },
        {
          label: t("sidebar.manageDepartment.departmentRoles"),
          url: "/department/roles",
        },
        {
          label: t("sidebar.manageDepartment.departmentSettings"),
          url: "/department/settings",
        },
      ],
    },
    {
      label: t("sidebar.manageRecruitment.title"),
      icon: "fa-solid fa-flag",
      subItems: [
        {
          label: t("sidebar.manageRecruitment.allCampaigns"),
          url: "/recruitment-campaigns",
        },
      ],
    },
    {
      label: t("sidebar.manageMembers.title"),
      icon: "fa-users",
      subItems: [
        {
          label: t("sidebar.manageMembers.allMembers"),
          url: `/clubs/${getClubId() || 1}/members`,
        },
        { label: t("sidebar.manageMembers.addMember"), url: "/members/add" },
        {
          label: t("sidebar.manageMembers.memberRoles"),
          url: "/members/roles",
        },
        {
          label: t("sidebar.manageMembers.memberActivity"),
          url: "/members/activity",
        },
        {
          label: "Lịch sử tham gia",
          url: "/members/history",
        },
      ],
    },
    {
      label: t("sidebar.managePosts.title"),
      icon: "fa-newspaper",
      subItems: [
        { label: t("sidebar.managePosts.allPosts"), url: "/club/post" },
      ],
    },
    {
      label: t("sidebar.manageEvents.title"),
      icon: "fa-calendar",
      subItems: [
        { label: t("sidebar.manageEvents.allEvents"), url: "/events" },
        { label: t("sidebar.manageEvents.createEvent"), url: "/events/create" },
        {
          label: t("sidebar.manageEvents.eventCalendar"),
          url: "/events/calendar",
        },
        {
          label: t("sidebar.manageEvents.eventReports"),
          url: "/events/reports",
        },
      ],
    },
    {
      label: t("sidebar.manageFunds.title"),
      icon: "fa-wallet",
      subItems: [
        { label: t("sidebar.manageFunds.budgetOverview"), url: "/funds" },
        { label: t("sidebar.manageFunds.myFunds"), url: "/funds/my" },
        {
          label: t("sidebar.manageFunds.transactions"),
          url: "/funds/reports?tab=transactions",
        },
      ],
    },
    {
      label: t("sidebar.manageInterview.title"),
      icon: "fa-solid fa-microphone",
      subItems: [
        {
          label: t("sidebar.manageInterview.allInterviews"),
          url: "/interview/schedule",
        },
        {
          label: "So sánh & Công bố",
          url: "/interview/comparison",
        },
      ],
    },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={`w-64 min-w-[256px] max-w-[256px] h-screen fixed left-0 top-0 p-4 bg-slate-800 transition-all duration-300 overflow-y-auto overflow-x-hidden scrollbar-hide ${
        isOpen ? "translate-x-0" : "-translate-x-full"
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

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
            />
          </svg>
        </div>
        <span className="font-bold text-lg text-white truncate">UniClub</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = currentPath === item.url;
          const expanded = isExpanded(item.label);
          const isSubItemActive =
            hasSubItems &&
            item.subItems?.some((sub) => sub.url === currentPath);

          return (
            <div key={item.label}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex cursor-pointer items-center justify-between px-4 py-3 transition-all ${
                    expanded ? "" : "rounded-lg"
                  } ${
                    isSubItemActive || expanded
                      ? "text-white"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <i className={`fas ${item.icon} w-5 flex-shrink-0`}></i>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <i
                    className={`fas fa-chevron-${expanded ? "down" : "right"} text-xs transition-transform flex-shrink-0`}
                  ></i>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigate(item.url)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-r-4 border-blue-500 text-white font-semibold shadow-lg"
                      : "text-white/70 hover:bg-white/5"
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
                        onClick={() => handleNavigate(subItem.url)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all text-sm cursor-pointer ${
                          isSubActive
                            ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-l-4 border-blue-400 text-white font-semibold"
                            : "text-white/80 hover:bg-slate-700 hover:text-white"
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
  );
}
