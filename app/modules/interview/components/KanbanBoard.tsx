import React, { useState, useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import CreateInterviewModal from './CreateInterviewModal';
import InterviewDetailModal from './InterviewDetailModal';
import type { CandidateCardData } from './CandidateCard';
import type { InterviewScheduleResponse, ApplicationResponseDto } from '~/cores/api';
import {
  useGetInterviewsQuery,
  useGetApplicationsByStatusQuery,
  useCreateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useAssignInterviewersMutation,
  useRemoveAssignmentMutation,
  useGetInterviewByIdQuery,
  useCloseRoomMutation,
} from '~/cores/api';

interface KanbanBoardProps {
  campaignId: number;
  currentUserId: string;
  onNavigateToRoom?: (roomCode: string) => void;
}

const columns = [
  {
    status: 'Reviewed',
    title: 'Đã duyệt hồ sơ',
    color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: 'Scheduled',
    title: 'Đã lên lịch',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    status: 'Confirmed',
    title: 'Đã xác nhận',
    color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    status: 'InProgress',
    title: 'Đang phỏng vấn',
    color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    status: 'Completed',
    title: 'Hoàn thành',
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ campaignId, currentUserId, onNavigateToRoom }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponseDto | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);

  // API hooks
  const { data: interviews = [], isLoading: interviewsLoading } = useGetInterviewsQuery({ campaignId });
  const { data: reviewedApps = [], isLoading: appsLoading } = useGetApplicationsByStatusQuery('SUCCESS');
  const [createInterview] = useCreateInterviewMutation();
  const [updateStatus] = useUpdateInterviewStatusMutation();
  const [assignInterviewers] = useAssignInterviewersMutation();
  const [removeAssignment] = useRemoveAssignmentMutation();
  const [closeRoom] = useCloseRoomMutation();
  const { data: selectedInterview } = useGetInterviewByIdQuery(selectedInterviewId!, { skip: !selectedInterviewId });

  // Build card data for each column
  const columnCards = useMemo(() => {
    const result: Record<string, CandidateCardData[]> = {};

    // SUCCESS column - applications approved into interview stage that don't have interviews yet
    const interviewedAppIds = new Set(interviews.map(iv => iv.applicationId));
    result['Reviewed'] = reviewedApps
      .filter(app => !interviewedAppIds.has(app.applicationId))
      .map(app => ({ type: 'application' as const, application: app }));

    // Interview columns
    for (const col of columns) {
      if (col.status === 'Reviewed') continue;
      result[col.status] = interviews
        .filter(iv => iv.status === col.status)
        .map(iv => ({ type: 'interview' as const, interview: iv }));
    }

    return result;
  }, [interviews, reviewedApps]);

  const handleDrop = async (data: CandidateCardData, targetStatus: string) => {
    // Application → Scheduled: create interview
    if (data.type === 'application' && targetStatus === 'Scheduled' && data.application) {
      setSelectedApplication(data.application);
      setCreateModalOpen(true);
      return;
    }

    // Interview → another status: update status
    if (data.type === 'interview' && data.interview) {
      const currentStatus = data.interview.status;
      if (currentStatus === targetStatus) return;

      // Validate transitions
      const validTransitions: Record<string, string[]> = {
        Scheduled: ['Confirmed', 'Cancelled'],
        Confirmed: ['InProgress', 'Rescheduled', 'Cancelled'],
        InProgress: ['Completed'],
      };
      if (!validTransitions[currentStatus]?.includes(targetStatus)) return;

      let cancelReason;
      if (targetStatus === 'Cancelled') {
        const reason = window.prompt('Vui lòng nhập lý do hủy lịch:');
        if (!reason || !reason.trim()) return;
        cancelReason = reason.trim();
      }

      try {
        await updateStatus({
          id: data.interview.id,
          dto: { status: targetStatus, cancelReason },
        }).unwrap();

        // Auto-close room when interview is marked Completed
        if (targetStatus === 'Completed' && data.interview.meetingRoom?.roomCode) {
          try {
            await closeRoom(data.interview.meetingRoom.roomCode).unwrap();
          } catch (e) {
            console.warn('Could not close room (may already be closed):', e);
          }
        }
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  };

  const handleCreateInterview = async (dto: any) => {
    try {
      await createInterview(dto).unwrap();
    } catch (err) {
      console.error('Failed to create interview:', err);
    }
  };

  const handleViewDetail = (data: CandidateCardData) => {
    if (data.interview) {
      setSelectedInterviewId(data.interview.id);
      setDetailModalOpen(true);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    let cancelReason;
    if (status === 'Cancelled') {
      const reason = window.prompt('Vui lòng nhập lý do hủy lịch:');
      if (!reason || !reason.trim()) return;
      cancelReason = reason.trim();
    }

    try {
      await updateStatus({ id, dto: { status, cancelReason } }).unwrap();

      // Auto-close room when interview is marked Completed via detail modal
      if (status === 'Completed') {
        const interview = interviews.find(iv => iv.id === id);
        if (interview?.meetingRoom?.roomCode) {
          try {
            await closeRoom(interview.meetingRoom.roomCode).unwrap();
          } catch (e) {
            console.warn('Could not close room:', e);
          }
        }
      }

      setDetailModalOpen(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssignInterviewer = async (scheduleId: number, userId: string, role: string) => {
    try {
      await assignInterviewers({
        scheduleId,
        dto: { interviewers: [{ interviewerUserId: userId, role }] },
      }).unwrap();
    } catch (err) {
      console.error('Failed to assign interviewer:', err);
    }
  };

  const handleRemoveAssignment = async (scheduleId: number, assignmentId: number) => {
    try {
      await removeAssignment({ scheduleId, assignmentId }).unwrap();
    } catch (err) {
      console.error('Failed to remove assignment:', err);
    }
  };

  const isLoading = interviewsLoading || appsLoading;

  return (
    <div>
      {/* Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.status} className="min-w-[280px] flex-1 animate-pulse">
              <div className={`h-12 rounded-t-2xl ${col.color} opacity-50`} />
              <div className="bg-gray-50/80 rounded-b-2xl p-3 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              color={col.color}
              icon={col.icon}
              cards={columnCards[col.status] || []}
              onDrop={handleDrop}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      )}

      {/* Create Interview Modal */}
      <CreateInterviewModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        application={selectedApplication}
        campaignId={campaignId}
        currentUserId={currentUserId}
        onSubmit={handleCreateInterview}
      />

      {/* Interview Detail Modal */}
      <InterviewDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedInterviewId(null);
        }}
        interview={selectedInterview || null}
        onUpdateStatus={handleUpdateStatus}
        onAssignInterviewer={handleAssignInterviewer}
        onRemoveAssignment={handleRemoveAssignment}
        onNavigateToRoom={onNavigateToRoom}
      />
    </div>
  );
};

export default KanbanBoard;
