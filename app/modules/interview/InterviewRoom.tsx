import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  GenericMeetingRoom,
  GenericRoomAccessGate,
  RoomBlockedScreen,
  RoomLoadingScreen,
} from "~/modules/meeting";
import ScoringPanel from "./components/ScoringPanel";
import {
  useJoinRoomMutation,
  useSubmitFeedbackMutation,
  useGetInterviewsQuery,
} from "~/cores/api";
import type {
  InterviewScheduleResponse,
  InterviewAssignmentResponse,
} from "~/cores/api";
import { getUserId } from "~/utils/auth";

/**
 * InterviewRoom wraps GenericMeetingRoom and adds:
 *  - Room validation (block Closed/Completed/Cancelled rooms)
 *  - ScoringPanel sidebar for assigned interviewers
 */

// ── Scoring sidebar wrapper ─────────────────────────────────────

const InterviewSidePanel: React.FC<{
  roomCode: string;
  currentUserId: string;
}> = ({ roomCode, currentUserId }) => {
  const [submitFeedback, { isLoading: isSubmitting }] =
    useSubmitFeedbackMutation();
  const { data: interviews = [] } = useGetInterviewsQuery();

  const relatedInterview: InterviewScheduleResponse | undefined =
    interviews.find((iv) => iv.meetingRoom?.roomCode === roomCode);
  const currentAssignment: InterviewAssignmentResponse | undefined =
    relatedInterview?.assignments?.find(
      (a) => a.interviewerUserId === currentUserId,
    );

  const handleSubmitFeedback = useCallback(
    async (data: {
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
        console.error("Failed to submit feedback:", err);
      }
    },
    [submitFeedback],
  );

  if (!currentAssignment || !relatedInterview) return null;
  return (
    <ScoringPanel
      scheduleId={relatedInterview.id}
      assignment={currentAssignment}
      allAssignments={relatedInterview.assignments}
      campaignId={relatedInterview.campaignId}
      onSubmitFeedback={handleSubmitFeedback}
      isSubmitting={isSubmitting}
    />
  );
};

// ── Main page component ──────────────────────────────────────────

const InterviewRoom: React.FC = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState(urlRoomCode || "");

  const [joinRoomApi, { isLoading: isJoining }] = useJoinRoomMutation();

  const { data: interviews = [], isLoading: isValidating } =
    useGetInterviewsQuery(undefined, { skip: !urlRoomCode });

  const currentUserId = getUserId();

  // ── Validation gate ──
  if (urlRoomCode && !isValidating) {
    if (interviews.length > 0) {
      const matchedInterview = interviews.find(
        (iv) => iv.meetingRoom?.roomCode === urlRoomCode,
      );

      if (!matchedInterview) {
        return (
          <RoomBlockedScreen
            reason="Mã phòng không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại."
            backPath="/meeting-room"
            backLabel="Quay lại sảnh"
          />
        );
      }

      if (matchedInterview.meetingRoom?.status === "Idle") {
        return (
          <RoomBlockedScreen
            reason="Chưa đến giờ phỏng vấn. Phòng hiện chưa mở, vui lòng quay lại sau."
            backPath="/meeting-room"
            backLabel="Quay lại sảnh"
          />
        );
      }

      if (matchedInterview.meetingRoom?.status === "Closed") {
        return (
          <RoomBlockedScreen
            reason="Phòng đã bị đóng sau khi buổi phỏng vấn kết thúc."
            backPath="/meeting-room"
            backLabel="Quay lại sảnh"
          />
        );
      }

      if (["Completed", "Cancelled"].includes(matchedInterview.status)) {
        return (
          <RoomBlockedScreen
            reason={`Buổi phỏng vấn đã ở trạng thái "${matchedInterview.status}" — phòng không còn nhận người vào.`}
            backPath="/meeting-room"
            backLabel="Quay lại sảnh"
          />
        );
      }
    }
  }

  if (urlRoomCode && isValidating) {
    return <RoomLoadingScreen />;
  }

  const handleJoinRoom = async (
    roomCode: string,
    userId: string,
    displayName: string,
    role: string,
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
      setJoinError(
        err?.data?.message ||
          "Không thể tham gia phòng. Vui lòng kiểm tra mã phòng.",
      );
    }
  };

  if (!hasJoined) {
    return (
      <GenericRoomAccessGate
        roomCode={urlRoomCode}
        onJoinRoom={handleJoinRoom}
        isJoining={isJoining}
        error={joinError}
        title="Phòng phỏng vấn"
        subtitle="Nhập mã phòng để tham gia buổi phỏng vấn"
        backPath="/meeting-room"
        backLabel="← Quay lại sảnh"
      />
    );
  }

  // Only show scoring panel tab if the current user is an assigned interviewer
  const matchedInterview = interviews.find(
    (iv) => iv.meetingRoom?.roomCode === activeRoomCode,
  );
  const isAssignedInterviewer = matchedInterview?.assignments?.some(
    (a) => a.interviewerUserId === currentUserId,
  );

  return (
    <GenericMeetingRoom
      roomCode={activeRoomCode}
      backPath="/home"
      sidePanel={
        isAssignedInterviewer ? (
          <InterviewSidePanel
            roomCode={activeRoomCode}
            currentUserId={currentUserId}
          />
        ) : undefined
      }
      sidePanelLabels={{
        show: "Hiện bảng điều khiển",
        hide: "Ẩn bảng điều khiển",
      }}
      customTabLabel="Đánh giá"
      customTabIcon="fa-clipboard-check"
    />
  );
};

export default InterviewRoom;
