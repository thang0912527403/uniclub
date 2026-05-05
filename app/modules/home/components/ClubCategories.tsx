import React from "react";
import { useNavigate } from "react-router";
import {
  useGetActiveClubsQuery,
  useGetClubMemberCountQuery,
  type Club,
} from "~/cores/api";
import { Users, ArrowRight } from "lucide-react";

function ClubCard({ club }: { club: Club }) {
  const navigate = useNavigate();
  const { data: memberCount } = useGetClubMemberCountQuery(club.clubId);

  return (
    <div
      onClick={() => navigate(`/public/clubs/${club.clubId}`)}
      className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-gray-100"
    >
      {/* Image Header */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={
            club.coverImageUrl ||
            "https://i.ytimg.com/vi/Cq2uAOsK930/maxresdefault.jpg"
          }
          alt={club.clubName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        {/* Logo Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="w-12 h-12 p-1 bg-white rounded-xl shadow-lg">
            <img
              src={
                club.logoUrl ||
                "https://yt3.googleusercontent.com/YaAFWY03ER0DfF77HAyMqNlRxmJiSEDq_I7ZF0MlcgRcVzOhIhZfB8QlwNhAuVXZesi2I2zy=s900-c-k-c0x00ffffff-no-rj"
              }
              alt="logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
            {club.shortName}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-1 uppercase tracking-tight">
          {club.clubName}
        </h3>

        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
          {club.description ||
            "Chưa có mô tả chi tiết cho câu lạc bộ này. Hãy nhấn khám phá để tìm hiểu thêm."}
        </p>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <Users size={16} className="text-orange-500" />
            <span>{memberCount ?? club.memberCount} Thành viên</span>
          </div>

          <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ClubCategories: React.FC = () => {
  const { data, isFetching } = useGetActiveClubsQuery({
    pageIndex: "1",
    searchQuery: "",
    pageSize: "3",
  });
  const clubs = data?.data ?? [];
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 md:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Câu lạc bộ <span className="text-orange-500">hàng đầu</span>
          </h2>
          <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
            Khám phá và tham gia vào những cộng đồng năng động, nơi đam mê của
            bạn được tỏa sáng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clubs.slice(0, 3).map((club) => (
            <ClubCard key={club.clubId} club={club} />
          ))}
        </div>

        {/* Bottom Action */}
        <div className="text-center mt-10">
          <button
            className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2 group cursor-pointer"
            onClick={() => navigate("/public/clubs")}
          >
            Xem tất cả câu lạc bộ
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClubCategories;
