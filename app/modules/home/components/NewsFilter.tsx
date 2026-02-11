import React from 'react';
import { Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { FilterProps } from '../types';

const { RangePicker } = DatePicker;

const NewsFilter: React.FC<FilterProps> = ({
    onSearchChange,
    onCategoryChange,
    onClubChange,
    onDateChange,
}) => {
    const categories = [
        { value: 'all', label: 'Tất cả thể loại' },
        { value: 'event', label: 'Sự kiện' },
        { value: 'training', label: 'Đào tạo' },
        { value: 'sport', label: 'Thể thao' },
        { value: 'volunteer', label: 'Thiện nguyện' },
    ];

    const clubs = [
        { value: 'all', label: 'Tất cả CLB' },
        { value: 'van-nghe', label: 'CLB Văn nghệ' },
        { value: 'ky-nang-mem', label: 'CLB Kỹ năng mềm' },
        { value: 'the-thao', label: 'CLB Thể thao' },
        { value: 'tinh-nguyen', label: 'CLB Tình nguyện' },
    ];

    return (
        <div className="p-3 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tìm kiếm */}
                <Input
                    placeholder="Tìm kiếm bản tin..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    size="large"
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full"
                />

                {/* Lọc theo thể loại */}
                <Select
                    placeholder="Chọn thể loại"
                    size="large"
                    defaultValue="all"
                    onChange={onCategoryChange}
                    options={categories}
                    className="w-full"
                />

                {/* Lọc theo CLB */}
                <Select
                    placeholder="Chọn CLB"
                    size="large"
                    defaultValue="all"
                    onChange={onClubChange}
                    options={clubs}
                    className="w-full"
                />

                {/* Lọc theo ngày */}
                <RangePicker
                    placeholder={['Từ ngày', 'Đến ngày']}
                    size="large"
                    onChange={onDateChange}
                    format="DD/MM/YYYY"
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default NewsFilter;
