import React, { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  isLocal?: boolean;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  isSpotlight?: boolean;
  isThumbnail?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  avatar?: string | null;
  onClick?: () => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  muted = false,
  label = "User",
  isLocal = false,
  isVideoEnabled = true,
  isAudioEnabled = true,
  isSpotlight = false,
  isThumbnail = false,
  isScreenSharing = false,
  isHandRaised = false,
  avatar,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Show video when camera is on OR when screen sharing is active
  const hasVideo =
    stream &&
    (isVideoEnabled || isScreenSharing) &&
    stream.getVideoTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasVideo, isScreenSharing]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`
        group relative rounded-2xl overflow-hidden bg-slate-200 
        shadow-sm border border-slate-300 transition-all duration-300 hover:shadow-md
        ${isSpotlight ? "h-full" : isThumbnail ? "aspect-video" : "aspect-video"}
        ${onClick ? "cursor-pointer" : ""}
        ${isSpotlight ? "ring-2 ring-orange-500/50" : ""}
      `}
      onClick={onClick}
    >
      {/* Video Element — show when camera is on OR screen is being shared */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full ${isScreenSharing ? "object-contain bg-black" : "object-cover"}`}
        />
      ) : (
        /* Avatar Placeholder when no video */
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="relative">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 blur-md opacity-40 animate-pulse"></div>
            {/* Avatar circle */}
            <div
              className={`
              relative rounded-full bg-gradient-to-br from-orange-500 to-amber-600 
              flex items-center justify-center text-white font-bold shadow-lg
              ${isSpotlight ? "w-32 h-32 text-5xl" : isThumbnail ? "w-12 h-12 text-lg" : "w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl"}
            `}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={label}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitials(label)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hand Raised indicator */}
      {isHandRaised && (
        <div className="absolute top-3 right-3 flex items-center justify-center bg-yellow-400/90 backdrop-blur-md w-8 h-8 rounded-full shadow-lg border-2 border-white animate-bounce">
          <i className="fa-solid fa-hand text-white text-sm" />
        </div>
      )}

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-green-500/80 backdrop-blur-md px-2 py-1 rounded-lg border border-green-400/50">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {!isThumbnail && (
            <span className="text-white text-xs font-medium">Đang chia sẻ</span>
          )}
        </div>
      )}

      {/* Name Label with pill shape */}
      <div
        className={`absolute bottom-3 left-3 right-3 flex items-center justify-between ${isThumbnail ? "bottom-2 left-2 right-2" : ""}`}
      >
        <div
          className={`flex items-center gap-2 bg-gray-900/80 rounded-full ${isThumbnail ? "px-2 py-1" : "px-3 py-1.5"}`}
        >
          <span
            className={`text-gray-200 font-medium truncate ${isThumbnail ? "text-[10px] max-w-[60px]" : "text-xs max-w-[120px]"}`}
          >
            {label}
          </span>
          {/* Audio indicator */}
          {!isAudioEnabled ? (
            <svg
              className={`text-red-500 ${isThumbnail ? "w-3 h-3" : "w-3.5 h-3.5"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          ) : (
            <div className="flex items-end gap-0.5 h-3">
              <div
                className="w-1 h-2 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1 h-3 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1 h-1.5 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          )}
        </div>

        {/* Expand/Pin button (shows on hover) */}
        {!isThumbnail && onClick && (
          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 hover:bg-white/20">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSpotlight ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Local indicator */}
      {isLocal && !isThumbnail && (
        <div className="absolute top-3 right-3 bg-gray-900/80 px-3 py-1 rounded-full text-gray-200 text-xs font-semibold">
          You
        </div>
      )}

      {/* Border glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-2xl ring-2 transition-all duration-300 pointer-events-none ${isSpotlight ? "ring-orange-500/50" : "ring-transparent group-hover:ring-orange-500/30"}`}
      ></div>
    </div>
  );
};

export default VideoTile;
