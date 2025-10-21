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
import ThreeHeaderOverlay, { type EffectsPreset, type EffectsBlendMode } from '../background/ThreeHeaderOverlay';
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
  // Experimental 3D FX overlay controls
  enableFxOverlay?: boolean;
  fxPreset?: EffectsPreset;
  fxOpacity?: number;
  fxBlendMode?: EffectsBlendMode;
  onFxSettingsApply?: (settings: { enable: boolean; preset: EffectsPreset; opacity: number; blendMode: EffectsBlendMode }) => void;
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
  height = 'md',
  enableFxOverlay = true,
  fxPreset = 'ribbons',
  fxOpacity = 0.24,
  fxBlendMode = 'overlay',
  onFxSettingsApply
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showFxSettings, setShowFxSettings] = useState(false);
  const [showFxToolbar, setShowFxToolbar] = useState(false);
  const [previewFxPreset, setPreviewFxPreset] = useState<EffectsPreset | null>(null);
  const [showFxHint, setShowFxHint] = useState<boolean>(false);
  const fxChipScrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Local 3D FX overlay state (declare early to avoid any TDZ/ordering issues)
  const [localEnableFx, setLocalEnableFx] = useState<boolean>(enableFxOverlay);
  const [localFxPreset, setLocalFxPreset] = useState<EffectsPreset>(fxPreset);
  const [localFxOpacity, setLocalFxOpacity] = useState<number>(fxOpacity);
  const [localFxBlendMode, setLocalFxBlendMode] = useState<EffectsBlendMode>(fxBlendMode);
  const [localFxAutoAdapt, setLocalFxAutoAdapt] = useState<boolean>(true);
  const [userAdjustedOpacity, setUserAdjustedOpacity] = useState<boolean>(false);

  // Handle banner URL processing
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<boolean>(false);

  useEffect(() => {
    // Load saved FX settings (simple local persistence)
    try {
      const raw = localStorage.getItem('profileFxSettings');
      if (raw) {
        const saved = JSON.parse(raw) as {
          enable: boolean; preset: EffectsPreset; opacity: number; blendMode: EffectsBlendMode;
        };
        setLocalEnableFx(!!saved.enable);
        if (saved.preset) setLocalFxPreset(saved.preset);
        if (typeof saved.opacity === 'number') setLocalFxOpacity(saved.opacity);
        if (saved.blendMode) setLocalFxBlendMode(saved.blendMode);
        if (typeof saved.opacity === 'number') {
          setUserAdjustedOpacity(true);
          setLocalFxAutoAdapt(false);
        }
      }
      const hint = localStorage.getItem('profileFxHintDismissed') !== '1';
      setShowFxHint(hint);
    } catch {}
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Processing banner input:', {
        input: bannerUrl,
        state: { useFallback, urlError }
      });
    }

    if (!bannerUrl) {
      const fallbackUrl = getBannerImageUrl(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('No banner data provided, using fallback:', fallbackUrl);
      }
      setProcessedUrl(fallbackUrl);
      setUrlError(false);
      return;
    }

    // Handle BannerData object
    if (typeof bannerUrl === 'object') {
      const url = getBannerImageUrl(bannerUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log('Processed banner data:', {
          input: bannerUrl,
          output: url
        });
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Processed legacy URL:', {
          input: bannerUrl,
          publicId: publicIdResult,
          version: version,
          output: url
        });
      }
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

  const effectiveFxPreset = previewFxPreset ?? localFxPreset;

  useEffect(() => {
    setLocalEnableFx(enableFxOverlay);
    setLocalFxPreset(fxPreset);
    if (typeof fxOpacity === 'number') {
      setLocalFxOpacity(fxOpacity);
      setUserAdjustedOpacity(true);
      setLocalFxAutoAdapt(false);
    }
    setLocalFxBlendMode(fxBlendMode);
  }, [enableFxOverlay, fxPreset, fxOpacity, fxBlendMode]);

  // When toolbar opens on mobile, nudge the chip row to imply scrollability
  useEffect(() => {
    if (!showFxToolbar) return;
    const el = fxChipScrollRef.current;
    if (!el) return;
    try {
      const original = el.scrollLeft;
      el.scrollTo({ left: original + 40, behavior: 'smooth' });
      setTimeout(() => el.scrollTo({ left: original, behavior: 'smooth' }), 350);
    } catch {}
  }, [showFxToolbar]);

  // Auto-adapt opacity based on banner luminance when enabled and user hasn't adjusted
  useEffect(() => {
    if (!localFxAutoAdapt || userAdjustedOpacity || !primaryBannerUrl) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // perceived luminance
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += lum;
        }
        const avg = sum / (sampleSize * sampleSize);
        // Map luminance to opacity range [0.06, 0.14]
        const mapped = Math.max(0.06, Math.min(0.14, 0.14 - (avg / 255) * 0.06));
        if (!cancelled) setLocalFxOpacity(Number(mapped.toFixed(3)));
      } catch {
        // ignore
      }
    };
    img.src = primaryBannerUrl;
    return () => {
      cancelled = true;
    };
  }, [localFxAutoAdapt, userAdjustedOpacity, primaryBannerUrl]);

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
    if (process.env.NODE_ENV === 'development') {
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
    }

    // If we have a custom banner design, don't show an error toast
    if (customBannerDesign) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using custom banner design as fallback:', customBannerDesign);
      }
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
        'relative isolate w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700',
        heightClasses[height],
        className
      )}
      onMouseEnter={() => isEditable && setIsHovering(true)}
      onMouseLeave={() => isEditable && setIsHovering(false)}
    >
      <ErrorBoundary fallback={fallbackUI}>
        {primaryBannerUrl && !useFallback ? (
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
        {/* 3D FX overlay layer (transparent, non-interactive) */}
        {localEnableFx && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <ThreeHeaderOverlay
              preset={effectiveFxPreset}
              opacity={showFxSettings ? Math.max(localFxOpacity, 0.18) : localFxOpacity}
              blendMode={localFxBlendMode}
            />
          </div>
        )}
      </ErrorBoundary>

      {/* Banner selector overlay */}
      {isEditable && showBannerSelector && (
        <div className="absolute inset-0 z-20 flex flex-col items-start justify-start overflow-auto bg-opacity-75 p-4 transition-opacity bg-card/70">
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
        <div className="absolute inset-0 z-20 flex flex-col items-stretch justify-start bg-black/50 p-3 overflow-auto transition-opacity">
          {error && (
            <div className="mb-4 text-sm text-red-500 bg-destructive/20 px-3 py-1 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-start">
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

            <button
              type="button"
              onClick={() => setShowFxToolbar((v) => !v)}
              className={cn(
                "flex items-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors duration-200"
              )}
            >
              3D FX
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

          {showFxSettings && (
            <div className="mt-3 w-full max-w-full sm:max-w-xl rounded-md bg-background/95 p-4 text-foreground shadow-lg backdrop-blur-md max-h-[calc(100%-6rem)] overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={localEnableFx}
                    onChange={(e) => setLocalEnableFx(e.target.checked)}
                  />
                  Enable 3D FX overlay
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={localFxAutoAdapt}
                    onChange={(e) => {
                      setLocalFxAutoAdapt(e.target.checked);
                      if (!e.target.checked) setUserAdjustedOpacity(true);
                    }}
                  />
                  Auto‑adapt intensity
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-xs">Preset</span>
                  <select
                    className="rounded-md bg-muted text-foreground px-2 py-1"
                    value={localFxPreset}
                    onChange={(e) => setLocalFxPreset(e.target.value as EffectsPreset)}
                  >
                    <option value="ribbons">Ribbons</option>
                    <option value="aurora">Aurora</option>
                    <option value="metaballs">Metaballs</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs">Blend mode</span>
                  <select
                    className="rounded-md bg-muted text-foreground px-2 py-1"
                    value={localFxBlendMode}
                    onChange={(e) => setLocalFxBlendMode(e.target.value as EffectsBlendMode)}
                  >
                    <option value="screen">Screen</option>
                    <option value="soft-light">Soft light</option>
                    <option value="overlay">Overlay</option>
                    <option value="plus-lighter">Plus lighter</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs">Intensity ({localFxOpacity.toFixed(2)})</span>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={localFxOpacity}
                    onChange={(e) => {
                      setLocalFxOpacity(parseFloat(e.target.value));
                      setUserAdjustedOpacity(true);
                    }}
                  />
                </div>

                {/* Keeping UI simple: omit motion slider for now */}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFxSettings(false)}
                  className="rounded-md bg-primary-600 text-white px-3 py-1.5 text-sm hover:bg-primary-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Compact bottom toolbar for FX presets + intensity */}
      {isEditable && showFxToolbar && (
        <div className="absolute inset-x-2 bottom-2 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="relative flex items-center gap-2 rounded-md bg-background/90 backdrop-blur-md border border-border px-3 py-2 shadow-sm max-w-full overflow-hidden">
            <div
              className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] pr-2"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
                maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)'
              }}
              ref={fxChipScrollRef}
              onScroll={() => {
                if (showFxHint) {
                  setShowFxHint(false);
                  try { localStorage.setItem('profileFxHintDismissed', '1'); } catch {}
                }
              }}
            >
              {(['ribbons','aurora','metaballs','audio'] as EffectsPreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onMouseEnter={() => setPreviewFxPreset(p)}
                  onMouseLeave={() => setPreviewFxPreset(null)}
                  onClick={() => {
                    setLocalEnableFx(true);
                    setPreviewFxPreset(null);
                    setLocalFxPreset(p);
                  }}
                  className={cn(
                    "text-xs px-2 py-1 rounded border",
                    effectiveFxPreset === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-muted/80"
                  )}
                >
                  {p === 'ribbons' ? 'Ribbons' : p === 'aurora' ? 'Aurora' : p === 'metaballs' ? 'Metaballs' : 'Audio'}
                </button>
              ))}
            </div>
            {showFxHint && (
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded-full shadow-sm animate-pulse">
                Swipe for more
              </div>
            )}

            <div className="flex items-center gap-2 ml-3">
              <span className="text-xs text-muted-foreground">Intensity</span>
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.01}
                value={localFxOpacity}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setLocalFxOpacity(v);
                  setUserAdjustedOpacity(true);
                  setLocalEnableFx(v > 0.005);
                }}
                className="w-28 sm:w-40 touch-pan-y"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Apply: persist settings locally and save via callback (if provided by page)
                  const clampedOpacity = Math.max(0, Math.min(0.3, localFxOpacity));
                  try {
                    localStorage.setItem('profileFxSettings', JSON.stringify({
                      enable: clampedOpacity > 0.005 && localEnableFx,
                      preset: localFxPreset,
                      opacity: clampedOpacity,
                      blendMode: localFxBlendMode,
                    }));
                  } catch {}
                  onFxSettingsApply?.({
                    enable: clampedOpacity > 0.005 && localEnableFx,
                    preset: localFxPreset,
                    opacity: clampedOpacity,
                    blendMode: localFxBlendMode,
                  });
                  setPreviewFxPreset(null);
                  setShowFxToolbar(false);
                }}
                className="text-xs rounded bg-primary text-primary-foreground px-2 py-1"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalEnableFx(false);
                  setLocalFxPreset('ribbons' as EffectsPreset);
                  setLocalFxOpacity(0.12);
                  setPreviewFxPreset(null);
                  setShowFxToolbar(false);
                }}
                className="text-xs rounded bg-muted px-2 py-1"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

// Export both named and default export for backward compatibility
export default ProfileBanner;
