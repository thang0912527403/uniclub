import React from 'react';

const HeroSection: React.FC = () => {
    return (
        <section className="bg-gradient-to-br from-orange-50 to-white py-16 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
                            🎓 UniClubs
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                            Tham gia CLB và tạo{' '}
                            <span className="text-orange-500">kết nối</span>{' '}
                            bền vững
                        </h1>

                        <p className="text-gray-600 text-lg leading-relaxed">
                            Khám phá các câu lạc bộ đa dạng, tham gia các hoạt động bổ ích và kết nối với những người bạn cùng chí hướng. Hãy là một phần của cộng đồng sinh viên sôi động!
                        </p>

                        <div className="flex gap-4">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
                                Tham gia CLB
                            </button>
                            <button className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-500 px-6 py-3 rounded-lg font-medium transition-all duration-300">
                                Tìm hiểu thêm
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 pt-6">
                            <div>
                                <div className="text-3xl font-bold text-orange-500">150+</div>
                                <div className="text-gray-600 text-sm">Câu lạc bộ</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-orange-500">5K+</div>
                                <div className="text-gray-600 text-sm">Thành viên</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-orange-500">200+</div>
                                <div className="text-gray-600 text-sm">Sự kiện/năm</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative">
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                                alt="Students collaborating"
                                className="w-full h-[500px] object-cover"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
