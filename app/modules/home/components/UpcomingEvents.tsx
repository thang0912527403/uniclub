import React from 'react';
import type { Event } from '../types';

const UpcomingEvents: React.FC = () => {
    const events: Event[] = [
        {
            id: 1,
            date: { day: '15', month: 'Thg 1' },
            title: 'Workshop AI & Machine Learning',
            club: 'CLB Công nghệ thông tin',
            location: 'Phòng A101',
            time: '14:00 - 17:00',
            category: 'Workshop'
        },
        {
            id: 2,
            date: { day: '22', month: 'Thg 1' },
            title: 'Lễ hội Văn hóa Mùa Xuân',
            club: 'CLB Văn hóa',
            location: 'Sân trường',
            time: '09:00 - 18:00',
            category: 'Sự kiện'
        },
        {
            id: 3,
            date: { day: '28', month: 'Thg 1' },
            title: 'Giải Bóng rổ Hạc CLB',
            club: 'CLB Thể thao',
            location: 'Nhà thi đấu',
            time: '15:00 - 18:00',
            category: 'Thể thao'
        },
        {
            id: 4,
            date: { day: '05', month: 'Thg 2' },
            title: 'Ngày hội Văn hóa 2024',
            club: 'CLB Văn nghệ',
            location: 'Hội trường lớn',
            time: '08:00 - 17:00',
            category: 'Sự kiện'
        }
    ];

    return (
        <section className="py-16 px-6 md:px-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Sự kiện sắp diễn ra
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Đăng ký tham gia các sự kiện hấp dẫn sắp tới
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex"
                        >
                            {/* Date Badge */}
                            <div className="bg-orange-500 text-white p-6 flex flex-col items-center justify-center min-w-[100px]">
                                <div className="text-3xl font-bold">{event.date.day}</div>
                                <div className="text-sm uppercase">{event.date.month}</div>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 p-6">
                                <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                    {event.category}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                                        </svg>
                                        <span>{event.club}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        <span>{event.location}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span>{event.time}</span>
                                    </div>
                                </div>

                                <button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
                                    Đăng ký ngay
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group">
                        Xem tất cả sự kiện
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default UpcomingEvents;
