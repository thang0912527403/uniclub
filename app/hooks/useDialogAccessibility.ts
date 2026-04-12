import { useEffect, useRef, type RefObject } from 'react';

/**
 * Focus trap, Escape đóng, và trả focus về phần tử mở dialog khi đóng.
 */
export function useDialogAccessibility(open: boolean, onRequestClose: () => void): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onRequestClose);
  onCloseRef.current = onRequestClose;
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const container = containerRef.current;

    const focusFirst = () => {
      if (!container) return;
      const selectors =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const first = container.querySelector<HTMLElement>(selectors);
      first?.focus();
    };

    const id = window.setTimeout(focusFirst, 0);

    const listFocusables = () => {
      if (!container) return [] as HTMLElement[];
      const selectors =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const nodes = listFocusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', handleKeyDown);
      prevFocusRef.current?.focus?.();
    };
  }, [open]);

  return containerRef;
}
