import React, { useState, useMemo } from 'react';
import { message } from 'antd';
import type { InterviewScheduleResponse } from '~/cores/api';
import { useGetUserByIdQuery, useConfirmAssignmentMutation } from '~/cores/api';
import FeedbackForm from './FeedbackForm';
import type { ProposedSlots } from './CreateInterviewModal';

interface InterviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewScheduleResponse | null;
  currentUserId: string;
  onUpdateStatus?: (id: number, status: string) => void;
  onAssignInterviewer?: (scheduleId: number, userId: string, role: string) => void;
  onRemoveAssignment?: (scheduleId: number, assignmentId: number) => void;
  onNavigateToRoom?: (roomCode: string) => void;
}

const roleOptions = [
  { value: 'Interviewer', label: 'Interviewer', icon: 'fa-solid fa-microphone', color: 'text-orange-500' },
  { value: 'Lead', label: 'Lead', icon: 'fa-solid fa-crown', color: 'text-yellow-500' },
  { value: 'Observer', label: 'Observer', icon: 'fa-regular fa-eye', color: 'text-blue-500' },
  { value: 'HRRepresentative', label: 'HR', icon: 'fa-solid fa-clipboard-user', color: 'text-green-500' },
];

const statusActions: Record<string, { label: string; nextStatus: string; color: string; icon: string }[]> = {
  Scheduled: [
    { label: 'Xác nhận', nextStatus: 'Confirmed', color: 'bg-emerald-500 hover:bg-emerald-600', icon: 'fa-solid fa-check' },
    { label: 'Hủy', nextStatus: 'Cancelled', color: 'bg-red-500 hover:bg-red-600', icon: 'fa-solid fa-xmark' },
  ],
  Confirmed: [
    { label: 'Bắt đầu PV', nextStatus: 'InProgress', color: 'bg-blue-500 hover:bg-blue-600', icon: 'fa-solid fa-play' },
    { label: 'Dời lịch', nextStatus: 'Rescheduled', color: 'bg-purple-500 hover:bg-purple-600', icon: 'fa-solid fa-calendar-days' },
    { label: 'Hủy', nextStatus: 'Cancelled', color: 'bg-red-500 hover:bg-red-600', icon: 'fa-solid fa-xmark' },
  ],
  InProgress: [
    { label: 'Hoàn thành', nextStatus: 'Completed', color: 'bg-green-500 hover:bg-green-600', icon: 'fa-solid fa-flag-checkered' },
  ],
};

// ─── User Display ────────────────────────────────────────────────
const UserDisplay: React.FC<{ userId: string; showId?: boolean }> = ({ userId, showId = false }) => {
  const { data: user, isFetching } = useGetUserByIdQuery(userId, { skip: !userId });
  if (isFetching) return <span className="text-gray-400 text-xs animate-pulse">Đang tải...</span>;
  return (
    <span>
      {user?.fullName || <span className="font-mono text-xs">{userId.slice(0, 12)}...</span>}
      {showId && user?.fullName && <span className="text-gray-400 text-xs ml-1">({userId.slice(0, 8)})</span>}
    </span>
  );
};

const InterviewDetailDrawer: React.FC<InterviewDetailDrawerProps> = ({
  isOpen,
  onClose,
  interview,
  currentUserId,
  onUpdateStatus,
  onAssignInterviewer,
  onRemoveAssignment,
  onNavigateToRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'assignments' | 'feedback'>('info');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('Interviewer');
  const [feedbackForAssignment, setFeedbackForAssignment] = useState<number | null>(null);

  const [confirmAssignment] = useConfirmAssignmentMutation();

  const { data: candidateInfo } = useGetUserByIdQuery(interview?.candidateUserId ?? '', { skip: !interview?.candidateUserId });
  const { data: creatorInfo } = useGetUserByIdQuery(interview?.createdByUserId ?? '', { skip: !interview?.createdByUserId });

  // ─── Parse proposed time slots from description ───────────────
  const proposedSlots = useMemo(() => {
    if (!interview?.description) return null;
    const match = interview.description.match(/<!--PROPOSED_SLOTS:(.*?)-->/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as ProposedSlots;
    } catch {
      return null;
    }
  }, [interview?.description]);

  // Clean description (strip the JSON metadata)
  const cleanDescription = useMemo(() => {
    if (!interview?.description) return '';
    return interview.description.replace(/\n*<!--PROPOSED_SLOTS:.*?-->/, '').trim();
  }, [interview?.description]);

  if (!interview) return null;

  const isReadOnly = ['Completed', 'Cancelled'].includes(interview.status);
  const actions = statusActions[interview.status] || [];
  const hasRoom = !!interview.meetingRoom;

  // Check if current user is an assigned interviewer
  const myAssignment = interview.assignments?.find(a => a.interviewerUserId === currentUserId);
  const canConfirmSchedule = myAssignment && !myAssignment.hasConfirmed && !isReadOnly;

  const handleConfirmSchedule = async () => {
    if (!myAssignment) return;
    try {
      await confirmAssignment({ scheduleId: interview.id, assignmentId: myAssignment.id }).unwrap();
      message.success('Đã xác nhận tham gia');
    } catch (err) {
      message.error('Xác nhận thất bại');
    }
  };



  const feedbackDone = interview.assignments?.filter(a => a.feedbackSubmittedAt).length || 0;
  const feedbackTotal = interview.assignments?.length || 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-bold text-white line-clamp-2">{interview.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {interview.status}
                  </span>
                  <span className="text-orange-100 text-sm">
                    {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                {/* Interviewer confirm banner */}
                {canConfirmSchedule && (
                  <button
                    onClick={handleConfirmSchedule}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all w-full justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Xác nhận tham gia buổi phỏng vấn này
                  </button>
                )}
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 px-6 flex-shrink-0">
            {[
              { key: 'info' as const, label: 'Thông tin', icon: 'fa-regular fa-file-lines' },
              { key: 'assignments' as const, label: `PV viên (${interview.assignments?.length || 0})`, icon: 'fa-solid fa-users' },
              {
                key: 'feedback' as const,
                label: `Đánh giá`,
                icon: 'fa-solid fa-star',
                badge: feedbackTotal > 0 ? `${feedbackDone}/${feedbackTotal}` : undefined,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <i className={tab.icon} />
                {tab.label}
                {'badge' in tab && tab.badge && (
                  <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    feedbackDone === feedbackTotal && feedbackTotal > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ──── INFO TAB ──── */}
            {activeTab === 'info' && (
              <div className="space-y-5">
                {cleanDescription && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mô tả</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">{cleanDescription}</p>
                  </div>
                )}

                {/* Candidate Confirmed Banner */}
                {interview.status === 'Confirmed' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-check text-white text-xs" />
                      </div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Candidate đã xác nhận lịch</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 ml-9">
                      <i className="fa-regular fa-calendar text-xs" />
                      {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}

                {/* Proposed Time Slots — READ-ONLY for admin/interviewer */}
                {proposedSlots && proposedSlots.proposedTimeSlots.length > 0 && interview.status === 'Scheduled' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <i className="fa-regular fa-calendar text-orange-500" />
                      Khung giờ đề xuất ({proposedSlots.proposedTimeSlots.length})
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                      Candidate sẽ chọn một trong các khung giờ dưới đây.
                    </p>
                    <div className="space-y-2">
                      {proposedSlots.proposedTimeSlots.map((slot, idx) => {
                        const slotDate = new Date(`${slot.date}T${slot.time}`);
                        const isCurrentSlot = new Date(interview.scheduledAt).getTime() === slotDate.getTime();
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              isCurrentSlot
                                ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              isCurrentSlot
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                              {isCurrentSlot ? <i className="fa-solid fa-check text-xs" /> : idx + 1}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                isCurrentSlot ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-200'
                              }`}>
                                {slotDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                              <p className={`text-xs flex items-center gap-1 ${
                                isCurrentSlot ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <i className="fa-regular fa-clock" />
                                {slot.time}
                                {isCurrentSlot && <span className="ml-1 font-semibold">(Đang được chọn)</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Thời lượng" value={`${interview.durationMinutes} phút`} />
                  <InfoCard label="Application" value={`#${interview.applicationId}`} />
                  <InfoCard label="Ứng viên" value={candidateInfo?.fullName || interview.candidateUserId.slice(0, 12) + '...'} />
                  <InfoCard label="Tạo bởi" value={creatorInfo?.fullName || interview.createdByUserId.slice(0, 12) + '...'} />
                </div>

                {/* Meeting Room */}
                {hasRoom && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Phòng họp</p>
                        <p className="text-lg font-mono font-bold text-green-800 dark:text-green-300">{interview.meetingRoom!.roomCode}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {isReadOnly ? 'Đã đóng' : interview.meetingRoom!.status} • Max {interview.meetingRoom!.maxParticipants} người
                        </p>
                      </div>
                      {!isReadOnly ? (
                        <button
                          onClick={() => onNavigateToRoom?.(interview.meetingRoom!.roomCode)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-md"
                        >
                          Vào phòng
                        </button>
                      ) : (
                        <span className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-xl text-sm font-medium cursor-not-allowed">
                          Đã đóng
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                {actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Thao tác</h4>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.nextStatus}
                          onClick={() => onUpdateStatus?.(interview.id, action.nextStatus)}
                          className={`flex items-center gap-1.5 px-4 py-2 ${action.color} text-white rounded-xl text-sm font-medium transition-all hover:shadow-md`}
                        >
                          <i className={action.icon} />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──── ASSIGNMENTS TAB ──── */}
            {activeTab === 'assignments' && (
              <div className="space-y-4">
                {/* Add interviewer */}
                {!isReadOnly && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Thêm người phỏng vấn</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUserId}
                        onChange={(e) => setNewUserId(e.target.value)}
                        placeholder="User ID"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                      />
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-400 outline-none"
                      >
                        {roleOptions.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (newUserId.trim()) {
                            onAssignInterviewer?.(interview.id, newUserId.trim(), newRole);
                            setNewUserId('');
                          }
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                )}

                {/* Assignment list */}
                {interview.assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fa-solid fa-users text-3xl mb-3 block" />
                    <p className="text-sm">Chưa có người phỏng vấn nào.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interview.assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            a.hasConfirmed
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {a.interviewerUserId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              <UserDisplay userId={a.interviewerUserId} />
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <i className={`${roleOptions.find(r => r.value === a.role)?.icon} ${roleOptions.find(r => r.value === a.role)?.color}`} />
                                {a.role}
                              </span>
                              {a.hasConfirmed ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <i className="fa-solid fa-check-circle" /> Đã xác nhận
                                </span>
                              ) : (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                  <i className="fa-solid fa-clock" /> Chờ xác nhận
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* If this is the current user and hasn't confirmed, show confirm button */}
                          {a.interviewerUserId === currentUserId && !a.hasConfirmed && !isReadOnly && (
                            <button
                              onClick={() => confirmAssignment({ scheduleId: interview.id, assignmentId: a.id })}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-all mr-1"
                              title="Xác nhận lịch"
                            >
                              Xác nhận
                            </button>
                          )}
                          {!isReadOnly && (
                            <button
                              onClick={() => onRemoveAssignment?.(interview.id, a.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Confirmation progress */}
                    {!isReadOnly && interview.assignments.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 dark:text-blue-400 font-medium">Tiến độ xác nhận lịch</span>
                          <span className="text-blue-600 dark:text-blue-300 font-bold">
                            {interview.assignments.filter(a => a.hasConfirmed).length}/{interview.assignments.length}
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${(interview.assignments.filter(a => a.hasConfirmed).length / interview.assignments.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ──── FEEDBACK TAB ──── */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                {/* Pending feedback banner */}
                {interview.status === 'Completed' && feedbackDone < feedbackTotal && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                      <i className="fa-solid fa-bell" />
                      Còn {feedbackTotal - feedbackDone} người chưa đánh giá
                    </p>
                  </div>
                )}

                {interview.assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fa-solid fa-star text-3xl mb-3 block" />
                    <p className="text-sm">Chưa có đánh giá nào.</p>
                  </div>
                ) : (
                  interview.assignments.map((a) => (
                    <div key={a.id} className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            a.feedbackSubmittedAt
                              ? 'bg-gradient-to-br from-green-400 to-green-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {a.interviewerUserId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              <UserDisplay userId={a.interviewerUserId} />
                              <span className="text-gray-400 font-normal ml-1">({a.role})</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {a.feedbackSubmittedAt
                                ? `Đã đánh giá: ${new Date(a.feedbackSubmittedAt).toLocaleString('vi-VN')}`
                                : 'Chưa đánh giá'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Results */}
                        {a.feedbackSubmittedAt && (
                          <div className="flex items-center gap-2">
                            {a.score != null && (
                              <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                a.score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                a.score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {a.score}/100
                              </div>
                            )}
                            {a.result && (
                              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                a.result === 'Pass' ? 'bg-green-100 text-green-700' :
                                a.result === 'Fail' ? 'bg-red-100 text-red-700' :
                                a.result === 'OnHold' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {a.result}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Feedback notes */}
                      {a.feedbackNotes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">{a.feedbackNotes}</p>
                      )}

                      {/* Show feedback form for current user if not yet submitted */}
                      {!a.feedbackSubmittedAt && a.interviewerUserId === currentUserId && interview.status === 'Completed' && (
                        <>
                          {feedbackForAssignment === a.id ? (
                            <FeedbackForm
                              scheduleId={interview.id}
                              assignmentId={a.id}
                              onSuccess={() => setFeedbackForAssignment(null)}
                              onCancel={() => setFeedbackForAssignment(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setFeedbackForAssignment(a.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors w-full justify-center border border-orange-200 dark:border-orange-800"
                            >
                              <i className="fa-solid fa-pen-to-square" />
                              Đánh giá ngay
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Info Card Helper ────────────────────────────────────────────
const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
  </div>
);

export default InterviewDetailDrawer;
