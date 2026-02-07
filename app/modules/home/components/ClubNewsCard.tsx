import React from 'react';
import { Card, Tag } from 'antd';
import { CalendarOutlined, EyeOutlined, HeartOutlined, TeamOutlined } from '@ant-design/icons';
import type { ClubNewsCardProps } from '../types';

const ClubNewsCard: React.FC<ClubNewsCardProps> = ({
    image,
    title,
    clubName,
    category,
    date,
    views,
    likes,
    summary,
}) => {
    return (
        <Card
            hoverable
            className="w-full max-w-sm rounded-xl overflow-hidden shadow-md transition-transform duration-300 hover:scale-105"
            cover={
                <div className="relative h-60 overflow-hidden">
                    <img
                        alt={title}
                        src={image}
                        className="w-full h-full object-cover"
                    />
                    <Tag
                        color="blue"
                        className="absolute top-4 left-4 text-sm font-semibold"
                    >
                        {category}
                    </Tag>
                </div>
            }
            styles={{
                body: { padding: 20 },
            }}
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <TeamOutlined />
                    <span>{clubName}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 line-clamp-2 min-h-[3.5rem]">
                    {title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-3 min-h-[3.75rem]">
                    {summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <CalendarOutlined />
                        <span>{date}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <EyeOutlined />
                            <span>{views}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                            <HeartOutlined />
                            <span>{likes}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ClubNewsCard;
