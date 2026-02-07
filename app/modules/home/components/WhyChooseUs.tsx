import React from 'react';
import type { Feature } from '../types';

const WhyChooseUs: React.FC = () => {
    const features: Feature[] = [
        {
            id: 1,
            icon: 'target',
            title: 'Dễ tìm kiếm',
            description: 'Tìm kiếm câu lạc bộ phù hợp với sở thích của bạn một cách dễ dàng'
        },
        {
            id: 2,
            icon: 'users',
            title: 'Kết nối',
            description: 'Kết nối với những người bạn cùng đam mê và xây dựng mối quan hệ bền vững'
        },
        {
            id: 3,
            icon: 'book',
            title: 'Học tập cùng nhau',
            description: 'Học hỏi kỹ năng mới và phát triển bản thân qua các hoạt động CLB'
        },
        {
            id: 4,
            icon: 'trophy',
            title: 'Phát triển kỹ năng',
            description: 'Nâng cao kỹ năng mềm và tích lũy kinh nghiệm thực tế'
        }
    ];

    const getIcon = (iconName: string) => {
        const icons = {
            target: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            users: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            book: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            trophy: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            )
        };
        return icons[iconName as keyof typeof icons] || icons.target;
    };

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
                            className="group text-center p-6 rounded-2xl hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 border border-transparent hover:border-orange-200 cursor-default"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-500 rounded-full mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                {getIcon(feature.icon)}
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
