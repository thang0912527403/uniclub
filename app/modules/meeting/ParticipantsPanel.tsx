import React, { useState } from "react";
import { useWebRtc } from "~/modules/webrtc";

interface ParticipantsPanelProps {
  roomCode: string;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ roomCode }) => {
  const { users, userStates, isAudioEnabled, isVideoEnabled } = useWebRtc();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalParticipants = 1 + users.length;

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/interview/room/${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  // Filter users by search
  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1d2e] to-[#151826]">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-users text-white text-sm" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight">
              Mọi người
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {totalParticipants} người trong phòng
            </p>
          </div>
        </div>

        {/* Copy room link card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3.5 mb-3">
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider mb-2">
            Liên kết phòng
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
              <p className="text-white/70 text-xs truncate font-mono">
                {roomCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              title="Sao chép mã phòng"
            >
              <i
                className={`fa-solid ${copied ? "fa-check" : "fa-copy"} text-sm`}
              />
            </button>
          </div>
          <button
            onClick={handleCopyLink}
            className={`w-full mt-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/10"
            }`}
          >
            {copied ? (
              <>
                <i className="fa-solid fa-check" />
                Đã sao chép!
              </>
            ) : (
              <>
                <i className="fa-solid fa-link" />
                Sao chép liên kết phòng
              </>
            )}
          </button>
        </div>

        {/* Search */}
        {totalParticipants > 3 && (
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1">
        {/* Current user (you) */}
        <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 transition-all">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-orange-500/20">
              <i className="fa-solid fa-user text-xs" />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1d2e]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              Bạn
            </p>
            <p className="text-blue-400 text-[10px] font-medium">Chủ phòng</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isAudioEnabled
                  ? "bg-white/10 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
              title={isAudioEnabled ? "Micro đang bật" : "Micro đang tắt"}
            >
              <i
                className={`fa-solid ${isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"} text-[11px]`}
              />
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isVideoEnabled
                  ? "bg-white/10 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
              title={isVideoEnabled ? "Camera đang bật" : "Camera đang tắt"}
            >
              <i
                className={`fa-solid ${isVideoEnabled ? "fa-video" : "fa-video-slash"} text-[11px]`}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center gap-2 py-2 px-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              Thành viên khác ({filteredUsers.length})
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {/* Other users */}
        {filteredUsers.map((user) => {
          const state = userStates[user.connectionId];
          const isMuted = state?.isMuted ?? false;
          const isCameraOff = state?.isCameraOff ?? false;
          const isScreenSharing = state?.isScreenSharing ?? false;

          return (
            <div
              key={user.connectionId}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-sm font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1d2e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-medium truncate">
                  {user.fullName}
                </p>
                {isScreenSharing && (
                  <p className="text-green-400 text-[10px] font-medium flex items-center gap-1">
                    <i className="fa-solid fa-display text-[8px]" />
                    Đang chia sẻ màn hình
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    !isMuted
                      ? "bg-white/5 text-gray-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                  title={!isMuted ? "Micro đang bật" : "Micro đang tắt"}
                >
                  <i
                    className={`fa-solid ${!isMuted ? "fa-microphone" : "fa-microphone-slash"} text-[11px]`}
                  />
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    !isCameraOff
                      ? "bg-white/5 text-gray-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                  title={!isCameraOff ? "Camera đang bật" : "Camera đang tắt"}
                >
                  <i
                    className={`fa-solid ${!isCameraOff ? "fa-video" : "fa-video-slash"} text-[11px]`}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty search result */}
        {searchQuery && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <i className="fa-solid fa-user-slash text-2xl mb-2 opacity-50" />
            <p className="text-xs">Không tìm thấy người nào</p>
          </div>
        )}

        {/* Empty when alone */}
        {!searchQuery && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <i className="fa-solid fa-user-plus text-2xl mb-2 opacity-50" />
            <p className="text-xs text-center">
              Chưa có ai khác trong phòng.
              <br />
              Chia sẻ liên kết để mời người tham gia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
