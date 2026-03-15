import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import {
  useGetClubStructureRolesQuery,
  useCreateClubRoleMutation,
  useUpdateClubRoleMutation,
  useDeleteClubRoleMutation,
} from '~/cores/api/clubRoleApi';
import { getClubId } from '~/utils/auth';
import { validateClubRoleForm, type ClubRoleFormData } from '~/utils/validation';
import type { ClubRole, ClubRolePolicy } from '~/cores/api/types/clubRole';

/* ─── Config ──────────────────────────────────────────────────────────────── */

const LEVEL_CONFIG: Record<number, { gradient: string; badge: string; label: string; icon: string }> = {
  0: { gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-500', label: 'Chưa phân cấp', icon: 'fa-user' },
  1: { gradient: 'from-amber-500 to-yellow-500', badge: 'bg-amber-500', label: 'Cấp 1', icon: 'fa-crown' },
  2: { gradient: 'from-sky-500 to-blue-500', badge: 'bg-sky-500', label: 'Cấp 2', icon: 'fa-user-tie' },
  3: { gradient: 'from-emerald-500 to-green-500', badge: 'bg-emerald-500', label: 'Cấp 3', icon: 'fa-users' },
};

function getLevelConfig(level: number) {
  return LEVEL_CONFIG[level] || { gradient: 'from-purple-500 to-indigo-500', badge: 'bg-purple-500', label: `Cấp ${level}`, icon: 'fa-layer-group' };
}

/* ─── Shared UI Components ────────────────────────────────────────────────── */

function AvatarCircle({ name, size = 'md', gradient }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; gradient?: string }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-20 h-20 text-xl' };
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase() || '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${gradient || 'from-blue-500 to-purple-500'} shadow-lg ring-4 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
}

function ConnectorLine() {
  return (
    <div className="flex justify-center">
      <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
    </div>
  );
}

/* ─── Action Buttons for each role ────────────────────────────────────────── */

interface RoleActionsProps {
  role: ClubRole;
  onEdit: (role: ClubRole) => void;
  onDelete: (role: ClubRole) => void;
}

function RoleActions({ role, onEdit, onDelete }: RoleActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onEdit(role)} title="Chỉnh sửa"
        className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors">
        <i className="fas fa-edit text-xs"></i>
      </button>
      <button onClick={() => onDelete(role)} title="Xóa"
        className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors">
        <i className="fas fa-trash text-xs"></i>
      </button>
    </div>
  );
}

/* ─── Chart View ──────────────────────────────────────────────────────────── */

function RoleCard({ role, actions }: { role: ClubRole; actions: RoleActionsProps }) {
  const config = getLevelConfig(role.level);
  const [showPolicies, setShowPolicies] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 text-center hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 duration-200">
      <div className="flex justify-center mb-3">
        <AvatarCircle name={role.roleName} size="lg" gradient={config.gradient} />
      </div>
      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{role.roleName}</h4>
      {role.description && role.description !== 'string' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{role.description}</p>
      )}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${config.badge}`}>
          <i className={`fas ${config.icon} mr-1`}></i>
          {config.label}
        </span>
        {role.memberCount > 0 && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i className="fas fa-users mr-1"></i>
            {role.memberCount}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <RoleActions {...actions} />
      </div>

      {role.policies.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowPolicies(!showPolicies)}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
            <i className={`fas fa-${showPolicies ? 'chevron-up' : 'shield-alt'} mr-1`}></i>
            {showPolicies ? 'Ẩn quyền' : `${role.policies.length} quyền`}
          </button>
          {showPolicies && (
            <div className="mt-2 text-left space-y-1">
              {role.policies.map((p: ClubRolePolicy) => (
                <div key={p.id} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <i className="fas fa-check-circle text-green-500 mt-0.5 text-[10px]"></i>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LevelSection({ level, roles, config, actionProps }: {
  level: number; roles: ClubRole[]; config: ReturnType<typeof getLevelConfig>;
  actionProps: Omit<RoleActionsProps, 'role'>;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
        <span className={`px-4 py-1.5 text-white rounded-full text-xs font-semibold ${config.badge} flex items-center gap-1.5`}>
          <i className={`fas ${config.icon}`}></i>
          {config.label} — {roles.length} vai trò
        </span>
        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600"></div>
      </div>
      <div className={`flex justify-center gap-6 flex-wrap ${roles.length === 1 ? '' : 'px-4'}`}>
        {roles.map((role) => (
          <div key={role.clubRoleId} className="w-56">
            <RoleCard role={role} actions={{ role, ...actionProps }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── List View ───────────────────────────────────────────────────────────── */

function ListView({ roles, actionProps }: { roles: ClubRole[]; actionProps: Omit<RoleActionsProps, 'role'> }) {
  const [expandedPolicies, setExpandedPolicies] = useState<Set<number>>(new Set());

  const togglePolicies = (roleId: number) => {
    setExpandedPolicies(prev => {
      const next = new Set(prev);
      next.has(roleId) ? next.delete(roleId) : next.add(roleId);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vai trò</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cấp bậc</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thành viên</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quyền</th>
            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {roles.map((role, idx) => {
            const config = getLevelConfig(role.level);
            const isExpanded = expandedPolicies.has(role.clubRoleId);
            return (
              <tr key={role.clubRoleId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${config.icon} text-white text-sm`}></i>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{role.roleName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {role.description && role.description !== 'string' ? role.description : <span className="italic opacity-50">—</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${config.badge}`}>
                    <i className={`fas ${config.icon} text-[10px]`}></i>
                    {config.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {role.memberCount}
                </td>
                <td className="px-6 py-4">
                  {role.policies.length > 0 ? (
                    <div>
                      <button onClick={() => togglePolicies(role.clubRoleId)}
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                        <i className={`fas fa-${isExpanded ? 'chevron-up' : 'shield-alt'} mr-1`}></i>
                        {isExpanded ? 'Ẩn' : `${role.policies.length} quyền`}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1">
                          {role.policies.map((p) => (
                            <div key={p.id} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <i className="fas fa-check-circle text-green-500 mt-0.5 text-[10px]"></i>
                              <span>{p.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Không có</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    <RoleActions role={role} {...actionProps} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/* ─── Role Form Modal ─────────────────────────────────────────────────────── */

interface RoleModalProps {
  initial?: ClubRole | null;
  onClose: () => void;
  onSave: (data: ClubRoleFormData) => Promise<void>;
  isSaving: boolean;
}

function RoleModal({ initial, onClose, onSave, isSaving }: RoleModalProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ClubRoleFormData>({
    roleName: initial?.roleName ?? '',
    description: initial?.description ?? '',
    level: initial?.level ?? 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClubRoleFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClubRoleForm(form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    await onSave(validation.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus'} text-blue-600 dark:text-blue-400`}></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên vai trò <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.roleName}
              onChange={(e) => { setForm((p) => ({ ...p, roleName: e.target.value })); if (errors.roleName) setErrors((p) => ({ ...p, roleName: undefined })); }}
              placeholder="VD: Chủ nhiệm, Phó chủ nhiệm..."
              className={`w-full rounded-lg px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border ${errors.roleName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} focus:outline-none focus:border-blue-500 transition-colors`}
            />
            {errors.roleName && <p className="text-red-500 text-xs mt-1">{errors.roleName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cấp bậc <span className="text-red-500">*</span>
            </label>
            <div className={`flex rounded-lg border overflow-hidden transition-colors ${errors.level ? 'border-red-500' : 'border-gray-300 dark:border-gray-700 focus-within:border-blue-500'}`}>
              <input
                type="number"
                min={0}
                value={form.level}
                onChange={(e) => { setForm((p) => ({ ...p, level: Number(e.target.value) })); if (errors.level) setErrors((p) => ({ ...p, level: undefined })); }}
                placeholder="VD: 1, 2, 3..."
                className="flex-1 px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex flex-col border-l border-gray-300 dark:border-gray-700">
                <button type="button"
                  onClick={() => { setForm((p) => ({ ...p, level: p.level + 1 })); if (errors.level) setErrors((p) => ({ ...p, level: undefined })); }}
                  className="cursor-pointer flex-1 px-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-center">
                  <i className="fas fa-chevron-up text-[9px]"></i>
                </button>
                <div className="h-px bg-gray-300 dark:bg-gray-700"></div>
                <button type="button"
                  onClick={() => { setForm((p) => ({ ...p, level: Math.max(0, p.level - 1) })); if (errors.level) setErrors((p) => ({ ...p, level: undefined })); }}
                  className="cursor-pointer flex-1 px-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-center">
                  <i className="fas fa-chevron-down text-[9px]"></i>
                </button>
              </div>
            </div>
            {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Mô tả quyền hạn và nhiệm vụ của vai trò..."
              className="w-full rounded-lg px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={isSaving}
              className="cursor-pointer px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSaving && <i className="fas fa-spinner fa-spin text-sm"></i>}
              {isEdit ? 'Lưu thay đổi' : 'Thêm vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────────────────────── */

function DeleteModal({ role, onConfirm, onCancel, isLoading }: { role: ClubRole; onConfirm: () => Promise<void>; onCancel: () => void; isLoading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <i className="fas fa-trash text-red-600 dark:text-red-400 text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xóa vai trò</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{role.roleName}</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Bạn có chắc muốn xóa vai trò <span className="font-semibold">"{role.roleName}"</span>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={isLoading}
            className="cursor-pointer px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="cursor-pointer px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading && <i className="fas fa-spinner fa-spin text-sm"></i>}
            Xóa vai trò
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Module ─────────────────────────────────────────────────────────── */

export default function ClubStructureModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const clubId = Number(id) || getClubId();
  const { data: roles = [], isLoading, error } = useGetClubStructureRolesQuery(clubId, { skip: !clubId });

  const [createRole, { isLoading: isCreating }] = useCreateClubRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateClubRoleMutation();
  const [deleteRoleMut, { isLoading: isDeleting }] = useDeleteClubRoleMutation();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedRole, setSelectedRole] = useState<ClubRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubRole | null>(null);

  const levelMap = new Map<number, ClubRole[]>();
  roles.forEach((role) => {
    const existing = levelMap.get(role.level) || [];
    existing.push(role);
    levelMap.set(role.level, existing);
  });
  const sortedLevels = [...levelMap.entries()].sort(([a], [b]) => a - b);
  const uniqueLevels = sortedLevels.length;
  const totalPolicies = roles.reduce((sum, r) => sum + r.policies.length, 0);

  const handleSave = async (data: ClubRoleFormData) => {
    try {
      if (modalMode === 'create') {
        await createRole({ roleName: data.roleName, description: data.description, level: data.level, clubId }).unwrap();
        showNotification({ type: 'success', title: 'Thêm vai trò thành công!', message: `Vai trò "${data.roleName}" đã được tạo.`, duration: 3000 });
      } else if (modalMode === 'edit' && selectedRole) {
        await updateRole({ clubId, roleId: selectedRole.clubRoleId, body: { roleName: data.roleName, description: data.description, level: data.level } }).unwrap();
        showNotification({ type: 'success', title: 'Cập nhật vai trò thành công!', message: `Vai trò "${data.roleName}" đã được cập nhật.`, duration: 3000 });
      }
      setModalMode(null);
      setSelectedRole(null);
    } catch (err) {
      const rtkErr = err as { data?: { message?: string } };
      showNotification({ type: 'error', title: 'Thao tác thất bại', message: rtkErr?.data?.message ?? 'Vui lòng thử lại.', duration: 4000 });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoleMut({ clubId, roleId: deleteTarget.clubRoleId }).unwrap();
      showNotification({ type: 'success', title: 'Xóa vai trò thành công!', message: `Vai trò "${deleteTarget.roleName}" đã được xóa.`, duration: 3000 });
      setDeleteTarget(null);
    } catch (err) {
      const rtkErr = err as { data?: { message?: string } };
      showNotification({ type: 'error', title: 'Xóa vai trò thất bại', message: rtkErr?.data?.message ?? 'Vui lòng thử lại.', duration: 4000 });
    }
  };

  const actionProps = {
    onEdit: (role: ClubRole) => { setSelectedRole(role); setModalMode('edit'); },
    onDelete: (role: ClubRole) => setDeleteTarget(role),
  };

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath={`/clubs/${id}/structure`} isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Cấu trúc Câu lạc bộ"
        breadcrumb={`Pages / Clubs / ${id} / Structure`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Top bar: Back + Add + View Toggle */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(`/clubs/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedRole(null); setModalMode('create'); }}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md">
              <i className="fas fa-plus text-sm"></i>
              Thêm vai trò
            </button>

            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
              <button onClick={() => setViewMode('chart')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${viewMode === 'chart' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <i className="fas fa-sitemap"></i> Sơ đồ
              </button>
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <i className="fas fa-list"></i> Danh sách
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-id-badge text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng vai trò</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-layer-group text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cấp bậc</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueLevels}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng thành viên</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{roles.reduce((s, r) => s + r.memberCount, 0)}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tổng quyền</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalPolicies}</h3>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && <Loading />}

        {/* Error */}
        {!isLoading && error && (
          <Error title="Không thể tải cấu trúc" error={error} />
        )}

        {/* Empty */}
        {!isLoading && !error && roles.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center">
            <i className="fas fa-sitemap text-3xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Chưa có vai trò nào</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hãy tạo vai trò cho câu lạc bộ</p>
            <button onClick={() => { setSelectedRole(null); setModalMode('create'); }}
              className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              Thêm vai trò đầu tiên
            </button>
          </div>
        )}

        {/* Chart View */}
        {!isLoading && !error && roles.length > 0 && viewMode === 'chart' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                <i className="fas fa-sitemap mr-2 text-blue-500"></i>
                Sơ đồ tổ chức
              </h2>
              {sortedLevels.map(([level, levelRoles], index) => {
                const config = getLevelConfig(level);
                return (
                  <div key={level}>
                    {index > 0 && <ConnectorLine />}
                    <LevelSection level={level} roles={levelRoles} config={config} actionProps={actionProps} />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                Chú thích cấp bậc
              </h3>
              <div className="flex flex-wrap gap-6">
                {sortedLevels.map(([level]) => {
                  const config = getLevelConfig(level);
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${config.badge}`}></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300"><strong>{config.label}</strong></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* List View */}
        {!isLoading && !error && roles.length > 0 && viewMode === 'list' && (
          <>
            <ListView roles={roles} actionProps={actionProps} />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Hiển thị {roles.length} vai trò</p>
          </>
        )}
      </main>

      {/* Modals */}
      {modalMode && (
        <RoleModal
          initial={modalMode === 'edit' ? selectedRole : null}
          onClose={() => { setModalMode(null); setSelectedRole(null); }}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteModal role={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={isDeleting} />
      )}
    </div>
  );
}
