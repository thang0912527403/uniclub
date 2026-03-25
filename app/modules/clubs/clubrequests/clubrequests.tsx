import { useState } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import { useGetClubRequestsQuery, useUpdateClubRequestStatusMutation } from '~/cores/api/clubRequestApi';
import { useAssignPoliciesToUserMutation } from '~/cores/api/policyApi';

interface RequestActionModalProps {
  request: any;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RequestActionModal({ request, action, onConfirm, onCancel, isLoading }: RequestActionModalProps) {
  const isApprove = action === 'approve';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isApprove ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
            <i className={`fas ${isApprove ? 'fa-check-double' : 'fa-times-circle'} text-2xl`}></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isApprove ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">CLB: {request.clubName}</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {isApprove
            ? `Hệ thống sẽ chính thức tạo câu lạc bộ "${request.clubName}" và gửi thông báo đến người yêu cầu.`
            : `Bạn có chắc chắn muốn từ chối yêu cầu thành lập câu lạc bộ này? Hành động này không thể hoàn tác.`}
        </p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={isLoading} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'} disabled:opacity-50`}>
            {isLoading && <i className="fas fa-spinner fa-spin"></i>}
            {isApprove ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubRequestsModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const isLoading = false;
  const error = null;
  const { data: requests } = useGetClubRequestsQuery();
  const [updateStatus] = useUpdateClubRequestStatusMutation();
  const [assignPoliciesToUser] = useAssignPoliciesToUserMutation();

  const [activeModal, setActiveModal] = useState<{ request: any, action: 'approve' | 'reject' } | null>(null);

  const handleAction = async () => {
    if (!activeModal) return;

    try {

      const isApprove = activeModal.action === 'approve';

      await updateStatus({
        id: activeModal.request.requestId,
        status: isApprove ? 'APPROVED' : 'REJECTED'
      }).unwrap();

      if (isApprove) {

        await assignPoliciesToUser({
          userId: activeModal.request.userId,
          policyIds: [1]
        }).unwrap();

      }

      showNotification({
        type: 'success',
        title: 'Thành công!',
        message: `Đã ${isApprove ? 'duyệt' : 'từ chối'} yêu cầu của ${activeModal.request.clubName}`,
        duration: 3000,
      });

      setActiveModal(null);

    } catch (err) {

      showNotification({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể cập nhật trạng thái.',
        duration: 4000
      });

    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/club-requests" isOpen={isSidebarOpen} />
      <HeaderBar title="Yêu cầu thành lập CLB" breadcrumb="Pages / Club Requests" isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>

        {/* Stats Grid tương tự như trang Clubs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <i className="fas fa-clock text-xl"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đang chờ</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{requests?.filter(r => r.status === 'PENDING').length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <i className="fas fa-check-double text-xl"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã duyệt</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{requests?.filter(r => r.status === 'APPROVED').length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <i className="fas fa-times-circle text-xl"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã từ chối</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{requests?.filter(r => r.status === 'REJECTED').length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách yêu cầu</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="text" placeholder="Tìm tên CLB..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:border-blue-500 transition-all w-full md:w-64" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tên CLB</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mô tả & Lý do</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày gửi</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests?.map((req) => (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white block">{req.clubName}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">{req.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1 truncate">Lý do: {req.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${getStatusStyle(req.status)}`}>
                        {req.status === 'Pending' ? 'Chờ duyệt' : req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status.toLowerCase() === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveModal({ request: req, action: 'approve' })}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer" title="Phê duyệt"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={() => setActiveModal({ request: req, action: 'reject' })}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Từ chối"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <button className="text-blue-500 hover:underline text-xs font-bold">Xem chi tiết</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {activeModal && (
        <RequestActionModal
          request={activeModal.request}
          action={activeModal.action}
          onConfirm={handleAction}
          onCancel={() => setActiveModal(null)}
          isLoading={false}
        />
      )}
    </div>
  );
}