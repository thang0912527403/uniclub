import { useState } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import {
  useGetApplicationsByFormQuery,
  useUpdateApplicationStatusMutation,
  APPLICATION_STATUS,
  type ApplicationResponseDto,
} from '~/cores/api';
import { useNotification } from '~/components/Notification';

/** Form ID trùng với trang /question để test luồng: nộp đơn → duyệt đơn */
const FORM_ID = 1;

const statusLabel: Record<string, string> = {
  [APPLICATION_STATUS.PENDING]: 'Chờ duyệt',
  [APPLICATION_STATUS.APPROVED]: 'Đã duyệt',
  [APPLICATION_STATUS.REJECTED]: 'Từ chối',
  [APPLICATION_STATUS.SUCCESS]: 'Đạt — PV',
};

const statusColor: Record<string, string> = {
  [APPLICATION_STATUS.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  [APPLICATION_STATUS.APPROVED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [APPLICATION_STATUS.SUCCESS]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export default function AdminApplicationsModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { data: applications = [], isLoading, error } = useGetApplicationsByFormQuery(FORM_ID);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { show: showNotification } = useNotification();

  const handleStatus = async (app: ApplicationResponseDto, newStatus: string) => {
    setUpdatingId(app.applicationId);
    try {
      await updateStatus({ id: app.applicationId, body: { status: newStatus } }).unwrap();
      showNotification({
        type: 'success',
        title: 'Cập nhật trạng thái',
        message: `Đơn #${app.applicationId} đã được ${newStatus === APPLICATION_STATUS.APPROVED ? 'duyệt' : 'từ chối'}.`,
      });
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Cập nhật thất bại.';
      showNotification({ type: 'error', title: 'Lỗi', message: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen">
        <Sidebar currentPath="/applications" isOpen={true} />
        <main className="pt-24 p-6 ml-64">
          <Error title="Lỗi khi tải đơn ứng tuyển" error={error} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/applications" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Duyệt đơn ứng tuyển"
        breadcrumb="Pages / Đơn ứng tuyển (Form)"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {isLoading ? (
          <Loading message="Đang tải danh sách đơn..." />
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-blue-800 dark:text-blue-200 text-sm">
              <strong>Test luồng:</strong> Form #{FORM_ID} (trùng form trang Nộp đơn). User nộp tại{' '}
              <a href="/question" className="underline font-medium">/question</a>, xem đơn tại{' '}
              <a href="/my-applications" className="underline font-medium">/my-applications</a>. Admin duyệt tại đây.
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Đơn theo Form #{FORM_ID} ({applications.length})
                </h2>
              </div>
              {applications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 block" />
                  Chưa có đơn nào. User nộp đơn tại <a href="/question" className="text-blue-500 underline">/question</a>.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app) => {
                    const label = statusLabel[app.status] ?? app.status;
                    const color = statusColor[app.status] ?? 'bg-gray-100 text-gray-800';
                    const isPending = app.status === APPLICATION_STATUS.PENDING;
                    const busy = isUpdating && updatingId === app.applicationId;
                    return (
                      <li key={app.applicationId} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Đơn #{app.applicationId} · User: <code className="text-xs">{app.userId}</code>
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                            Nộp lúc: {new Date(app.submissionDate).toLocaleString('vi-VN')}
                            {app.reviewedAt && (
                              <> · Duyệt lúc: {new Date(app.reviewedAt).toLocaleString('vi-VN')}</>
                            )}
                          </p>
                          <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-sm font-medium ${color}`}>
                            {label}
                          </span>
                        </div>
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleStatus(app, APPLICATION_STATUS.APPROVED)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg font-medium cursor-pointer"
                            >
                              {busy ? <i className="fas fa-spinner fa-spin" /> : 'Duyệt'}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleStatus(app, APPLICATION_STATUS.REJECTED)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg font-medium cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
