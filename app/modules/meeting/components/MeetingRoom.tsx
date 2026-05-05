import React, { useEffect, useState, useRef, useCallback } from "react";
import { useMeeting } from "../context/MeetingContext";
import { VideoTile } from "./VideoTile";
import { ControlBar } from "./ControlBar";
import { getUserId, getAccessToken } from "~/utils/auth";
import { useLeaveRoomMutation } from "~/cores/api";
import { API_URLS } from "~/cores/api/baseApi";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export const MeetingRoom: React.FC<{ roomId: string; onLeave: () => void }> = ({
  roomId,
  onLeave,
}) => {
  const {
    users,
    userStates,
    localStream,
    screenStream,
    remoteStreams,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    isReady,
    isScreenSharing,
    screenSharingUser,
    isHandRaised,
    toggleHand,
    messages,
    sendMessage,
  } = useMeeting();

  const [spotlightUser, setSpotlightUser] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadCountRef = useRef(0);
  const hasLeftRef = useRef(false);
  const [hasJoined, setHasJoined] = useState(false);

  const { user } = useCurrentUser();
  const currentUserId = getUserId();
  const [leaveRoomApi] = useLeaveRoomMutation();

  // ── Call REST API to record participant.left ─────────────────────
  const callLeaveApi = useCallback(() => {
    if (hasLeftRef.current || !roomId || !currentUserId) return;
    hasLeftRef.current = true;

    leaveRoomApi({ roomCode: roomId, dto: { userId: currentUserId } })
      .unwrap()
      .then(() => console.log("[Room] REST leave API called successfully"))
      .catch((err) => console.error("[Room] REST leave API error:", err));
  }, [roomId, currentUserId, leaveRoomApi]);

  // ── Beacon fallback for tab close (async fetch may not complete) ──
  const callLeaveBeacon = useCallback(() => {
    if (hasLeftRef.current || !roomId || !currentUserId) return;
    hasLeftRef.current = true;

    const baseUrl = API_URLS.MAIN_SERVICE;
    const url = `${baseUrl}/rooms/${roomId}/leave`;
    const body = JSON.stringify({ userId: currentUserId });
    const accessToken = getAccessToken();

    // sendBeacon doesn't support custom headers, so use fetch with keepalive
    try {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body,
        keepalive: true, // ensures the request completes even if page is unloading
      }).catch(() => {
        // Last resort: sendBeacon (no auth header but at least hits the server)
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      });
    } catch {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    }
  }, [roomId, currentUserId]);

  // ── Join room on connect ──────────────────────────────────────────
  useEffect(() => {
    // Only join when the provider has bound all listeners
    if (isConnected && isReady && roomId) {
      hasLeftRef.current = false;
      joinRoom(roomId)
        .then(() => setHasJoined(true))
        .catch((err) => {
          console.error("Failed to join room:", err);
        });

      return () => {
        leaveRoom();
        setHasJoined(false);
      };
    }
  }, [isConnected, isReady, roomId, joinRoom, leaveRoom]);

  // ── Handle tab close / navigation away ────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      callLeaveBeacon();
      // Also try SignalR synchronous stop
      leaveRoom();
    };

    const handleVisibilityChange = () => {
      // Mobile browsers: page hidden = user switched away/closed
      if (document.visibilityState === "hidden") {
        callLeaveBeacon();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [callLeaveBeacon, leaveRoom]);

  // Auto-spotlight screen sharing user (including self)
  useEffect(() => {
    if (isScreenSharing) {
      setSpotlightUser("local");
    } else if (screenSharingUser) {
      setSpotlightUser(screenSharingUser);
    } else {
      setSpotlightUser(null);
    }
  }, [screenSharingUser, isScreenSharing]);

  // Track unread messages
  useEffect(() => {
    if (!isChatOpen && messages.length > lastReadCountRef.current) {
      setUnreadCount(messages.length - lastReadCountRef.current);
    }
  }, [messages, isChatOpen]);

  const handleLeave = async () => {
    callLeaveApi();
    await leaveRoom();
    onLeave();
  };

  const handleVideoClick = (connectionId: string | null) => {
    if (spotlightUser === connectionId) {
      setSpotlightUser(null); // Exit spotlight
    } else {
      setSpotlightUser(connectionId); // Enter spotlight
    }
  };

  // Calculate grid layout based on participant count and spotlight
  const totalParticipants = 1 + users.length;

  // Auto-determine spotlight user if not manually set (default to first remote user or local)
  const effectiveSpotlightUser =
    spotlightUser || (users.length > 0 ? users[0].connectionId : "local");
  const isSpotlightMode = true; // Always use spotlight layout to match Pulse Meeting design

  const getGridClass = () => {
    if (isSpotlightMode) return "grid-cols-1";
    if (totalParticipants === 1) return "grid-cols-1 max-w-3xl";
    if (totalParticipants === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl";
    if (totalParticipants <= 4) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
    if (totalParticipants <= 6) return "grid-cols-2 md:grid-cols-3 max-w-7xl";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-full";
  };

  // Get the stream to display for spotlight
  const getSpotlightContent = () => {
    if (!effectiveSpotlightUser) return null;

    if (effectiveSpotlightUser === "local") {
      return {
        stream: isScreenSharing ? screenStream : localStream,
        label: user?.fullName || "Bạn",
        isLocal: true,
        avatar: user?.avatar,
        isHandRaised: isHandRaised,
      };
    }

    const rUser = users.find((u) => u.connectionId === effectiveSpotlightUser);
    const stream = remoteStreams[effectiveSpotlightUser];
    const state = userStates[effectiveSpotlightUser];

    return {
      stream,
      label: rUser?.fullName || "User",
      isLocal: false,
      isMuted: state?.isMuted || false,
      isCameraOff: state?.isCameraOff || false,
      isScreenSharing: state?.isScreenSharing || false,
      isHandRaised: state?.isHandRaised || false,
      avatar: rUser?.avatar,
    };
  };

  const spotlightContent = getSpotlightContent();

  if (!isReady || !hasJoined) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full w-full">
        <div className="text-center text-gray-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block text-orange-500" />
          <p className="text-sm">Đang thiết lập kết nối WebRTC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-gray-50">
      {/* Video Grid Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 pb-28 overflow-y-auto">
        {isSpotlightMode && spotlightContent ? (
          // Spotlight Mode: One big video + thumbnails
          <div className="w-full h-full max-w-7xl flex flex-col gap-4">
            {/* Main spotlight video */}
            <div className="flex-1 min-h-0">
              <VideoTile
                stream={spotlightContent.stream}
                muted={spotlightContent.isLocal}
                label={spotlightContent.label}
                isLocal={spotlightContent.isLocal}
                isVideoEnabled={
                  spotlightContent.isLocal
                    ? isScreenSharing || isVideoEnabled
                    : !spotlightContent.isCameraOff ||
                      spotlightContent.isScreenSharing
                }
                isAudioEnabled={
                  spotlightContent.isLocal
                    ? isAudioEnabled
                    : !spotlightContent.isMuted
                }
                isSpotlight
                isScreenSharing={spotlightContent.isScreenSharing}
                isHandRaised={spotlightContent.isHandRaised}
                avatar={spotlightContent.avatar}
                onClick={() => setSpotlightUser(null)}
              />
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-3 overflow-x-auto pb-2 justify-center">
              {/* Local user thumbnail (if not spotlighted) */}
              {effectiveSpotlightUser !== "local" && (
                <div className="flex-shrink-0 w-40">
                  <VideoTile
                    stream={isScreenSharing ? screenStream : localStream}
                    muted
                    label="Bạn"
                    isLocal
                    isVideoEnabled={isScreenSharing || isVideoEnabled}
                    isAudioEnabled={isAudioEnabled}
                    isThumbnail
                    isHandRaised={isHandRaised}
                    avatar={user?.avatar}
                    onClick={() => handleVideoClick("local")}
                  />
                </div>
              )}

              {/* Remote users thumbnails */}
              {users.map((rUser) => {
                if (rUser.connectionId === effectiveSpotlightUser) return null;
                const stream = remoteStreams[rUser.connectionId];
                const state = userStates[rUser.connectionId];
                return (
                  <div key={rUser.connectionId} className="flex-shrink-0 w-40">
                    <VideoTile
                      stream={stream}
                      label={rUser.fullName}
                      isVideoEnabled={
                        !state?.isCameraOff || state?.isScreenSharing
                      }
                      isAudioEnabled={!state?.isMuted}
                      isScreenSharing={state?.isScreenSharing}
                      isHandRaised={state?.isHandRaised}
                      isThumbnail
                      avatar={rUser.avatar}
                      onClick={() => handleVideoClick(rUser.connectionId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Grid Mode
          <div className={`grid gap-4 mx-auto w-full ${getGridClass()}`}>
            {/* Local User Video */}
            <VideoTile
              stream={isScreenSharing ? screenStream : localStream}
              muted
              label="Bạn"
              isLocal
              isVideoEnabled={isScreenSharing || isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              isHandRaised={isHandRaised}
              onClick={() => handleVideoClick("local")}
            />

            {/* Remote Users */}
            {users.map((user) => {
              const stream = remoteStreams[user.connectionId];
              const state = userStates[user.connectionId];
              return (
                <VideoTile
                  key={user.connectionId}
                  stream={stream}
                  label={user.fullName}
                  isVideoEnabled={
                    !state?.isCameraOff || state?.isScreenSharing
                  }
                  isAudioEnabled={!state?.isMuted}
                  isScreenSharing={state?.isScreenSharing}
                  isHandRaised={state?.isHandRaised}
                  onClick={() => handleVideoClick(user.connectionId)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Control Bar */}
      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={
          isScreenSharing ? stopScreenShare : startScreenShare
        }
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) {
            setUnreadCount(0);
            lastReadCountRef.current = messages.length;
          }
        }}
        isHandRaised={isHandRaised}
        onToggleHand={toggleHand}
        onLeave={handleLeave}
      />
    </div>
  );
};

export default MeetingRoom;
