import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router";
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
import ContactSidebar from "./components/ContactSidebar";
import ProfileInfoTab from "./components/ProfileInfoTab";
import InterviewStatusTracker from "./components/InterviewStatusTracker";
import InterviewerInterviewsSection from "./components/InterviewerInterviewsSection";
import MyApplications from "~/modules/my-applications/MyApplications";

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const meId = getUserId();

  // Decide which ID to use for fetching
  const targetUserId = userId || meId;
  const isOwnProfile = !userId || userId === meId;

  const {
    data: user,
    isLoading,
    refetch,
  } = useGetUserByIdQuery(targetUserId, { skip: !targetUserId });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
    useUploadAvatarMutation();
  const { show: showNotification } = useNotification();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<
    "info" | "applications" | "candidate" | "interviewer"
  >("info");

  // Sync tab from URL
  useEffect(() => {
    if (
      tabParam === "applications" ||
      tabParam === "info" ||
      tabParam === "candidate" ||
      tabParam === "interviewer"
    ) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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
          <i className="fas fa-spinner fa-spin text-3xl text-orange-500" />
        </div>
      </div>
    );
  }

  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "U")}&size=256&background=f97316&color=fff&bold=true&font-size=0.4`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 mt-16">
        <ProfileHeader
          user={user}
          avatarUrl={avatarUrl}
          isEditing={isEditing}
          isUpdating={isUpdating}
          isUploadingAvatar={isUploadingAvatar}
          setIsEditing={setIsEditing}
          handleCancel={handleCancel}
          setShowSaveConfirm={setShowSaveConfirm}
          handleAvatarChange={handleAvatarChange}
          handleAvatarClick={handleAvatarClick}
          fileInputRef={fileInputRef}
          isOwnProfile={isOwnProfile}
        />

        {/* ─── Main Content Layout ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          <ContactSidebar user={user} />

          {/* Right Area (Tabs & Content) */}
          <div className="flex-1 min-w-0">
            {/* ─── Tabs Navigation (Only if own profile) ─────────────────────────────── */}
            {isOwnProfile && (
              <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl w-fit border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <button
                  onClick={() => handleTabChange("info")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "info"
                      ? "bg-white dark:bg-gray-700 text-orange-500 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <i className="fas fa-user-circle" />
                  Thông tin chung
                </button>

                <>
                  <button
                    onClick={() => handleTabChange("candidate")}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      activeTab === "candidate"
                        ? "bg-white dark:bg-gray-700 text-orange-500 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <i className="fas fa-clipboard-list" />
                    Lịch phỏng vấn
                  </button>

                  <button
                    onClick={() => handleTabChange("applications")}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      activeTab === "applications"
                        ? "bg-white dark:bg-gray-700 text-orange-500 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <i className="fas fa-file-alt" />
                    Đơn của tôi
                  </button>

                  <button
                    onClick={() => handleTabChange("interviewer")}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      activeTab === "interviewer"
                        ? "bg-white dark:bg-gray-700 text-orange-500 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <i className="fas fa-calendar-alt" />
                    Các cuộc phỏng vấn
                  </button>
                </>
              </div>
            )}

            {/* ─── Tab Content ─────────────────────────────────── */}
            {(activeTab === "info" || !isOwnProfile) && (
              <ProfileInfoTab
                user={user}
                form={form}
                setForm={setForm}
                isEditing={isEditing}
              />
            )}

            {/* ─── Interview tracker ───────────── */}
            {activeTab === "candidate" && targetUserId && (
              <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
                <InterviewStatusTracker userId={targetUserId} />
              </div>
            )}

            {/* ─── My Applications ───────────── */}
            {activeTab === "applications" && isOwnProfile && (
              <div className="animate-in fade-in zoom-in-95 duration-300 w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="-m-12 sm:-my-12 sm:-mx-4 w-[calc(100%+32px)]">
                  <MyApplications />
                </div>
              </div>
            )}

            {/* ─── Interviewer scheduler ───────────── */}
            {activeTab === "interviewer" && targetUserId && (
              <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
                <InterviewerInterviewsSection userId={targetUserId} />
              </div>
            )}
          </div>
        </div>
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

export default UserProfile;
