import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getUserId } from "~/utils/auth";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useMediaPreview } from "../hooks/useMediaPreview";
import { VideoPreview } from "./VideoPreview";

// ── Types ────────────────────────────────────────────────────────

export interface RoomAccessGateProps {
  /** Pre-filled room code (from URL param) */
  roomCode?: string;
  /** Callback when user clicks Join */
  onJoinRoom: (
    roomCode: string,
    userId: string,
    displayName: string,
    role: string,
  ) => void;
  isJoining?: boolean;
  error?: string | null;
  /** UI customisation */
  title?: string;
  subtitle?: string;
  backPath?: string;
  backLabel?: string;
  /** Whether to show the role selector (default false) */
  showRoleSelector?: boolean;
  /** Available roles for the selector */
  roleOptions?: { value: string; label: string }[];
  /** Admin: callback to create a new room. If provided, shows "Create room" button */
  onCreateRoom?: () => void;
  isCreatingRoom?: boolean;
}

// ── Main Component ───────────────────────────────────────────────

const GenericRoomAccessGate: React.FC<RoomAccessGateProps> = ({
  roomCode: initialRoomCode,
  onJoinRoom,
  isJoining = false,
  error = null,
  title = "Phòng họp trực tuyến",
  subtitle = "Nhập mã phòng để tham gia",
  backPath = "/home",
  backLabel = "← Quay lại",
  showRoleSelector = false,
  roleOptions = [
    { value: "Participant", label: "Người tham gia" },
    { value: "Host", label: "Chủ trì" },
  ],
  onCreateRoom,
  isCreatingRoom = false,
}) => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(initialRoomCode || "");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(roleOptions[0]?.value || "Participant");

  const { user: authUser } = useCurrentUser();
  const mediaPreview = useMediaPreview();

  useEffect(() => {
    if (authUser?.fullName) setDisplayName(authUser.fullName);
  }, [authUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !displayName.trim()) return;
    const userId = getUserId();
    // Stop preview stream before joining (MeetingRoom will acquire its own)
    mediaPreview.stopMedia();
    onJoinRoom(roomCode.trim(), userId, displayName.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
            <p className="text-orange-100 text-sm">{subtitle}</p>
          </div>

          <div className="p-6 md:p-8">
            {/* 2-column layout: preview + form */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Video Preview */}
              <div className="md:w-1/2 flex-shrink-0">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
                  Xem trước
                </p>
                <VideoPreview
                  stream={mediaPreview.stream}
                  isAudioOn={mediaPreview.isAudioOn}
                  isVideoOn={mediaPreview.isVideoOn}
                  hasPermission={mediaPreview.hasPermission}
                  onToggleAudio={mediaPreview.toggleAudio}
                  onToggleVideo={mediaPreview.toggleVideo}
                  displayName={displayName}
                />
              </div>

              {/* Right: Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
                {/* Room code */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">
                    Mã phòng <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="VD: a3f9-xk2m"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-lg font-mono text-center tracking-widest"
                    required
                    readOnly={!!initialRoomCode}
                  />
                </div>

                {/* Display name */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all"
                    required
                    disabled
                  />
                </div>

                {/* Role selector (optional) */}
                {showRoleSelector && (
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">
                      Vai trò
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all"
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-800">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2.5 mt-auto">
                  {/* Join button */}
                  <button
                    type="submit"
                    disabled={isJoining || !roomCode.trim() || !displayName.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base rounded-xl hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isJoining ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang kết nối...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Tham gia phòng
                      </span>
                    )}
                  </button>

                  {/* Create room button (admin only) */}
                  {onCreateRoom && (
                    <button
                      type="button"
                      onClick={onCreateRoom}
                      disabled={isCreatingRoom}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 hover:border-orange-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingRoom ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Đang tạo phòng...
                        </span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Tạo phòng mới
                        </>
                      )}
                    </button>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-0.5">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 text-xs">hoặc</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="w-full py-2.5 text-white/60 text-sm font-medium hover:text-white transition-colors"
                  >
                    {backLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericRoomAccessGate;
