import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  GenericMeetingRoom,
  GenericRoomAccessGate,
} from "~/modules/meeting";
import { useJoinRoomMutation } from "~/cores/api";
import { getUserId } from "~/utils/auth";

/**
 * General-purpose meeting room route.
 * No interview-specific logic — just WebRTC video conferencing.
 */
const MeetingRoomPage: React.FC = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState(urlRoomCode || "");

  const [joinRoomApi, { isLoading: isJoining }] = useJoinRoomMutation();

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

  if (!hasJoined) {
    return (
      <GenericRoomAccessGate
        roomCode={urlRoomCode}
        onJoinRoom={handleJoinRoom}
        isJoining={isJoining}
        error={joinError}
        title="Phòng họp trực tuyến"
        subtitle="Nhập mã phòng để tham gia cuộc họp"
        backPath="/home"
        backLabel="← Quay lại trang chủ"
      />
    );
  }

  return (
    <GenericMeetingRoom
      roomCode={activeRoomCode}
      backPath="/home"
    />
  );
};

export default function MeetingRoomRoute() {
  return <MeetingRoomPage />;
}
