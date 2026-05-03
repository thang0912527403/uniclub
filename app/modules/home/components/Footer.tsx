import React from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white py-10 sm:py-12 px-4 sm:px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-orange-500 p-2 rounded-lg">
                                {/* Graduation Cap SVG Icon */}
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">UniClubs</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Nền tảng kết nối sinh viên với các câu lạc bộ và hoạt động ngoại khóa
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3 mt-4">
                            <a href="#" className="bg-gray-800 hover:bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer" aria-label="Facebook">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="#" className="bg-gray-800 hover:bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer" aria-label="Twitter">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </a>
                            <a href="#" className="bg-gray-800 hover:bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer" aria-label="YouTube">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z" />
                                </svg>
                            </a>
                            <a href="#" className="bg-gray-800 hover:bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer" aria-label="Instagram">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links - Giới thiệu */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Giới thiệu</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Về UniClubs</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Câu lạc bộ</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Sự kiện</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Tin tức</a></li>
                        </ul>
                    </div>

                    {/* Links - Hỗ trợ */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Hỗ trợ</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Trung tâm trợ giúp</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Điều khoản dịch vụ</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Liên hệ</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Đăng ký nhận tin</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Nhận thông tin về các sự kiện và hoạt động mới nhất
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email của bạn"
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition-all duration-300"
                            />
                            <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer" aria-label="Subscribe">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm">
                        © {currentYear} UniClubs. Tất cả các quyền được bảo lưu.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Điều khoản</a>
                        <a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Quyền riêng tư</a>
                        <a href="#" className="hover:text-orange-500 transition-colors cursor-pointer">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
