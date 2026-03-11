import { Link } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import { useGetApplicationsByClubQuery } from '~/cores/api/applicationApi';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';

const statusLabel: Record<string, string> = {
  Pending: 'Chờ duyệt',
  Interview: 'Phỏng vấn',
  Accepted: 'Chấp nhận',
  Rejected: 'Từ chối',
};

export default function ApplicationsPage() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { clubManagerMembership } = useClubRole();
  const clubId = clubManagerMembership?.clubId ?? 0;

  const { data: applications = [], isLoading, error } = useGetApplicationsByClubQuery(
    { clubId },
    { skip: !clubId }
  );

  if (!clubId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <i className="fas fa-info-circle text-4xl mb-3 block" />
          <p>Bạn cần là quản lý CLB để xem trang này.</p>
          <Link to="/dashboard" className="text-orange-500 hover:underline mt-2 inline-block">
            Về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SettingButton />
      <Sidebar currentPath="/applications" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Duyệt đơn ứng tuyển"
        breadcrumb="Tuyển sinh / Đơn ứng tuyển"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className={`pt-24 p-6 transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {isLoading && <Loading message="Đang tải đơn ứng tuyển..." />}
        {error && <Error error={error} title="Lỗi khi tải đơn" />}
        {!isLoading && !error && (
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Đơn ứng tuyển của CLB ({applications.length})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Quản lý và duyệt đơn tại{' '}
                <Link
                  to="/recruitment-campaigns"
                  className="text-orange-500 hover:underline"
                >
                  Chiến dịch tuyển sinh
                </Link>
                .
              </p>
            </div>
            {applications.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                <i className="fas fa-inbox text-4xl mb-3 block opacity-50" />
                <p>Chưa có đơn ứng tuyển nào.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications.map((app) => (
                  <li
                    key={app.applicationId}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Đơn #{app.applicationId}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        Form #{app.formId} · {new Date(app.submissionDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'Accepted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : app.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : app.status === 'Interview'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {statusLabel[app.status] ?? app.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
