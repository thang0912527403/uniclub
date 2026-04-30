import { useState, useRef, useCallback, useEffect } from "react";
import type { HubConnection } from "@microsoft/signalr";
import type { RoomUser } from "../types";
import { rtcConfig } from "../config/rtcConfig";

/**
 * Manages WebRTC peer connections and remote media streams.
 * Handles ICE candidates, offer/answer signaling, and incoming tracks.
 *
 * @param connection    — active SignalR hub connection
 * @param localStreamRef     — ref to local MediaStream
 * @param screenStreamRef    — ref to screen-share MediaStream
 * @param isScreenSharingRef — ref to screen-sharing flag
 * @param roomIdRef          — ref to current room ID
 */
export function usePeerConnections(
  connection: HubConnection | null,
  localStreamRef: React.MutableRefObject<MediaStream | null>,
  screenStreamRef: React.MutableRefObject<MediaStream | null>,
  isScreenSharingRef: React.MutableRefObject<boolean>,
  roomIdRef: React.MutableRefObject<string | null>,
) {
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});

  // Keep a ref to connection so callbacks stay stable
  const connectionRef = useRef(connection);
  connectionRef.current = connection;

  // ── Create Peer Connection ────────────────────────────────────────

  const createPeerConnection = useCallback(
    async (
      targetConnectionId: string,
      isInitiator: boolean,
      roomId: string,
    ) => {
      if (peers.current.has(targetConnectionId)) return;

      console.log(
        `[Peer] Creating for ${targetConnectionId}, initiator: ${isInitiator}`,
      );
      const pc = new RTCPeerConnection(rtcConfig);

      // Determine which stream to send (screen or camera)
      const currentScreenStream = screenStreamRef.current;
      const currentLocalStream = localStreamRef.current;
      const currentlyScreenSharing = isScreenSharingRef.current;

      const streamToShare =
        currentlyScreenSharing && currentScreenStream
          ? currentScreenStream
          : currentLocalStream;

      if (streamToShare) {
        streamToShare.getTracks().forEach((track) => {
          pc.addTrack(track, streamToShare);
        });
      }

      // If screen sharing, also attach audio from local stream
      if (currentlyScreenSharing && currentLocalStream) {
        const audioTrack = currentLocalStream.getAudioTracks()[0];
        if (audioTrack && !streamToShare?.getAudioTracks().length) {
          pc.addTrack(audioTrack, currentLocalStream);
        }
      }

      // CRITICAL: Ensure both audio and video transceivers exist in the SDP.
      // Without this, a user who joins with audio-only would create an offer
      // with no video m-line, making it impossible for the remote peer
      // (who may be screen sharing or have camera on) to send video back.
      const senders = pc.getSenders();
      const hasAudioSender = senders.some((s) => s.track?.kind === "audio");
      const hasVideoSender = senders.some((s) => s.track?.kind === "video");

      if (!hasAudioSender) {
        pc.addTransceiver("audio", { direction: "recvonly" });
      }
      if (!hasVideoSender) {
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      // ICE candidate → send via SignalR
      pc.onicecandidate = (event) => {
        if (event.candidate && connectionRef.current) {
          connectionRef.current.invoke(
            "SendSignal",
            roomId,
            targetConnectionId,
            {
              type: "candidate",
              candidate: event.candidate.toJSON(),
            },
          );
        }
      };

      // Incoming remote track
      pc.ontrack = (event) => {
        console.log(
          `[Peer] Remote track from ${targetConnectionId}`,
          event.track.kind,
        );
        if (event.streams?.[0]) {
          // Use the stream directly from the peer connection.
          // Do NOT clone it — cloning creates a detached copy that won't reflect
          // future replaceTrack() calls (e.g. camera ↔ screen sharing swap).
          setRemoteStreams((prev) => ({
            ...prev,
            [targetConnectionId]: event.streams[0],
          }));
        }
      };

      peers.current.set(targetConnectionId, pc);

      // Initiator creates and sends offer
      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await connectionRef.current!.invoke(
            "SendSignal",
            roomId,
            targetConnectionId,
            {
              type: "offer",
              sdp: offer.sdp,
            },
          );
        } catch (err) {
          console.error("[Peer] Error creating offer:", err);
        }
      }
    },
    // All external values accessed via refs → stable callback
    [localStreamRef, screenStreamRef, isScreenSharingRef],
  );

  // ── Cleanup ───────────────────────────────────────────────────────

  const cleanupPeers = useCallback(() => {
    peers.current.forEach((pc) => pc.close());
    peers.current.clear();
    setRemoteStreams({});
  }, []);

  // ── Signaling Event Handler ───────────────────────────────────────

  useEffect(() => {
    if (!connection) return;

    const handleSignal = async (fromUser: any, signal: any) => {
      // Handle both camelCase and PascalCase from server
      const connectionId = fromUser.connectionId || fromUser.ConnectionId;
      const type = signal.type || signal.Type;
      const sdp = signal.sdp || signal.Sdp;
      const candidate = signal.candidate || signal.Candidate;

      if (!connectionId) return;

      let pc = peers.current.get(connectionId);

      // If we don't have a peer and this is an offer, create one as receiver
      if (!pc) {
        if (type === "offer") {
          await createPeerConnection(connectionId, false, roomIdRef.current!);
          pc = peers.current.get(connectionId);
        } else {
          console.warn(
            "[Peer] Signal for unknown peer (not an offer):",
            connectionId,
            type,
          );
          return;
        }
      }

      try {
        if (type === "offer" && sdp) {
          await pc!.setRemoteDescription(
            new RTCSessionDescription({ type: "offer", sdp }),
          );
          const answer = await pc!.createAnswer();
          await pc!.setLocalDescription(answer);
          await connection.invoke(
            "SendSignal",
            roomIdRef.current!,
            connectionId,
            {
              type: "answer",
              sdp: answer.sdp,
            },
          );
        } else if (type === "answer" && sdp) {
          await pc!.setRemoteDescription(
            new RTCSessionDescription({ type: "answer", sdp }),
          );
        } else if (type === "candidate" && candidate) {
          await pc!.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("[Peer] Error handling signal:", err);
      }
    };

    connection.on("ReceiveSignal", handleSignal);
    connection.on("receivesignal", handleSignal);
    return () => {
      connection.off("ReceiveSignal", handleSignal);
      connection.off("receivesignal", handleSignal);
    };
  }, [connection, createPeerConnection, roomIdRef]);

  return {
    peers,
    remoteStreams,
    createPeerConnection,
    cleanupPeers,
    setRemoteStreams,
  };
}
