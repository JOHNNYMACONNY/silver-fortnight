import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { MOTION_VARIANTS } from '../../utils/animations';
import Box from '../layout/primitives/Box';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
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
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full lg:max-w-2xl',
    xl: 'max-w-xl w-full md:max-w-2xl lg:max-w-3xl',
    xxl: 'max-w-2xl w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl',
    full: 'max-w-full w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-6rem)]'
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
            className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-black/40 motion-reduce:animate-none motion-reduce:transition-none"
            onClick={handleBackdropClick}
            style={{ backdropFilter: 'blur(12px)' }}
            initial="hidden"
            animate={shouldReduceMotion ? undefined : 'visible'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            variants={MOTION_VARIANTS.backdrop}
          >
            {/* Modal content with spring animation */}
            <Box
              ref={modalRef}
              className={cn(
                'w-full rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-orange-500/10 @container',
                'border border-white/20',
                '!max-h-[98vh] sm:!max-h-[95vh] md:!max-h-[90vh] lg:!max-h-[85vh]',
                '!flex !flex-col',
                'bg-white/5 dark:bg-white/5',
                'mx-auto',
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
                className="flex flex-col h-full min-h-0"
                initial={shouldReduceMotion ? undefined : 'hidden'}
                animate={shouldReduceMotion ? undefined : 'visible'}
                exit={shouldReduceMotion ? undefined : 'exit'}
                variants={MOTION_VARIANTS.modal as import('framer-motion').Variants}
              >
                {title && (
                  <header className={cn('px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b border-border/30 flex-shrink-0')}>
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <h2 
                        id="modal-title" 
                        className={cn('text-base sm:text-lg md:text-xl font-semibold text-foreground truncate flex-1 min-w-0')}
                      >
                        {title}
                      </h2>
                      <motion.button
                        type="button"
                        className={cn(
                          'text-muted-foreground hover:text-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg',
                          'p-1.5 sm:p-2',
                          'transition-colors duration-200',
                          'min-w-[44px] min-h-[44px]',
                          'flex items-center justify-center flex-shrink-0'
                        )}
                        onClick={handleCloseClick}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        aria-label="Close modal"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-5 w-5 sm:h-6 sm:w-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
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
                  </header>
                )}

                <section className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 overflow-y-auto flex-1 min-h-0">
                  {children}
                </section>

                {footer && (
                  <footer className={cn('px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-border/30 flex-shrink-0')}>
                    {footer}
                  </footer>
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
export const Modal = memo(ModalComponent) as React.FC<ModalProps>;
