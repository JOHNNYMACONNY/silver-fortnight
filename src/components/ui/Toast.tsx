import React, { useState, useEffect } from 'react';
import { Transition } from './transitions/Transition';
import { cn } from '../../utils/cn';
import { CheckCircle, AlertTriangle, XCircle, Info, Zap, Handshake, Globe, Star, Trophy, Crown, X, Flame, Wifi, Wrench } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'trades' | 'collaboration' | 'community' | 'xp' | 'achievement' | 'level-up' | 'streak' | 'connection' | 'maintenance';

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

  // Type-specific styles with glassmorphic design
  const typeStyles = {
    success: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-success-500/30',
      text: 'text-foreground',
      icon: <CheckCircle className="h-5 w-5 text-success-600" />
    },
    error: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-red-500/30',
      text: 'text-foreground',
      icon: <XCircle className="h-5 w-5 text-red-600" />
    },
    warning: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-amber-500/30',
      text: 'text-foreground',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />
    },
    info: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-blue-500/30',
      text: 'text-foreground',
      icon: <Info className="h-5 w-5 text-blue-600" />
    },
    // Topic-based semantic variants
    trades: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-orange-500/30',
      text: 'text-foreground',
      icon: <Zap className="h-5 w-5 text-orange-600" />
    },
    collaboration: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-purple-500/30',
      text: 'text-foreground',
      icon: <Handshake className="h-5 w-5 text-purple-600" />
    },
    community: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-blue-500/30',
      text: 'text-foreground',
      icon: <Globe className="h-5 w-5 text-blue-600" />
    },
    // Gamification variants
    xp: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-orange-500/30',
      text: 'text-foreground',
      icon: <Star className="h-5 w-5 text-orange-600" />
    },
    achievement: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-purple-500/30',
      text: 'text-foreground',
      icon: <Trophy className="h-5 w-5 text-purple-600" />
    },
    'level-up': {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-yellow-500/30',
      text: 'text-foreground',
      icon: <Crown className="h-5 w-5 text-yellow-600" />
    },
    // System and status variants
    streak: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-orange-500/30',
      text: 'text-foreground',
      icon: <Flame className="h-5 w-5 text-orange-600" />
    },
    connection: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-blue-500/30',
      text: 'text-foreground',
      icon: <Wifi className="h-5 w-5 text-blue-600" />
    },
    maintenance: {
      bg: 'bg-white/5 backdrop-blur-xl',
      border: 'border border-amber-500/30',
      text: 'text-foreground',
      icon: <Wrench className="h-5 w-5 text-amber-600" />
    }
  };

  const { bg, border, text, icon } = typeStyles[type];

  return (
    <Transition show={show} type="fade" duration={300} onExited={handleExited}>
      <div
        className={cn(
          'rounded-xl shadow-md p-4 mb-4 flex items-start transition-all duration-200',
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
              className="text-xs px-3 py-1.5 rounded-lg border border-current/30 hover:bg-current/10 transition-colors duration-200"
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
            className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200 p-1 rounded-lg hover:bg-current/10"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Transition>
  );
};
