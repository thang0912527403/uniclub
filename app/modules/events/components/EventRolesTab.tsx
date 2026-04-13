import React, { useState } from "react";
import {
  useGetEventRolesQuery,
  useCreateEventRoleMutation,
  useUpdateEventRoleMutation,
  useDeleteEventRoleMutation,
  useSetEventRolePoliciesMutation,
} from "~/cores/api/eventCollaboratorApi";
import { useNotification } from "~/components/Notification";
import { ConfirmDialog } from "~/components/ConfirmDialog";

interface Props {
  eventId: number;
  clubId: number;
  isDark: boolean;
  eventStatus?: string;
}

const ALL_EVENT_POLICIES = [
  { name: "viewevent", label: "Xem sự kiện" },
  { name: "editevent", label: "Chỉnh sửa sự kiện" },
  { name: "deleteevent", label: "Xóa sự kiện" },
  { name: "managesession", label: "Quản lý buổi họp" },
  { name: "openregistration", label: "Mở đăng ký" },
  { name: "startevent", label: "Bắt đầu sự kiện" },
  { name: "completeevent", label: "Kết thúc sự kiện" },
  { name: "managecollaborator", label: "Quản lý cộng tác viên" },
  { name: "viewattendance", label: "Xem điểm danh" },
  { name: "approveattendance", label: "Duyệt đăng ký" },
  { name: "checkin", label: "Điểm danh (Check-in)" },
  { name: "evaluatemember", label: "Đánh giá thành viên" },
];

export function EventRolesTab({ eventId, clubId, isDark, eventStatus }: Props) {
  const { show: showNotification } = useNotification();
  const { data: roles = [], isLoading, refetch } = useGetEventRolesQuery({
    clubId,
    eventId,
  });

  const [createRole, { isLoading: isCreating }] = useCreateEventRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateEventRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteEventRoleMutation();
  const [setPolicies, { isLoading: isSavingPolicies }] = useSetEventRolePoliciesMutation();

  const [formState, setFormState] = useState<{
    id?: number;
    roleName: string;
    description: string;
    isOpen: boolean;
  }>({ roleName: "", description: "", isOpen: false });

  const [editingPoliciesFor, setEditingPoliciesFor] = useState<number | null>(null);
  const [editedPolicies, setEditedPolicies] = useState<Set<string>>(new Set());

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const text = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const bgCard = isDark ? "bg-[#242838]" : "bg-white";
  const inputCls = isDark
    ? "bg-[#1a1d2e] border-gray-700 text-white focus:border-blue-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const handleSaveRole = async () => {
    try {
      if (formState.id) {
        await updateRole({
          clubId,
          eventId,
          roleId: formState.id,
          roleName: formState.roleName,
          description: formState.description,
        }).unwrap();
        showNotification({ type: "success", title: "Cập nhật chức vụ thành công" });
      } else {
        await createRole({
          clubId,
          eventId,
          roleName: formState.roleName,
          description: formState.description,
        }).unwrap();
        showNotification({ type: "success", title: "Thêm chức vụ thành công" });
      }
      setFormState({ roleName: "", description: "", isOpen: false });
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi",
        message: err?.data?.error || err?.data?.message || "Đã xảy ra lỗi",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRole({ clubId, eventId, roleId: deleteId }).unwrap();
      showNotification({ type: "success", title: "Đã xóa chức vụ" });
      setDeleteId(null);
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi",
        message: err?.data?.error || err?.data?.message || "Không thể xóa",
      });
    }
  };

  const handleSavePolicies = async (roleId: number) => {
    try {
      await setPolicies({
        clubId,
        eventId,
        roleId,
        policies: Array.from(editedPolicies),
      }).unwrap();
      showNotification({ type: "success", title: "Cập nhật quyền thành công" });
      setEditingPoliciesFor(null);
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi",
        message: err?.data?.error || err?.data?.message || "Đã xảy ra lỗi",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className={`h-12 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
        <div className={`h-24 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${text} flex items-center`}>
            <i className="fas fa-shield-alt mr-2 text-blue-500" />
            Chức vụ & Quyền hạn
          </h3>
          <p className={`text-sm ${sub} mt-1`}>
            Định nghĩa các chức vụ trong sự kiện và thiết lập quyền hạn cho từng chức vụ.
          </p>
        </div>
        {eventStatus !== "CANCELED" && (
            <button
            onClick={() => setFormState({ roleName: "", description: "", isOpen: true })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
            <i className="fas fa-plus" /> Thêm chức vụ
            </button>
        )}
      </div>

      {formState.isOpen && (
        <div className={`p-5 rounded-xl border ${border} ${bgCard} shadow-sm`}>
          <h4 className={`text-sm font-bold mb-4 ${text}`}>
            {formState.id ? "Sửa chức vụ" : "Thêm chức vụ mới"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${sub}`}>Tên chức vụ *</label>
              <input
                type="text"
                value={formState.roleName}
                onChange={(e) => setFormState({ ...formState, roleName: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg outline-none border ${inputCls}`}
                placeholder="VD: Trưởng ban Nội dung..."
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${sub}`}>Mô tả</label>
              <input
                type="text"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg outline-none border ${inputCls}`}
                placeholder="Nhiệm vụ chính..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setFormState({ roleName: "", description: "", isOpen: false })}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${border} ${sub} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
            >
              Hủy
            </button>
            <button
              onClick={handleSaveRole}
              disabled={isCreating || isUpdating || !formState.roleName.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreating || isUpdating ? <i className="fas fa-spinner fa-spin" /> : "Lưu chức vụ"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isCreator = role.level === 0;
          const isEditingPolicies = editingPoliciesFor === role.eventRoleId;

          return (
            <div key={role.eventRoleId} className={`rounded-xl border ${border} ${bgCard} overflow-hidden shadow-sm flex flex-col`}>
              {/* Card Header & Body */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${text} text-lg mb-1 flex items-center gap-2`}>
                      {role.roleName}
                      {isCreator && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 rounded-full">
                          Creator
                        </span>
                      )}
                    </h4>
                    <p className={`text-sm ${sub}`}>{role.description || "Không có mô tả."}</p>
                  </div>
                  {!isCreator && eventStatus !== "CANCELED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setFormState({
                            id: role.eventRoleId,
                            roleName: role.roleName,
                            description: role.description || "",
                            isOpen: true,
                          })
                        }
                        className={`p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors`}
                        title="Sửa"
                      >
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        onClick={() => setDeleteId(role.eventRoleId)}
                        className={`p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors`}
                        title="Xóa"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  )}
                </div>

                <div className={`mt-4 pt-4 border-t ${border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${sub}`}>
                      <i className="fas fa-key mr-1.5" />
                      Quyền hạn ({role.policies?.length || 0})
                    </span>
                    {!isCreator && eventStatus !== "CANCELED" && (
                      <button
                        onClick={() => {
                          if (isEditingPolicies) {
                            setEditingPoliciesFor(null);
                          } else {
                            setEditingPoliciesFor(role.eventRoleId);
                            setEditedPolicies(new Set(role.policies || []));
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          isEditingPolicies
                            ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                            : `${border} text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`
                        }`}
                      >
                        {isEditingPolicies ? "Đóng phân quyền" : "Phân quyền"}
                      </button>
                    )}
                  </div>

                  {!isEditingPolicies && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {isCreator ? (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                          Tất cả quyền (Full Access)
                        </span>
                      ) : role.policies?.length ? (
                        role.policies.map((pName) => {
                          const pol = ALL_EVENT_POLICIES.find((x) => x.name === pName);
                          return (
                            <span
                              key={pName}
                              className={`text-[11px] px-2 py-1 rounded-md font-medium ${
                                isDark ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-gray-100 text-gray-600 border-gray-200"
                              } border`}
                            >
                              {pol?.label || pName}
                            </span>
                          );
                        })
                      ) : (
                        <span className={`text-xs italic ${sub}`}>Chưa có quyền</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Policy Editor Inline */}
              {isEditingPolicies && (
                <div className={`bg-gray-50 dark:bg-gray-800/50 p-4 border-t ${border}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className={`text-sm font-semibold ${text}`}>Chọn quyền cho {role.roleName}</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditedPolicies(new Set(ALL_EVENT_POLICIES.map((p) => p.name)))}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        onClick={() => setEditedPolicies(new Set())}
                        className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {ALL_EVENT_POLICIES.map((p) => {
                      const checked = editedPolicies.has(p.name);
                      return (
                        <label
                          key={p.name}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            checked
                              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/25 dark:border-blue-600 font-medium"
                              : `${border} ${bgCard}`
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setEditedPolicies((prev) => {
                                const next = new Set(prev);
                                next.has(p.name) ? next.delete(p.name) : next.add(p.name);
                                return next;
                              });
                            }}
                            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer rounded"
                          />
                          <span className={`${checked ? "text-blue-700 dark:text-blue-300" : text}`}>
                            {p.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setEditingPoliciesFor(null)}
                      className={`px-3 py-1.5 text-xs font-medium border ${border} ${sub} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSavePolicies(role.eventRoleId)}
                      disabled={isSavingPolicies}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSavingPolicies ? <i className="fas fa-spinner fa-spin" /> : "Lưu quyền"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa chức vụ"
        message="Bạn có chắc chắn muốn xóa chức vụ này? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các thành viên đang sở hữu chức vụ này."
        confirmText="Xác nhận xóa"
        type="danger"
      />
    </div>
  );
}
