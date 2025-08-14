import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { MOTION_VARIANTS } from '../../utils/animations';
import Box from '../layout/primitives/Box';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
}

export const ModalComponent: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  closeOnEsc = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [shouldReduceMotion, setShouldReduceMotion] = useState<boolean>(false);

  // Size classes - memoized as a constant outside of render
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  // Handle ESC key press - memoized with useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (closeOnEsc && e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [closeOnEsc, isOpen, onClose]);

  // Handle click outside - memoized with useCallback
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [closeOnClickOutside, onClose]);

  // Handle close button click - memoized with useCallback
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent event propagation - memoized with useCallback
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Focus helpers
  const getFocusableElements = useCallback((container: HTMLElement | null): HTMLElement[] => {
    if (!container) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
  }, []);

  const focusFirstElement = useCallback(() => {
    const container = modalRef.current;
    if (!container) return;
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.focus();
    }
  }, [getFocusableElements]);

  const handleFocusTrapKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const container = modalRef.current;
    if (!container) return;
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      // Shift+Tab
      if (!current || current === first || !container.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (!current || current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [getFocusableElements]);

  // Handle ESC key press
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Setup reduced motion preference
  useEffect(() => {
    const query = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const update = () => setShouldReduceMotion(query ? query.matches : false);
    update();
    if (query) {
      try {
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
      } catch {
        // Safari fallback
        query.addListener(update);
        return () => query.removeListener(update);
      }
    }
  }, []);

  // Focus management: capture previously focused element, set initial focus, restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = (document.activeElement as HTMLElement) || null;
      // Defer to next frame to ensure modal content is mounted
      const id = requestAnimationFrame(() => {
        focusFirstElement();
      });
      return () => cancelAnimationFrame(id);
    } else {
      // Restore focus to the element that opened the modal
      const prev = previouslyFocusedElementRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen, focusFirstElement]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Render modal with portal and AnimatePresence for enter/exit animations
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade animation */}
          <motion.div
            className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black bg-opacity-60 motion-reduce:animate-none motion-reduce:transition-none"
            onClick={handleBackdropClick}
            style={{ backdropFilter: 'blur(2px)' }}
            initial="hidden"
            animate={shouldReduceMotion ? undefined : 'visible'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            variants={MOTION_VARIANTS.backdrop}
          >
            {/* Modal content with spring animation */}
            <Box
              ref={modalRef}
              className={cn(
                'w-full rounded-lg overflow-hidden bg-card text-card-foreground shadow-lg @container border-glass',
                sizeClasses[size]
              )}
              style={{ containerType: 'inline-size' }}
              onClick={handleModalClick}
              onKeyDown={handleFocusTrapKeyDown}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              tabIndex={-1}
            >
              <motion.div
                initial={shouldReduceMotion ? undefined : 'hidden'}
                animate={shouldReduceMotion ? undefined : 'visible'}
                exit={shouldReduceMotion ? undefined : 'exit'}
                variants={MOTION_VARIANTS.modal as import('framer-motion').Variants}
              >
                {title && (
                  <div className={cn('px-6 py-4 border-b border-divider')}>
                    <div className="flex items-center justify-between">
                      <h3 id="modal-title" className={cn('text-lg font-medium text-foreground')}>{title}</h3>
                      <motion.button
                        type="button"
                        className={cn(
                          'text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400',
                          'focus:outline-none'
                        )}
                        onClick={handleCloseClick}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-6 w-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                )}

                <div className="px-6 py-4">
                  {children}
                </div>

                {footer && (
                  <div className={cn('px-6 py-4 border-t border-divider')}>
                    {footer}
                  </div>
                )}
              </motion.div>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Memoize the Modal component to prevent unnecessary re-renders
export const Modal = memo(ModalComponent);
