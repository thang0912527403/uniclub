import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { Club } from '~/cores/api';
import { useNavigate } from 'react-router';
import {useGetClubMemberCountQuery} from '~/cores/api/clubApi';

const ClubCard: React.FC<{ club: Club }> = ({ club }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const navigate = useNavigate();
    const { data: memberCount = 0 } = useGetClubMemberCountQuery(club.clubId);

    const handleCardClick = () => {
        navigate(`/public/clubs/${club.clubId}`);
    };

    return (
        <div className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-500 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={club.coverImageUrl || 'https://gemini.google.com/share/7c0bfa0f995f'}
                    alt={club.clubName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {club.clubName}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400 uppercase mb-3">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" /> {formatDate(club.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><User size={14} className="text-orange-500" /> {memberCount} thành viên</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug flex items-center gap-2">
                    {/* Logo Club */}
                    <img
                        src={club.logoUrl || 'https://gemini.google.com/share/7c0bfa0f995f'}
                        alt={club.clubName}
                        className="w-6 h-6 rounded-full object-cover border border-gray-100 shadow-sm"
                    />

                    {/* Club Name - Short Name */}
                    <span className="truncate">
                        {club.shortName}
                    </span>
                </h3>

                <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed italic">
                    "{club.description}"
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
                    <button className="flex items-center gap-2 text-orange-600 font-bold text-sm group/btn"
                        onClick={handleCardClick}
                    >
                        Xem chi tiết câu lạc bộ
                        <span className="p-1.5 bg-orange-50 rounded-full group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-all">
                            <ArrowRight size={16} />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClubCard;