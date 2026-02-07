export interface RoomUser {
  connectionId: string;
  userId: string;
  fullName: string;
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
  localStream: MediaStream | null;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  peers: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  isConnected: boolean;
}
