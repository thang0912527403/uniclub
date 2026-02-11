import React from 'react';
import type { RegistrationType } from '../types';

const RegistrationCards: React.FC = () => {
    const registrationTypes: RegistrationType[] = [
        {
            id: 1,
            title: 'Sinh viên mới tuyển',
            description: 'Dành cho sinh viên mới muốn tham gia các câu lạc bộ',
            features: [
                'Đăng ký tham gia CLB',
                'Nhận thông báo sự kiện',
                'Kết nối với thành viên'
            ],
            icon: 'student',
            color: 'text-orange-600',
            bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600'
        },
        {
            id: 2,
            title: 'Chủ tịch Câu lạc bộ',
            description: 'Dành cho người quản lý và điều hành câu lạc bộ',
            features: [
                'Quản lý thành viên CLB',
                'Tổ chức sự kiện',
                'Báo cáo hoạt động'
            ],
            icon: 'leader',
            color: 'text-green-600',
            bgColor: 'bg-gradient-to-br from-green-500 to-green-600'
        },
        {
            id: 3,
            title: 'Ban Tổ chức Sự kiện',
            description: 'Dành cho ban tổ chức và hỗ trợ các hoạt động',
            features: [
                'Hỗ trợ tổ chức sự kiện',
                'Quản lý tài liệu',
                'Điều phối hoạt động'
            ],
            icon: 'organizer',
            color: 'text-blue-600',
            bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600'
        }
    ];

    const getIcon = (iconName: string) => {
        const icons = {
            student: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            ),
            leader: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            organizer: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        };
        return icons[iconName as keyof typeof icons] || icons.student;
    };

    return (
        <section className="py-16 px-6 md:px-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Chiến dịch đăng ký
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Chọn loại tài khoản phù hợp với bạn để bắt đầu
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {registrationTypes.map((type) => (
                        <div
                            key={type.id}
                            className={`${type.bgColor} rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer`}
                        >
                            <div className="text-white mb-4">
                                {getIcon(type.icon)}
                            </div>

                            <h3 className="text-2xl font-bold mb-3">
                                {type.title}
                            </h3>

                            <p className="text-white/90 mb-6 leading-relaxed">
                                {type.description}
                            </p>

                            <ul className="space-y-3 mb-6">
                                {type.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-lg cursor-pointer">
                                Đăng ký ngay
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group cursor-pointer">
                        Xem tất cả chiến dịch
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RegistrationCards;
