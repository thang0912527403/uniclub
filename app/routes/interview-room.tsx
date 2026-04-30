import { useParams, Navigate } from "react-router";

/**
 * Legacy route — redirects to the unified /meeting-room/:roomCode.
 */
export default function InterviewRoomRoute() {
  const { roomCode } = useParams<{ roomCode: string }>();

  return (
    <Navigate
      to={roomCode ? `/meeting-room/${roomCode}` : "/meeting-room"}
      replace
    />
  );
}
