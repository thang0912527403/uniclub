import { Navigate, Link, useParams } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useGetFundLocationQuery } from '~/cores/api';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { fundTokens as t } from './funds.design-tokens';

export default function FundDetailPage() {
  const { publicId: publicIdParam } = useParams<{ publicId: string }>();
  const publicId = String(publicIdParam ?? '').trim();
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const bgClass = isDark ? 'bg-[#0f1729]' : 'bg-slate-50';
  const isValidParam = !!publicId;
  const { data: location, isLoading, isError } = useGetFundLocationQuery(publicId, {
    skip: !isValidParam,
  });

  if (location && location.clubId && location.fundId) {
    return <Navigate to={`/clubs/${location.clubId}/funds/${publicId}`} replace />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Chi tiết quỹ"
        breadcrumb="Tài chính / Quản lý quỹ"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 pb-10 px-4 md:px-8 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {!isValidParam || isError ? (
            <section className={`${t.card.base} ${t.space.card}`} role="alert">
              <h2 className={t.type.sectionTitle}>Mã quỹ không hợp lệ</h2>
              <p className={`mt-1 ${t.type.body}`}>Không tìm được thông tin quỹ từ đường dẫn hiện tại.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link to="/funds" className={t.btn.primary}>
                  Quay lại danh sách quỹ
                </Link>
              </div>
            </section>
          ) : (
            <section className={`${t.card.base} ${t.space.card}`} role="status" aria-busy={isLoading}>
              <h2 className={t.type.sectionTitle}>Đang chuyển đến trang quỹ mới</h2>
              <p className={`mt-1 ${t.type.body}`}>
                Đang tìm câu lạc bộ của quỹ...
              </p>
              <p className={t.type.muted}>Nếu bị kẹt lâu, hãy quay lại danh sách quỹ và mở lại quỹ này.</p>
              <div className="mt-4">
                <Link to="/funds" className={t.btn.secondary}>
                  Quay lại danh sách quỹ
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
