import { useState, useEffect, useRef } from 'react';
import { toggleTheme, isDarkMode } from '~/utils/theme';

export function SettingButton() {
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('vi');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with DOM when component mounts
  useEffect(() => {
    setIsDark(isDarkMode());
    
    // Listen for theme changes
    const handleThemeChange = () => {
      setIsDark(isDarkMode());
    };
    
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
      {/* Settings Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              <i className="fas fa-cog mr-2"></i>
              Cài đặt
            </h3>
          </div>

          {/* Settings List */}
          <div className="py-2">
            {/* Theme Setting */}
            <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'} text-blue-500`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Giao diện</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isDark ? 'Chế độ tối' : 'Chế độ sáng'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Language Setting (UI only) */}
            <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors opacity-60 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-language text-green-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Ngôn ngữ</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'vi' ? 'Tiếng Việt' : 'English'}
                    </p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none cursor-not-allowed"
                  disabled
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>

            {/* Notifications Setting (UI only) */}
            <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors opacity-60 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-bell text-yellow-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Thông báo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đang bật
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>

            {/* Sound Setting (UI only) */}
            <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors opacity-60 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-volume-up text-purple-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Âm thanh</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đang bật
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <i className="fas fa-info-circle mr-1"></i>
              Một số tính năng đang phát triển
            </p>
          </div>
        </div>
      )}

      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
        title="Cài đặt"
        aria-label="Settings"
      >
        <i className="fas fa-cog text-xl transition-transform group-hover:rotate-90 duration-300"></i>
      </button>
    </div>
  );
}
