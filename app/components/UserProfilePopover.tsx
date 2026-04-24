import React, { useState } from "react";
import { Popover, Skeleton } from "antd";
import { useGetUserByIdQuery } from "~/cores/api";
import { Link } from "react-router";

export interface UserProfilePopoverProps {
  /** User ID to fetch data for */
  userId: string;
  /** Element that triggers the popover (e.g., text, avatar) */
  children: React.ReactNode;
  /** Trigger mode: hover or click */
  trigger?: "hover" | "click";
  /** Placement of the popover */
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight";
  /** Additional class for the wrapper */
  className?: string;
}

const PopoverContent: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: user, isLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  if (isLoading) {
    return (
      <div className="p-3 w-72">
        <div className="flex gap-4">
          <Skeleton.Avatar active size={64} />
          <div className="flex-1">
            <Skeleton
              active
              paragraph={{ rows: 2, width: ["100%", "60%"] }}
              title={false}
            />
          </div>
        </div>
        <Skeleton
          active
          paragraph={{ rows: 1, width: ["80%"] }}
          className="mt-4"
        />
        <div className="flex gap-2 mt-4">
          <Skeleton.Button active block />
          <Skeleton.Button active block />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 w-64 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <i className="fa-solid fa-user-slash text-gray-400 text-xl"></i>
        </div>
        <p className="text-gray-500 font-medium text-sm">
          Không tìm thấy thông tin
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 p-1">
      {/* Header Info */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white dark:border-gray-800">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initial if image fails
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            user.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 pt-1">
          <h3 className="font-bold text-[17px] text-gray-900 dark:text-white leading-tight mb-1">
            {user.fullName}
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
            {user.studentId
              ? `MSSV: ${user.studentId}`
              : user.major || "Thành viên"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-5 px-1">
        {user.address ? (
          <div className="flex items-start gap-3 text-[14px] text-gray-700 dark:text-gray-300">
            <i className="fa-solid fa-house text-gray-400 mt-[3px] w-4 text-center"></i>
            <span>
              Sống tại{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {user.address}
              </span>
            </span>
          </div>
        ) : null}

        {user.major ? (
          <div className="flex items-start gap-3 text-[14px] text-gray-700 dark:text-gray-300">
            <i className="fa-solid fa-graduation-cap text-gray-400 mt-[3px] w-4 text-center"></i>
            <span>
              Học chuyên ngành{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {user.major}
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-[14px] text-gray-700 dark:text-gray-300">
            <i className="fa-solid fa-briefcase text-gray-400 mt-[3px] w-4 text-center"></i>
            <span>
              Thành viên tại{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                UniClub
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-400 py-2 rounded-lg font-semibold transition-colors text-sm cursor-not-allowed"
          disabled={true}
        >
          <i className="fa-brands fa-facebook-messenger"></i>
          Đang cập nhật
        </button>
        <Link
          to={`/profile/${user.userId}`}
          className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition-colors flex items-center justify-center"
          title="Xem chi tiết hồ sơ"
        >
          <i className="fa-solid fa-ellipsis"></i>
        </Link>
      </div>
    </div>
  );
};

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  userId,
  children,
  trigger = "hover",
  placement = "bottomLeft",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      content={<PopoverContent userId={userId} />}
      trigger={trigger}
      placement={placement}
      styles={{ container: { padding: "16px", borderRadius: "16px" } }}
      destroyOnHidden
      getPopupContainer={() => document.body}
      zIndex={9999}
      mouseEnterDelay={0.4} // Thêm độ trễ để tránh hiện popup khi chỉ lia chuột ngang qua
      mouseLeaveDelay={0.2}
    >
      <span
        className={`inline-block cursor-pointer hover:underline ${className}`}
      >
        {children}
      </span>
    </Popover>
  );
};
