/**
 * Mobile Image Component
 * 
 * Optimized image component for mobile devices with lazy loading,
 * responsive sizing, and performance optimizations.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobilePerformance } from '../../hooks/useMobilePerformance';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface MobileImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty' | 'color';
  blurDataURL?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  hapticFeedback?: boolean;
  lazy?: boolean;
  responsive?: boolean;
  aspectRatio?: number;
}

const MobileImage: React.FC<MobileImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  fallback,
  onLoad,
  onError,
  onClick,
  hapticFeedback = true,
  lazy = true,
  responsive = true,
  aspectRatio,
}) => {
  const { isMobile, isTouchDevice, touchTarget } = useMobileOptimization();
  const { 
    getOptimalImageSize, 
    getOptimalImageFormat, 
    getOptimizedImageUrl,
    useLazyLoad,
    mobileOptimizations,
    preloadResource
  } = useMobilePerformance();

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!lazy || priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading
  const { elementRef, isVisible, hasLoaded } = useLazyLoad();

  // Update loading state when element becomes visible
  useEffect(() => {
    if (isVisible && !hasLoaded && lazy) {
      setIsLoading(true);
    }
  }, [isVisible, hasLoaded, lazy]);

  // Generate optimized image URL
  const generateOptimizedUrl = useCallback(() => {
    if (!src) return '';

    // Get container width for responsive sizing
    const containerWidth = containerRef.current?.offsetWidth || width || 320;
    const availableSizes = [320, 640, 1024, 1280, 1920];
    const optimalSize = getOptimalImageSize(availableSizes, containerWidth);
    
    return getOptimizedImageUrl(src, optimalSize, height, quality);
  }, [src, width, height, quality, getOptimalImageSize, getOptimalImageFormat, getOptimizedImageUrl]);

  // Update image source when needed
  useEffect(() => {
    if (isLoading && src) {
      const optimizedUrl = generateOptimizedUrl();
      setCurrentSrc(optimizedUrl);
    }
  }, [isLoading, src, generateOptimizedUrl]);

  // Preload image if priority
  useEffect(() => {
    if (priority && src) {
      preloadResource(src, 'image');
    }
  }, [priority, src, preloadResource]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    if (hapticFeedback && isTouchDevice && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onClick?.();
  }, [hapticFeedback, isTouchDevice, onClick]);

  // Get responsive styles
  const getResponsiveStyles = () => {
    if (!responsive) return {};

    const baseStyles: React.CSSProperties = {
      width: '100%',
      height: 'auto',
    };

    if (aspectRatio) {
      baseStyles.aspectRatio = aspectRatio.toString();
    }

    return baseStyles;
  };

  // Get container styles
  const getContainerStyles = () => {
    const styles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      ...getResponsiveStyles(),
    };

    if (width) styles.width = width;
    if (height) styles.height = height;

    return styles;
  };

  // Get image styles
  const getImageStyles = () => {
    const styles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'opacity 0.3s ease-in-out',
      opacity: isLoaded ? 1 : 0,
    };

    return styles;
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={getContainerStyles()}
      onClick={handleClick}
    >
      {/* Lazy loading trigger */}
      {lazy && (
        <div
          ref={elementRef as React.RefObject<HTMLDivElement>}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: -1 }}
        />
      )}

      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {placeholder === 'blur' && blurDataURL ? (
              <img
                src={blurDataURL}
                alt=""
                className="w-full h-full object-cover filter blur-sm"
              />
            ) : placeholder === 'color' ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
            ) : (
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && !hasError && (
          <motion.div
            className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center space-y-2 text-gray-500 dark:text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs">Failed to load</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main image */}
      {currentSrc && !hasError && (
        <motion.img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${onClick ? 'hover:scale-105' : ''}
            transition-all duration-300
          `}
          style={getImageStyles()}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes || (responsive ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined)}
          decoding="async"
        />
      )}

      {/* Fallback image */}
      {hasError && fallback && (
        <img
          src={fallback}
          alt={alt}
          className="w-full h-full object-cover"
          style={getImageStyles()}
        />
      )}

      {/* Touch feedback overlay */}
      {onClick && isTouchDevice && (
        <motion.div
          className="absolute inset-0 bg-black/0 hover:bg-black/5 active:bg-black/10 transition-colors duration-150"
          whileTap={{ scale: 0.98 }}
        />
      )}
    </div>
  );
};

export default MobileImage;
