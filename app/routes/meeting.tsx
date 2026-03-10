import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { WebRtcProvider, MeetingRoom } from '~/modules/webrtc';

const JoinMeetingPage: React.FC = () => {
    const navigate = useNavigate();
    const [inputRoomId, setInputRoomId] = useState('');
    const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [hasCamera, setHasCamera] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Try to get camera preview
        const initPreview = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setPreviewStream(stream);
                setIsPreviewEnabled(true);
                setHasCamera(true);
            } catch {
                console.log('Camera not available for preview');
                setHasCamera(false);
            }
        };
        initPreview();

        return () => {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (videoRef.current && previewStream) {
            videoRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputRoomId.trim()) {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }
            navigate(`/meeting/${inputRoomId.trim()}`);
        }
    };

    const generateRoomId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < 2) result += '-';
        }
        setInputRoomId(result);
    };

    // Get user initials for avatar
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.fullName || 'Guest';
    const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
                    {/* Video Preview */}
                    <div className="order-2 md:order-1">
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 aspect-video shadow-2xl shadow-black/50">
                            {isPreviewEnabled && previewStream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 blur-md opacity-40"></div>
                                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                            {initials}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                            
                            {/* Status badge */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                <span className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span className="text-white text-sm">
                                    {hasCamera ? 'Camera đã sẵn sàng' : 'Không có camera'}
                                </span>
                            </div>
                        </div>

                        {/* Device notice */}
                        {!hasCamera && (
                            <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Bạn vẫn có thể tham gia và nghe người khác</span>
                            </div>
                        )}
                    </div>

                    {/* Join Form */}
                    <div className="order-1 md:order-2">
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
                            {/* Logo */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg shadow-orange-500/30">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">UniClubs Meeting</h1>
                                    <p className="text-gray-400 text-sm">Họp trực tuyến an toàn</p>
                                </div>
                            </div>

                            <form onSubmit={handleJoin} className="space-y-6">
                                <div>
                                    <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
                                        Mã phòng họp
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="roomId"
                                            value={inputRoomId}
                                            onChange={(e) => setInputRoomId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300"
                                            placeholder="Nhập mã phòng (vd: abc-def-ghi)"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Generate Room Button */}
                                <button
                                    type="button"
                                    onClick={generateRoomId}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Tạo mã phòng mới
                                </button>

                                {/* Join Button */}
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Tham gia ngay
                                </button>
                            </form>

                            {/* Info */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-gray-400 text-sm text-center">
                                    Nhập mã phòng để tham gia hoặc tạo phòng mới
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MeetingPageContent: React.FC = () => {
    const { roomId: routeRoomId } = useParams();
    const navigate = useNavigate();

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

    return <JoinMeetingPage />;
};

export default function MeetingPage() {
    return (
        <WebRtcProvider>
            <MeetingPageContent />
        </WebRtcProvider>
    );
}
