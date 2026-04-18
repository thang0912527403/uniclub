import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useTheme } from "~/hooks/useTheme";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { isManagerRole } from "~/hooks/useClubRole";
import { useGetClubByIdQuery, useGetFundCapabilitiesQuery } from "~/cores/api";
import { PayOSConnectPanel } from "~/modules/funds/components/PayOSConnectPanel";
import { fundTokens as t } from "../funds.design-tokens";

export default function ClubPayosSettingsPage() {
  const { id: clubIdParam } = useParams<{ id: string }>();
  const clubId = parseInt(clubIdParam ?? "0", 10);

  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, userId } = useCurrentUser();

  const isInvalidParams = !clubIdParam || isNaN(clubId) || clubId < 1;

  const bgClass = isDark ? "bg-[#0f1729]" : "bg-slate-50";

  const { data: club } = useGetClubByIdQuery(clubId, { skip: isInvalidParams });
  const { data: caps, isLoading: capsLoading, isError: capsIsError, error: capsError } =
    useGetFundCapabilitiesQuery(
      { clubId, userId: userId || '' },
      {
        skip: isInvalidParams || !userId,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true,
      },
    );

  const capsErrorStatus =
    capsError && typeof capsError === "object" && "status" in capsError
      ? (capsError as { status: number }).status
      : undefined;
  const capsForbidden = capsIsError && capsErrorStatus === 403;

  const canManagePayos =
    isAdmin ||
    caps?.canManageOnlinePaymentSettings === true ||
    ((caps?.clubRoleLevel === 1 || isManagerRole(caps?.clubRoleName)) &&
      (caps?.hasEditFinancePolicy ?? false));

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/clubs" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Thanh toán online"
        breadcrumb={`Câu lạc bộ / ${club?.clubName?.trim() || (isInvalidParams ? "—" : `CLB #${clubId}`)} / Thanh toán online`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <nav aria-label="Điều hướng câu lạc bộ">
            <Link
              to={clubId > 0 ? `/clubs/${clubId}` : "/clubs"}
              className={`${t.btn.secondary} inline-flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
              Quay lại CLB
            </Link>
          </nav>

          {isInvalidParams ? (
            <section className={`${t.card.base} p-6`} role="alert">
              <p className={t.type.body}>Đường dẫn không hợp lệ.</p>
            </section>
          ) : capsForbidden ? (
            <section className={`${t.card.base} p-6`} role="alert">
              <p className={t.type.body}>Bạn không thuộc CLB này hoặc không có quyền truy cập.</p>
            </section>
          ) : capsLoading ? (
            <section className={`${t.card.base} p-6`} aria-busy="true">
              <p className={t.type.body}>Đang kiểm tra quyền truy cập...</p>
            </section>
          ) : (
            <PayOSConnectPanel clubId={clubId} canManagePayos={canManagePayos} />
          )}
        </div>
      </main>
    </div>
  );
}

