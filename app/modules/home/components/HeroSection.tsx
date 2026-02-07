import React from 'react';

const HeroSection: React.FC = () => {
    return (
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 py-20 px-6 md:px-12 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                            {/* Badge SVG Icon */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            <span>UniClubs</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Tham gia CLB và tạo{' '}
                            <span className="text-orange-500 relative">
                                kết nối
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 10C50 2 150 2 198 10" stroke="#f97316" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                            </span>{' '}
                            bền vững
                        </h1>

                        <p className="text-gray-600 text-lg leading-relaxed">
                            Khám phá các câu lạc bộ đa dạng, tham gia các hoạt động bổ ích và kết nối với những người bạn cùng chí hướng. Hãy là một phần của cộng đồng sinh viên sôi động!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer">
                                Tham gia CLB
                            </button>
                            <button className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-500 px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:shadow-md cursor-pointer">
                                Tìm hiểu thêm
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 pt-6">
                            <div className="group cursor-default">
                                <div className="text-4xl font-bold text-orange-500 group-hover:scale-110 transition-transform duration-300">150+</div>
                                <div className="text-gray-600 text-sm">Câu lạc bộ</div>
                            </div>
                            <div className="group cursor-default">
                                <div className="text-4xl font-bold text-orange-500 group-hover:scale-110 transition-transform duration-300">5K+</div>
                                <div className="text-gray-600 text-sm">Thành viên</div>
                            </div>
                            <div className="group cursor-default">
                                <div className="text-4xl font-bold text-orange-500 group-hover:scale-110 transition-transform duration-300">200+</div>
                                <div className="text-gray-600 text-sm">Sự kiện/năm</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative">
                        <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                                alt="Students collaborating"
                                className="w-full h-[500px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent"></div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
