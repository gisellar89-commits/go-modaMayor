import { useEffect } from "react";

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export default function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isOpen: boolean, returnFocusRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isOpen || !containerRef?.current) return;

    const container = containerRef.current;
    const prevActive = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
      );

    const focusable = getFocusable();
    const first = focusable[0] ?? container;
    try {
      first.focus();
    } catch (e) {
      // ignore
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const list = getFocusable();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const idx = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx === 0 || document.activeElement === container) {
          e.preventDefault();
          list[list.length - 1].focus();
        }
      } else {
        if (idx === list.length - 1) {
          e.preventDefault();
          list[0].focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const toReturn = returnFocusRef?.current ?? prevActive;
      try {
        (toReturn as HTMLElement | null)?.focus();
      } catch (e) {
        // ignore
      }
    };
  }, [containerRef, isOpen, returnFocusRef]);
}
