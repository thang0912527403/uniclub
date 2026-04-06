import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUploadAvatarMutation,
} from "~/cores/api/userApi";
import { useNotification } from "~/components/Notification";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import type { UpdateUserDto } from "~/cores/api/types/user";
import { getUserId } from "~/utils/auth";
import ProfileHeader from "./components/profileHeader";
import InterviewStatusTracker from "./components/InterviewStatusTracker";
import InterviewerInterviewsSection from "./components/InterviewerInterviewsSection";
import MyApplications from "~/modules/my-applications/MyApplications";

const UserProfile = () => {
  const navigate = useNavigate();
  const meId = getUserId();
  const {
    data: user,
    isLoading,
    refetch,
  } = useGetUserByIdQuery(meId, { skip: !meId });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
    useUploadAvatarMutation();
  const { show: showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<
    "info" | "applications" | "candidate" | "interviewer"
  >("info");
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [form, setForm] = useState<UpdateUserDto>({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    major: "",
    studentId: "",
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        gender: user.gender || "",
        address: user.address || "",
        major: user.major || "",
        studentId: user.studentId || "",
      });
    }
  }, [user]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meId) return;
    try {
      await uploadAvatar({ id: meId, file }).unwrap();
      showNotification({
        type: "success",
        title: "Thành công",
        message: "Cập nhật ảnh đại diện thành công!",
      });
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Không thể tải ảnh lên";
      showNotification({ type: "error", title: "Lỗi", message: msg });
    }
  };

  const handleSave = async () => {
    if (!meId) return;
    try {
      await updateUser({ id: meId, data: form }).unwrap();
      showNotification({
        type: "success",
        title: "Thành công",
        message: "Cập nhật hồ sơ thành công!",
      });
      setIsEditing(false);
      setShowSaveConfirm(false);
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Cập nhật thất bại";
      showNotification({ type: "error", title: "Lỗi", message: msg });
      setShowSaveConfirm(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        gender: user.gender || "",
        address: user.address || "",
        major: user.major || "",
        studentId: user.studentId || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500" />
        </div>
      </div>
    );
  }

  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "U")}&size=256&background=6366f1&color=fff&bold=true&font-size=0.4`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 mt-16">
        {/* ─── Cover + Avatar ─────────────────────────────── */}
        <div className="relative mb-20 mt-6">
          <div className="h-48 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-lg" />

          {/* Avatar */}
          <div className="absolute -bottom-16 left-8 group">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl object-cover"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <i className="fas fa-spinner fa-spin text-white text-xl" />
                ) : (
                  <i className="fas fa-camera text-white text-xl" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Name + Role badge */}
          <div className="absolute -bottom-14 left-48">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.fullName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          {/* Edit / Save buttons */}
          <div className="absolute -bottom-14 right-4 flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={isUpdating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdating && (
                    <i className="fas fa-spinner fa-spin text-xs" />
                  )}
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <i className="fas fa-pen mr-2" />
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* ─── Tabs Navigation ─────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl w-fit border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "info"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <i className="fas fa-user-circle" />
            Thông tin chung
          </button>

          <button
            onClick={() => setActiveTab("candidate")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "candidate"
                ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <i className="fas fa-clipboard-list" />
            Lịch phỏng vấn
          </button>

          <button
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "applications"
                ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <i className="fas fa-file-alt" />
            Đơn của tôi
          </button>

          <button
            onClick={() => setActiveTab("interviewer")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "interviewer"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <i className="fas fa-calendar-alt" />
            Các cuộc phỏng vấn
          </button>
        </div>

        {/* ─── Tab Content ─────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <i className="fas fa-user text-indigo-500" /> Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <Field
                  label="Họ và tên"
                  icon="fa-id-card"
                  value={form.fullName}
                  field="fullName"
                  editable={isEditing}
                  onChange={(val) => setForm((f) => ({ ...f, fullName: val }))}
                  required
                />
                <Field
                  label="Số điện thoại"
                  icon="fa-phone"
                  value={form.phoneNumber ?? ""}
                  field="phoneNumber"
                  editable={isEditing}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, phoneNumber: val }))
                  }
                />
                <Field
                  label="Ngày sinh"
                  icon="fa-calendar"
                  value={form.dateOfBirth ?? ""}
                  field="dateOfBirth"
                  type="date"
                  editable={isEditing}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, dateOfBirth: val }))
                  }
                />
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <i className="fas fa-venus-mars text-indigo-400 w-4 text-center" />{" "}
                    Giới tính
                  </label>
                  {isEditing ? (
                    <select
                      value={form.gender ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, gender: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
                      {form.gender === "Male"
                        ? "Nam"
                        : form.gender === "Female"
                          ? "Nữ"
                          : form.gender || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <i className="fas fa-graduation-cap text-purple-500" /> Thông
                tin học vụ
              </h3>
              <div className="space-y-4">
                <Field
                  label="Mã số sinh viên"
                  icon="fa-hashtag"
                  value={form.studentId ?? ""}
                  field="studentId"
                  editable={isEditing}
                  onChange={(val) => setForm((f) => ({ ...f, studentId: val }))}
                />
                <Field
                  label="Chuyên ngành"
                  icon="fa-book"
                  value={form.major ?? ""}
                  field="major"
                  editable={isEditing}
                  onChange={(val) => setForm((f) => ({ ...f, major: val }))}
                />
                <Field
                  label="Địa chỉ"
                  icon="fa-map-marker-alt"
                  value={form.address ?? ""}
                  field="address"
                  editable={isEditing}
                  onChange={(val) => setForm((f) => ({ ...f, address: val }))}
                />

                {/* Read-only fields */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <i className="fas fa-envelope text-indigo-400 w-4 text-center" />{" "}
                    Email
                  </label>
                  <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
                    {user?.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <i className="fas fa-clock text-indigo-400 w-4 text-center" />{" "}
                    Ngày tham gia
                  </label>
                  <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
                    {user?.joinDate
                      ? new Date(user.joinDate).toLocaleDateString("vi-VN")
                      : user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Interview tracker ───────────── */}
        {activeTab === "candidate" && meId && (
          <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
            <InterviewStatusTracker userId={meId} />
          </div>
        )}

        {/* ─── My Applications ───────────── */}
        {activeTab === "applications" && (
          <div className="animate-in fade-in zoom-in-95 duration-300 w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Reset background and padding to match the tab content styling */}
            <div className="-m-12 sm:-my-12 sm:-mx-4 w-[calc(100%+32px)]">
              <MyApplications />
            </div>
          </div>
        )}

        {/* ─── Interviewer scheduler ───────────── */}
        {activeTab === "interviewer" && meId && (
          <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
            <InterviewerInterviewsSection userId={meId} />
          </div>
        )}
      </main>

      {/* Save Confirm Dialog */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Lưu thay đổi"
        message="Bạn có chắc muốn cập nhật hồ sơ cá nhân?"
        type="info"
        confirmText="Lưu"
        isLoading={isUpdating}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
};

// ─── Reusable Field Component ──────────────────────────
function Field({
  label,
  icon,
  value,
  field,
  type = "text",
  editable,
  onChange,
  required = false,
}: {
  label: string;
  icon: string;
  value: string;
  field: string;
  type?: string;
  editable: boolean;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
        <i className={`fas ${icon} text-indigo-400 w-4 text-center`} /> {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

export default UserProfile;
