import React from "react";

interface ContactSidebarProps {
  user: any;
}

const ContactSidebar: React.FC<ContactSidebarProps> = ({ user }) => {
  return (
    <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-6 sticky top-24">
        {/* Contact items */}
        <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <i className="fas fa-phone text-gray-400 w-4 text-center" />
            <div>
              <span className="block text-gray-800 dark:text-gray-200">
                {user?.phoneNumber || "Chưa cập nhật"}{" "}
                <span className="text-gray-400 text-xs ml-1">(Mobile)</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <i className="fas fa-envelope text-gray-400 w-4 text-center" />
            <span className="text-gray-800 dark:text-gray-200 break-all">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          disabled
          className="w-full py-3 mt-1 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <i className="fas fa-comment-dots text-lg" /> Chat (Đang cập nhật)
        </button>
      </div>
    </div>
  );
};

export default ContactSidebar;
