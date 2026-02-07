import React, { useEffect, useState, useRef } from 'react';
import { useWebRtc } from '../hooks/useWebRtc';
import { VideoTile } from './VideoTile';
import { ControlBar } from './ControlBar';
import { ChatPanel } from './ChatPanel';

export const MeetingRoom: React.FC<{ roomId: string; onLeave: () => void }> = ({ roomId, onLeave }) => {
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
    isScreenSharing,
    screenSharingUser,
    messages,
    sendMessage
  } = useWebRtc();

  const [spotlightUser, setSpotlightUser] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadCountRef = useRef(0);
  
  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.userId;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId).catch(console.error);
    }
    
    return () => {
      leaveRoom();
    };
  }, [isConnected, roomId]);

  // Auto-spotlight screen sharing user (including self)
  useEffect(() => {
    if (isScreenSharing) {
      setSpotlightUser('local');
    } else if (screenSharingUser) {
      setSpotlightUser(screenSharingUser);
    } else {
      setSpotlightUser(null);
    }
  }, [screenSharingUser, isScreenSharing]);

  // Debug: Log screen share state changes
  useEffect(() => {
    console.log('[MeetingRoom] Screen share state:', {
      isScreenSharing,
      screenStream: screenStream ? 'exists' : 'null',
      screenStreamTracks: screenStream?.getTracks().length || 0,
      localStream: localStream ? 'exists' : 'null',
      spotlightUser
    });
  }, [isScreenSharing, screenStream, localStream, spotlightUser]);

  // Track unread messages
  useEffect(() => {
    if (!isChatOpen && messages.length > lastReadCountRef.current) {
      setUnreadCount(messages.length - lastReadCountRef.current);
    }
  }, [messages, isChatOpen]);

  const handleLeave = () => {
    leaveRoom();
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
  const isSpotlightMode = spotlightUser !== null;
  
  const getGridClass = () => {
    if (isSpotlightMode) return 'grid-cols-1';
    if (totalParticipants === 1) return 'grid-cols-1 max-w-3xl';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (totalParticipants <= 4) return 'grid-cols-1 md:grid-cols-2 max-w-6xl';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-full';
  };

  // Get the stream to display for spotlight
  const getSpotlightContent = () => {
    if (!spotlightUser) return null;
    
    if (spotlightUser === 'local') {
      return {
        stream: isScreenSharing ? screenStream : localStream,
        label: 'Bạn',
        isLocal: true
      };
    }
    
    const user = users.find(u => u.connectionId === spotlightUser);
    const stream = remoteStreams[spotlightUser];
    const state = userStates[spotlightUser];
    
    return {
      stream,
      label: user?.fullName || 'User',
      isLocal: false,
      isMuted: state?.isMuted || false,
      isCameraOff: state?.isCameraOff || false,
      isScreenSharing: state?.isScreenSharing || false
    };
  };

  const spotlightContent = getSpotlightContent();

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          {/* Room info */}
          <div>
            <h1 className="text-white font-semibold text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {roomId}
              </span>
              {screenSharingUser && (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                  Đang chia sẻ màn hình
                </span>
              )}
            </h1>
            <p className="text-gray-400 text-sm">
              {totalParticipants} người tham gia
            </p>
          </div>
        </div>

        {/* Room actions */}
        <div className="flex items-center gap-3">
          {/* Participants badge */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-white font-medium">{totalParticipants}</span>
          </div>

          {/* Exit spotlight button */}
          {isSpotlightMode && (
            <button 
              onClick={() => setSpotlightUser(null)}
              className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="hidden sm:inline text-sm">Thoát phóng to</span>
            </button>
          )}

          {/* Copy room ID */}
          <button 
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="hidden sm:inline text-sm">Sao chép mã</span>
          </button>
        </div>
      </header>

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
                isVideoEnabled={spotlightContent.isLocal ? (isScreenSharing || isVideoEnabled) : !spotlightContent.isCameraOff}
                isAudioEnabled={spotlightContent.isLocal ? isAudioEnabled : !spotlightContent.isMuted}
                isSpotlight
                isScreenSharing={spotlightContent.isScreenSharing}
                onClick={() => setSpotlightUser(null)}
              />
            </div>
            
            {/* Thumbnail strip */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* Local user thumbnail (if not spotlighted) */}
              {spotlightUser !== 'local' && (
                <div className="flex-shrink-0 w-40">
                  <VideoTile 
                    stream={isScreenSharing ? screenStream : localStream} 
                    muted 
                    label="Bạn"
                    isLocal
                    isVideoEnabled={isScreenSharing || isVideoEnabled}
                    isAudioEnabled={isAudioEnabled}
                    isThumbnail
                    onClick={() => handleVideoClick('local')}
                  />
                </div>
              )}
              
              {/* Remote users thumbnails */}
              {users.map(user => {
                if (user.connectionId === spotlightUser) return null;
                const stream = remoteStreams[user.connectionId];
                const state = userStates[user.connectionId];
                return (
                  <div key={user.connectionId} className="flex-shrink-0 w-40">
                    <VideoTile 
                      stream={stream} 
                      label={user.fullName}
                      isVideoEnabled={!state?.isCameraOff}
                      isAudioEnabled={!state?.isMuted}
                      isScreenSharing={state?.isScreenSharing}
                      isThumbnail
                      onClick={() => handleVideoClick(user.connectionId)}
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
              onClick={() => handleVideoClick('local')}
            />

            {/* Remote Users */}
            {users.map(user => {
              const stream = remoteStreams[user.connectionId];
              const state = userStates[user.connectionId];
              return (
                <VideoTile 
                  key={user.connectionId} 
                  stream={stream} 
                  label={user.fullName}
                  isVideoEnabled={!state?.isCameraOff}
                  isAudioEnabled={!state?.isMuted}
                  isScreenSharing={state?.isScreenSharing}
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
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) {
            setUnreadCount(0);
            lastReadCountRef.current = messages.length;
          }
        }}
        onLeave={handleLeave}
      />

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        onSendMessage={sendMessage}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setUnreadCount(0);
          lastReadCountRef.current = messages.length;
        }}
        currentUserId={getCurrentUserId()}
      />
    </div>
  );
};

export default MeetingRoom;
