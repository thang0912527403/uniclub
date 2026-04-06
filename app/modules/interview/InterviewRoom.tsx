import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { WebRtcProvider, MeetingRoom } from '~/modules/webrtc';
import RoomAccessGate from './components/RoomAccessGate';
import ScoringPanel from './components/ScoringPanel';
import {
  useJoinRoomMutation,
  useSubmitFeedbackMutation,
  useGetInterviewsQuery,
} from '~/cores/api';
import type {
  InterviewScheduleResponse,
  InterviewAssignmentResponse,
} from '~/cores/api';
import { getUserId } from '~/utils/auth';

/**
 * InterviewRoom wraps the existing MeetingRoom (WebRTC) module
 * and adds a ScoringPanel sidebar for interviewers to evaluate candidates.
 * Includes:
 *  - Room validation: block entry if room is Closed/Completed/Cancelled/not found.
 *  - ScoringPanel: shown only to assigned interviewers.
 */

// ── Inner component (inside WebRtcProvider) ──────────────────────

const InterviewRoomContent: React.FC<{
  roomCode: string;
  currentUserId: string;
}> = ({ roomCode, currentUserId }) => {
  const navigate = useNavigate();
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();
  const [isScoringOpen, setIsScoringOpen] = useState(true);

  const { data: interviews = [] } = useGetInterviewsQuery();
  const relatedInterview: InterviewScheduleResponse | undefined = interviews.find(
    iv => iv.meetingRoom?.roomCode === roomCode
  );
  const currentAssignment: InterviewAssignmentResponse | undefined = relatedInterview?.assignments?.find(
    a => a.interviewerUserId === currentUserId
  );

  const handleLeave = useCallback(() => {
    navigate('/interview/schedule');
  }, [navigate]);

  const handleSubmitFeedback = useCallback(async (data: {
    scheduleId: number;
    assignmentId: number;
    feedbackNotes: string;
    result: string;
  }) => {
    try {
      await submitFeedback({
        scheduleId: data.scheduleId,
        assignmentId: data.assignmentId,
        dto: {
          feedbackNotes: data.feedbackNotes,
          result: data.result,
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, [submitFeedback]);

  const showScoringPanel = !!currentAssignment && !!relatedInterview;

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      <div className="flex-1 h-full transition-all duration-300">
        <MeetingRoom roomId={roomCode} onLeave={handleLeave} />
      </div>

      {showScoringPanel && (
        <button
          onClick={() => setIsScoringOpen(prev => !prev)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-b from-orange-500 to-amber-500 text-white w-8 h-16 flex items-center justify-center rounded-l-xl shadow-lg hover:shadow-xl hover:w-9 transition-all duration-200"
          style={{ right: isScoringOpen ? '380px' : '0px', transition: 'right 0.3s ease' }}
          title={isScoringOpen ? 'Ẩn bảng chấm điểm' : 'Hiện bảng chấm điểm'}
        >
          <i className={`fa-solid ${isScoringOpen ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`} />
        </button>
      )}

      {showScoringPanel && (
        <div
          className="flex-shrink-0 border-l border-gray-700/50 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: isScoringOpen ? '380px' : '0px',
            minWidth: isScoringOpen ? '380px' : '0px',
            opacity: isScoringOpen ? 1 : 0,
          }}
        >
          <div className="w-[380px] h-full">
            <ScoringPanel
              scheduleId={relatedInterview!.id}
              assignment={currentAssignment!}
              allAssignments={relatedInterview!.assignments}
              campaignId={relatedInterview!.campaignId}
              onSubmitFeedback={handleSubmitFeedback}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Room blocked screen ──────────────────────────────────────────

const RoomBlockedScreen: React.FC<{ reason: string }> = ({ reason }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-5 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-lock text-red-400 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Phòng không khả dụng</h2>
        <p className="text-white/60 text-sm mb-8">{reason}</p>
        <button
          onClick={() => navigate('/interview/schedule')}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Quay lại lịch phỏng vấn
        </button>
      </div>
    </div>
  );
};

// ── Main page component ──────────────────────────────────────────

const InterviewRoom: React.FC = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState(urlRoomCode || '');

  const [joinRoomApi, { isLoading: isJoining }] = useJoinRoomMutation();

  // Validate room by looking it up in all interviews (avoids extra endpoint)
  const { data: interviews = [], isLoading: isValidating } = useGetInterviewsQuery(undefined, {
    skip: !urlRoomCode,
  });

  // Parse current user from context
  const currentUserId = getUserId();

  // ── Validation gate (only when navigated via URL with a room code) ──
  if (urlRoomCode && !isValidating) {
    // Only block if we got data back (avoid false positives on empty response)
    if (interviews.length > 0) {
      const matchedInterview = interviews.find(iv => iv.meetingRoom?.roomCode === urlRoomCode);

      if (!matchedInterview) {
        return <RoomBlockedScreen reason="Mã phòng không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại." />;
      }

      if (matchedInterview.meetingRoom?.status === 'Closed') {
        return <RoomBlockedScreen reason="Phòng đã bị đóng sau khi buổi phỏng vấn kết thúc." />;
      }

      if (['Completed', 'Cancelled'].includes(matchedInterview.status)) {
        return (
          <RoomBlockedScreen
            reason={`Buổi phỏng vấn đã ở trạng thái "${matchedInterview.status}" — phòng không còn nhận người vào.`}
          />
        );
      }
    }
  }

  // Show loading spinner while validation is in-flight
  if (urlRoomCode && isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center text-white/60">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block" />
          <p className="text-sm">Đang kiểm tra phòng...</p>
        </div>
      </div>
    );
  }

  const handleJoinRoom = async (
    roomCode: string,
    userId: string,
    displayName: string,
    role: string
  ) => {
    setJoinError(null);
    try {
      await joinRoomApi({
        roomCode,
        dto: { userId, displayName, role },
      }).unwrap();

      setActiveRoomCode(roomCode);
      setHasJoined(true);
      navigate(`/interview/room/${roomCode}`);
    } catch (err: any) {
      setJoinError(err?.data?.message || 'Không thể tham gia phòng. Vui lòng kiểm tra mã phòng.');
    }
  };

  if (!hasJoined) {
    return (
      <RoomAccessGate
        roomCode={urlRoomCode}
        onJoinRoom={handleJoinRoom}
        isJoining={isJoining}
        error={joinError}
      />
    );
  }

  return (
    <WebRtcProvider>
      <InterviewRoomContent
        roomCode={activeRoomCode}
        currentUserId={currentUserId}
      />
    </WebRtcProvider>
  );
};

export default InterviewRoom;
