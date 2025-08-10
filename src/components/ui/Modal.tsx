import React, { useEffect, useRef, useCallback, memo } from 'react';
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

  // Handle ESC key press
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

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
            className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black bg-opacity-60"
            onClick={handleBackdropClick}
            style={{ backdropFilter: 'blur(2px)' }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={MOTION_VARIANTS.backdrop}
          >
            {/* Modal content with spring animation */}
            <Box
              ref={modalRef}
              className={cn(
                'w-full rounded-lg overflow-hidden bg-card text-card-foreground shadow-lg @container',
                sizeClasses[size]
              )}
              style={{ containerType: 'inline-size' }}
              onClick={handleModalClick}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={MOTION_VARIANTS.modal as import('framer-motion').Variants}
              >
                {title && (
                  <div className={cn('px-6 py-4 border-b border-border')}>
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
                  <div className={cn('px-6 py-4 border-t border-border')}>
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
