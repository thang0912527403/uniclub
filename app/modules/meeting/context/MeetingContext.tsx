import React, { createContext, useContext, useRef, useEffect } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import type { RoomUser, UserMediaState, ChatMessage } from '../types';
import { useSignalR } from '../hooks/useSignalR';
import { usePeerConnections } from '../hooks/usePeerConnections';
import { useMediaControls } from '../hooks/useMediaControls';
import { useChat } from '../hooks/useChat';
import { useCurrentUser } from '~/hooks/useCurrentUser';

// ── Context Type ────────────────────────────────────────────────────

interface MeetingContextType {
  connection: HubConnection | null;
  users: RoomUser[];
  userStates: Record<string, UserMediaState>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  peers: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenSharingUser: string | null;
  isHandRaised: boolean;
  toggleHand: () => Promise<void>;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
}

// ── Context ─────────────────────────────────────────────────────────

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const useMeeting = () => {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within a MeetingProvider');
  return ctx;
};

// ── Provider ────────────────────────────────────────────────────────

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useCurrentUser();

  // Shared mutable refs (passed to hooks to avoid stale closures)
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);

  // 1. SignalR connection
  const { connection, isConnected } = useSignalR();

  // 2. Peer connections (WebRTC signaling)
  const peerConns = usePeerConnections(
    connection, localStreamRef, screenStreamRef, isScreenSharingRef, roomIdRef
  );

  // 3. Media controls + user presence
  const media = useMediaControls(
    connection, peerConns,
    { localStreamRef, screenStreamRef, isScreenSharingRef, roomIdRef },
    authUser
  );

  // 4. Chat
  const chat = useChat(connection, roomIdRef);

  // 5. Disconnect cleanup — reset UI state when connection drops
  const prevConnectedRef = useRef(false);
  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      media.resetState();
      peerConns.cleanupPeers();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, media.resetState, peerConns.cleanupPeers]);

  // ── Provide ─────────────────────────────────────────────────────

  return (
    <MeetingContext.Provider value={{
      connection,
      users: media.users,
      userStates: media.userStates,
      localStream: media.localStream,
      screenStream: media.screenStream,
      remoteStreams: peerConns.remoteStreams,
      joinRoom: media.joinRoom,
      leaveRoom: media.leaveRoom,
      toggleAudio: media.toggleAudio,
      toggleVideo: media.toggleVideo,
      startScreenShare: media.startScreenShare,
      stopScreenShare: media.stopScreenShare,
      peers: peerConns.peers,
      isConnected,
      isAudioEnabled: media.isAudioEnabled,
      isVideoEnabled: media.isVideoEnabled,
      isScreenSharing: media.isScreenSharing,
      screenSharingUser: media.screenSharingUser,
      isHandRaised: media.isHandRaised,
      toggleHand: media.toggleHand,
      messages: chat.messages,
      sendMessage: chat.sendMessage
    }}>
      {children}
    </MeetingContext.Provider>
  );
};
