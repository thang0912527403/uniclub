import React, { useEffect, useRef } from 'react';
import { useWebRtc } from '../hooks/useWebRtc';

const VideoPlayer: React.FC<{ stream: MediaStream; muted?: boolean; label?: string }> = ({ stream, muted, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
          {label}
        </div>
      )}
    </div>
  );
};

export const MeetingRoom: React.FC<{ roomId: string; onLeave: () => void }> = ({ roomId, onLeave }) => {
  const {
    users,
    localStream,
    remoteStreams,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    isConnected
  } = useWebRtc();

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId).catch(console.error);
    }
    
    return () => {
      // Leave room when component unmounts? 
      // Or maybe let the user manually leave.
      // For now, let's leave when unmount to be safe.
      leaveRoom();
    };
  }, [isConnected, roomId]); // Warning: joinRoom might be persistent

  // We need to ensure we don't join multiple times or loops.
  // The context handles `currentRoomId` so joinRoom logic should be idempotent-ish or checked.
  // Actually context check `if (!connection) return`.
  // It sends `JoinRoom` signal.

  return (
    <div className="flex flex-col h-full bg-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Room: {roomId}</h2>
            <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {users.length} Users
                </span>
                <button 
                    onClick={() => { leaveRoom(); onLeave(); }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                    Leave Room
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
            {/* Local User */}
            {localStream && (
                <VideoPlayer stream={localStream} muted label="You" />
            )}

            {/* Remote Users */}
            {users.map(user => {
                const stream = remoteStreams[user.connectionId];
                if (!stream) return null; // Or render placeholder
                return (
                    <VideoPlayer 
                        key={user.connectionId} 
                        stream={stream} 
                        label={user.fullName} 
                    />
                );
            })}
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex justify-center gap-4">
            <button 
                onClick={toggleAudio}
                className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
                {isAudioEnabled ? 'Mic On' : 'Mic Off'}
            </button>
            <button 
                onClick={toggleVideo}
                className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
                {isVideoEnabled ? 'Cam On' : 'Cam Off'}
            </button>
        </div>
    </div>
  );
};
