import { useState, useEffect } from 'react';

export function useSidebarToggle() {
  const [isOpen, setIsOpen] = useState<boolean>(true); // Default: true (mở) cho cả server và client
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Đọc từ localStorage chỉ sau khi component mount (client-side)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) {
        setIsOpen(saved === 'true');
      }
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Lưu vào localStorage khi thay đổi (chỉ sau khi hydrated)
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isHydrated]);

  const toggle = () => {
    setIsOpen(prev => !prev);
  };

  return { isOpen, toggle, setIsOpen };
}
