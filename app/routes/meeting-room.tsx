import React, { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  GenericMeetingRoom,
  GenericRoomAccessGate,
  RoomBlockedScreen,
  RoomLoadingScreen,
} from "~/modules/meeting";
import {
  useJoinRoomMutation,
  useGetInterviewsQuery,
  useSubmitFeedbackMutation,
} from "~/cores/api";
import type {
  InterviewScheduleResponse,
  InterviewAssignmentResponse,
} from "~/cores/api";
import { getUserId } from "~/utils/auth";
import { useClubRole } from "~/hooks/useClubRole";
import ScoringPanel from "~/modules/interview/components/ScoringPanel";

// ── Interview Scoring sidebar (auto-attached when room matches an interview) ──

const InterviewSidePanel: React.FC<{
  roomCode: string;
  currentUserId: string;
}> = ({ roomCode, currentUserId }) => {
  const { isClubManager } = useClubRole();
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
      isClubManager={isClubManager}
      onSubmitFeedback={handleSubmitFeedback}
      isSubmitting={isSubmitting}
    />
  );
};

// ── Main unified meeting room route ──────────────────────────────

export default function MeetingRoomRoute() {
  const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState(urlRoomCode || "");

  const [joinRoomApi, { isLoading: isJoining }] = useJoinRoomMutation();
  const currentUserId = getUserId();

  // Fetch interviews to validate room status & show scoring panel
  const { data: interviews = [], isLoading: isValidating } =
    useGetInterviewsQuery(undefined, { skip: !urlRoomCode });

  // ── Interview room validation gate ──
  const matchedInterview = useMemo(
    () => interviews.find((iv) => iv.meetingRoom?.roomCode === urlRoomCode),
    [interviews, urlRoomCode],
  );

  if (urlRoomCode && isValidating) {
    return <RoomLoadingScreen />;
  }

  if (urlRoomCode && !isValidating && interviews.length > 0 && matchedInterview) {
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

  // ── Join handler (calls REST API then enters room) ──
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
      navigate(`/meeting-room/${roomCode}`);
    } catch (err: any) {
      setJoinError(
        err?.data?.message ||
          "Không thể tham gia phòng. Vui lòng kiểm tra mã phòng.",
      );
    }
  };

  // ── Show access gate if not joined ──
  if (!hasJoined) {
    return (
      <GenericRoomAccessGate
        roomCode={urlRoomCode}
        onJoinRoom={handleJoinRoom}
        isJoining={isJoining}
        error={joinError}
        title="Phòng họp chung"
        subtitle="Tham gia phòng họp video trực tuyến của UniClub"
        backPath="/home"
        backLabel="← Quay lại"
      />
    );
  }

  // ── Determine if user is an assigned interviewer (for scoring panel) ──
  const activeInterview = interviews.find(
    (iv) => iv.meetingRoom?.roomCode === activeRoomCode,
  );
  const isAssignedInterviewer = activeInterview?.assignments?.some(
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
}
