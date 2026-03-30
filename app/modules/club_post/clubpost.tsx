import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import PostCard from './components/PostCard';
import PostFilter from './components/PostFilter';
import { useGetClubPostsQuery } from '~/cores/api';
import { useGetClubsQuery } from '~/cores/api';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const { data: clubsData } = useGetClubsQuery({ pageIndex: '1', searchQuery: '', pageSize: '100' });
  const clubs = clubsData?.data ?? [];
  const categories = ["Tất cả", ...clubs.map(c => c.clubName)];

  const selectedClub = clubs.find(c => c.clubName === activeTab);
  const { data: allPosts = [] } = useGetClubPostsQuery();

  const filteredPosts = allPosts;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <Navbar />

      {/* Hero Header */}
      <div className="pt-32 pb-16 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Khám phá <span className="text-orange-500 italic">Bản tin</span>
          </h2>
          <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-6"></div>
          <p className="max-w-2xl mx-auto text-gray-500 font-medium">
            Nơi tổng hợp những hoạt động, thông báo và chia sẻ thú vị nhất từ cộng đồng các câu lạc bộ tại UNIC.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold mb-8 transition-colors group"
      >
        <div className="p-2 rounded-full group-hover:bg-orange-50">
          <ChevronLeft size={20} />
        </div>
        Quay lại
      </button>
        {/* Filter Section */}
        <PostFilter 
          categories={categories} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Grid Posts */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
             <p className="text-gray-400 font-medium">Chưa có bản tin nào thuộc danh mục này.</p>
          </div>
        )}

        {/* Pagination (Tùy chọn) */}
        <div className="mt-20 flex justify-center">
          <button className="bg-white text-orange-600 border border-orange-100 px-10 py-3 rounded-full font-bold hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-sm">
            Tải thêm bài viết
          </button>
        </div>
      </div>

      {/* Footer đơn giản cho trang tin tức */}
      <footer className="py-12 text-center text-gray-400 text-sm border-t border-gray-100 bg-white">
        © 2026 UniClubs News - Mọi thông tin thuộc bản quyền của các CLB UNIC.
      </footer>
    </div>
  );
};

export default NewsPage;