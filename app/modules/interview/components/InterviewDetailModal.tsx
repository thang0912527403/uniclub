import React, { useState } from 'react';
import type { InterviewScheduleResponse } from '~/cores/api';
import { useGetUserByIdQuery } from '~/cores/api';

interface InterviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewScheduleResponse | null;
  onUpdateStatus?: (id: number, status: string) => void;
  onAssignInterviewer?: (scheduleId: number, userId: string, role: string) => void;
  onRemoveAssignment?: (scheduleId: number, assignmentId: number) => void;
  onNavigateToRoom?: (roomCode: string) => void;
}

const roleOptions = [
  { value: 'Interviewer', label: 'Interviewer', icon: 'fa-solid fa-microphone text-orange-500' },
  { value: 'Lead', label: 'Lead', icon: 'fa-solid fa-crown text-yellow-500' },
  { value: 'Observer', label: 'Observer', icon: 'fa-regular fa-eye text-blue-500' },
  { value: 'HRRepresentative', label: 'HR Representative', icon: 'fa-solid fa-clipboard-user text-green-500' },
];

const statusActions: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  Scheduled: [
    { label: 'Xác nhận', nextStatus: 'Confirmed', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Hủy', nextStatus: 'Cancelled', color: 'bg-red-500 hover:bg-red-600' },
  ],
  Confirmed: [
    { label: 'Bắt đầu', nextStatus: 'InProgress', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Dời lịch', nextStatus: 'Rescheduled', color: 'bg-purple-500 hover:bg-purple-600' },
    { label: 'Hủy', nextStatus: 'Cancelled', color: 'bg-red-500 hover:bg-red-600' },
  ],
  InProgress: [
    { label: 'Hoàn thành', nextStatus: 'Completed', color: 'bg-green-500 hover:bg-green-600' },
  ],
};

const UserDisplay: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: userInfo, isFetching } = useGetUserByIdQuery(userId, { skip: !userId });

  if (isFetching) {
    return <span className="opacity-50"><i className="fa-solid fa-spinner fa-spin text-xs"></i> Đang tải...</span>;
  }

  return <span>{userInfo?.fullName || <span className="font-mono">{userId.slice(0, 12)}...</span>}</span>;
};

const InterviewDetailModal: React.FC<InterviewDetailModalProps> = ({
  isOpen,
  onClose,
  interview,
  onUpdateStatus,
  onAssignInterviewer,
  onRemoveAssignment,
  onNavigateToRoom,
}) => {
  const [newInterviewerUserId, setNewInterviewerUserId] = useState('');
  const [newInterviewerRole, setNewInterviewerRole] = useState('Interviewer');
  const [activeTab, setActiveTab] = useState<'info' | 'assignments' | 'feedback'>('info');

  const { data: candidateInfo, isFetching: isCandidateFetching } = useGetUserByIdQuery(interview?.candidateUserId ?? '', { skip: !interview?.candidateUserId });
  const { data: creatorInfo, isFetching: isCreatorFetching } = useGetUserByIdQuery(interview?.createdByUserId ?? '', { skip: !interview?.createdByUserId });

  if (!isOpen || !interview) return null;

  const isReadOnly = ['Completed', 'Cancelled'].includes(interview.status);
  const actions = statusActions[interview.status] || [];
  const hasRoom = !!interview.meetingRoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-lg font-bold text-white">{interview.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {interview.status}
                </span>
                <span className="text-orange-100 text-sm">
                  {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {[
            { key: 'info' as const, label: 'Thông tin', icon: 'fa-regular fa-file-lines' },
            { key: 'assignments' as const, label: `Phỏng vấn viên (${interview.assignments?.length || 0})`, icon: 'fa-solid fa-users' },
            { key: 'feedback' as const, label: 'Đánh giá', icon: 'fa-solid fa-star' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-5">
              {interview.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Mô tả</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{interview.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Thời lượng</p>
                  <p className="text-sm font-medium text-gray-800">{interview.durationMinutes} phút</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Application ID</p>
                  <p className="text-sm font-medium text-gray-800">#{interview.applicationId}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Candidate ID</p>
                  <div className="text-sm font-medium text-gray-800">
                    {isCandidateFetching ? (
                      <span className="flex items-center gap-1.5 opacity-50"><i className="fa-solid fa-spinner fa-spin text-xs" /> Đang tải...</span>
                    ) : (
                      candidateInfo?.fullName || <span className="text-xs font-mono">{interview.candidateUserId}</span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tạo bởi</p>
                  <div className="text-sm font-medium text-gray-800">
                    {isCreatorFetching ? (
                      <span className="flex items-center gap-1.5 opacity-50"><i className="fa-solid fa-spinner fa-spin text-xs" /> Đang tải...</span>
                    ) : (
                      creatorInfo?.fullName || <span className="text-xs font-mono">{interview.createdByUserId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meeting Room */}
              {hasRoom && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase mb-1">Phòng họp</p>
                      <p className="text-lg font-mono font-bold text-green-800">{interview.meetingRoom!.roomCode}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Trạng thái: {isReadOnly ? 'Closed' : interview.meetingRoom!.status} • Tối đa {interview.meetingRoom!.maxParticipants} người
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Thao tác</h4>
                  <div className="flex gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.nextStatus}
                        onClick={() => onUpdateStatus?.(interview.id, action.nextStatus)}
                        className={`px-4 py-2 ${action.color} text-white rounded-xl text-sm font-medium transition-all hover:shadow-md`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {/* Add interviewer */}
              {!isReadOnly && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Thêm người phỏng vấn</h4>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterviewerUserId}
                    onChange={(e) => setNewInterviewerUserId(e.target.value)}
                    placeholder="User ID"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                  <select
                    value={newInterviewerRole}
                    onChange={(e) => setNewInterviewerRole(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newInterviewerUserId.trim()) {
                        onAssignInterviewer?.(interview.id, newInterviewerUserId.trim(), newInterviewerRole);
                        setNewInterviewerUserId('');
                      }
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Thêm
                  </button>
                </div>
              </div>
              )}

              {/* List */}
              {interview.assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Chưa có người phỏng vấn nào được phân công.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {interview.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {a.interviewerUserId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800"><UserDisplay userId={a.interviewerUserId} /></p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                              <i className={roleOptions.find(r => r.value === a.role)?.icon} />
                              {a.role}
                            </span>
                            {a.hasConfirmed && <span className="text-xs text-green-600 font-medium">✓ Đã xác nhận</span>}
                          </div>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <button
                          onClick={() => onRemoveAssignment?.(interview.id, a.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {interview.assignments.filter(a => a.feedbackSubmittedAt).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Chưa có đánh giá nào.</p>
                </div>
              ) : (
                interview.assignments
                  .filter(a => a.feedbackSubmittedAt)
                  .map((a) => (
                    <div key={a.id} className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {a.interviewerUserId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800"><UserDisplay userId={a.interviewerUserId} /> <span className="text-gray-400 font-normal">({a.role})</span></p>
                            <p className="text-xs text-gray-400">{a.feedbackSubmittedAt ? new Date(a.feedbackSubmittedAt).toLocaleString('vi-VN') : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {a.score != null && (
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              a.score >= 70 ? 'bg-green-100 text-green-700' :
                              a.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {a.score}/100
                            </div>
                          )}
                          {a.result && (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              a.result === 'Pass' ? 'bg-green-100 text-green-700' :
                              a.result === 'Fail' ? 'bg-red-100 text-red-700' :
                              a.result === 'OnHold' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {a.result}
                            </span>
                          )}
                        </div>
                      </div>
                      {a.feedbackNotes && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{a.feedbackNotes}</p>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailModal;
