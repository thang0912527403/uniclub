import React from 'react';
import type { Stat } from '../types';

const Statistics: React.FC = () => {
    const stats: Stat[] = [
        {
            id: 1,
            value: '5,240',
            label: 'Sinh viên tham gia',
            icon: '👥',
            color: 'bg-orange-500'
        },
        {
            id: 2,
            value: '152',
            label: 'Câu lạc bộ hoạt động',
            icon: '🏛️',
            color: 'bg-orange-500'
        },
        {
            id: 3,
            value: '218',
            label: 'Sự kiện đã tổ chức',
            icon: '📅',
            color: 'bg-orange-500'
        },
        {
            id: 4,
            value: '48',
            label: 'Giải thưởng đạt được',
            icon: '🏆',
            color: 'bg-orange-500'
        }
    ];

    return (
        <section className="py-16 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div
                            key={stat.id}
                            className="text-center group"
                        >
                            <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                <span className="text-3xl">{stat.icon}</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">
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
