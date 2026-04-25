import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { MeetingProvider, useMeeting } from "../context/MeetingContext";
import { MeetingRoom } from "./MeetingRoom";
import ParticipantsPanel from "./ParticipantsPanel";
import { getUserId } from "~/utils/auth";

// ── Types ────────────────────────────────────────────────────────

export type SidePanelTab = "people" | "custom";

export interface GenericMeetingRoomProps {
  /** The WebRTC room ID to join */
  roomCode: string;
  /** Where to navigate when user leaves the room */
  backPath?: string;
  /** Optional sidebar panel (e.g. ScoringPanel for interviews) */
  sidePanel?: React.ReactNode;
  /** Width of the side panel in px (default 380) */
  sidePanelWidth?: number;
  /** Toggle button tooltip labels */
  sidePanelLabels?: { show: string; hide: string };
  /** Label for the custom side panel tab (default: "Bảng đánh giá") */
  customTabLabel?: string;
  /** Icon class for the custom tab (default: "fa-clipboard-check") */
  customTabIcon?: string;
}

// ── Inner content (rendered inside MeetingProvider) ──────────────

const MeetingRoomContent: React.FC<GenericMeetingRoomProps> = ({
  roomCode,
  backPath = "/home",
  sidePanel,
}) => {
  const navigate = useNavigate();
  // We use "chat" and "people" as tabs now. Custom tab is optional.
  const [activeTab, setActiveTab] = useState<"people" | "chat" | "custom">(
    "chat",
  );
  const { messages, sendMessage } = useMeeting();
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getUserId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleLeave = useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  const hasCustomPanel = !!sidePanel;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Video Area */}
        <div className="flex-1 relative transition-all duration-300">
          <MeetingRoom roomId={roomCode} onLeave={handleLeave} />
        </div>

        {/* Right Sidebar Wrapper */}
        <div
          className={`relative flex-shrink-0 bg-white border-l border-gray-200 flex flex-col z-20 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-[360px]" : "w-0 border-l-0"
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 -left-6 flex items-center justify-center w-6 h-14 bg-white border border-gray-200 shadow-sm rounded-l-md hover:bg-gray-50 transition-all z-30 group cursor-pointer border-r-0"
            title={isSidebarOpen ? "Thu gọn (Đóng)" : "Mở rộng"}
          >
            <i
              className={`fa-solid ${isSidebarOpen ? "fa-chevron-right" : "fa-chevron-left"} text-gray-400 group-hover:text-orange-500 text-[10px] absolute right-1`}
            />
          </button>

          {/* Sidebar Content (Hidden when closed to prevent overflow) */}
          <div
            className={`flex flex-col h-full w-[360px] overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-orange-500">
                Meeting Space
              </h2>
              <p className="text-xs text-gray-500">Room: {roomCode}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("people")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "people"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="fa-solid fa-users text-xs" /> Participants
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "chat"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="fa-solid fa-comment text-xs" /> Chat
              </button>
              {hasCustomPanel && (
                <button
                  onClick={() => setActiveTab("custom")}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "custom"
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="fa-solid fa-clipboard-check text-xs" /> Đánh giá
                </button>
              )}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === "people" && (
                <ParticipantsPanel roomCode={roomCode} />
              )}
              {activeTab === "custom" && hasCustomPanel && (
                <div className="h-full overflow-y-auto p-4">{sidePanel}</div>
              )}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col h-full bg-gray-50/50">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        Chưa có tin nhắn nào.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwnMessage = msg.userId === currentUserId;
                        return (
                          <div
                            key={msg.messageId}
                            className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-800">
                                {isOwnMessage ? "You" : msg.fullName}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <div
                              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                                isOwnMessage
                                  ? "bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-200"
                                  : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                              }`}
                            >
                              {msg.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t border-gray-200">
                    <form
                      onSubmit={handleChatSubmit}
                      className="flex relative items-center"
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Send a message..."
                        className="w-full bg-gray-100 border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all text-gray-700"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-2 text-orange-500 hover:text-orange-600 disabled:opacity-50 p-1"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Room blocked screen (reusable) ──────────────────────────────

export const RoomBlockedScreen: React.FC<{
  reason: string;
  backPath?: string;
  backLabel?: string;
}> = ({ reason, backPath = "/home", backLabel = "Quay lại" }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-5 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-lock text-red-400 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Phòng không khả dụng
        </h2>
        <p className="text-white/60 text-sm mb-8">{reason}</p>
        <button
          onClick={() => navigate(backPath)}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          {backLabel}
        </button>
      </div>
    </div>
  );
};

// ── Loading spinner (reusable) ──────────────────────────────────

export const RoomLoadingScreen: React.FC<{ message?: string }> = ({
  message = "Đang kiểm tra phòng...",
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div className="text-center text-white/60">
      <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block" />
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

// ── Main wrapper (adds MeetingProvider) ─────────────────────────

const GenericMeetingRoom: React.FC<GenericMeetingRoomProps> = (props) => (
  <MeetingProvider>
    <MeetingRoomContent {...props} />
  </MeetingProvider>
);

export default GenericMeetingRoom;
