export interface RoomUser {
  connectionId: string;
  userId: string;
  fullName: string;
}

export interface UserMediaState {
  connectionId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

export interface ChatMessage {
  messageId: string;
  connectionId: string;
  userId: string;
  fullName: string;
  message: string;
  timestamp: string;
}

export type SignalType = 'offer' | 'answer' | 'candidate';

export interface SignalData {
  type: SignalType;
  sdp?: string; // For offer/answer
  candidate?: RTCIceCandidateInit; // For candidate
}

export interface WebRtcContextType {
  connection: any; // HubConnection type
  users: RoomUser[];
  userStates: Record<string, UserMediaState>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  peers: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  remoteStreams: Record<string, MediaStream>;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenSharingUser: string | null;
}
