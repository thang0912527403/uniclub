import { useMemo } from "react";
import Cookies from "js-cookie";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useTheme } from "~/hooks/useTheme";
import { useClubRole } from "~/hooks/useClubRole";
import { useGetClubByIdQuery, useGetFundCapabilitiesQuery } from "~/cores/api";
import { PayOSConnectPanel } from "../modules/funds/components/PayOSConnectPanel";
import { fundTokens as t } from "./funds.design-tokens";
import { getClubId } from "~/utils/auth";

export default function FundsPayosPage() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isDark } = useTheme();
  const { isAdmin, can } = useClubRole();

  const bgClass = isDark ? "bg-[#0f1729]" : "bg-slate-50";
  const hasToken = !!Cookies.get("accessToken");
  const clubId = getClubId();

  const { data: club } = useGetClubByIdQuery(clubId, {
    skip: !hasToken || clubId < 1,
  });

  const { data: caps } = useGetFundCapabilitiesQuery(clubId, {
    skip: !hasToken || clubId < 1,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const canManagePayos = useMemo(() => {
    if (isAdmin) return true;
    return can("editfinance", clubId);
  }, [isAdmin, can, clubId]);

  return (
    <div className="min-h-screen">
      <Sidebar
        currentPath="/funds/payos"
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      <HeaderBar
        title="Thanh toán online"
        breadcrumb="Tài chính / Quản lý quỹ / Thanh toán online"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <section className={`${t.card.base} ${t.space.card}`}>
            <p className={t.type.label}>Câu lạc bộ</p>
            <p className={`${t.type.body} mt-1`}>
              {club?.clubName?.trim() || (clubId > 0 ? `CLB #${clubId}` : "—")}
            </p>
          </section>

          {clubId < 1 ? (
            <section className={`${t.card.base} p-6`} role="alert">
              <p className={t.type.body}>Bạn chưa chọn câu lạc bộ.</p>
            </section>
          ) : (
            <PayOSConnectPanel clubId={clubId} canManagePayos={canManagePayos} />
          )}
        </div>
      </main>
    </div>
  );
}

