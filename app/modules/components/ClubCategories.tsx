import React from 'react';
import type { ClubCategory } from '../types';

const ClubCategories: React.FC = () => {
    const categories: ClubCategory[] = [
        {
            id: 1,
            title: 'Công nghệ & Khoa học',
            description: 'Khám phá thế giới công nghệ, lập trình và khoa học máy tính',
            icon: '💻',
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
            members: 1200,
            clubs: 15
        },
        {
            id: 2,
            title: 'Văn hóa & Nghệ thuật',
            description: 'Thể hiện tài năng nghệ thuật và khám phá văn hóa đa dạng',
            icon: '🎨',
            image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
            members: 890,
            clubs: 12
        },
        {
            id: 3,
            title: 'Thể thao & Sức khỏe',
            description: 'Rèn luyện sức khỏe và tinh thần thể thao đồng đội',
            icon: '⚽',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
            members: 1500,
            clubs: 20
        }
    ];

    return (
        <section className="py-16 px-6 md:px-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Câu lạc bộ hàng đầu
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Tham gia các câu lạc bộ phù hợp với sở thích và đam mê của bạn
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={category.image}
                                    alt={category.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-4xl">{category.icon}</div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                                    {category.title}
                                </h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {category.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        {category.members} thành viên
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                        </svg>
                                        {category.clubs} CLB
                                    </span>
                                </div>

                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors duration-300">
                                    Khám phá
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group">
                        Xem tất cả CLB
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ClubCategories;
