import React from "react";

export interface ProfileHeaderProps {
  user: any;
  avatarUrl: string;
  isEditing: boolean;
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  setIsEditing: (val: boolean) => void;
  handleCancel: () => void;
  setShowSaveConfirm: (val: boolean) => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  avatarUrl,
  isEditing,
  isUpdating,
  isUploadingAvatar,
  setIsEditing,
  handleCancel,
  setShowSaveConfirm,
  handleAvatarChange,
  handleAvatarClick,
  fileInputRef,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 mt-6">
      {/* Cover Photo */}
      <div
        className="h-70 w-full bg-cover bg-center"
        style={{
          backgroundImage:
            "url('./src/assets/images/profile_img/background-profile2.jpg')",
        }}
      />

      <div className="px-6 md:px-8 pb-8 relative flex flex-col md:flex-row md:items-end justify-between">
        {/* Avatar & Basic Info Container */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 relative z-10 w-full md:w-auto">
          {/* Avatar with negative margin to overlap cover only */}
          <div className="group relative shrink-0 -mt-16 md:-mt-20 z-10">
            <div className="relative h-32 w-32 md:h-[140px] md:w-[140px] rounded-full border-[5px] border-white dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <i className="fas fa-spinner fa-spin text-white text-xl" />
                ) : (
                  <i className="fas fa-camera text-white text-xl" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info Text (No negative margin, sits below cover on mobile) */}
          <div className="text-center md:text-left mb-2 md:mb-1 mt-4 md:mt-0 pt-2 h-full flex flex-col justify-end">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {user?.fullName}
            </h1>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1.5 flex items-center justify-center md:justify-start gap-1">
              <i className="fas fa-graduation-cap text-orange-500 w-4" />{" "}
              {user?.major || "Thành viên"} tại UniClub
            </p>

            {/* Location & Social Layout */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1.5">
                <i className="fas fa-map-marker-alt text-gray-400" />{" "}
                {user?.address || "Việt Nam"}
              </span>
              <div className="hidden md:block w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
              <span className="flex items-center gap-4 text-gray-400">
                <span className="hover:text-blue-600 transition-colors cursor-pointer">
                  <i className="fab fa-facebook-f" />
                </span>
                <span className="hover:text-blue-500 transition-colors cursor-pointer">
                  <i className="fab fa-linkedin-in" />
                </span>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  <i className="fab fa-twitter" />
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions (Edit Profile) */}
        <div className="mt-8 md:mt-0 flex flex-wrap justify-center md:justify-end gap-3 self-center md:self-end mb-2 w-full md:w-auto">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-transparent"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowSaveConfirm(true)}
                disabled={isUpdating}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 border border-transparent"
              >
                {isUpdating && <i className="fas fa-spinner fa-spin text-xs" />}
                Lưu
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="h-10 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full transition-all shadow-sm"
              title="Chỉnh sửa hồ sơ"
            >
              <i className="fas fa-pen text-xs" />
              <span className="hidden md:inline">Sửa hồ sơ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
