import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { getUserId } from '~/utils/auth';
import { useCurrentUser } from '~/hooks/useCurrentUser';

interface RoomAccessGateProps {
  roomCode?: string;
  onJoinRoom: (roomCode: string, userId: string, displayName: string, role: string) => void;
  isJoining?: boolean;
  error?: string | null;
}

const RoomAccessGate: React.FC<RoomAccessGateProps> = ({
  roomCode: initialRoomCode,
  onJoinRoom,
  isJoining = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Candidate');

  const { user: authUser } = useCurrentUser();

  // Pre-fill display name from auth context
  React.useEffect(() => {
    if (authUser?.fullName) setDisplayName(authUser.fullName);
  }, [authUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !displayName.trim()) return;

    const userId = getUserId();
    onJoinRoom(roomCode.trim(), userId, displayName.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Phòng phỏng vấn</h1>
            <p className="text-orange-100 text-sm mt-1">Nhập mã phòng để tham gia buổi phỏng vấn</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
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
                Tên hiển thị <span className="text-red-400"></span>
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


            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

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
                'Tham gia'
              )}
            </button>

            {/* Back */}
            <button
              type="button"
              onClick={() => navigate('/interview/schedule')}
              className="w-full py-2.5 text-white/60 text-sm font-medium hover:text-white transition-colors"
            >
              ← Quay lại lịch phỏng vấn
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomAccessGate;
