import React from 'react';
import { Calendar, User, Clock, Share2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { ClubPostResponseDto } from '~/cores/api';

const NewsDetailContent: React.FC<{ post: ClubPostResponseDto }> = ({ post }) => {
  const navigate = useNavigate();
  const date = new Date(post.postDate).toLocaleDateString('vi-VN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold mb-8 transition-colors group"
      >
        <div className="p-2 rounded-full group-hover:bg-orange-50">
          <ChevronLeft size={20} />
        </div>
        Quay lại
      </button>

      {/* Header bài viết */}
      <header className="mb-10">
        <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
          {post.clubName}
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">
              {post?.userName?.charAt(0)}
            </div>
            <div>
              <p className="text-gray-900 font-bold">{post.userName}</p>
              <p className="text-gray-400 text-sm italic">Người viết bản tin</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-2"><Calendar size={18} className="text-orange-500" /> {date}</span>
            {/* <span className="flex items-center gap-2"><Clock size={18} className="text-orange-500" /> 5 phút đọc</span> */}
          </div>
        </div>
      </header>

      {/* Ảnh bìa lớn */}
      <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100 mb-12">
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Nội dung bài viết */}
      <article className="prose prose-orange lg:prose-xl max-w-none">
        {/* Caption/Sapo */}
        <p className="text-2xl font-medium text-gray-600 italic leading-relaxed mb-8 border-l-4 border-orange-500 pl-6">
          {post.caption}
        </p>

        {/* Nội dung chính */}
        <div className="text-gray-700 leading-extra-relaxed space-y-6 text-lg whitespace-pre-line">
          {post.content}
        </div>
      </article>

      {/* Footer bài viết: Tag hoặc Social Share (Chỉ xem) */}
      {/* <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400 uppercase">Tags:</span>
          <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">#UNIC</span>
          <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">#{post.clubName.replace(/\s/g, '')}</span>
        </div>

        <button className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-all active:scale-95 shadow-lg">
          <Share2 size={18} /> Chia sẻ bài viết
        </button>
      </div> */}
    </div>
  );
};

export default NewsDetailContent;