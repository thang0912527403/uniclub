import React from 'react';
import type { Feature } from '../types';

const WhyChooseUs: React.FC = () => {
    const features: Feature[] = [
        {
            id: 1,
            icon: '🎯',
            title: 'Dễ tìm kiếm',
            description: 'Tìm kiếm câu lạc bộ phù hợp với sở thích của bạn một cách dễ dàng'
        },
        {
            id: 2,
            icon: '🤝',
            title: 'Kết nối',
            description: 'Kết nối với những người bạn cùng đam mê và xây dựng mối quan hệ bền vững'
        },
        {
            id: 3,
            icon: '📚',
            title: 'Học tập cùng nhau',
            description: 'Học hỏi kỹ năng mới và phát triển bản thân qua các hoạt động CLB'
        },
        {
            id: 4,
            icon: '🏆',
            title: 'Phát triển kỹ năng',
            description: 'Nâng cao kỹ năng mềm và tích lũy kinh nghiệm thực tế'
        }
    ];

    return (
        <section className="py-16 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Tại sao chọn UniClubs?
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Nền tảng kết nối sinh viên với các câu lạc bộ hàng đầu
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            className="group text-center p-6 rounded-2xl hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
