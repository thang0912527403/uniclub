import { Link } from 'react-router';
import { useGetCurrentUserQuery } from '~/cores/api';
import { useGetApplicationsByUserQuery } from '~/cores/api/applicationApi';
import { APPLICATION_STATUS } from '~/cores/api/types/application';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';

/** UserId dùng khi chưa đăng nhập (để test). Cùng giá trị với form nộp đơn. */
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

const statusLabel: Record<string, string> = {
  [APPLICATION_STATUS.PENDING]: 'Chờ duyệt',
  [APPLICATION_STATUS.APPROVED]: 'Đã duyệt',
  [APPLICATION_STATUS.REJECTED]: 'Từ chối',
  [APPLICATION_STATUS.SUCCESS]: 'Đạt — Vào phỏng vấn',
};

const statusColor: Record<string, string> = {
  [APPLICATION_STATUS.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  [APPLICATION_STATUS.APPROVED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [APPLICATION_STATUS.SUCCESS]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export default function MyApplications() {
  const { data: currentUser, isLoading: loadingUser } = useGetCurrentUserQuery();
  const userId = currentUser?.userId ?? TEST_USER_ID;
  const isTestMode = !currentUser?.userId;
  const { data: applications = [], isLoading, error } = useGetApplicationsByUserQuery(userId);

  if (loadingUser || isLoading) {
    return <Loading message="Đang tải đơn của bạn..." />;
  }

  if (error) {
    return <Error error={error} title="Lỗi khi tải đơn ứng tuyển" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-orange-500 hover:text-orange-600 font-bold">UniClubs</Link>
          <Link to="/question" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500">Nộp đơn</Link>
        </div>
      </header>
      <div className="py-12 px-4 max-w-3xl mx-auto">
        {isTestMode && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-blue-800 dark:text-blue-200 text-sm">
            Đang xem ở chế độ test (chưa đăng nhập). Hiển thị đơn của tài khoản test.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn ứng tuyển của tôi</h1>
          <Link
            to="/question"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            <i className="fas fa-plus" /> Nộp đơn mới
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <i className="fas fa-file-alt text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-6">Bạn chưa có đơn ứng tuyển nào.</p>
            <Link to="/question" className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">
              Nộp đơn ngay
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {applications.map((app) => {
              const label = statusLabel[app.status] ?? app.status;
              const color = statusColor[app.status] ?? 'bg-gray-100 text-gray-800';
              const isSuccess = app.status === APPLICATION_STATUS.SUCCESS;
              return (
                <li key={app.applicationId}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Đơn #{app.applicationId} · Form #{app.formId}
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                        Nộp lúc: {new Date(app.submissionDate).toLocaleString('vi-VN')}
                      </p>
                      <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-sm font-medium ${color}`}>
                        {label}
                      </span>
                    </div>
                    {isSuccess && (
                      <Link
                        to={`/meeting/room-${app.applicationId}`}
                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                      >
                        <i className="fas fa-video" /> Vào phỏng vấn
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
