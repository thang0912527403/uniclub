import React from 'react';
import type { User } from '~/cores/api'; // chỉnh lại path nếu cần

type ProfileHeaderProps = {
  user?: User;
};

const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  return (
    <div className="relative mb-8 mt-20">
      {/* Cover Image */}
      <div className="h-35 w-full bg-gradient-to-r from-[#f26522] to-[#ffa585] rounded-3xl"></div>

      {/* Avatar & Info */}
      <div className="flex flex-col md:flex-row items-end px-8 -mt-12 gap-6">
        <img 
          src="src/assets/images/profile_img/586_bite-my-tongue.jpg" 
          className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
          alt="User Avatar"
        />

        <div className="flex-1 pb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.fullName || "Loading..."}
          </h1>

          {/* <p className="text-gray-500 italic">
            {user?.bio || "Chưa có mô tả"}
          </p> */}
        </div>

        <div className="pb-2">
          <button className="px-6 py-2 border-2 border-[#f26522] text-[#f26522] rounded-xl font-bold hover:bg-[#f26522] hover:text-white transition-all">
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;