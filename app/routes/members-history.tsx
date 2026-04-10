import React, { useState, useMemo } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import { useGetClubMembersQuery } from '~/cores/api/clubApi';

export default function MembersHistoryPage() {
  const { isOpen, toggle } = useSidebarToggle();
  const { clubManagerMembership } = useClubRole();
  const clubId = clubManagerMembership?.clubId;

  // Gọi API lấy toàn bộ thành viên của CLB, bỏ qua nếu chưa có clubId
  const { data: members = [], isLoading } = useGetClubMembersQuery(clubId || 0, {
    skip: !clubId,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Lọc và Sắp xếp
  const processedMembers = useMemo(() => {
    let result = [...members];

    // Lọc theo chữ
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.studentId && m.studentId.toLowerCase().includes(q))
      );
    }

    // Lọc theo trạng thái
    if (statusFilter !== 'ALL') {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Sắp xếp theo ngày tham gia
    result.sort((a, b) => {
      const dateA = new Date(a.joinDate).getTime();
      const dateB = new Date(b.joinDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [members, search, statusFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <SettingButton />
      <Sidebar currentPath="/members/history" isOpen={isOpen} onClose={toggle} />
      <HeaderBar
        title="Lịch sử tham gia của thành viên"
        breadcrumb="Quản lý Thành viên / Lịch sử tham gia"
        isSidebarOpen={isOpen}
        onToggleSidebar={toggle}
      />

      <main className={`pt-24 p-6 transition-all duration-300 min-h-screen ${isOpen ? 'md:ml-64' : 'ml-0'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header Area */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-blue-500" />
                Lịch sử tham gia
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Theo dõi quá trình gia nhập và thông tin của tổng số {members.length} thành viên
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm tên, email, mssv..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-gray-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Không hoạt động (INACTIVE)</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 text-sm border border-blue-100 dark:border-blue-900/50"
                title="Sắp xếp theo ngày tham gia"
              >
                <i className={`fa-solid fa-sort-${sortOrder === 'desc' ? 'amount-down' : 'amount-up'}`} />
                {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider">
                  <th className="p-4 pl-6">Thành viên</th>
                  <th className="p-4">Thông tin liên lạc</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 pr-6 rounded-tr-lg">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4 pl-6"><div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div></td>
                      <td className="p-4"><div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div></td>
                      <td className="p-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                      <td className="p-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                      <td className="p-4 pr-6"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div></td>
                    </tr>
                  ))
                ) : processedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <i className="fa-solid fa-inbox text-4xl mb-3 opacity-30" />
                        <p>Không tìm thấy thành viên nào phù hợp.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedMembers.map((member) => (
                    <tr key={member.userId} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random`} 
                            alt={member.fullName} 
                            className="w-10 h-10 rounded-full shadow-sm object-cover border border-gray-200 dark:border-gray-600"
                          />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{member.fullName}</p>
                            {member.departments && member.departments.length > 0 && (
                              <p className="text-xs text-gray-500 max-w-[200px] truncate">
                                Ban: {member.departments.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{member.email}</p>
                        {member.studentId && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            MSSV: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">{member.studentId}</span>
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                          {member.roleName || 'Member'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${member.status?.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.status?.toUpperCase() === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {member.status?.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : member.status || 'Chưa rõ'}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fa-solid fa-calendar-check" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                              {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(member.joinDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Area */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Hiển thị {processedMembers.length} thành viên</span>
            {search && <span>(Đang lọc từ tổng số {members.length})</span>}
          </div>
        </div>
      </main>
    </div>
  );
}
