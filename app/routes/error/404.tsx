import { useNavigate } from 'react-router';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center px-4 py-12 overflow-hidden relative">
            {/* ── Decorative blobs ── */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/4 translate-y-1/4" />
            <div className="absolute top-1/4 right-0 w-24 h-40 bg-orange-200 rounded-3xl rotate-12 opacity-40 translate-x-1/3" />

            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
                {/* ── Left: Giant 404 watermark + icon ── */}
                <div className="relative flex items-center justify-center flex-shrink-0 select-none">
                    <span className="text-[180px] md:text-[220px] font-black text-orange-100 leading-none tracking-tighter">
                        4
                    </span>
                    <div className="relative mx-[-10px] md:mx-[-14px]">
                        <span className="text-[180px] md:text-[220px] font-black text-orange-100 leading-none tracking-tighter">
                            0
                        </span>
                        {/* Icon overlay on the "0" */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <span className="text-[180px] md:text-[220px] font-black text-orange-100 leading-none tracking-tighter">
                        4
                    </span>
                </div>

                {/* ── Right: Content card ── */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 md:p-10 max-w-lg w-full">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">
                        Không tìm thấy
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight mb-4">
                        Trang không<br />tồn tại
                    </h1>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                        Rất tiếc, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Có thể trang này đã bị xóa hoặc đường dẫn không chính xác.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Về trang chủ
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-700 font-semibold rounded-xl border border-zinc-200 hover:border-orange-400 hover:text-orange-600 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại
                        </button>
                    </div>

                    {/* Footer help */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                        </svg>
                        Cần hỗ trợ? Gửi email tới <span className="font-semibold text-orange-500 ml-1">support@uniclubs.edu</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
