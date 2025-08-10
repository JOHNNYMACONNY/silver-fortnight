import React from 'react';
import { cn } from '../../utils/cn';

// Fallback Button Component
export const FallbackButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, variant = 'default', size = 'md', className = '', disabled = false, type = 'button' }) => {
  const variantClasses = {
    default: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    destructive: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
        className
      )}
    >
      {children}
    </button>
  );
};

// Fallback Card Component - Enhanced with Glassmorphism
export const FallbackCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated';
}> = ({ children, className = '', variant = 'default' }) => {
  const variantClasses = {
    default: 'backdrop-blur-md bg-white/70 dark:bg-neutral-800/60 border border-white/20 dark:border-neutral-700/30',
    glass: 'backdrop-blur-lg bg-white/80 dark:bg-neutral-800/70 border border-white/30 dark:border-neutral-700/40 shadow-glass',
    elevated: 'backdrop-blur-xl bg-white/90 dark:bg-neutral-800/80 border-2 border-white/40 dark:border-neutral-700/50 shadow-2xl'
  };

  return (
    <div className={cn(
      'rounded-xl shadow-glass transition-all duration-300',
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
};

export const FallbackCardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)}>
    {children}
  </div>
);

export const FallbackCardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
);

export const FallbackCardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={cn('p-6 pt-0', className)}>
    {children}
  </div>
);

export const FallbackCardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={cn('flex items-center p-6 pt-0', className)}>
    {children}
  </div>
);

// Fallback Badge Component - Enhanced with Glassmorphism
export const FallbackBadge: React.FC<{
  children: React.ReactNode;
  variant?: string;
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'backdrop-blur-sm bg-orange-100/80 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50',
    secondary: 'backdrop-blur-sm bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50',
    destructive: 'backdrop-blur-sm bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50 dark:border-red-800/50',
    outline: 'backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 border border-gray-200/70 text-gray-900 dark:border-gray-700/70 dark:text-gray-100',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
      variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
      className
    )}>
      {children}
    </span>
  );
};

// Fallback Avatar Component - Enhanced with Glassmorphism
export const FallbackAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: string;
  className?: string;
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden flex items-center justify-center backdrop-blur-sm bg-gray-200/80 dark:bg-gray-700/80 border border-white/20 dark:border-neutral-700/30',
      sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
      className
    )}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// Fallback Modal Component - Enhanced with Glassmorphism
export const FallbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: string;
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-navigation flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn(
        'backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 border border-white/30 dark:border-neutral-700/40 rounded-xl shadow-2xl w-full transition-all duration-300',
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md
      )}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-neutral-700/30">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Fallback Logo Component - Enhanced with Glassmorphism
export const FallbackLogo: React.FC<{
  size?: string;
  showText?: boolean;
  className?: string;
}> = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'backdrop-blur-sm bg-orange-500/90 rounded-lg flex items-center justify-center',
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.medium
      )}>
        <span className="text-white font-bold text-sm">T</span>
      </div>
      {showText && (
        <span className="font-bold text-xl text-gray-900 dark:text-white">
          TradeYa
        </span>
      )}
    </div>
  );
};

// Component Fallback Mapper
export const ComponentFallbacks = {
  Button: FallbackButton,
  Card: FallbackCard,
  CardHeader: FallbackCardHeader,
  CardTitle: FallbackCardTitle,
  CardContent: FallbackCardContent,
  CardFooter: FallbackCardFooter,
  Badge: FallbackBadge,
  Avatar: FallbackAvatar,
  Modal: FallbackModal,
  Logo: FallbackLogo,
};

export default ComponentFallbacks; 