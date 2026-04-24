import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { logoutUser } from "~/utils/auth";
import { useCurrentUser } from "~/hooks/useCurrentUser";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuth, isLoading, isError } = useCurrentUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Trang chủ", href: "/home" },
    { name: "Câu lạc bộ", href: "/public/clubs" },
    { name: "Sự kiện", href: "/public/events" },
    { name: "Tin tức", href: "/public/news" },
    { name: "Về chúng tôi", href: "#about" },
  ];

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  // User Avatar Component
  const UserAvatar = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const sizeClasses =
      size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";

    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.fullName}
          className={`${sizeClasses} rounded-full object-cover border-2 border-orange-200`}
        />
      );
    }

    // Default avatar with initials
    const initials =
      user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
      <div
        className={`${sizeClasses} rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold`}
      >
        {initials}
      </div>
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-lg py-3"
          : "bg-white/95 backdrop-blur-md py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="/home"
            onClick={(e) => handleSmoothScroll(e, "/home")}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="bg-orange-500 p-2 rounded-lg group-hover:bg-orange-600 transition-all duration-300 group-hover:scale-105">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors duration-300">
              UniClubs
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-300 relative group cursor-pointer"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-300 relative group cursor-pointer"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ),
            )}
          </div>

          {/* CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              /* User is logged in - show user menu */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors duration-300"
                >
                  <UserAvatar />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Hồ sơ cá nhân
                      </Link>

                      <Link
                        to="/manage-clubs"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Câu lạc bộ của tôi
                      </Link>

                      <Link
                        to="/auth/change-password"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
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
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                        Đổi mật khẩu
                      </Link>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
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
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : !isMounted || (isAuth && !isError && (!user || isLoading)) ? (
              /* Loading state - show skeleton */
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="text-left hidden md:block">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-2 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : isAuth && isError ? (
              /* Server error state - user is logged in but server is unreachable */
              <div className="relative group flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 cursor-default select-none">
                <div className="relative flex items-center justify-center w-8 h-8">
                  {/* Pulsing ring */}
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-30 animate-ping"></span>
                  <svg
                    className="w-5 h-5 text-red-500 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-red-600 hidden md:block">
                  Mất kết nối server
                </span>
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white mb-0.5">Không thể tải thông tin</p>
                      <p className="text-gray-400 leading-relaxed">Server hiện không phản hồi. Vui lòng thử làm mới trang hoặc quay lại sau.</p>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -top-1.5 right-6 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            ) : (
              /* User is not logged in - show login/register buttons */
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-300 cursor-pointer"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer inline-block"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
