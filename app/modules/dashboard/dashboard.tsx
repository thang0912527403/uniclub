import AdminDashboard from "./AdminDashboard";
import ClubManagerDashboard from "./ClubManagerDashboard";
import { useClubRole } from "~/hooks/useClubRole";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";

export default function DashboardModule() {
  const { isAdmin, isClubManager, isAnyClubManager, isLoading, currentClub } =
    useClubRole();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-500 font-medium italic">
            Đang tải dữ liệu quyền hạn...
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isAdmin) {
      return <AdminDashboard />;
    }
    if (isClubManager) {
      return <ClubManagerDashboard />;
    }
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <i className="fas fa-university text-3xl text-blue-600"></i>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Chào mừng bạn đến với UniClub
        </h1>
        <p className="text-slate-600 max-w-md">
          Bạn đang tham gia với tư cách thành viên. Nếu bạn có quyền quản lý,
          các công cụ sẽ xuất hiện tại đây sau khi bạn chọn Câu lạc bộ.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar
        currentPath="/dashboard"
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />

      <main
        className={`flex-1 transition-all duration-300 h-screen overflow-y-auto ${isSidebarOpen ? "md:ml-64" : "ml-0"}`}
      >
        <HeaderBar
          title={
            isAdmin
              ? "Hệ thống Quản trị"
              : currentClub?.clubName || "Bảng điều khiển CLB"
          }
          breadcrumb={isAdmin ? "Hệ thống / Dashboard" : "CLB / Dashboard"}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <div className="p-6 pt-24 min-h-full">{renderContent()}</div>
      </main>
    </div>
  );
}
