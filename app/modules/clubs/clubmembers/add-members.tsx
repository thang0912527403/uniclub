import { useState, useEffect } from "react";
import { Sidebar } from "~/components/Sidebar";
import { HeaderBar } from "~/components/HeaderBar";
import { useSidebarToggle } from "~/hooks/useSidebarToggle";
import { useNotification } from "~/components/Notification";
import {
  useAddMembersMutation,
  useLazySearchUsersQuery,
  useGetClubMembersQuery,
  type User,
} from "~/cores/api";
import { getClubId } from "~/utils/auth";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Loading } from "~/components/Loading";

export default function AddMembersModule() {
  const { t } = useTranslation("common");
  const { isOpen, toggle } = useSidebarToggle();
  const { show } = useNotification();
  const navigate = useNavigate();
  const clubIdStr = getClubId();
  const clubId = Number(clubIdStr);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "bulk">("search");
  const [bulkEmails, setBulkEmails] = useState("");

  // API Hooks
  const [searchUsers, { data: searchResults, isFetching: isSearching }] =
    useLazySearchUsersQuery();
  const { data: currentMembers = [] } = useGetClubMembersQuery(clubId, {
    skip: !clubId,
  });
  const [addMembers, { isLoading: isSubmitting }] = useAddMembersMutation();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleAddUserToList = (user: User) => {
    if (selectedUsers.some((u) => u.userId === user.userId)) {
      show({
        type: "warning",
        title: "Thông báo",
        message: "Người dùng này đã có trong danh sách chọn.",
      });
      return;
    }
    if (currentMembers.some((m) => m.email === user.email)) {
      show({
        type: "warning",
        title: "Thông báo",
        message: "Người dùng này đã là thành viên của câu lạc bộ.",
      });
      return;
    }
    setSelectedUsers((prev) => [...prev, user]);
  };

  const handleRemoveFromList = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId));
  };

  const handleSubmit = async () => {
    if (!clubId) return;

    let finalEmails: string[] = [];

    if (activeTab === "search") {
      finalEmails = selectedUsers.map((u) => u.email);
    } else {
      finalEmails = bulkEmails
        .split(/[\n,;]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes("@"));
    }

    if (finalEmails.length === 0) {
      show({
        type: "warning",
        title: "Thông báo",
        message: "Vui lòng chọn hoặc nhập ít nhất một email hợp lệ.",
      });
      return;
    }

    try {
      await addMembers({ clubId, emails: finalEmails }).unwrap();
      show({
        type: "success",
        title: "Thành công!",
        message: `Đã thêm ${finalEmails.length} thành viên vào câu lạc bộ.`,
      });
      setSelectedUsers([]);
      setBulkEmails("");
      setTimeout(() => navigate("/club/members"), 1500);
    } catch (err: any) {
      show({
        type: "error",
        title: "Thất bại",
        message:
          err?.data?.message ?? "Không thể thêm thành viên. Vui lòng thử lại.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gray-950 font-sans">
      <Sidebar
        currentPath="/club/members/add"
        isOpen={isOpen}
        onClose={toggle}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <HeaderBar
          onToggleSidebar={toggle}
          isSidebarOpen={isOpen}
          title="Thêm thành viên"
          breadcrumb="Members / Add"
        />

        <main
          className={`flex-1 p-4 md:p-8 pt-24 transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}
        >
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mt-20 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  Thêm thành viên mới
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Tìm kiếm và quản lý danh sách thành viên trước khi thêm
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-white dark:bg-gray-900 p-1 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "search" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  <i className="fas fa-search mr-2" /> Tìm kiếm
                </button>
                <button
                  onClick={() => setActiveTab("bulk")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "bulk" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  <i className="fas fa-paste mr-2" /> Thêm nhanh (Bulk)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT PANEL: Search/Input */}
              <div className="lg:col-span-7 space-y-6">
                {activeTab === "search" ? (
                  <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-gray-800">
                    <div className="relative mb-8">
                      <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo email hoặc tên..."
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all"
                      />
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {isSearching ? (
                        <div className="py-10 text-center">
                          <i className="fas fa-spinner fa-spin text-blue-500 text-2xl" />
                        </div>
                      ) : !searchQuery.trim() ? (
                        <div className="py-20 text-center text-gray-400">
                          <i className="fas fa-mouse-pointer text-4xl mb-4 opacity-20 block" />
                          <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
                        </div>
                      ) : searchResults?.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                          <i className="fas fa-user-slash text-4xl mb-4 opacity-20 block" />
                          <p>Không tìm thấy người dùng nào phù hợp</p>
                        </div>
                      ) : (
                        searchResults?.map((user: User) => (
                          <div
                            key={user.userId}
                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 bg-slate-50/30 dark:bg-gray-800/20 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                                    {getInitials(user.fullName)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                  {user.fullName}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddUserToList(user)}
                              disabled={selectedUsers.some(
                                (u) => u.userId === user.userId,
                              )}
                              className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white shadow-sm transition-all disabled:opacity-30"
                            >
                              <i className="fas fa-plus" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-gray-800">
                    <label className="block font-bold text-gray-900 dark:text-white mb-4">
                      Dán danh sách email
                    </label>
                    <textarea
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      className="w-full h-[400px] p-5 bg-slate-50 dark:bg-gray-800 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all font-mono text-sm resize-none"
                      placeholder="email1@gmail.com&#10;email2@gmail.com, email3@gmail.com"
                    />
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
                      <i className="fas fa-lightbulb text-amber-500" />
                      <p className="text-xs text-amber-800 dark:text-amber-400">
                        Các email sẽ được hệ thống lọc và kiểm tra tồn tại sau
                        khi bấm nút thêm.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Selected / Summary */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">
                      Danh sách chờ
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                      {activeTab === "search"
                        ? selectedUsers.length
                        : "Bulk Mode"}
                    </span>
                  </div>

                  {activeTab === "search" ? (
                    <>
                      <div className="space-y-3 min-h-[100px] max-h-[350px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                        {selectedUsers.length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-gray-800 rounded-3xl">
                            <p className="text-xs text-gray-400">
                              Chưa có ai trong danh sách
                            </p>
                          </div>
                        ) : (
                          selectedUsers.map((user) => (
                            <div
                              key={user.userId}
                              className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-gray-800/30 rounded-2xl animate-in fade-in slide-in-from-right-2"
                            >
                              <div className="flex items-center gap-3">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                    {getInitials(user.fullName)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate w-32">
                                    {user.fullName}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveFromList(user.userId)
                                }
                                className="w-8 h-8 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <i className="fas fa-times-circle" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mb-8 p-6 text-center border-2 border-dashed border-slate-100 dark:border-gray-800 rounded-3xl">
                      <i className="fas fa-bolt text-3xl text-blue-500/20 mb-3 block" />
                      <p className="text-xs text-gray-400">
                        Bạn đang sử dụng chế độ thêm nhanh hàng loạt qua email.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      (activeTab === "search" && selectedUsers.length === 0) ||
                      (activeTab === "bulk" && !bulkEmails.trim())
                    }
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <>
                        <i className="fas fa-check-circle" />
                        Xác nhận thêm vào CLB
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-gray-400 mt-4 px-4 uppercase tracking-widest font-bold">
                    Hệ thống sẽ gửi thông báo đến người dùng sau khi thêm thành
                    công
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `,
        }}
      />
    </div>
  );
}
