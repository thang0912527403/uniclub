import React, { useState } from 'react';


import ClubNewsCard from './components/notiCard';
import Header from './components/header';
import NewsFilter from './components/filter';

import type { ClubNewsCardProps } from './type';
import type { Dayjs } from 'dayjs';
const HomePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const newsItems: ClubNewsCardProps[] = [
    {
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
      title: 'Đêm hội văn nghệ chào mừng sinh viên K18',
      clubName: 'CLB Văn nghệ',
      category: 'Sự kiện',
      date: '15/01/2026',
      views: 1250,
      likes: 87,
      summary: 'CLB Văn nghệ tổ chức đêm hội chào mừng tân sinh viên với nhiều tiết mục đặc sắc và phần thưởng hấp dẫn.',
    },
    {
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      title: 'Workshop kỹ năng lãnh đạo cho thành viên CLB',
      clubName: 'CLB Kỹ năng mềm',
      category: 'Đào tạo',
      date: '12/01/2026',
      views: 890,
      likes: 65,
      summary: 'Chương trình đào tạo kỹ năng lãnh đạo và quản lý thời gian dành cho các thành viên Ban Chủ nhiệm.',
    },
    {
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80',
      title: 'Giải bóng đá giao hữu giữa các CLB trường',
      clubName: 'CLB Thể thao',
      category: 'Thể thao',
      date: '10/01/2026',
      views: 2100,
      likes: 156,
      summary: 'Giải đấu thường niên tạo sân chơi lành mạnh, gắn kết tình đoàn kết giữa các câu lạc bộ trong trường.',
    },
    {
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Chiến dịch thiện nguyện "Mùa đông ấm áp"',
      clubName: 'CLB Tình nguyện',
      category: 'Thiện nguyện',
      date: '08/01/2026',
      views: 1680,
      likes: 203,
      summary: 'CLB tổ chức quyên góp và trao tặng quà cho trẻ em vùng cao, mang đến niềm vui và sự ấm áp.',
    },
    {
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Chiến dịch thiện nguyện "Mùa đông ấm áp"',
      clubName: 'CLB Tình Nguyện Trẻ',
      category: 'Thiện nguyện',
      date: '08/01/2026',
      views: 1680,
      likes: 203,
      summary: 'CLB tổ chức quyên góp và trao tặng quà cho trẻ em vùng cao, mang đến niềm vui và sự ấm áp.',
    },
    {
      image: 'https://images.unsplash.com/photo-1520975922284-9f2dc6a3d47c?w=800&q=80',
      title: 'Ngày hội hiến máu nhân đạo 2026',
      clubName: 'CLB Công Tác Xã Hội',
      category: 'Cộng đồng',
      date: '15/02/2026',
      views: 2340,
      likes: 412,
      summary: 'CLB phối hợp cùng bệnh viện tổ chức ngày hội hiến máu, lan tỏa tinh thần sẻ chia và trách nhiệm xã hội.',
    },
    {
      image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80',
      title: 'Chương trình tiếp sức mùa thi',
      clubName: 'CLB Sinh Viên Tình Nguyện',
      category: 'Tình nguyện',
      date: '20/06/2026',
      views: 3120,
      likes: 528,
      summary: 'Các thành viên CLB hỗ trợ thí sinh và phụ huynh trong kỳ thi quan trọng bằng nước uống, chỉ dẫn và động viên tinh thần.',
    },
    {
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
      title: 'Workshop kỹ năng làm việc nhóm',
      clubName: 'CLB Kỹ Năng Mềm',
      category: 'Kỹ năng',
      date: '05/03/2026',
      views: 1895,
      likes: 267,
      summary: 'Buổi workshop giúp thành viên nâng cao kỹ năng giao tiếp, phối hợp nhóm và giải quyết vấn đề hiệu quả.',
    },
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
      title: 'Talkshow định hướng nghề nghiệp IT',
      clubName: 'CLB Công Nghệ Thông Tin',
      category: 'Học thuật',
      date: '18/04/2026',
      views: 2760,
      likes: 489,
      summary: 'CLB mời diễn giả là chuyên gia trong ngành CNTT chia sẻ kinh nghiệm, định hướng nghề nghiệp cho sinh viên.',
    },
    {
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
      title: 'Chương trình trồng cây xanh vì môi trường',
      clubName: 'CLB Môi Trường Xanh',
      category: 'Môi trường',
      date: '22/03/2026',
      views: 1450,
      likes: 198,
      summary: 'Hoạt động trồng cây xanh góp phần bảo vệ môi trường, nâng cao ý thức sống xanh cho cộng đồng sinh viên.',
    },
    {
      image: 'https://images.unsplash.com/photo-1515165562835-c4c8c1e5b1c9?w=800&q=80',
      title: 'Cuộc thi ý tưởng khởi nghiệp trẻ',
      clubName: 'CLB Khởi Nghiệp & Đổi Mới Sáng Tạo',
      category: 'Sáng tạo',
      date: '10/05/2026',
      views: 3580,
      likes: 642,
      summary: 'Cuộc thi tạo sân chơi cho sinh viên trình bày ý tưởng khởi nghiệp, khuyến khích tư duy sáng tạo và đổi mới.',
    },
    {
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
      title: 'Tuyển thành viên CLB Hùng Biện 2026',
      clubName: 'CLB Hùng Biện & Tranh Biện',
      category: 'Tuyển thành viên',
      date: '12/01/2026',
      views: 4210,
      likes: 735,
      summary: 'CLB Hùng Biện & Tranh Biện chính thức mở đợt tuyển thành viên mới, chào đón những bạn yêu thích nói trước đám đông, tư duy phản biện và mong muốn phát triển kỹ năng diễn đạt.'
    },

  ];
  const filteredNews = newsItems.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory = selectedCategory === 'all' ||
      item.category.toLowerCase() === getCategoryLabel(selectedCategory).toLowerCase();

    const matchClub = selectedClub === 'all' ||
      item.clubName.toLowerCase().includes(selectedClub.replace('-', ' '));

    return matchSearch && matchCategory && matchClub;
  });

  function getCategoryLabel(value: string): string {
    const map: { [key: string]: string } = {
      'event': 'Sự kiện',
      'training': 'Đào tạo',
      'sport': 'Thể thao',
      'volunteer': 'Thiện nguyện',
    };
    return map[value] || '';
  }
  return (<div>
    <Header />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        

        <NewsFilter
          onSearchChange={setSearchText}
          onCategoryChange={setSelectedCategory}
          onClubChange={setSelectedClub}
          onDateChange={setDateRange}
        />

        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredNews.map((item, index) => (
              <ClubNewsCard key={index} {...item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Không tìm thấy bản tin nào phù hợp</p>
          </div>
        )}
      </div>
    </div></div>
  );
};

export default HomePage;