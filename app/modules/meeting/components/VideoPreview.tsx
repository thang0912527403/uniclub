import React, { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  stream: MediaStream | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  hasPermission: boolean | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  displayName: string;
}

/**
 * Camera/mic preview with toggle controls — shown on the pre-join screen.
 * Mirrors the video feed and shows audio level indicator.
 */
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  isAudioOn,
  isVideoOn,
  hasPermission,
  onToggleAudio,
  onToggleVideo,
  displayName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <div className="space-y-3">
      {/* Video area */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-white/10 shadow-inner">
        {isVideoOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Avatar */}
            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 blur-md opacity-40 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>
            </div>
            {hasPermission === false && (
              <p className="text-red-400 text-xs mt-2 text-center px-4">
                Không thể truy cập camera/microphone. Vui lòng cấp quyền trong trình duyệt.
              </p>
            )}
            {hasPermission !== false && !isVideoOn && (
              <p className="text-gray-400 text-xs mt-1">Camera đang tắt</p>
            )}
          </div>
        )}

        {/* Audio level indicator */}
        {isAudioOn && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <div className="w-1.5 h-3 bg-green-400 rounded-full animate-pulse" />
            <div
              className="w-1.5 h-4 bg-green-400 rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-1.5 h-2 bg-green-400 rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}

        {/* Mirror label */}
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
          <span className="text-white text-xs font-medium">{displayName || 'Bạn'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Mic toggle */}
        <button
          type="button"
          onClick={onToggleAudio}
          disabled={hasPermission === false}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            isAudioOn
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              : 'bg-red-500/80 hover:bg-red-600 text-white border border-red-400/30'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={isAudioOn ? 'Tắt micro' : 'Bật micro'}
        >
          {isAudioOn ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isAudioOn ? 'Tắt micro' : 'Bật micro'}
          </span>
        </button>

        {/* Camera toggle */}
        <button
          type="button"
          onClick={onToggleVideo}
          disabled={hasPermission === false}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            isVideoOn
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              : 'bg-red-500/80 hover:bg-red-600 text-white border border-red-400/30'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
        >
          {isVideoOn ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3l18 18"
              />
            </svg>
          )}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isVideoOn ? 'Tắt camera' : 'Bật camera'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;
