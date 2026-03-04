import { useState } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '~/cores/api';
import type { User, CreateUserDto, UpdateUserDto } from '~/cores/api/types/user';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'pending', label: 'Chờ duyệt' },
];

/* ─────────── Confirm Delete Modal ─────────── */
interface ConfirmDeleteModalProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmDeleteModal({ user, onConfirm, onCancel, isLoading }: ConfirmDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900">
            <i className="fas fa-user-times text-red-600 dark:text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xóa người dùng</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Bạn có chắc muốn xóa &quot;{user.fullName}&quot; ({user.email})? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading && <i className="fas fa-spinner fa-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Create/Edit User Modal ─────────── */
interface UserFormModalProps {
  mode: 'create' | 'edit';
  user: User | null;
  onClose: () => void;
  onSubmitCreate: (values: CreateUserDto) => Promise<void>;
  onSubmitEdit: (values: UpdateUserDto) => Promise<void>;
  isSubmitting: boolean;
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
  isSubmitting,
}: UserFormModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');
  const [major, setMajor] = useState(user?.major ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [gender, setGender] = useState<string>(user?.gender ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [status, setStatus] = useState<string>(user?.status ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      await onSubmitCreate({
        fullName,
        email,
        password,
        phoneNumber: phoneNumber || undefined,
        studentId: studentId || undefined,
        major: major || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        address: address || undefined,
      });
    } else if (user) {
      await onSubmitEdit({
        fullName,
        phoneNumber: phoneNumber || undefined,
        studentId: studentId || undefined,
        major: major || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        address: address || undefined,
        status: status || undefined,
      });
    }
  };

  const inputClass =
    'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {mode === 'create' ? 'Thêm người dùng' : 'Chỉnh sửa người dùng'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Họ và tên *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Họ và tên"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} ${mode === 'edit' ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder="email@example.com"
              required
              disabled={mode === 'edit'}
            />
          </div>
          {mode === 'create' && (
            <div>
              <label className={labelClass}>Mật khẩu * (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Mật khẩu"
                required
                minLength={6}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Số điện thoại</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={inputClass}
              placeholder="Số điện thoại"
            />
          </div>
          <div>
            <label className={labelClass}>Mã sinh viên</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={inputClass}
              placeholder="Mã sinh viên"
            />
          </div>
          <div>
            <label className={labelClass}>Chuyên ngành</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className={inputClass}
              placeholder="Chuyên ngành"
            />
          </div>
          <div>
            <label className={labelClass}>Ngày sinh</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn --</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Địa chỉ</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Địa chỉ"
            />
          </div>
          {mode === 'edit' && (
            <div>
              <label className={labelClass}>Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn --</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <i className="fas fa-spinner fa-spin" />}
              {mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Main Module ─────────── */
export default function UsersModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const { data: users = [], isLoading, error } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [modalOpen, setModalOpen] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen('create');
  };

  const openEdit = (record: User) => {
    setEditingUser(record);
    setModalOpen('edit');
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingUser(null);
  };

  const handleCreate = async (body: CreateUserDto) => {
    try {
      await createUser(body).unwrap();
      showNotification({
        type: 'success',
        title: 'Thêm người dùng thành công',
        message: 'Người dùng đã được tạo.',
      });
      closeModal();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      showNotification({
        type: 'error',
        title: 'Thêm người dùng thất bại',
        message: err?.data?.message ?? 'Vui lòng thử lại sau.',
      });
    }
  };

  const handleEdit = async (body: UpdateUserDto) => {
    if (!editingUser) return;
    try {
      await updateUser({ id: editingUser.userId, data: body }).unwrap();
      showNotification({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin người dùng đã được cập nhật.',
      });
      closeModal();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      showNotification({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: err?.data?.message ?? 'Vui lòng thử lại sau.',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.userId).unwrap();
      showNotification({
        type: 'success',
        title: 'Đã xóa người dùng',
        message: `"${deleteTarget.fullName}" đã bị xóa.`,
      });
      setDeleteTarget(null);
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      showNotification({
        type: 'error',
        title: 'Xóa thất bại',
        message: err?.data?.message ?? 'Không thể xóa người dùng.',
      });
    }
  };

  const statusLabel = (status: string | null | undefined) => {
    if (!status) return '—';
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt?.label ?? status;
  };

  const statusBadgeClass = (status: string | null | undefined) => {
    if (status === 'active') return 'bg-green-500 text-white';
    if (status === 'inactive') return 'bg-gray-500 text-white';
    return 'bg-amber-500 text-white';
  };

  return (
    <div className="min-h-screen">
      <SettingButton />

      <Sidebar currentPath="/users" isOpen={isSidebarOpen} />

      <HeaderBar
        title="Quản lý Người dùng"
        breadcrumb="Pages / Users"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {isLoading && <Loading message="Đang tải danh sách người dùng..." />}

        {error && (
          <Error title="Lỗi khi tải danh sách người dùng." error={error} />
        )}

        {!isLoading && !error && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng số</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Hoạt động</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter((u) => u.status === 'active').length}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-pause-circle text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Không hoạt động</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter((u) => u.status === 'inactive').length}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Chờ duyệt</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter((u) => u.status === 'pending').length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openCreate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-plus" />
                  Thêm người dùng
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {users.length === 0 ? (
                <div className="p-12 text-center">
                  <i className="fas fa-users text-6xl text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có người dùng nào</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Thêm người dùng đầu tiên để bắt đầu</p>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    Thêm người dùng
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Họ tên
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          SĐT
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Mã SV
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Chuyên ngành
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Trạng thái
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((record) => (
                        <tr
                          key={record.userId}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {record.fullName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.email}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.phoneNumber ?? '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.studentId ?? '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.major ?? '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                                record.status
                              )}`}
                            >
                              {statusLabel(record.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(record)}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(record)}
                                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium cursor-pointer"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {modalOpen && (
        <UserFormModal
          key={editingUser?.userId ?? 'create'}
          mode={modalOpen}
          user={editingUser}
          onClose={closeModal}
          onSubmitCreate={handleCreate}
          onSubmitEdit={handleEdit}
          isSubmitting={modalOpen === 'create' ? isCreating : isUpdating}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
