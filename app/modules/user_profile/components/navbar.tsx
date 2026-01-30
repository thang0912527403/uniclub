import React from 'react';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-10 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-[#f26522] text-white font-bold p-1 rounded text-xl">UC</div>
        <span className="text-2xl font-bold text-[#1a2e44]">UniClubs</span>
      </div>
      <div className="hidden md:flex gap-8 text-gray-600 font-medium">
        <a href="#" className="hover:text-[#f26522]">Trang chủ</a>
        <a href="#" className="hover:text-[#f26522]">Câu lạc bộ</a>
        <a href="#" className="hover:text-[#f26522]">Sự kiện</a>
        <a href="#" className="hover:text-[#f26522]">Chiến dịch</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-600 font-medium">Đăng xuất</button>
        <button className="bg-[#f26522] text-white px-6 py-2 rounded-lg font-bold">Tham gia ngay</button>
      </div>
    </nav>
  );
};

export default Navbar;