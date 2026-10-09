"use client";

import { useEffect, useRef } from "react";

/**
 * Hook for WCAG 2.1 AA compliant modal focus management:
 * - Automatically focuses the first interactive element on open
 * - Traps Tab and Shift+Tab cycling within the modal dialog
 * - Handles Escape key to dismiss
 * - Restores focus to the triggering element upon close
 */
export function useModalFocusTrap(
  isOpen: boolean,
  onClose?: () => void,
  isSubmitting: boolean = false,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (
        previouslyFocusedRef.current &&
        typeof previouslyFocusedRef.current.focus === "function"
      ) {
        previouslyFocusedRef.current.focus();
      }
      return;
    }

    if (typeof document !== "undefined") {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Delay slightly to let animations or children render
    const timer = setTimeout(() => {
      const focusable = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length > 0) {
        const firstEditable = Array.from(focusable).find(
          (el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA",
        );
        (firstEditable || focusable[0]).focus();
      }
    }, 50);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && onClose && !isSubmitting) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = container?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!elements || elements.length === 0) return;

      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  return containerRef;
}
