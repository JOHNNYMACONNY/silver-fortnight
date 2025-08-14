import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatCloudinaryUrl } from '../../utils/imageUtils';

// Extend the ImgHTMLAttributes to include fetchpriority (lowercase as per HTML spec)
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

export interface LazyImageProps {
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

  useEffect(() => {
    if (hasFormatted.current || !src) return;
    setIsLoaded(false);
    hasFormatted.current = true;

    if (src.includes('ui-avatars.com') ||
        src.includes('googleusercontent.com') ||
        src.includes('gravatar.com') ||
        (src.startsWith('http') && !src.includes('cloudinary.com'))) {
      setImgSrc(src);
    } else if (src.includes('cloudinary.com')) {
      const formattedSrc = formatCloudinaryUrl(src, fallbackSrc, {
        width: width,
        height: height,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto'
      });
      setImgSrc(formattedSrc);
    } else {
      setImgSrc(src);
    }
  }, [src, width, height, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    if (onError) {
      onError();
    }
  }, [fallbackSrc, imgSrc, onError]);

  const srcSet = useMemo(() => {
    if (!src ||
        !src.includes('cloudinary.com') ||
        src.includes('ui-avatars.com') ||
        src.includes('googleusercontent.com') ||
        src.includes('gravatar.com')) {
      return undefined;
    }
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

  const imgStyle = useMemo(() => ({
    transition: 'opacity 0.3s ease-in-out',
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined
  }), [width, height]);

  const finalSrc = imgSrc || fallbackSrc;
  if (!finalSrc) return null;

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
