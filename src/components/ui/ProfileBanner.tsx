import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Camera, X, Loader2, Palette } from 'lucide-react';
import {
  uploadBannerImage,
  validateFile
} from '../../services/cloudinary/cloudinaryService';
import { useToast } from '../../contexts/ToastContext';
import { getBannerImageUrl, pathToPublicId } from '../../utils/imageUtils';
import type { BannerData } from '../../utils/imageUtils';
import ErrorBoundary from './ErrorBoundary';
import DefaultBanner, { BannerDesign } from './DefaultBanner';
import BannerSelector from './BannerSelector';

export interface ProfileBannerProps {
  bannerUrl?: string | BannerData;
  isEditable?: boolean;
  onBannerChange?: (data: BannerData) => void;
  onBannerRemove?: () => void;
  onUploadStart?: () => void;
  onUploadComplete?: (success: boolean) => void;
  onCustomBannerSelect?: (design: BannerDesign) => void;
  customBannerDesign?: BannerDesign;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

const heightClasses = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64'
};

/**
 * Image component with error handling
 */
const BannerImage: React.FC<{
  src: string;
  className: string;
  onError: () => void;
}> = ({ src, className, onError }) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // Prevent infinite loop
    console.error('Banner image load error:', {
      src: e.currentTarget.src,
      naturalWidth: e.currentTarget.naturalWidth,
      naturalHeight: e.currentTarget.naturalHeight,
      complete: e.currentTarget.complete,
      currentSrc: e.currentTarget.currentSrc
    });
    onError();
  };

  return (
    <img
      src={src}
      alt="Profile banner"
      className={className}
      onError={handleError}
    />
  );
};

/**
 * ProfileBanner component
 *
 * A standardized component for displaying profile banners with proper fallbacks
 * and error handling
 */
export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  bannerUrl,
  isEditable = false,
  onBannerChange,
  onBannerRemove,
  onUploadStart,
  onUploadComplete,
  onCustomBannerSelect,
  customBannerDesign,
  className,
  height = 'md'
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Handle banner URL processing
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<boolean>(false);

  useEffect(() => {
    console.log('Processing banner input:', {
      input: bannerUrl,
      state: { useFallback, urlError }
    });

    if (!bannerUrl) {
      const fallbackUrl = getBannerImageUrl(null);
      console.log('No banner data provided, using fallback:', fallbackUrl);
      setProcessedUrl(fallbackUrl);
      setUrlError(false);
      return;
    }

    // Handle BannerData object
    if (typeof bannerUrl === 'object') {
      const url = getBannerImageUrl(bannerUrl);
      console.log('Processed banner data:', {
        input: bannerUrl,
        output: url
      });
      setProcessedUrl(url);
      setUrlError(false);
      return;
    }

    // Legacy string URL handling
    const versionMatch = bannerUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? `v${versionMatch[1]}` : 'v1';
    const publicIdResult = bannerUrl.includes('/') ? pathToPublicId(bannerUrl) : bannerUrl;

    if (typeof publicIdResult === 'string') {
      const url = getBannerImageUrl({
        publicId: publicIdResult,
        version: version,
        uploadedAt: new Date().getTime()
      });
      console.log('Processed legacy URL:', {
        input: bannerUrl,
        publicId: publicIdResult,
        version: version,
        output: url
      });
      setProcessedUrl(url);
      setUrlError(false);
    } else {
      console.error('Banner URL parsing failed:', publicIdResult);
      setUrlError(true);
      const fallbackUrl = getBannerImageUrl(null);
      setProcessedUrl(fallbackUrl);
      addToast('error', 'Error loading banner image');
    }
  }, [bannerUrl, addToast]);

  const primaryBannerUrl = processedUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Starting banner upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    setError(null);
    setIsUploading(true);
    setUseFallback(false);
    onUploadStart?.();

    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }

      console.log('Uploading banner to Cloudinary...');
      const result = await uploadBannerImage(file);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.publicId || !result.version) {
        throw new Error('Invalid upload response');
      }

      console.log('Banner upload successful:', {
        publicId: result.publicId,
        version: result.version,
        baseUrl: result.baseUrl,
        transformedUrl: result.transformedUrl,
        uploadedAt: result.uploadedAt
      });

      // Update banner data with upload response
      const bannerData: BannerData = {
        publicId: result.publicId,
        version: result.version,
        uploadedAt: result.uploadedAt || Date.now()
      };

      // Update component state and notify parent
      onBannerChange?.(bannerData);
      onUploadComplete?.(true);

      // Try loading base URL first
      console.log('Testing base URL load:', result.baseUrl);
      setProcessedUrl(result.baseUrl);

      // If transformed URL is available, switch to it after base URL loads successfully
      if (result.transformedUrl) {
        const testImg = new Image();
        testImg.onload = () => {
          console.log('Base URL loaded successfully, switching to transformed URL');
          setProcessedUrl(result.transformedUrl!);
        };
        testImg.src = result.baseUrl;
      }

      addToast('success', 'Banner uploaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload banner';
      console.error('Banner upload error:', errorMessage);
      setError(errorMessage);
      onUploadComplete?.(false);
      addToast('error', errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBannerError = () => {
    console.error('Banner image load failed:', {
      originalUrl: bannerUrl,
      processedUrl: primaryBannerUrl,
      currentState: {
        useFallback,
        urlError,
        isUploading,
        error
      }
    });

    // If we have a custom banner design, don't show an error toast
    if (customBannerDesign) {
      console.log('Using custom banner design as fallback:', customBannerDesign);
      setUseFallback(true);
    } else {
      // Switch to our CSS-based DefaultBanner component
      setUseFallback(true);
      addToast('error', 'Failed to load banner image. Using default banner.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Fallback UI for error boundary
  const fallbackUI = (
    <DefaultBanner
      height={height}
      design="gradient1"
      className="flex items-center justify-center"
    >
      <span className="text-white relative z-10">
        {isEditable ? 'Click to add a banner' : 'No banner image'}
      </span>
    </DefaultBanner>
  );

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700',
        heightClasses[height],
        className
      )}
      onMouseEnter={() => isEditable && setIsHovering(true)}
      onMouseLeave={() => isEditable && setIsHovering(false)}
    >
      <ErrorBoundary fallback={fallbackUI}>
        {bannerUrl && !useFallback ? (
          <BannerImage
            src={primaryBannerUrl}
            className="h-full w-full object-cover"
            onError={handleBannerError}
          />
        ) : (
          <DefaultBanner
            height={height}
            design={customBannerDesign || "random"}
            className="h-full w-full"
          >
            {isEditable && !showBannerSelector && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg font-medium px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg">
                  {isEditable ? 'Click to add a banner' : 'No banner image'}
                </span>
              </div>
            )}
          </DefaultBanner>
        )}
      </ErrorBoundary>

      {/* Banner selector overlay */}
      {isEditable && showBannerSelector && (
        <div className="absolute inset-0 flex flex-col items-start justify-start overflow-auto bg-opacity-75 p-4 transition-opacity bg-card/70">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Choose a Banner Style</h3>
            <button
              type="button"
              onClick={() => setShowBannerSelector(false)}
              className="flex items-center rounded-md bg-neutral-200 dark:bg-neutral-800 p-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <BannerSelector
            selectedDesign={customBannerDesign}
            onCategoryChange={(category) => {
              // Do nothing when category changes, just log for debugging
              console.log('Category changed to:', category);
            }}
            onSelect={(design) => {
              // Prevent default behavior and stop propagation
              // This is only called when a user actually clicks on a banner design
              onCustomBannerSelect?.(design);
              setShowBannerSelector(false);
              addToast('success', 'Banner style updated');
            }}
          />
        </div>
      )}

      {/* Upload controls overlay */}
      {isEditable && (isHovering || !bannerUrl || isUploading || error) && !showBannerSelector && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity">
          {error && (
            <div className="mb-4 text-sm text-red-500 bg-destructive/20 px-3 py-1 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={isUploading}
              className={cn(
                "flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors duration-200",
                "bg-background text-foreground hover:bg-muted"
              )}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : bannerUrl ? 'Change Photo' : 'Add Photo'}
            </button>

            <button
              type="button"
              onClick={() => setShowBannerSelector(true)}
              className={cn(
                "flex items-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors duration-200"
              )}
            >
              <Palette className="mr-2 h-4 w-4" />
              Choose Style
            </button>

            {bannerUrl && onBannerRemove && (
              <button
                type="button"
                onClick={onBannerRemove}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

// Export both named and default export for backward compatibility
export default ProfileBanner;
