import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

export function useSidebarToggle() {
  const [isOpen, setIsOpen] = useState<boolean>(true); // SSR/default: true
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = isMobileViewport();
    if (mobile) {
      setIsOpen(false); // Mobile: mặc định đóng
    } else {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) setIsOpen(saved === 'true');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && !isMobileViewport()) {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isHydrated]);

  const toggle = () => {
    setIsOpen(prev => !prev);
  };

  return { isOpen, toggle, setIsOpen };
}
