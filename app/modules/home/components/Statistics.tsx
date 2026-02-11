import React from 'react';
import type { Stat } from '../types';

const Statistics: React.FC = () => {
    const stats: Stat[] = [
        {
            id: 1,
            value: '5,240',
            label: 'Sinh viên tham gia',
            icon: 'users',
            color: 'bg-gradient-to-br from-orange-400 to-orange-600'
        },
        {
            id: 2,
            value: '152',
            label: 'Câu lạc bộ hoạt động',
            icon: 'building',
            color: 'bg-gradient-to-br from-orange-400 to-orange-600'
        },
        {
            id: 3,
            value: '218',
            label: 'Sự kiện đã tổ chức',
            icon: 'calendar',
            color: 'bg-gradient-to-br from-orange-400 to-orange-600'
        },
        {
            id: 4,
            value: '48',
            label: 'Giải thưởng đạt được',
            icon: 'trophy',
            color: 'bg-gradient-to-br from-orange-400 to-orange-600'
        }
    ];

    const getIcon = (iconName: string) => {
        const icons = {
            users: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            building: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            calendar: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            trophy: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            )
        };
        return icons[iconName as keyof typeof icons] || icons.users;
    };

    return (
        <section className="py-16 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div
                            key={stat.id}
                            className="text-center group cursor-default"
                        >
                            <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl text-white`}>
                                {getIcon(stat.icon)}
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors duration-300">
                                {stat.value}
                            </div>
                            <div className="text-gray-600 text-sm">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Statistics;
