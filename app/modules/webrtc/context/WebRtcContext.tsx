import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { RoomUser, SignalData } from '../types';

interface WebRtcContextType {
  connection: HubConnection | null;
  users: RoomUser[];
  localStream: MediaStream | null;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  peers: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  remoteStreams: Record<string, MediaStream>;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const WebRtcContext = createContext<WebRtcContextType | undefined>(undefined);

export const useWebRtcContext = () => {
  const context = useContext(WebRtcContext);
  if (!context) {
    throw new Error('useWebRtcContext must be used within a WebRtcProvider');
  }
  return context;
};

// Configuration for ICE servers (STUN/TURN)
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const WebRtcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Map of connectionId -> RTCPeerConnection
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize SignalR Connection
  useEffect(() => {
    const initSignalR = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://localhost:7237';
      
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${backendUrl}/webrtc`, {
          accessTokenFactory: () => accessToken || ''
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      newConnection.onclose(() => {
        setIsConnected(false);
        setUsers([]);
        setRemoteStreams({});
        cleanupPeers();
      });

      try {
        await newConnection.start();
        console.log('SignalR Connected');
        setConnection(newConnection);
        setIsConnected(true);
      } catch (err) {
        console.error('SignalR Connection Failed: ', err);
      }
    };

    initSignalR();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  // Handle SignalR Events
  useEffect(() => {
    if (!connection) return;

    // When a new user joins
    connection.on('UserJoined', (user: RoomUser) => {
      console.log('User joined:', user);
      setUsers(prev => [...prev, user]);
    });

    // When a user leaves
    connection.on('UserLeft', (user: RoomUser) => {
      if (!user) return;
      console.log('User left:', user);
      setUsers(prev => prev.filter(u => u.connectionId !== user.connectionId));
      setRemoteStreams(prev => {
        const newState = { ...prev };
        delete newState[user.connectionId];
        return newState;
      });
      
      // Close peer connection
      const pc = peers.current.get(user.connectionId);
      if (pc) {
        pc.close();
        peers.current.delete(user.connectionId);
      }
    });

    // Receive existing users list when joining
    connection.on('ExistingUsers', async (existingUsers: RoomUser[]) => {
      console.log('Existing users:', existingUsers);
      setUsers(existingUsers);
      
      // Initiate connections to all existing users
      for (const user of existingUsers) {
        await createPeerConnection(user.connectionId, true, currentRoomId!);
      }
    });

    // Handle Signaling
    connection.on('ReceiveSignal', async (fromUser: RoomUser, signal: any) => {
      const { type, sdp, candidate } = signal;
      const { connectionId } = fromUser;
      
      let pc = peers.current.get(connectionId);
      
      if (!pc) {
        if (type === 'offer') {
            await createPeerConnection(connectionId, false, currentRoomId!, fromUser);
            pc = peers.current.get(connectionId);
        } else {
            console.warn('Received signal for unknown peer and not an offer:', connectionId, type);
            return;
        }
      }

      try {
        if (type === 'offer' && sdp) {
          await pc!.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
          const answer = await pc!.createAnswer();
          await pc!.setLocalDescription(answer);
          
          await connection.invoke('SendSignal', currentRoomId, connectionId, {
            type: 'answer',
            sdp: answer.sdp
          });
        } 
        else if (type === 'answer' && sdp) {
          await pc!.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
        } 
        else if (type === 'candidate' && candidate) {
          await pc!.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    });

    return () => {
      connection.off('UserJoined');
      connection.off('UserLeft');
      connection.off('ExistingUsers');
      connection.off('ReceiveSignal');
    };
  }, [connection, currentRoomId, localStream]);

  const createPeerConnection = async (targetConnectionId: string, isInitiator: boolean, roomId: string, user?: RoomUser) => {
    if (peers.current.has(targetConnectionId)) return;

    console.log(`Creating PeerConnection for ${targetConnectionId}, initiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && connection) {
        connection.invoke('SendSignal', roomId, targetConnectionId, {
          type: 'candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Handle incoming stream
    pc.ontrack = (event) => {
      console.log(`Received remote stream from ${targetConnectionId}`);
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => ({
            ...prev,
            [targetConnectionId]: event.streams[0]
        }));
      }
    };

    peers.current.set(targetConnectionId, pc);

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        await connection!.invoke('SendSignal', roomId, targetConnectionId, {
          type: 'offer',
          sdp: offer.sdp
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }
  };

  const cleanupPeers = () => {
    peers.current.forEach(pc => pc.close());
    peers.current.clear();
    setRemoteStreams({});
  };

  const joinRoom = async (roomId: string) => {
    if (!connection) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const fullName = user.fullName || 'Guest';
      const userId = user.id;

      await connection.invoke('JoinRoom', roomId, userId, fullName);
      setCurrentRoomId(roomId);
    } catch (err) {
      console.error('Error joining room:', err);
      throw err;
    }
  };

  const leaveRoom = async () => {
    if (connection && currentRoomId) {
      await connection.invoke('LeaveRoom', currentRoomId);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    cleanupPeers();
    setUsers([]);
    setCurrentRoomId(null);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <WebRtcContext.Provider value={{
      connection,
      users,
      localStream,
      remoteStreams,
      joinRoom,
      leaveRoom,
      toggleAudio,
      toggleVideo,
      peers,
      isConnected,
      isAudioEnabled,
      isVideoEnabled
    }}>
      {children}
    </WebRtcContext.Provider>
  );
};
