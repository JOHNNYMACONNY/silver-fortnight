/**
 * Mobile Button Component
 * 
 * Optimized button component for mobile devices with enhanced
 * touch interactions, haptic feedback, and accessibility.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedTouchInteractions } from '../../hooks/useAdvancedTouchInteractions';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  autoFocus?: boolean;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  hapticFeedback = true,
  rippleEffect = true,
  className = '',
  type = 'button',
  form,
  autoFocus = false,
}) => {
  const { isMobile, isTouchDevice, touchTarget } = useMobileOptimization();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // Touch interaction handlers
  const handleTouchGesture = useCallback((gesture: string, event: any) => {
    if (gesture === 'long-press' && onLongPress) {
      onLongPress();
    }
  }, [onLongPress]);

  const touchInteractions = useAdvancedTouchInteractions(
    {
      hapticEnabled: hapticFeedback,
      hapticIntensity: 'medium',
      longPressDelay: 800,
      tapThreshold: 10,
    },
    {
      onTap: (event) => {
        if (!disabled && !loading && onClick) {
          onClick();
        }
      },
      onLongPress: (event) => handleTouchGesture('long-press', event),
      onTouchStart: (event) => {
        setIsPressed(true);
        
        // Create ripple effect
        if (rippleEffect && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const rippleId = ++rippleIdRef.current;
          const newRipple = {
            id: rippleId,
            x: event.position.x - rect.left,
            y: event.position.y - rect.top,
          };
          
          setRipples(prev => [...prev, newRipple]);
          
          // Remove ripple after animation
          setTimeout(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== rippleId));
          }, 600);
        }
      },
      onTouchEnd: () => {
        setIsPressed(false);
      },
    }
  );

  // Get variant styles
  const getVariantStyles = () => {
    const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 disabled:bg-blue-300`;
      case 'secondary':
        return `${baseStyles} bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white focus:ring-gray-500 disabled:bg-gray-300`;
      case 'outline':
        return `${baseStyles} border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300`;
      case 'ghost':
        return `${baseStyles} text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500 disabled:text-blue-300`;
      case 'danger':
        return `${baseStyles} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 disabled:bg-red-300`;
      case 'success':
        return `${baseStyles} bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500 disabled:bg-green-300`;
      default:
        return baseStyles;
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    const baseStyles = 'rounded-lg flex items-center justify-center';
    
    switch (size) {
      case 'sm':
        return `${baseStyles} px-3 py-2 text-sm min-h-[${touchTarget.minSize}px]`;
      case 'lg':
        return `${baseStyles} px-6 py-4 text-lg min-h-[${touchTarget.minSize + 8}px]`;
      case 'xl':
        return `${baseStyles} px-8 py-5 text-xl min-h-[${touchTarget.minSize + 16}px]`;
      default:
        return `${baseStyles} px-4 py-3 text-base min-h-[${touchTarget.minSize}px]`;
    }
  };

  // Get button styles
  const getButtonStyles = () => {
    return `
      ${getVariantStyles()}
      ${getSizeStyles()}
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${className}
    `.trim();
  };

  // Get icon styles
  const getIconStyles = () => {
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
    };
    
    return `${iconSizes[size]} ${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`;
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      form={form}
      disabled={disabled || loading}
      autoFocus={autoFocus}
      className={getButtonStyles()}
      style={{
        minHeight: `${touchTarget.minSize}px`,
        minWidth: `${touchTarget.minSize}px`,
      }}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      animate={{
        scale: isPressed ? 0.98 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      {...(isTouchDevice ? touchInteractions.handlers : {})}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        className={`flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'}`}
        transition={{ duration: 0.2 }}
      >
        {/* Left icon */}
        {Icon && iconPosition === 'left' && (
          <Icon className={getIconStyles()} />
        )}

        {/* Button text */}
        <span className="whitespace-nowrap">{children}</span>

        {/* Right icon */}
        {Icon && iconPosition === 'right' && (
          <Icon className={getIconStyles()} />
        )}
      </motion.div>

      {/* Pressed state overlay */}
      {isPressed && !disabled && !loading && (
        <motion.div
          className="absolute inset-0 bg-black/10 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
};

export default MobileButton;

