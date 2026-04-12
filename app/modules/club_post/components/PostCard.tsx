import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { ClubPostResponseDto } from '~/cores/api';
import { useNavigate } from 'react-router';

const PostCard: React.FC<{ post: ClubPostResponseDto }> = ({ post }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/club/posts/${post.postId}`);
  };

  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-500 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={post.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000'} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {post.clubName}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400 uppercase mb-3">
          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" /> {formatDate(post.postDate)}</span>
          <span className="flex items-center gap-1.5"><User size={14} className="text-orange-500" /> {post.userName}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed italic">
          "{post.caption}"
        </p>

        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
          <button className="flex items-center gap-2 text-orange-600 font-bold text-sm group/btn"
            onClick={handleCardClick}
          >
            Đọc bài viết 
            <span className="p-1.5 bg-orange-50 rounded-full group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-all">
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;