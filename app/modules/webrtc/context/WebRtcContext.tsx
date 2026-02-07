import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import type { RoomUser, UserMediaState, ChatMessage } from '../types';

interface WebRtcContextType {
  connection: HubConnection | null;
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
  // Chat
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
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
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
  ]
};

export const WebRtcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [userStates, setUserStates] = useState<Record<string, UserMediaState>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingUser, setScreenSharingUser] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize SignalR Connection
  useEffect(() => {
    const initSignalR = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ef55-58-187-78-183.ngrok-free.app';
      
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
        setUserStates({});
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
      console.log('[UserJoined] Current refs:', {
        isScreenSharing: isScreenSharingRef.current,
        screenStream: screenStreamRef.current ? 'exists' : 'null',
        localStream: localStreamRef.current ? 'exists' : 'null',
        roomId: roomIdRef.current
      });
      // Prevent duplicates
      setUsers(prev => {
        if (prev.some(u => u.connectionId === user.connectionId)) {
          return prev;
        }
        return [...prev, user];
      });
      setUserStates(prev => ({
        ...prev,
        [user.connectionId]: {
          connectionId: user.connectionId,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false
        }
      }));
    });

    // When a user leaves
    connection.on('UserLeft', (user: RoomUser) => {
      if (!user) return;
      console.log('User left:', user);
      setUsers(prev => prev.filter(u => u.connectionId !== user.connectionId));
      setUserStates(prev => {
        const newState = { ...prev };
        delete newState[user.connectionId];
        return newState;
      });
      setRemoteStreams(prev => {
        const newState = { ...prev };
        delete newState[user.connectionId];
        return newState;
      });
      
      // Check if leaving user was screen sharing
      if (screenSharingUser === user.connectionId) {
        setScreenSharingUser(null);
      }
      
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
      
      // Initialize states for existing users
      const states: Record<string, UserMediaState> = {};
      existingUsers.forEach(user => {
        states[user.connectionId] = {
          connectionId: user.connectionId,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false
        };
      });
      setUserStates(states);
      
      // Initiate connections to all existing users
      for (const user of existingUsers) {
        await createPeerConnection(user.connectionId, true, roomIdRef.current!);
      }
    });

    // Handle Signaling
    connection.on('ReceiveSignal', async (fromUser: RoomUser, signal: any) => {
      const { type, sdp, candidate } = signal;
      const { connectionId } = fromUser;
      
      let pc = peers.current.get(connectionId);
      
      if (!pc) {
        if (type === 'offer') {
            await createPeerConnection(connectionId, false, roomIdRef.current!, fromUser);
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
          
          await connection.invoke('SendSignal', roomIdRef.current!, connectionId, {
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

    // Handle mic toggle from other users
    connection.on('UserToggleMic', (data: { connectionId: string; isMuted: boolean }) => {
      console.log('User toggled mic:', data);
      setUserStates(prev => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isMuted: data.isMuted
        }
      }));
    });

    // Handle camera toggle from other users
    connection.on('UserToggleCamera', (data: { connectionId: string; isCameraOff: boolean }) => {
      console.log('User toggled camera:', data);
      setUserStates(prev => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isCameraOff: data.isCameraOff
        }
      }));
    });

    // Handle screen share start
    connection.on('UserStartedScreenShare', (data: { connectionId: string; fullName: string }) => {
      console.log('User started screen share:', data);
      setScreenSharingUser(data.connectionId);
      setUserStates(prev => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isScreenSharing: true
        }
      }));
    });

    // Handle screen share stop
    connection.on('UserStoppedScreenShare', (data: { connectionId: string }) => {
      console.log('User stopped screen share:', data);
      setScreenSharingUser(null);
      setUserStates(prev => ({
        ...prev,
        [data.connectionId]: {
          ...prev[data.connectionId],
          isScreenSharing: false
        }
      }));
    });

    // Handle chat messages
    connection.on('ReceiveMessage', (data: { messageId: string; connectionId: string; userId: string; fullName: string; message: string; timestamp: string }) => {
      console.log('Received message:', data);
      setMessages(prev => [...prev, {
        messageId: data.messageId,
        connectionId: data.connectionId,
        userId: data.userId,
        fullName: data.fullName,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    return () => {
      connection.off('UserJoined');
      connection.off('UserLeft');
      connection.off('ExistingUsers');
      connection.off('ReceiveSignal');
      connection.off('UserToggleMic');
      connection.off('UserToggleCamera');
      connection.off('UserStartedScreenShare');
      connection.off('UserStoppedScreenShare');
      connection.off('ReceiveMessage');
    };
  }, [connection, currentRoomId, localStream, screenSharingUser]);

  const createPeerConnection = async (targetConnectionId: string, isInitiator: boolean, roomId: string, user?: RoomUser) => {
    if (peers.current.has(targetConnectionId)) return;

    console.log(`Creating PeerConnection for ${targetConnectionId}, initiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Add local tracks - use screen stream if currently sharing (use refs for current values)
    const currentScreenStream = screenStreamRef.current;
    const currentLocalStream = localStreamRef.current;
    const currentlyScreenSharing = isScreenSharingRef.current;
    
    const streamToShare = currentlyScreenSharing && currentScreenStream ? currentScreenStream : currentLocalStream;
    
    console.log(`createPeerConnection: isScreenSharing=${currentlyScreenSharing}, streamToShare=${streamToShare ? 'exists' : 'null'}`);
    
    if (streamToShare) {
      streamToShare.getTracks().forEach(track => {
        pc.addTrack(track, streamToShare);
      });
    }
    
    // If screen sharing but also have audio from localStream, add that too
    if (currentlyScreenSharing && currentLocalStream) {
      const audioTrack = currentLocalStream.getAudioTracks()[0];
      if (audioTrack && !streamToShare?.getAudioTracks().length) {
        pc.addTrack(audioTrack, currentLocalStream);
      }
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
      // Try to get media devices - gracefully handle if not available
      let stream: MediaStream | null = null;
      let hasAudio = false;
      let hasVideo = false;

      // Try video + audio first
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        hasAudio = true;
        hasVideo = true;
      } catch {
        // Try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          hasAudio = true;
          hasVideo = false;
          console.log('Joining with audio only (no camera access)');
        } catch {
          // Try video only
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            hasAudio = false;
            hasVideo = true;
            console.log('Joining with video only (no microphone access)');
          } catch {
            // No media devices available - join as listener
            console.log('Joining as listener (no camera/mic access)');
            stream = null;
            hasAudio = false;
            hasVideo = false;
          }
        }
      }

      if (stream) {
        setLocalStream(stream);
        localStreamRef.current = stream;
      }
      setIsAudioEnabled(hasAudio);
      setIsVideoEnabled(hasVideo);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const fullName = user.fullName || 'Guest';
      const userId = user.userId || '00000000-0000-0000-0000-000000000000';

      roomIdRef.current = roomId;
      await connection.invoke('JoinRoom', roomId, userId, fullName);
      setCurrentRoomId(roomId);
    } catch (err) {
      console.error('Error joining room:', err);
      throw err;
    }
  };

  const leaveRoom = async () => {
    if (connection && roomIdRef.current) {
      await connection.invoke('LeaveRoom', roomIdRef.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
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
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Notify backend (optional, ignore if method doesn't exist)
        if (connection && roomIdRef.current) {
          connection.invoke('ToggleMic', roomIdRef.current, !audioTrack.enabled).catch(() => {});
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Notify backend (optional, ignore if method doesn't exist)
        if (connection && roomIdRef.current) {
          connection.invoke('ToggleCamera', roomIdRef.current, !videoTrack.enabled).catch(() => {});
        }
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true 
      });
      
      // Update both state and refs immediately
      setScreenStream(stream);
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      
      // Replace or add video track in all peer connections
      const screenVideoTrack = stream.getVideoTracks()[0];
      
      for (const [connectionId, pc] of peers.current) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        
        if (videoSender) {
          // Replace existing video track
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          // No video sender - add track and renegotiate
          pc.addTrack(screenVideoTrack, stream);
          
          // Renegotiate
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            await connection!.invoke('SendSignal', roomIdRef.current!, connectionId, {
              type: 'offer',
              sdp: offer.sdp
            });
          } catch (err) {
            console.error('Error renegotiating for screen share:', err);
          }
        }
      }
      
      // Notify backend (optional, ignore if method doesn't exist)
      if (connection && roomIdRef.current) {
        connection.invoke('StartScreenShare', roomIdRef.current).catch(() => {});
      }
      
      // Handle when user stops sharing via browser UI
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  };

  const stopScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
      
      // Restore camera track in all peer connections
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          peers.current.forEach(pc => {
            const senders = pc.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
          });
        }
      }
      
      // Notify backend (optional, ignore if method doesn't exist)
      if (connection && roomIdRef.current) {
        connection.invoke('StopScreenShare', roomIdRef.current).catch(() => {});
      }
    }
  };

  const sendMessage = (message: string) => {
    if (!connection || !roomIdRef.current || !message.trim()) return;
    connection.invoke('SendMessage', roomIdRef.current, message.trim()).catch(err => {
      console.error('Error sending message:', err);
    });
  };

  return (
    <WebRtcContext.Provider value={{
      connection,
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
      peers,
      isConnected,
      isAudioEnabled,
      isVideoEnabled,
      isScreenSharing,
      screenSharingUser,
      messages,
      sendMessage
    }}>
      {children}
    </WebRtcContext.Provider>
  );
};
