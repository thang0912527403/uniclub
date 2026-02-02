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
            icon: '🎓',
            color: 'text-orange-600',
            bgColor: 'bg-orange-500'
        },
        {
            id: 2,
            title: 'Chủ tịch Câu lạc bộ Trưởng',
            description: 'Dành cho người quản lý và điều hành câu lạc bộ',
            features: [
                'Quản lý thành viên CLB',
                'Tổ chức sự kiện',
                'Báo cáo hoạt động'
            ],
            icon: '👔',
            color: 'text-green-600',
            bgColor: 'bg-green-500'
        },
        {
            id: 3,
            title: 'Hỗ trợ văn bản Sinh Trình Diễn',
            description: 'Dành cho ban tổ chức và hỗ trợ các hoạt động',
            features: [
                'Hỗ trợ tổ chức sự kiện',
                'Quản lý tài liệu',
                'Điều phối hoạt động'
            ],
            icon: '📋',
            color: 'text-blue-600',
            bgColor: 'bg-blue-500'
        }
    ];

    return (
        <section className="py-16 px-6 md:px-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Chiến dịch đăng diễn ra
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Chọn loại tài khoản phù hợp với bạn để bắt đầu
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {registrationTypes.map((type) => (
                        <div
                            key={type.id}
                            className={`${type.bgColor} rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
                        >
                            <div className="text-5xl mb-4">{type.icon}</div>

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

                            <button className="w-full bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-lg font-bold transition-colors duration-300">
                                Đăng ký ngay
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group">
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
