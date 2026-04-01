import React, { useState } from "react";
import {
  useGetEventMembersQuery,
  useAddEventMemberMutation,
  useUpdateEventMemberRoleMutation,
  useRemoveEventMemberMutation,
  useSetEventMemberPoliciesMutation,
  useGetEventRolesQuery,
} from "~/cores/api/eventCollaboratorApi";
import { useGetClubMembersQuery } from "~/cores/api";
import { useNotification } from "~/components/Notification";
import { ConfirmDialog } from "~/components/ConfirmDialog";

interface Props {
  eventId: number;
  clubId: number;
  isDark: boolean;
  eventStatus: string;
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

export function EventMembersTab({ eventId, clubId, isDark, eventStatus }: Props) {
  const { show: showNotification } = useNotification();
  const { data: members = [], isLoading, refetch } = useGetEventMembersQuery({
    clubId,
    eventId,
  });
  const { data: roles = [], isLoading: isRolesLoading } = useGetEventRolesQuery({
    clubId,
    eventId,
  });
  const { data: clubMembers = [], isLoading: isClubMembersLoading } =
    useGetClubMembersQuery(clubId);

  const [addMember, { isLoading: isAdding }] = useAddEventMemberMutation();
  const [updateMemberRole, { isLoading: isUpdatingRole }] = useUpdateEventMemberRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveEventMemberMutation();
  const [setPolicies, { isLoading: isSavingPolicies }] = useSetEventMemberPoliciesMutation();

  const [teamForm, setTeamForm] = useState<{ userId: string; roleId?: number }>({
    userId: "",
    roleId: undefined,
  });
  const [memberSearch, setMemberSearch] = useState("");

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

  // Filter club members that are not already in the event
  const existingMemberIds = new Set(members.map((m) => m.userId));
  const availableMembers = clubMembers.filter(
    (m) => m.status === "ACTIVE" && !existingMemberIds.has(m.userId)
  );

  const filteredMembers = memberSearch.trim()
    ? availableMembers.filter(
        (m) =>
          m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
          (m.email ?? "").toLowerCase().includes(memberSearch.toLowerCase()) ||
          (m.studentId ?? "").toLowerCase().includes(memberSearch.toLowerCase())
      )
    : availableMembers;

  const handleAddMember = async () => {
    if (!teamForm.userId) {
      showNotification({ type: "error", title: "Lỗi", message: "Vui lòng chọn thành viên" });
      return;
    }
    try {
      await addMember({
        clubId,
        eventId,
        userId: teamForm.userId,
        eventRoleId: teamForm.roleId,
      }).unwrap();
      showNotification({ type: "success", title: "Đã thêm thành viên mới" });
      setTeamForm({ userId: "", roleId: undefined });
      setMemberSearch("");
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi thêm thành viên",
        message: err?.data?.error || err?.data?.message || "Đã xảy ra lỗi",
      });
    }
  };

  const handleUpdateRole = async (memberId: number, roleId: number) => {
    try {
      await updateMemberRole({
        clubId,
        eventId,
        memberId,
        roleId,
      }).unwrap();
      showNotification({ type: "success", title: "Đã cập nhật chức vụ" });
      if (editingPoliciesFor === memberId) {
        setEditingPoliciesFor(null);
      }
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi cập nhật chức vụ",
        message: err?.data?.error || err?.data?.message || "Đã xảy ra lỗi",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeMember({ clubId, eventId, memberId: deleteId }).unwrap();
      showNotification({ type: "success", title: "Đã gỡ thành viên khỏi sự kiện" });
      setDeleteId(null);
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi xóa thành viên",
        message: err?.data?.error || err?.data?.message || "Không thể xóa",
      });
    }
  };

  const handleSavePolicies = async (memberId: number) => {
    try {
      await setPolicies({
        clubId,
        eventId,
        memberId,
        policies: Array.from(editedPolicies),
      }).unwrap();
      showNotification({ type: "success", title: "Cập nhật quyền thành công" });
      setEditingPoliciesFor(null);
      refetch();
    } catch (err: any) {
      showNotification({
        type: "error",
        title: "Lỗi cập nhật quyền",
        message: err?.data?.error || err?.data?.message || "Đã xảy ra lỗi",
      });
    }
  };

  if (isLoading || isRolesLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className={`h-12 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
        <div className={`h-48 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${text} flex items-center`}>
            <i className="fas fa-users-cog mr-2 text-blue-500" />
            Danh sách Ban tổ chức
          </h3>
          <p className={`text-sm ${sub} mt-1`}>
            Quản lý thành viên trong ban tổ chức và chức vụ của họ. ({members.length} thành viên)
          </p>
        </div>
      </div>

      {/* Add New Member Box */}
      {eventStatus !== "COMPLETED" && eventStatus !== "CANCELLED" && (
        <div className={`p-4 rounded-xl border ${border} ${bgCard} shadow-sm`}>
          <h4 className={`font-medium mb-3 ${text}`}>
            <i className="fas fa-user-plus mr-2 text-blue-500" />
            Thêm thành viên mới
          </h4>

          {isClubMembersLoading ? (
            <p className={`text-sm ${sub}`}>Đang tải danh sách thành viên Câu lạc bộ...</p>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm thành viên theo tên, email hoặc MSSV..."
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`}
              />
              {filteredMembers.length === 0 ? (
                <p className={`text-sm ${sub}`}>
                  {memberSearch.trim()
                    ? "Không tìm thấy thành viên phù hợp."
                    : "Tất cả thành viên quản lý đã tham gia sự kiện này."}
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={teamForm.userId}
                    onChange={(e) =>
                      setTeamForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`}
                  >
                    <option value="">— Chọn thành viên —</option>
                    {filteredMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} {m.studentId ? `(${m.studentId})` : ""}
                      </option>
                    ))}
                  </select>
                  <select
                    value={teamForm.roleId || ""}
                    onChange={(e) =>
                      setTeamForm((f) => ({
                        ...f,
                        roleId: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={`px-3 py-2 text-sm border rounded-lg outline-none ${inputCls}`}
                  >
                    <option value="">— Chọn chức vụ —</option>
                    {roles
                      .filter((r) => r.level !== 1) // Do not allow manual assign of Creator
                      .map((r) => (
                        <option key={r.eventRoleId} value={r.eventRoleId}>
                          {r.roleName}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={isAdding || !teamForm.userId || !teamForm.roleId}
                    className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isAdding ? <i className="fas fa-spinner fa-spin mr-1" /> : <i className="fas fa-plus mr-1" />}
                    Thêm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className={`rounded-xl border ${border} ${bgCard} overflow-hidden shadow-sm`}>
        {members.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <i className="fas fa-users text-3xl text-gray-400 mb-2" />
            <p className={`text-sm ${sub}`}>Chưa có thành viên nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? "bg-gray-800/50" : "bg-gray-50"}>
                  <th className={`px-4 py-3 text-left font-medium ${sub}`}>Thành viên</th>
                  <th className={`px-4 py-3 text-left font-medium ${sub}`}>Chức vụ</th>
                  <th className={`px-4 py-3 text-left font-medium ${sub}`}>Ngày tham gia</th>
                  <th className={`px-4 py-3 text-center font-medium ${sub}`}>Quyền đặc biệt</th>
                  <th className={`px-4 py-3 text-center font-medium ${sub}`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((m) => {
                  const isCreator = roles.find((r) => r.eventRoleId === m.roleId)?.level === 1;
                  const isEditingPolicies = editingPoliciesFor === m.eventMemberId;
                  const hasCustomPolicies = m.customPolicies && m.customPolicies.length > 0;

                  return (
                    <React.Fragment key={m.eventMemberId}>
                      <tr className={`${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"} transition-colors`}>
                        <td className={`px-4 py-3 font-medium ${text}`}>
                          <div className="flex items-center gap-3">
                            {m.userAvatar ? (
                              <img
                                src={m.userAvatar}
                                alt={m.userName}
                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                {m.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div>{m.userName}</div>
                              <div className={`text-xs ${sub} font-normal`}>
                                ID: {m.userId.slice(0, 8)}…
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={m.roleId || ""}
                            disabled={isUpdatingRole || isCreator}
                            onChange={(e) =>
                              handleUpdateRole(m.eventMemberId, Number(e.target.value))
                            }
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer outline-none ${
                              isCreator
                                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-transparent"
                                : `${inputCls}`
                            }`}
                          >
                            {isCreator ? (
                              <option value={m.roleId}>{m.roleName}</option>
                            ) : (
                              roles
                                .filter((r) => r.level !== 1)
                                .map((r) => (
                                  <option key={r.eventRoleId} value={r.eventRoleId}>
                                    {r.roleName}
                                  </option>
                                ))
                            )}
                          </select>
                        </td>
                        <td className={`px-4 py-3 ${sub}`}>
                          {new Date(m.joinDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasCustomPolicies ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex-col items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              Có tùy chỉnh
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex-col items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Theo chức vụ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isCreator && (
                              <button
                                onClick={() => {
                                  if (isEditingPolicies) {
                                    setEditingPoliciesFor(null);
                                  } else {
                                    setEditingPoliciesFor(m.eventMemberId);
                                    // Use custom policies if they exist, else empty Set. 
                                    // Wait, maybe we should show all current policies but distinguish them? 
                                    // Let's just edit custom member policies.
                                    setEditedPolicies(new Set(m.customPolicies || []));
                                  }
                                }}
                                className={`px-2.5 py-1.5 text-xs border rounded-lg transition-colors flex items-center gap-1 ${
                                  isEditingPolicies
                                    ? "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                                    : `border-gray-200 dark:border-gray-600 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`
                                }`}
                                title="Đặc quyền riêng"
                              >
                                <i className="fas fa-shield-alt" />
                                {isEditingPolicies ? "Đóng" : "Đặc quyền"}
                              </button>
                            )}
                            {!isCreator && (
                              <button
                                onClick={() => setDeleteId(m.eventMemberId)}
                                className={`px-2.5 py-1.5 text-xs text-red-500 border border-red-200 dark:border-red-900/80 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
                                title="Gỡ khỏi sự kiện"
                              >
                                <i className="fas fa-trash-alt" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline Special Policy Editor */}
                      {isEditingPolicies && !isCreator && (
                        <tr className={isDark ? "bg-gray-800/30" : "bg-blue-50/30"}>
                          <td colSpan={5} className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="space-y-3 pl-12 border-l-2 border-blue-400">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className={`text-sm font-semibold tracking-wider ${text}`}>
                                    <i className="fas fa-star mr-1.5 text-yellow-500" />
                                    Đặc quyền dành riêng cho {m.userName}
                                  </h5>
                                  <p className={`text-xs ${sub} mt-1`}>
                                    Ngoài các quyền được gán từ chức vụ <b>{m.roleName}</b>, bạn có thể cấp thêm (hoặc ghi đè) 
                                    các quyền hạn đặc thù cho riêng nhân sự này.
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditedPolicies(new Set(ALL_EVENT_POLICIES.map((p) => p.name)))}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Chọn tất cả
                                  </button>
                                  <button
                                    onClick={() => setEditedPolicies(new Set())}
                                    className="text-xs text-gray-500 hover:underline"
                                  >
                                    Bỏ tùy chỉnh
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                                {ALL_EVENT_POLICIES.map((p) => {
                                  // Indicates if this policy is already granted by the role
                                  const HasRolePolicy = m.rolePolicies?.includes(p.name);
                                  const isCustomSet = editedPolicies.has(p.name);

                                  return (
                                    <label
                                      key={p.name}
                                      className={`flex flex-col px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                        isCustomSet
                                          ? "border-blue-400 bg-white dark:bg-gray-800 shadow-sm"
                                          : HasRolePolicy
                                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700"
                                          : `border-gray-200 dark:border-gray-700 bg-transparent opacity-80`
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isCustomSet}
                                          onChange={() => {
                                            setEditedPolicies((prev) => {
                                              const next = new Set(prev);
                                              next.has(p.name) ? next.delete(p.name) : next.add(p.name);
                                              return next;
                                            });
                                          }}
                                          className="w-3 h-3 accent-blue-600 rounded cursor-pointer"
                                        />
                                        <span className={`font-medium ${isCustomSet ? "text-blue-700 dark:text-blue-400" : HasRolePolicy ? "text-emerald-700 dark:text-emerald-400" : text}`}>
                                          {p.label}
                                        </span>
                                      </div>
                                      {HasRolePolicy && !isCustomSet && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-5 mt-0.5">
                                          (Đã có từ chức vụ)
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => handleSavePolicies(m.eventMemberId)}
                                  disabled={isSavingPolicies}
                                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                  {isSavingPolicies && <i className="fas fa-spinner fa-spin mr-1" />}
                                  Lưu đặc quyền
                                </button>
                                <button
                                  onClick={() => setEditingPoliciesFor(null)}
                                  className={`px-4 py-1.5 text-xs font-medium border ${border} ${sub} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                >
                                  Đóng
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Gỡ thành viên khỏi sự kiện"
        message="Thành viên này sẽ không còn quyền quản lý hay xem thông tin bí mật của sự kiện này nữa. Bạn có chắc chắn?"
        confirmText="Xác nhận gỡ"
        type="danger"
      />
    </div>
  );
}
