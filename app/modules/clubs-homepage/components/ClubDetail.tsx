import React from 'react';
import { 
  Globe, 
  Facebook, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  ChevronLeft,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Club } from '~/cores/api';

const ClubDetailModule: React.FC<{ club: Club }> = ({ club }) => {
  const navigate = useNavigate();

  // Xử lý hiển thị ngày thành lập hoặc ngày tạo
  const displayDate = club.foundedDate || club.createdAt;
  const formattedDate = new Date(displayDate).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <div className="bg-white min-h-screen">
      {/* 1. Nút quay lại (Floating) */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl border border-gray-100 hover:scale-110 transition-all text-gray-700"
      >
        <ChevronLeft size={24} />
      </button>

      {/* 2. Banner & Logo Section */}
      <section className="relative h-[35vh] md:h-[45vh] overflow-hidden">
        <img 
          src={club.coverImageUrl || 'https://i.ytimg.com/vi/Cq2uAOsK930/maxresdefault.jpg'} 
          className="w-full h-full object-cover shadow-inner" 
          alt="Club Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        <div className="absolute -bottom-1 w-full">
          <div className="max-w-6xl mx-auto px-6 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Logo */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] p-1.5 shadow-2xl border-4 border-white overflow-hidden">
                <img 
                  src={club.logoUrl || 'https://yt3.googleusercontent.com/YaAFWY03ER0DfF77HAyMqNlRxmJiSEDq_I7ZF0MlcgRcVzOhIhZfB8QlwNhAuVXZesi2I2zy=s900-c-k-c0x00ffffff-no-rj'} 
                  className="w-full h-full object-contain rounded-[2.2rem]" 
                  alt="Club Logo" 
                />
              </div>
              {club.isActive && (
                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>

            {/* Title & Badge */}
            <div className="flex-1 text-center md:text-left mb-2">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-3">
                <span className="bg-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-500/40">
                  {club.shortName}
                </span>
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                   <Calendar size={14} className="text-orange-400" /> Thành lập: {formattedDate}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
                {club.clubName}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-2">
              <button className="bg-white text-gray-900 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95">
                THAM GIA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Content Grid */}
      <main className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Description & Stats */}
        <div className="lg:col-span-7 space-y-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 py-8 border-y border-gray-100">
            <div className="text-center">
               <p className="text-2xl font-black text-gray-900">{club.memberCount || 0}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Thành viên</p>
            </div>
            <div className="text-center border-x border-gray-100">
               <p className="text-2xl font-black text-gray-900">{club.status}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Trạng thái</p>
            </div>
            <div className="text-center">
               <p className="text-2xl font-black text-gray-900">{club.isPublic ? "Public" : "Private"}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Chế độ</p>
            </div>
          </div>

          {/* About Section */}
          <section>
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3 italic uppercase">
              <span className="w-8 h-1 bg-orange-500"></span>
              Giới thiệu
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line font-medium">
              {club.description || "Câu lạc bộ hiện chưa cập nhật thông tin giới thiệu chi tiết."}
            </p>
          </section>

          {/* Placeholder for Events/Posts */}
          <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
             <Info className="mx-auto text-gray-300 mb-3" size={32} />
             <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Các hoạt động sắp tới sẽ được cập nhật sớm</p>
          </div>
        </div>

        {/* Right Column: Contact Sidebar */}
        <aside className="lg:col-span-5 space-y-8">
          <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-10 border-b border-gray-200 pb-4">
              Contact Information
            </h4>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Địa chỉ</p>
                  <p className="text-sm font-bold text-gray-800 leading-snug">{club.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-500">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-800">{club.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-500">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Điện thoại</p>
                  <p className="text-sm font-bold text-gray-800">{club.phoneNumber}</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4">
              {club.facebookUrl && (
                <a href={club.facebookUrl} target="_blank" rel="noreferrer" className="flex-1 bg-white p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors border border-gray-100 group">
                   <Facebook size={20} className="text-gray-400 group-hover:text-blue-600" />
                   <span className="text-[10px] font-black text-gray-400">FACEBOOK</span>
                </a>
              )}
              {club.websiteUrl && (
                <a href={club.websiteUrl} target="_blank" rel="noreferrer" className="flex-1 bg-white p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-orange-50 transition-colors border border-gray-100 group">
                   <Globe size={20} className="text-gray-400 group-hover:text-orange-500" />
                   <span className="text-[10px] font-black text-gray-400">WEBSITE</span>
                </a>
              )}
            </div>

            {/* Button Xem thêm tin tức */}
            <button
              onClick={() => navigate('/public/clubs')}
              className="w-full mt-8 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              ← Xem thêm câu lạc bộ
            </button>
          </div>

          {/* Privacy Note */}
          <div className="px-10">
             <p className="text-[11px] text-gray-400 italic leading-relaxed text-center">
               Mọi thông tin trên đây thuộc bản quyền của <strong>{club.clubName}</strong>. 
               Vui lòng liên hệ ban quản trị để biết thêm chi tiết về quy định tham gia.
             </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ClubDetailModule;