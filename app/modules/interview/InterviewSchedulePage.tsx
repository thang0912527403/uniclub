import React, { useState, useMemo, useCallback, useRef } from 'react';
import { message, Modal, Input } from 'antd';
import { useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { SettingButton } from '~/components/SettingButton';
import {
  useGetRecruitmentCampaignsQuery,
  useGetRecruitmentCampaignsByClubIdQuery,
  useGetInterviewsQuery,
  useGetApplicationsByCampaignQuery,
  useCreateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useAssignInterviewersMutation,
  useRemoveAssignmentMutation,
  useGetInterviewByIdQuery,
  useCloseRoomMutation,
} from '~/cores/api';
import type { InterviewScheduleResponse, ApplicationResponseDto } from '~/cores/api';
import { useAuth } from '~/components/AuthProvider';

import StatusPipelineTabs from './components/StatusPipelineTabs';
import type { PipelineTab } from './components/StatusPipelineTabs';
import InterviewFilterBar from './components/InterviewFilterBar';
import InterviewTable from './components/InterviewTable';
import InterviewDetailDrawer from './components/InterviewDetailDrawer';
import BulkActionBar from './components/BulkActionBar';
import CreateInterviewModal from './components/CreateInterviewModal';

const InterviewSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  // ─── Campaign selector ──────────────────────────────────────
  const { user: authUser, isAdmin, clubManagerMembership, clubRoles } = useAuth();
  const clubId = clubManagerMembership?.clubId ?? 0;

  const { data: adminCampaigns, isLoading: adminLoading } = useGetRecruitmentCampaignsQuery(undefined, {
    skip: !isAdmin
  });

  const { data: clubCampaigns, isLoading: clubLoading } = useGetRecruitmentCampaignsByClubIdQuery(clubId, {
    skip: isAdmin || clubId === 0
  });

  const campaigns = (isAdmin ? adminCampaigns : clubCampaigns) || [];
  const campaignsLoading = isAdmin ? adminLoading : clubLoading;

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const activeCampaignId = selectedCampaignId || campaigns[0]?.campaignId;

  // ─── Current user ────────────────────────────────────────────
  const currentUserId = authUser?.userId ?? '';

  // ─── Data fetching ───────────────────────────────────────────
  const { data: allInterviews = [], isLoading: interviewsLoading } = useGetInterviewsQuery(
    { campaignId: activeCampaignId },
    { skip: !activeCampaignId }
  );
  const { data: reviewedApps = [], isLoading: appsLoading } = useGetApplicationsByCampaignQuery(
    { campaignId: activeCampaignId!, status: 'SUCCESS' },
    { skip: !activeCampaignId }
  );

  // ─── Mutations ───────────────────────────────────────────────
  const [createInterview] = useCreateInterviewMutation();
  const [updateStatus] = useUpdateInterviewStatusMutation();
  const [assignInterviewers] = useAssignInterviewersMutation();
  const [removeAssignment] = useRemoveAssignmentMutation();
  const [closeRoom] = useCloseRoomMutation();

  // ─── UI State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('Reviewed');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('scheduledAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ─── Drawer state ────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const { data: selectedInterview } = useGetInterviewByIdQuery(selectedInterviewId!, { skip: !selectedInterviewId });

  // ─── Create modal ────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponseDto | null>(null);
  const [bulkApplications, setBulkApplications] = useState<ApplicationResponseDto[]>([]);

  // ─── Filter applications not yet interviewed ────────────────
  const interviewedAppIds = useMemo(() => new Set(allInterviews.map(iv => iv.applicationId)), [allInterviews]);
  const uninterviewedApps = useMemo(
    () => reviewedApps.filter(app => !interviewedAppIds.has(app.applicationId)),
    [reviewedApps, interviewedAppIds]
  );

  // ─── Compute counts by status ───────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Reviewed: uninterviewedApps.length,
      Scheduled: 0,
      Confirmed: 0,
      InProgress: 0,
      Completed: 0,
      PendingFeedback: 0,
    };
    allInterviews.forEach(iv => {
      if (counts[iv.status] !== undefined) counts[iv.status]++;
      // Count pending feedback: Completed but not all feedbacks submitted
      if (iv.status === 'Completed') {
        const total = iv.assignments?.length || 0;
        const done = iv.assignments?.filter(a => a.feedbackSubmittedAt).length || 0;
        if (total > 0 && done < total) counts.PendingFeedback++;
      }
    });
    return counts;
  }, [allInterviews, uninterviewedApps]);

  // ─── Pipeline tabs config ───────────────────────────────────
  const pipelineTabs: PipelineTab[] = useMemo(() => [
    {
      key: 'Reviewed', label: 'Đã duyệt', count: statusCounts.Reviewed,
      color: '#eab308',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      key: 'Scheduled', label: 'Đã lên lịch', count: statusCounts.Scheduled,
      color: '#3b82f6',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      key: 'Confirmed', label: 'Đã xác nhận', count: statusCounts.Confirmed,
      color: '#10b981',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    },
    {
      key: 'InProgress', label: 'Đang PV', count: statusCounts.InProgress,
      color: '#f97316',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    },
    {
      key: 'Completed', label: 'Hoàn thành', count: statusCounts.Completed,
      color: '#22c55e',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    },
    {
      key: 'PendingFeedback', label: 'Chờ đánh giá', count: statusCounts.PendingFeedback,
      color: '#f59e0b',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
  ], [statusCounts]);

  // ─── Filter & sort interviews ───────────────────────────────
  const filteredInterviews = useMemo(() => {
    let items: InterviewScheduleResponse[];

    if (activeTab === 'PendingFeedback') {
      // Show completed interviews with pending feedback
      items = allInterviews.filter(iv => {
        if (iv.status !== 'Completed') return false;
        const total = iv.assignments?.length || 0;
        const done = iv.assignments?.filter(a => a.feedbackSubmittedAt).length || 0;
        return total > 0 && done < total;
      });
    } else {
      items = allInterviews.filter(iv => iv.status === activeTab);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(iv =>
        iv.title.toLowerCase().includes(q) ||
        iv.candidateUserId.toLowerCase().includes(q) ||
        (iv.description?.toLowerCase().includes(q))
      );
    }

    // Date range
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      items = items.filter(iv => new Date(iv.scheduledAt).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime() + 86400000; // end of day
      items = items.filter(iv => new Date(iv.scheduledAt).getTime() <= to);
    }

    // Sort
    const [field, direction] = sortBy.split('_');
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (field === 'scheduledAt') {
        cmp = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      } else if (field === 'title') {
        cmp = a.title.localeCompare(b.title);
      }
      return direction === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [allInterviews, activeTab, searchQuery, fromDate, toDate, sortBy]);

  // ─── Filter applications ────────────────────────────────────
  const filteredApplications = useMemo(() => {
    if (activeTab !== 'Reviewed') return [];
    let apps = uninterviewedApps;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(a => a.userId.toLowerCase().includes(q));
    }
    return apps;
  }, [uninterviewedApps, activeTab, searchQuery]);

  // ─── Pagination ──────────────────────────────────────────────
  const totalItems = activeTab === 'Reviewed' ? filteredApplications.length : filteredInterviews.length;
  const paginatedInterviews = useMemo(
    () => filteredInterviews.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredInterviews, currentPage, pageSize]
  );
  const paginatedApplications = useMemo(
    () => filteredApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredApplications, currentPage, pageSize]
  );

  // Reset page when filters change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  // ─── Selection ───────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (activeTab === 'Reviewed') {
      const allIds = paginatedApplications.map(a => a.applicationId);
      setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
    } else {
      const allIds = paginatedInterviews.map(iv => iv.id);
      setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
    }
  };

  // ─── Handlers ────────────────────────────────────────────────
  const handleRowClick = (iv: InterviewScheduleResponse) => {
    setSelectedInterviewId(iv.id);
    setDrawerOpen(true);
  };

  const handleApplicationClick = (app: ApplicationResponseDto) => {
    setSelectedApplication(app);
    setBulkApplications([]);
    setCreateModalOpen(true);
  };

  const handleCreateInterview = async (dto: any) => {
    try {
      await createInterview(dto).unwrap();
    } catch (err) {
      console.error('Failed to create interview:', err);
      throw err; // Re-throw so the modal can handle the error count
    }
  };

  const cancelReasonRef = useRef('');

  const handleUpdateStatus = async (id: number, status: string) => {
    if (status === 'Cancelled') {
      cancelReasonRef.current = '';
      Modal.confirm({
        title: 'Hủy lịch phỏng vấn',
        content: (
          <div>
            <p className="mb-2">Vui lòng nhập lý do hủy:</p>
            <Input.TextArea
              rows={3}
              placeholder="Lý do hủy..."
              onChange={(e) => { cancelReasonRef.current = e.target.value; }}
            />
          </div>
        ),
        okText: 'Xác nhận hủy',
        okType: 'danger',
        cancelText: 'Quay lại',
        async onOk() {
          if (!cancelReasonRef.current.trim()) {
            message.warning('Vui lòng nhập lý do hủy');
            throw new Error('cancel'); // keep modal open
          }
          try {
            await updateStatus({ id, dto: { status: 'Cancelled', cancelReason: cancelReasonRef.current.trim() } }).unwrap();
            message.success('Đã hủy lịch phỏng vấn');
            setDrawerOpen(false);
          } catch (err) {
            message.error('Hủy lịch thất bại');
          }
        },
      });
      return;
    }
    try {
      await updateStatus({ id, dto: { status } }).unwrap();
      message.success(`Đã cập nhật trạng thái: ${status}`);
      if (status === 'Completed') {
        const interview = allInterviews.find(iv => iv.id === id);
        if (interview?.meetingRoom?.roomCode) {
          try { await closeRoom(interview.meetingRoom.roomCode).unwrap(); } catch {}
        }
      }
      setDrawerOpen(false);
    } catch (err) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleAssignInterviewer = async (scheduleId: number, userId: string, role: string) => {
    try {
      await assignInterviewers({ scheduleId, dto: { interviewers: [{ interviewerUserId: userId, role }] } }).unwrap();
      message.success('Đã thêm người phỏng vấn');
    } catch (err) {
      message.error('Thêm người phỏng vấn thất bại');
    }
  };

  const handleRemoveAssignment = async (scheduleId: number, assignmentId: number) => {
    try {
      await removeAssignment({ scheduleId, assignmentId }).unwrap();
      message.success('Đã xóa người phỏng vấn');
    } catch (err) {
      message.error('Xóa người phỏng vấn thất bại');
    }
  };

  // ─── Bulk actions ────────────────────────────────────────────
  const handleBulkCreateSchedule = () => {
    // Open the CreateInterviewModal in bulk mode with selected applications
    const apps = reviewedApps.filter(a => selectedIds.has(a.applicationId));
    if (apps.length === 0) return;
    setBulkApplications(apps);
    setSelectedApplication(null);
    setCreateModalOpen(true);
  };

  const handleBulkConfirm = async () => {
    let ok = 0;
    for (const id of selectedIds) {
      try {
        await updateStatus({ id, dto: { status: 'Confirmed' } }).unwrap();
        ok++;
      } catch {}
    }
    if (ok > 0) message.success(`Đã xác nhận ${ok} lịch phỏng vấn`);
    setSelectedIds(new Set());
  };

  const bulkCancelReasonRef = useRef('');
  const bulkAssignUserIdRef = useRef('');
  const bulkAssignRoleRef = useRef('Interviewer');

  const handleBulkCancel = () => {
    bulkCancelReasonRef.current = '';
    Modal.confirm({
      title: 'Hủy lịch hàng loạt',
      content: (
        <div>
          <p className="mb-2">Nhập lý do hủy cho tất cả ({selectedIds.size} lịch):</p>
          <Input.TextArea
            rows={3}
            placeholder="Lý do hủy..."
            onChange={(e) => { bulkCancelReasonRef.current = e.target.value; }}
          />
        </div>
      ),
      okText: 'Xác nhận hủy tất cả',
      okType: 'danger',
      cancelText: 'Quay lại',
      async onOk() {
        if (!bulkCancelReasonRef.current.trim()) {
          message.warning('Vui lòng nhập lý do hủy');
          throw new Error('cancel');
        }
        let ok = 0;
        for (const id of selectedIds) {
          try {
            await updateStatus({ id, dto: { status: 'Cancelled', cancelReason: bulkCancelReasonRef.current.trim() } }).unwrap();
            ok++;
          } catch {}
        }
        if (ok > 0) message.success(`Đã hủy ${ok} lịch phỏng vấn`);
        setSelectedIds(new Set());
      },
    });
  };

  const handleBulkAssignInterviewers = () => {
    bulkAssignUserIdRef.current = '';
    bulkAssignRoleRef.current = 'Interviewer';
    Modal.confirm({
      title: 'Phân interviewer hàng loạt',
      width: 480,
      content: (
        <div className="space-y-3 pt-1">
          <p className="text-sm text-gray-600">
            Phân người phỏng vấn cho <strong>{selectedIds.size}</strong> lịch đang chọn.
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">User ID người phỏng vấn</label>
            <Input
              placeholder="Nhập User ID..."
              onChange={(e) => { bulkAssignUserIdRef.current = e.target.value; }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Vai trò</label>
            <select
              defaultValue={clubRoles[0]?.roleName || 'Interviewer'}
              onChange={(e) => { bulkAssignRoleRef.current = e.target.value; }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-orange-400 outline-none"
            >
              {clubRoles.length > 0
                ? clubRoles.map((r) => <option key={r.clubRoleId} value={r.roleName}>{r.roleName}</option>)
                : <option value="Interviewer">Interviewer</option>
              }
            </select>
          </div>
        </div>
      ),
      okText: 'Phân công',
      okButtonProps: { style: { background: '#a855f7', borderColor: '#a855f7' } },
      cancelText: 'Huỷ',
      async onOk() {
        const uid = bulkAssignUserIdRef.current.trim();
        if (!uid) {
          message.warning('Vui lòng nhập User ID');
          throw new Error('cancel');
        }
        let ok = 0;
        for (const id of selectedIds) {
          try {
            await assignInterviewers({
              scheduleId: id,
              dto: { interviewers: [{ interviewerUserId: uid, role: bulkAssignRoleRef.current }] },
            }).unwrap();
            ok++;
          } catch {}
        }
        if (ok > 0) message.success(`Đã phân công interviewer cho ${ok} lịch`);
        else message.error('Phân công thất bại');
        setSelectedIds(new Set());
      },
    });
  };

  const handleBulkStartInterview = async () => {
    Modal.confirm({
      title: 'Bắt đầu phỏng vấn hàng loạt',
      content: `Bạn chắc chắn muốn bắt đầu ${selectedIds.size} buổi phỏng vấn?`,
      okText: 'Bắt đầu',
      okButtonProps: { style: { background: '#3b82f6', borderColor: '#3b82f6' } },
      cancelText: 'Huỷ',
      async onOk() {
        let ok = 0;
        for (const id of selectedIds) {
          try {
            await updateStatus({ id, dto: { status: 'InProgress' } }).unwrap();
            ok++;
          } catch {}
        }
        if (ok > 0) message.success(`Đã bắt đầu ${ok} buổi phỏng vấn`);
        setSelectedIds(new Set());
      },
    });
  };

  const handleBulkComplete = async () => {
    Modal.confirm({
      title: 'Hoàn thành phỏng vấn hàng loạt',
      content: `Xác nhận hoàn thành ${selectedIds.size} buổi phỏng vấn?`,
      okText: 'Hoàn thành',
      okButtonProps: { style: { background: '#22c55e', borderColor: '#22c55e' } },
      cancelText: 'Huỷ',
      async onOk() {
        let ok = 0;
        for (const id of selectedIds) {
          try {
            await updateStatus({ id, dto: { status: 'Completed' } }).unwrap();
            // Also close the room if exists
            const interview = allInterviews.find(iv => iv.id === id);
            if (interview?.meetingRoom?.roomCode) {
              try { await closeRoom(interview.meetingRoom.roomCode).unwrap(); } catch {}
            }
            ok++;
          } catch {}
        }
        if (ok > 0) message.success(`Đã hoàn thành ${ok} buổi phỏng vấn`);
        setSelectedIds(new Set());
      },
    });
  };

  const isLoading = interviewsLoading || appsLoading;

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/interview/schedule" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Lịch phỏng vấn"
        breadcrumb="Interview / Schedule"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-clipboard-list text-orange-500" /> Quản lý phỏng vấn
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Quản lý toàn bộ quy trình phỏng vấn ứng viên
              </p>
            </div>

            {/* Campaign selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Chiến dịch:
              </label>
              {campaignsLoading ? (
                <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={activeCampaignId || ''}
                  onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all min-w-[200px]"
                >
                  {campaigns.map((c) => (
                    <option key={c.campaignId} value={c.campaignId}>
                      {c.campaignName || `Campaign #${c.campaignId}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {activeCampaignId ? (
          <div className="space-y-4">
            {/* Pipeline Tabs */}
            <StatusPipelineTabs
              tabs={pipelineTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {/* Filter Bar */}
            <InterviewFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onCreateClick={() => setCreateModalOpen(true)}
              showCreateButton={activeTab === 'Reviewed'}
            />

            {/* Data Table */}
            <InterviewTable
              interviews={paginatedInterviews}
              applications={paginatedApplications}
              activeTab={activeTab}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onRowClick={handleRowClick}
              onApplicationClick={handleApplicationClick}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">Chưa có chiến dịch tuyển dụng</p>
            <p className="text-sm mt-1">Vui lòng tạo chiến dịch tuyển dụng trước.</p>
          </div>
        )}
      </main>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        activeTab={activeTab}
        onConfirmAll={handleBulkConfirm}
        onCancelAll={handleBulkCancel}
        onBulkCreateSchedule={handleBulkCreateSchedule}
        onBulkAssignInterviewers={handleBulkAssignInterviewers}
        onBulkStartInterview={handleBulkStartInterview}
        onBulkComplete={handleBulkComplete}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Detail Drawer */}
      <InterviewDetailDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedInterviewId(null); }}
        interview={selectedInterview || null}
        currentUserId={currentUserId}
        clubRoles={clubRoles}
        onUpdateStatus={handleUpdateStatus}
        onAssignInterviewer={handleAssignInterviewer}
        onRemoveAssignment={handleRemoveAssignment}
        onNavigateToRoom={(roomCode) => navigate(`/interview/room/${roomCode}`)}
      />

      {/* Create Interview Modal */}
      <CreateInterviewModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedApplication(null);
          setBulkApplications([]);
          setSelectedIds(new Set());
        }}
        application={selectedApplication}
        applications={bulkApplications}
        campaignId={activeCampaignId || 0}
        currentUserId={currentUserId}
        onSubmit={handleCreateInterview}
      />

      {/* Custom styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      <SettingButton />
    </div>
  );
};

export default InterviewSchedulePage;
