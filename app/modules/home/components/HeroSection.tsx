import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sparkles, Star, Users, Globe } from "lucide-react";

import hero1 from "../../../../src/assets/images/hero_img/hero-1.jpg";
import hero2 from "../../../../src/assets/images/hero_img/hero-2.png";
import hero3 from "../../../../src/assets/images/hero_img/hero-3.png";
import hero4 from "../../../../src/assets/images/hero_img/hero-4.png";
import hero5 from "../../../../src/assets/images/hero_img/hero-5.png";

const HeroSection: React.FC = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY);
    };
    // Add passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 py-20 px-6 md:px-12 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
              Tham gia CLB và tạo{" "}
              <span className="text-orange-500 relative inline-block">
                kết nối
                <svg
                  className="absolute -bottom-2 -left-2 w-[110%]"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 2 150 2 198 10"
                    stroke="#f97316"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <br className="hidden md:block" />
              bền vững
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
              Khám phá các câu lạc bộ đa dạng, tham gia các hoạt động bổ ích và
              kết nối với những người bạn cùng chí hướng. Hãy là một phần của
              cộng đồng sinh viên sôi động!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/question"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                Tham gia CLB
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
              <button className="border-2 border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-500 px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-white cursor-pointer group">
                Tìm hiểu thêm
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-8 border-t border-gray-100 mt-4">
              <div className="group cursor-default">
                <div className="text-4xl font-extrabold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                  150<span className="text-orange-500">+</span>
                </div>
                <div className="text-gray-500 text-sm mt-1 font-medium">
                  Câu lạc bộ
                </div>
              </div>
              <div className="group cursor-default">
                <div className="text-4xl font-extrabold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                  5K<span className="text-orange-500">+</span>
                </div>
                <div className="text-gray-500 text-sm mt-1 font-medium">
                  Thành viên
                </div>
              </div>
              <div className="group cursor-default">
                <div className="text-4xl font-extrabold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                  200<span className="text-orange-500">+</span>
                </div>
                <div className="text-gray-500 text-sm mt-1 font-medium">
                  Sự kiện/năm
                </div>
              </div>
            </div>
          </div>

          {/* Right Image - Parallax Grid */}
          <div className="relative h-[600px] w-full hidden md:flex items-center justify-center lg:pl-10">
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-orange-400 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute top-1/2 -left-6 w-32 h-32 bg-blue-400 rounded-full opacity-10 blur-2xl"></div>

            {/* Floating Icons */}
            <div className="absolute top-10 left-0 text-orange-400 animate-bounce z-20">
              <Star size={32} strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-5 right-20 text-blue-400 animate-pulse z-20">
              <Sparkles size={40} strokeWidth={1.5} />
            </div>

            {/* Images Masonry Grid */}
            <div className="w-full flex gap-4 lg:gap-5 h-full items-center relative z-10">
              {/* Column 1 - Moves slower (downwards relative) */}
              <div
                className="flex flex-col gap-4 lg:gap-5 w-1/3 will-change-transform ease-out"
                style={{ transform: `translateY(${-40 + offset * 0.1}px)` }}
              >
                <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/50 h-[220px] lg:h-[260px] relative group">
                  <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img
                    src={hero1}
                    alt="Club activities"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md ring-1 ring-white/50 h-[260px] lg:h-[300px] relative group">
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img
                    src={hero2}
                    alt="Club collaboration"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Column 2 - Core focus, moves slightly up (faster) */}
              <div
                className="flex flex-col gap-4 lg:gap-5 w-1/3 will-change-transform ease-out"
                style={{ transform: `translateY(${20 + offset * -0.12}px)` }}
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white h-[300px] lg:h-[360px] relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"></div>
                  <img
                    src={hero3}
                    alt="Student connection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20 text-white font-medium text-sm px-3 py-1 bg-white/20 backdrop-blur-md rounded-full shadow-sm">
                    Nhiệt huyết
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/50 h-[200px] lg:h-[230px] relative group">
                  <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img
                    src={hero4}
                    alt="Team building"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Column 3 - Moves slower (downwards strongly) */}
              <div
                className="flex flex-col gap-4 lg:gap-5 w-1/3 will-change-transform ease-out"
                style={{ transform: `translateY(${-20 + offset * 0.15}px)` }}
              >
                <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/50 h-[240px] lg:h-[280px] relative group">
                  <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img
                    src={hero5}
                    alt="Creative projects"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="h-[180px] lg:h-[200px] bg-gradient-to-br from-orange-400 to-rose-400 rounded-2xl shadow-xl flex flex-col items-center justify-center group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-400/40">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Sparkles className="text-white mb-2" size={28} />
                  <span className="font-bold text-white text-lg px-4 text-center">
                    Khám phá <br /> ngay!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile fallback image (Only visible on small screens) */}
          <div className="md:hidden mt-8">
            <div className="rounded-2xl overflow-hidden shadow-lg relative h-[300px]">
              <img
                src={hero3}
                alt="Club activities default"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white font-bold text-xl">
                Sáng tạo & Năng động
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
