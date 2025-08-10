import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatCloudinaryUrl } from '../../utils/imageUtils';

// Extend the ImgHTMLAttributes to include fetchpriority (lowercase as per HTML spec)
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  fallbackSrc?: string;
  onClick?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * LazyImage component
 *
 * A component that handles responsive images, lazy loading, and WebP format
 * with proper fallbacks and error handling.
 *
 * Performance optimizations:
 * - Memoized component with React.memo
 * - Memoized srcSet generation
 * - Optimized Cloudinary URL formatting
 * - Proper image dimensions for better CLS
 */
export const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  fallbackSrc,
  onClick,
  onError,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto'
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasFormatted = useRef(false);

  // Format Cloudinary URL with optimizations
  useEffect(() => {
    // Skip if already formatted or no source
    if (hasFormatted.current || !src) return;

    // Reset states when src changes
    setIsLoaded(false);
    hasFormatted.current = true;

    // For external URLs (Google, ui-avatars, etc.), use as-is
    if (src.includes('ui-avatars.com') ||
        src.includes('googleusercontent.com') ||
        src.includes('gravatar.com') ||
        (src.startsWith('http') && !src.includes('cloudinary.com'))) {
      setImgSrc(src);
    } else if (src.includes('cloudinary.com')) {
      // Create responsive image URL with WebP format and quality optimizations
      const formattedSrc = formatCloudinaryUrl(src, fallbackSrc, {
        width: width,
        height: height,
        crop: 'fill',
        quality: 'auto:good', // Use Cloudinary's intelligent quality
        format: 'auto' // This will serve WebP to browsers that support it
      });

      setImgSrc(formattedSrc);
    } else {
      // For non-Cloudinary URLs, use as-is
      setImgSrc(src);
    }
  }, [src, width, height, fallbackSrc]);

  // Handle image load with useCallback for better performance
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle image error with useCallback for better performance
  const handleError = useCallback(() => {
    // If fallback is provided, use it
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }

    // Call onError callback if provided
    if (onError) {
      onError();
    }
  }, [fallbackSrc, imgSrc, onError]);

  // Generate srcSet for responsive images if it's a Cloudinary URL
  // Memoize to prevent recalculation on every render
  const srcSet = useMemo(() => {
    // Only generate srcSet for Cloudinary URLs, not external URLs
    if (!src ||
        !src.includes('cloudinary.com') ||
        src.includes('ui-avatars.com') ||
        src.includes('googleusercontent.com') ||
        src.includes('gravatar.com')) {
      return undefined;
    }

    // Generate srcSet with different widths
    const widths = [320, 640, 960, 1280, 1600, 1920];
    return widths
      .map(w => {
        const url = formatCloudinaryUrl(src, fallbackSrc, {
          width: w,
          height: height ? Math.round((height / width!) * w) : undefined,
          crop: 'fill',
          quality: 'auto:good',
          format: 'auto'
        });
        return `${url} ${w}w`;
      })
      .join(', ');
  }, [src, fallbackSrc, width, height]);

  // Memoize the style object to prevent unnecessary re-renders
  const imgStyle = useMemo(() => ({
    transition: 'opacity 0.3s ease-in-out',
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined
  }), [width, height]);

  // Don't render if no valid src is available
  const finalSrc = imgSrc || fallbackSrc;
  if (!finalSrc) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
      style={imgStyle}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchPriority}
      onLoad={handleLoad}
      onError={handleError}
      onClick={onClick}
      srcSet={srcSet}
      sizes={sizes}
    />
  );
});

export default LazyImage;
