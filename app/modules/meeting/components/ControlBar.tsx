import React from 'react';

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  unreadCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  isHandRaised: boolean;
  onToggleHand: () => void;
  onLeave: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isChatOpen,
  unreadCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  isHandRaised,
  onToggleHand,
  onLeave
}) => {

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full border border-gray-200 shadow-xl">
        {/* Mic Toggle */}
        <button
          onClick={onToggleAudio}
          className={`group relative p-3 rounded-full transition-all duration-300 flex items-center justify-center w-12 h-12 ${
            isAudioEnabled 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          }`}
          title={isAudioEnabled ? 'Tắt micro' : 'Bật micro'}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
          {/* Tooltip */}
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isAudioEnabled ? 'Tắt micro' : 'Bật micro'}
          </span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleVideo}
          className={`group relative p-3 rounded-full transition-all duration-300 flex items-center justify-center w-12 h-12 ${
            isVideoEnabled 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          }`}
          title={isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          )}
          {/* Tooltip */}
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20"></div>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`group relative p-3 rounded-full transition-all duration-300 flex items-center justify-center w-12 h-12 ${
            isScreenSharing 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          }`}
          title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
          </span>
        </button>

        {/* Hand Toggle */}
        <button
          onClick={onToggleHand}
          className={`group relative p-3 rounded-full transition-all duration-300 flex items-center justify-center w-12 h-12 ${
            isHandRaised 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          }`}
          title={isHandRaised ? 'Hạ tay xuống' : 'Giơ tay'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v9a7 7 0 11-14 0V9a1 1 0 112 0v2.5a.5.5 0 001 0V5a1 1 0 112 0v3.5a.5.5 0 001 0V3z" clipRule="evenodd" />
          </svg>
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isHandRaised ? 'Hạ tay xuống' : 'Giơ tay'}
          </span>
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`group relative p-3 rounded-full transition-all duration-300 flex items-center justify-center w-12 h-12 ${
            isChatOpen
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white' // Making chat always orange to match reference image
          }`}
          title="Tin nhắn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Tin nhắn
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Leave Call */}
        <button
          onClick={onLeave}
          className="group relative p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 flex items-center justify-center w-12 h-12 shadow-md shadow-red-500/20"
          title="Rời cuộc họp"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V15a2 2 0 01-2 2h-1C9.716 17 3 10.284 3 2V5z" clipRule="evenodd" />
          </svg>
          {/* Tooltip */}
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Rời cuộc họp
          </span>
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
