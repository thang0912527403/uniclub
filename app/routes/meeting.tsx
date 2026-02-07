import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { WebRtcProvider, MeetingRoom } from '~/modules/webrtc';

const MeetingPageContent: React.FC = () => {
    const { roomId: routeRoomId } = useParams();
    const navigate = useNavigate();
    const [inputRoomId, setInputRoomId] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputRoomId.trim()) {
            navigate(`/meeting/${inputRoomId.trim()}`);
        }
    };

    const handleLeave = () => {
        navigate('/meeting');
    };

    if (routeRoomId) {
        return (
            <div className="h-screen w-full">
               <MeetingRoom roomId={routeRoomId} onLeave={handleLeave} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Tham gia cuộc họp
                </h1>
                
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                            Mã phòng / Tên phòng
                        </label>
                        <input
                            type="text"
                            id="roomId"
                            value={inputRoomId}
                            onChange={(e) => setInputRoomId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Nhập mã phòng..."
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Tham gia ngay
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Hoặc tạo phòng mới bằng cách nhập tên bất kỳ</p>
                </div>
            </div>
        </div>
    );
};

export default function MeetingPage() {
    return (
        <WebRtcProvider>
            <MeetingPageContent />
        </WebRtcProvider>
    );
}
