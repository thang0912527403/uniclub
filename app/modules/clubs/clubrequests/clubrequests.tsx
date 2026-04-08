import { useState } from 'react';
import { Link } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import { useGetClubRequestsQuery, useUpdateClubRequestStatusMutation } from '~/cores/api/clubRequestApi';
import { useAssignUserRoleMutation } from '~/cores/api/userApi';

/* ─── Detail Modal ─────────────────────────────────────────────────────────── */
function DetailModal({ request, onClose, onApprove, onReject }: {
  request: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = request.status.toLowerCase() === 'pending';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết yêu cầu</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tên câu lạc bộ</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{request.clubName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mô tả</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{request.description || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lý do thành lập</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{request.reason || '—'}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ngày gửi</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trạng thái</p>
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
            Đóng
          </button>
          {isPending && (
            <>
              <button onClick={onReject} className="px-5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                <i className="fas fa-times mr-1.5"></i>Từ chối
              </button>
              <button onClick={onApprove} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
                <i className="fas fa-check mr-1.5"></i>Phê duyệt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Modal ─────────────────────────────────────────────────────────── */
function ConfirmModal({ request, action, onConfirm, onCancel, isLoading }: {
  request: any;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const isApprove = action === 'approve';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
            ? `Bạn có chắc chắn muốn phê duyệt yêu cầu thành lập câu lạc bộ "${request.clubName}"? Người yêu cầu sẽ được gán role Club Manager.`
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

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles =
    s === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
    s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  const label =
    s === 'pending' ? 'Chờ duyệt' :
    s === 'approved' ? 'Đã duyệt' : 'Đã từ chối';
  return <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${styles}`}>{label}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ClubRequestsModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const { data: requests } = useGetClubRequestsQuery();
  const [updateStatus] = useUpdateClubRequestStatusMutation();
  const [assignUserRole] = useAssignUserRoleMutation();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<{ request: any; action: 'approve' | 'reject' } | null>(null);

  const openConfirm = (request: any, action: 'approve' | 'reject') => {
    setDetailRequest(null);
    setActiveModal({ request, action });
  };

  const handleAction = async () => {
    if (!activeModal) return;
    const isApprove = activeModal.action === 'approve';
    const req = activeModal.request;
    setIsActionLoading(true);

    try {
      await updateStatus({
        id: req.requestId,
        status: isApprove ? 'APPROVED' : 'REJECTED',
      }).unwrap();
    } catch {
      showNotification({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật trạng thái yêu cầu.', duration: 4000 });
      setIsActionLoading(false);
      return;
    }

    if (isApprove) {
      try {
        await assignUserRole({ uid: req.userId, roleName: 'Club Manager' }).unwrap();
      } catch {
        showNotification({ type: 'error', title: 'Cảnh báo', message: 'Đã duyệt nhưng không thể gán role cho người dùng.', duration: 4000 });
      }
    }

    showNotification({
      type: 'success',
      title: 'Thành công!',
      message: isApprove
        ? `Đã phê duyệt yêu cầu thành lập câu lạc bộ "${req.clubName}".`
        : `Đã từ chối yêu cầu của "${req.clubName}".`,
      duration: 3000,
    });

    setActiveModal(null);
    setIsActionLoading(false);
  };

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/club-requests" isOpen={isSidebarOpen} />
      <HeaderBar title="Yêu cầu thành lập CLB" breadcrumb="Pages / Club Requests" isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Đang chờ', count: requests?.filter(r => r.status.toUpperCase() === 'PENDING').length ?? 0, color: 'amber', icon: 'fa-clock' },
            { label: 'Đã duyệt', count: requests?.filter(r => r.status.toUpperCase() === 'APPROVED').length ?? 0, color: 'emerald', icon: 'fa-check-double' },
            { label: 'Đã từ chối', count: requests?.filter(r => r.status.toUpperCase() === 'REJECTED').length ?? 0, color: 'red', icon: 'fa-times-circle' },
          ].map(({ label, count, color, icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${color}-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-${color}-500/20`}>
                  <i className={`fas ${icon} text-xl`}></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{count}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách yêu cầu</h2>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input type="text" placeholder="Tìm tên CLB..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:border-blue-500 transition-all w-full md:w-64" />
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
                  <tr key={req.requestId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
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
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailRequest(req)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                        {req.status.toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => openConfirm(req, 'approve')}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                              title="Phê duyệt"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => openConfirm(req, 'reject')}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              title="Từ chối"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {detailRequest && (
        <DetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onApprove={() => openConfirm(detailRequest, 'approve')}
          onReject={() => openConfirm(detailRequest, 'reject')}
        />
      )}

      {activeModal && (
        <ConfirmModal
          request={activeModal.request}
          action={activeModal.action}
          onConfirm={handleAction}
          onCancel={() => setActiveModal(null)}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}
