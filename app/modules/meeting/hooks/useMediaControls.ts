import { useState, useRef, useCallback, useEffect } from "react";
import type { HubConnection } from "@microsoft/signalr";
import type { RoomUser, UserMediaState } from "../types";

// ── Parameter types ─────────────────────────────────────────────────

interface PeerOperations {
  peers: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  createPeerConnection: (
    id: string,
    isInitiator: boolean,
    roomId: string,
  ) => Promise<void>;
  cleanupPeers: () => void;
  setRemoteStreams: React.Dispatch<
    React.SetStateAction<Record<string, MediaStream>>
  >;
}

interface SharedRefs {
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  screenStreamRef: React.MutableRefObject<MediaStream | null>;
  isScreenSharingRef: React.MutableRefObject<boolean>;
  roomIdRef: React.MutableRefObject<string | null>;
}

interface AuthUser {
  fullName?: string;
  userId?: string;
  avatar?: string | null;
}

/**
 * Manages room participants, local media devices, and media controls.
 * Handles join/leave room, audio/video toggles, screen sharing, and
 * all user-presence SignalR events.
 */
export function useMediaControls(
  connection: HubConnection | null,
  peerOps: PeerOperations,
  refs: SharedRefs,
  authUser: AuthUser | null,
) {
  // Destructure for stable useCallback deps
  const { peers, createPeerConnection, cleanupPeers, setRemoteStreams } =
    peerOps;
  const { localStreamRef, screenStreamRef, isScreenSharingRef, roomIdRef } =
    refs;

  // ── State ─────────────────────────────────────────────────────────

  const [users, setUsers] = useState<RoomUser[]>([]);
  const [userStates, setUserStates] = useState<Record<string, UserMediaState>>(
    {},
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingUser, setScreenSharingUser] = useState<string | null>(
    null,
  );
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Refs for stable callbacks (avoid stale closures)
  const connectionRef = useRef(connection);
  connectionRef.current = connection;

  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  // ── Room Join / Leave ─────────────────────────────────────────────

  const joinRoom = useCallback(
    async (roomId: string) => {
      const conn = connectionRef.current;
      if (!conn) return;

      try {
        // Graceful media device acquisition
        let stream: MediaStream | null = null;
        let hasAudio = false;
        let hasVideo = false;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          hasAudio = true;
          hasVideo = true;
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            hasAudio = true;
            console.log("[Media] Joining with audio only (no camera access)");
          } catch {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              hasVideo = true;
              console.log(
                "[Media] Joining with video only (no microphone access)",
              );
            } catch {
              console.log("[Media] Joining as listener (no camera/mic access)");
            }
          }
        }

        if (stream) {
          setLocalStream(stream);
          localStreamRef.current = stream;
        }
        setIsAudioEnabled(hasAudio);
        setIsVideoEnabled(hasVideo);

        const currentAuth = authUserRef.current;
        const fullName = currentAuth?.fullName || "Guest";
        const userId =
          currentAuth?.userId || "00000000-0000-0000-0000-000000000000";
        const avatarUrl = currentAuth?.avatar || "";

        roomIdRef.current = roomId;
        await conn.invoke("JoinRoom", roomId, userId, fullName, avatarUrl);
        setCurrentRoomId(roomId);
      } catch (err) {
        console.error("[Media] Error joining room:", err);
        throw err;
      }
    },
    [localStreamRef, roomIdRef],
  );

  const leaveRoom = useCallback(async () => {
    const conn = connectionRef.current;
    if (conn && roomIdRef.current) {
      try {
        await conn.invoke("LeaveRoom", roomIdRef.current);
        console.log("[Room] SignalR LeaveRoom invoked");
      } catch (err) {
        // Connection might already be closed (tab close, network drop)
        console.warn(
          "[Room] SignalR LeaveRoom failed (connection may be closed):",
          err,
        );
      }
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    // Stop screen stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
    }

    cleanupPeers();
    setUsers([]);
    setUserStates({});
    setCurrentRoomId(null);
    roomIdRef.current = null;
    setScreenSharingUser(null);
  }, [
    localStreamRef,
    screenStreamRef,
    isScreenSharingRef,
    roomIdRef,
    cleanupPeers,
  ]);

  // ── Audio / Video Toggles ─────────────────────────────────────────

  const toggleAudio = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];

    if (audioTrack) {
      // Turn OFF: stop track to release microphone
      audioTrack.stop();
      stream.removeTrack(audioTrack);

      // Replace track in all peers with null (mute)
      peers.current.forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track?.kind === "audio" || (!s.track && s));
        // We can't remove sender easily, so just note it
      });

      setIsAudioEnabled(false);

      const conn = connectionRef.current;
      if (conn && roomIdRef.current) {
        conn.invoke("ToggleMic", roomIdRef.current, true).catch(() => {});
      }
    } else {
      // Turn ON: re-acquire audio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const newTrack = audioStream.getAudioTracks()[0];
        stream.addTrack(newTrack);

        // Add track to all peer connections
        peers.current.forEach((pc) => {
          const audioSender = pc
            .getSenders()
            .find((s) => s.track === null || s.track?.kind === "audio");
          if (audioSender) {
            audioSender.replaceTrack(newTrack);
          } else {
            pc.addTrack(newTrack, stream);
          }
        });

        setIsAudioEnabled(true);

        const conn = connectionRef.current;
        if (conn && roomIdRef.current) {
          conn.invoke("ToggleMic", roomIdRef.current, false).catch(() => {});
        }
      } catch (err) {
        console.error("[Media] Could not re-acquire audio:", err);
      }
    }
  }, [localStreamRef, roomIdRef, peers]);

  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      // Turn OFF: stop track to release camera
      videoTrack.stop();
      stream.removeTrack(videoTrack);

      // Replace track in peers with null (black frame)
      peers.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(null);
        }
      });

      setIsVideoEnabled(false);

      const conn = connectionRef.current;
      if (conn && roomIdRef.current) {
        conn.invoke("ToggleCamera", roomIdRef.current, true).catch(() => {});
      }
    } else {
      // Turn ON: re-acquire video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const newTrack = videoStream.getVideoTracks()[0];
        stream.addTrack(newTrack);

        // Replace null track in peers with new video track
        peers.current.forEach((pc) => {
          const videoSender = pc
            .getSenders()
            .find((s) => s.track === null || s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(newTrack);
          } else {
            pc.addTrack(newTrack, stream);
          }
        });

        setIsVideoEnabled(true);

        const conn = connectionRef.current;
        if (conn && roomIdRef.current) {
          conn.invoke("ToggleCamera", roomIdRef.current, false).catch(() => {});
        }
      } catch (err) {
        console.error("[Media] Could not re-acquire video:", err);
      }
    }
  }, [localStreamRef, roomIdRef, peers]);

  // ── Screen Sharing ────────────────────────────────────────────────

  const stopScreenShare = useCallback(async () => {
    const currentScreenStream = screenStreamRef.current;
    if (!currentScreenStream) return;

    currentScreenStream.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    isScreenSharingRef.current = false;

    // Restore camera track in all peer connections
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      peers.current.forEach((pc) => {
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");
        videoSender?.replaceTrack(videoTrack);
      });
    }

    const conn = connectionRef.current;
    if (conn && roomIdRef.current) {
      conn.invoke("StopScreenShare", roomIdRef.current).catch(() => {});
    }
  }, [screenStreamRef, localStreamRef, isScreenSharingRef, roomIdRef, peers]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;

      // Replace video track in all peer connections
      const screenVideoTrack = stream.getVideoTracks()[0];

      for (const [connId, pc] of peers.current) {
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          // No video sender — add track and renegotiate
          pc.addTrack(screenVideoTrack, stream);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await connectionRef.current!.invoke(
              "SendSignal",
              roomIdRef.current!,
              connId,
              {
                type: "offer",
                sdp: offer.sdp,
              },
            );
          } catch (err) {
            console.error("[Media] Error renegotiating for screen share:", err);
          }
        }
      }

      const conn = connectionRef.current;
      if (conn && roomIdRef.current) {
        conn.invoke("StartScreenShare", roomIdRef.current).catch(() => {});
      }

      // Handle browser-native stop button
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("[Media] Error starting screen share:", err);
    }
  }, [screenStreamRef, isScreenSharingRef, roomIdRef, peers, stopScreenShare]);

  // ── Reset (called on disconnect) ──────────────────────────────────

  const resetState = useCallback(() => {
    setUsers([]);
    setUserStates({});
    setScreenSharingUser(null);
  }, []);

  // ── SignalR Event Handlers (User Presence) ────────────────────────

  useEffect(() => {
    if (!connection) return;

    const onUserJoined = (user: RoomUser) => {
      console.log("[Room] User joined:", user.fullName);
      setUsers((prev) =>
        prev.some((u) => u.connectionId === user.connectionId)
          ? prev
          : [...prev, user],
      );
      setUserStates((prev) => ({
        ...prev,
        [user.connectionId]: {
          connectionId: user.connectionId,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
        },
      }));
    };

    const onUserLeft = (user: RoomUser) => {
      if (!user) return;
      console.log("[Room] User left:", user.fullName);

      setUsers((prev) =>
        prev.filter((u) => u.connectionId !== user.connectionId),
      );
      setUserStates((prev) => {
        const next = { ...prev };
        delete next[user.connectionId];
        return next;
      });
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[user.connectionId];
        return next;
      });

      // If leaving user was screen sharing, clear it
      setScreenSharingUser((prev) =>
        prev === user.connectionId ? null : prev,
      );

      // Close the peer connection
      const pc = peers.current.get(user.connectionId);
      if (pc) {
        pc.close();
        peers.current.delete(user.connectionId);
      }
    };

    const onExistingUsers = async (existingUsers: RoomUser[]) => {
      console.log("[Room] Existing users:", existingUsers.length);
      setUsers(existingUsers);

      const states: Record<string, UserMediaState> = {};
      existingUsers.forEach((u) => {
        states[u.connectionId] = {
          connectionId: u.connectionId,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
        };
      });
      setUserStates(states);

      // Initiate peer connections to all existing users
      for (const u of existingUsers) {
        await createPeerConnection(u.connectionId, true, roomIdRef.current!);
      }
    };

    const onToggleMic = (data: { connectionId: string; isMuted: boolean }) => {
      setUserStates((prev) => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isMuted: data.isMuted,
        },
      }));
    };

    const onToggleCamera = (data: {
      connectionId: string;
      isCameraOff: boolean;
    }) => {
      setUserStates((prev) => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isCameraOff: data.isCameraOff,
        },
      }));
    };

    const onScreenShareStart = (data: {
      connectionId: string;
      fullName: string;
    }) => {
      console.log("[Room] Screen share started by:", data.fullName);
      setScreenSharingUser(data.connectionId);
      setUserStates((prev) => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isScreenSharing: true,
        },
      }));
    };

    const onScreenShareStop = (data: { connectionId: string }) => {
      console.log("[Room] Screen share stopped:", data.connectionId);
      setScreenSharingUser(null);
      setUserStates((prev) => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isScreenSharing: false,
        },
      }));
    };

    connection.on("UserJoined", onUserJoined);
    connection.on("userjoined", onUserJoined); // fallback
    connection.on("UserLeft", onUserLeft);
    connection.on("userleft", onUserLeft); // fallback
    connection.on("ExistingUsers", onExistingUsers);
    connection.on("existingusers", onExistingUsers); // Exact match from server warning
    connection.on("UserToggleMic", onToggleMic);
    connection.on("usertogglemic", onToggleMic); // fallback
    connection.on("UserToggleCamera", onToggleCamera);
    connection.on("usertogglecamera", onToggleCamera); // fallback
    connection.on("UserStartedScreenShare", onScreenShareStart);
    connection.on("userstartedscreenshare", onScreenShareStart); // fallback
    connection.on("UserStoppedScreenShare", onScreenShareStop);
    connection.on("userstoppedscreenshare", onScreenShareStop); // fallback

    return () => {
      connection.off("UserJoined", onUserJoined);
      connection.off("userjoined", onUserJoined);
      connection.off("UserLeft", onUserLeft);
      connection.off("userleft", onUserLeft);
      connection.off("ExistingUsers", onExistingUsers);
      connection.off("existingusers", onExistingUsers);
      connection.off("UserToggleMic", onToggleMic);
      connection.off("usertogglemic", onToggleMic);
      connection.off("UserToggleCamera", onToggleCamera);
      connection.off("usertogglecamera", onToggleCamera);
      connection.off("UserStartedScreenShare", onScreenShareStart);
      connection.off("userstartedscreenshare", onScreenShareStart);
      connection.off("UserStoppedScreenShare", onScreenShareStop);
      connection.off("userstoppedscreenshare", onScreenShareStop);
    };
  }, [connection, createPeerConnection, peers, setRemoteStreams, roomIdRef]);

  return {
    users,
    userStates,
    localStream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenSharingUser,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    resetState,
  };
}
