import React, { useState, useEffect } from 'react';
import { Transition } from './transitions/Transition';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
  action?: ToastAction;
  persistent?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  action,
  persistent = false
}) => {
  const [show, setShow] = useState(true);

  // Auto-close after duration (unless persistent)
  useEffect(() => {
    if (duration > 0 && !persistent) {
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [duration, persistent]);

  // Handle close
  const handleClose = () => {
    setShow(false);
  };

  // Handle after exit
  const handleExited = () => {
    onClose();
  };

  // Type-specific styles
  const typeStyles = {
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-l-4 border-success-500 dark:border-success-600',
      text: 'text-success-700 dark:text-success-400',
      icon: (
        <svg
          className="h-5 w-5 text-success-500 dark:text-success-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-900/20',
      border: 'border-l-4 border-error-500 dark:border-error-600',
      text: 'text-error-700 dark:text-error-400',
      icon: (
        <svg
          className="h-5 w-5 text-error-500 dark:text-error-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-l-4 border-warning-500 dark:border-warning-600',
      text: 'text-warning-700 dark:text-warning-400',
      icon: (
        <svg
          className="h-5 w-5 text-warning-500 dark:text-warning-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      border: 'border-l-4 border-primary-500 dark:border-primary-600',
      text: 'text-primary-700 dark:text-primary-400',
      icon: (
        <svg
          className="h-5 w-5 text-primary-500 dark:text-primary-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
  };

  const { bg, border, text, icon } = typeStyles[type];

  return (
    <Transition show={show} type="fade" duration={300} onExited={handleExited}>
      <div
        className={cn(
          'rounded-lg shadow-md p-4 mb-4 flex items-start transition-all duration-200',
          bg,
          border
        )}
        role="alert"
      >
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', text)}>{message}</p>
          {action && (
            <div className="mt-2">
              <button
                type="button"
                className={cn(
                  'text-xs font-medium underline hover:no-underline focus:outline-none transition-colors duration-200',
                  text
                )}
                onClick={() => {
                  action.onClick();
                  handleClose();
                }}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex items-start gap-2">
          {action && (
            <button
              type="button"
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors duration-200',
                type === 'error'
                  ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20'
              )}
              onClick={() => {
                action.onClick();
                handleClose();
              }}
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            className="inline-flex text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 focus:outline-none transition-colors duration-200"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  );
};
