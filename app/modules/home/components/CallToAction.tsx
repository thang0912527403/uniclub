import React from 'react';

const CallToAction: React.FC = () => {
    return (
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-16 px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Sẵn sàng bắt đầu hành trình của bạn?
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                    Tham gia ngay hôm nay để kết nối với hàng nghìn sinh viên và khám phá các cơ hội tuyệt vời
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        Đăng ký ngay
                    </button>
                    <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300">
                        Tìm hiểu thêm
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
