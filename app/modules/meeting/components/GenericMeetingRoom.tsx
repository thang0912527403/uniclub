import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { MeetingProvider } from "../context/MeetingContext";
import { MeetingRoom } from "./MeetingRoom";
import ParticipantsPanel from "./ParticipantsPanel";

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
  sidePanelWidth = 380,
  sidePanelLabels = {
    show: "Hiện bảng điều khiển",
    hide: "Ẩn bảng điều khiển",
  },
  customTabLabel = "Đánh giá",
  customTabIcon = "fa-clipboard-check",
}) => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidePanelTab>("people");

  const handleLeave = useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  const hasSidePanel = true; // Always show the side panel (People tab is always available)
  const hasCustomPanel = !!sidePanel;

  const tabs: { key: SidePanelTab; label: string; icon: string }[] = [
    { key: "people", label: "Mọi người", icon: "fa-users" },
    ...(hasCustomPanel
      ? [
          {
            key: "custom" as SidePanelTab,
            label: customTabLabel,
            icon: customTabIcon,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      <div className="flex-1 h-full transition-all duration-300">
        <MeetingRoom roomId={roomCode} onLeave={handleLeave} />
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-b from-blue-500 to-indigo-600 text-white w-8 h-16 flex items-center justify-center rounded-l-xl shadow-lg hover:shadow-xl hover:w-9 transition-all duration-200"
        style={{
          right: isPanelOpen ? `${sidePanelWidth}px` : "0px",
          transition: "right 0.3s ease",
        }}
        title={isPanelOpen ? sidePanelLabels.hide : sidePanelLabels.show}
      >
        <i
          className={`fa-solid ${isPanelOpen ? "fa-chevron-right" : "fa-chevron-left"} text-sm`}
        />
      </button>

      {/* Side panel */}
      <div
        className="flex-shrink-0 border-l border-gray-700/50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          width: isPanelOpen ? `${sidePanelWidth}px` : "0px",
          minWidth: isPanelOpen ? `${sidePanelWidth}px` : "0px",
          opacity: isPanelOpen ? 1 : 0,
        }}
      >
        <div
          style={{ width: `${sidePanelWidth}px` }}
          className="h-full flex flex-col bg-[#1a1d2e]"
        >
          {/* Tab bar */}
          {tabs.length > 1 ? (
            <div className="flex border-b border-white/10 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold transition-all relative ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[11px]`} />
                  {tab.label}
                  {/* Active indicator */}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "people" && (
              <ParticipantsPanel roomCode={roomCode} />
            )}
            {activeTab === "custom" && hasCustomPanel && (
              <div className="h-full overflow-y-auto">{sidePanel}</div>
            )}
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
