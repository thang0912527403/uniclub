import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(false); // Default light mode cho cả server và client
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Đọc từ cookies chỉ sau khi component mount (client-side)
    if (typeof document !== 'undefined') {
      const savedTheme = document.cookie
        .split('; ')
        .find(row => row.startsWith('theme='))
        ?.split('=')[1];
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Lưu vào cookies khi theme thay đổi (chỉ sau khi hydrated)
    if (isHydrated && typeof document !== 'undefined') {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1); // Expires sau 1 năm
      document.cookie = `theme=${isDark ? 'dark' : 'light'}; expires=${expires.toUTCString()}; path=/`;
    }
  }, [isDark, isHydrated]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return { isDark, setIsDark, toggleTheme };
}
