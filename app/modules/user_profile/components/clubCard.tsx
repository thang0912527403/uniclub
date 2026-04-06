import React from 'react';
export interface ClubCardProps { image?: string; title?: string; category?: string; description?: string; members?: number | string; events?: number | string; iconColor?: string; }

const ClubCard: React.FC<ClubCardProps> = ({ image, title, category, description, members, events, iconColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-transform hover:scale-105">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`${iconColor} p-2 rounded-lg text-white`}>
            {/* Icon placeholder */}
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
            <p className="text-gray-400 text-sm">{category}</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-6 line-clamp-2">{description}</p>
        <div className="flex gap-4 text-sm text-gray-500 mb-6">
          <span>👥 {members} thành viên</span>
          <span>📅 {events} sự kiện</span>
        </div>
        <button className="w-full py-2 bg-[#fff5ee] text-[#f26522] rounded-xl font-bold hover:bg-[#f26522] hover:text-white transition-colors">
          Chi tiết CLB
        </button>
      </div>
    </div>
  );
};

export default ClubCard;