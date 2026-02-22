import { useState, useEffect } from 'react';

export function useExpandedMenu() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Đọc từ localStorage chỉ sau khi component mount (client-side)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expandedMenuItems');
      if (saved) {
        setExpandedItems(JSON.parse(saved));
      }
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Lưu vào localStorage khi thay đổi (chỉ sau khi hydrated)
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('expandedMenuItems', JSON.stringify(expandedItems));
    }
  }, [expandedItems, isHydrated]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isExpanded = (label: string) => expandedItems.includes(label);

  return { expandedItems, toggleExpand, isExpanded };
}
