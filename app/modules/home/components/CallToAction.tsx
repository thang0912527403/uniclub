import React from 'react';

const CallToAction: React.FC = () => {
    return (
        <section className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-10 sm:py-16 px-4 sm:px-6 md:px-12 overflow-hidden">
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Sẵn sàng bắt đầu hành trình của bạn?
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                    Tham gia ngay hôm nay để kết nối với hàng nghìn sinh viên và khám phá các cơ hội tuyệt vời
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer">
                        Đăng ký ngay
                    </button>
                    <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 cursor-pointer">
                        Tìm hiểu thêm
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
