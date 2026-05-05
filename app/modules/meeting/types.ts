export interface RoomUser {
  connectionId: string;
  userId: string;
  fullName: string;
  avatar?: string;
}

export interface UserMediaState {
  connectionId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
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
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}
