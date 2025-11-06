import { 
  CLOUDINARY_CLOUD_NAME as ENV_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET as ENV_UPLOAD_PRESET,
  CLOUDINARY_API_KEY as ENV_API_KEY,
  getEnvVar
} from '../config/env';

export function safeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    // Basic sanity check; expand as needed
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function getFallbackAvatar(name?: string): string {
  const initials = (name ?? 'U').slice(0, 2).toUpperCase();
  // Simple placeholder using data URL; replace with real asset if desired
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='%2390cdf4'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='48' font-family='Arial, Helvetica, sans-serif'>${initials}</text></svg>`;
}

export function getProfileImageUrlBasic(url?: string | null, _size?: number): string | undefined {
  // For simple callers: validate and return as-is
  return safeImageUrl(url);
}

// Image utilities for Cloudinary integration and optimization

// Types
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
  crop?: string;
  gravity?: string;
  version?: string;
}

// Get environment variables from centralized config
const CLOUDINARY_CLOUD_NAME = ENV_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = ENV_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = ENV_API_KEY;

export const formatCloudinaryUrl = (
  url: string | null | undefined,
  defaultImage?: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!url) return defaultImage || '';

  // IMPORTANT: Don't process external URLs through Cloudinary
  if (url.includes('ui-avatars.com') ||
      url.includes('googleusercontent.com') ||
      url.includes('gravatar.com') ||
      url.startsWith('http') && !url.includes('cloudinary.com')) {
    // Return external URLs as-is
    return url;
  }

  // IMPORTANT: Improved check for URLs that already have transformations
  if (url.includes('cloudinary.com') &&
     (url.includes('c_') || url.includes('w_') || url.includes('h_') ||
      url.includes('q_') || url.includes('f_') || url.includes('g_'))) {
    // Already has transformations, return as-is
    return url;
  }

  // If it's a full Cloudinary URL without transformations, extract the public ID
  if (url.includes('cloudinary.com')) {
    const parsed = parseCloudinaryUrl(url);
    if (isCloudinaryUrlInfo(parsed)) {
      // Create a new URL with the extracted publicId and specified transformations
      return formatCloudinaryUrl(parsed.publicId, undefined, {
        ...options,
        version: parsed.version
      });
    }
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;
  const transformations = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if ((options as any).crop) transformations.push(`c_${(options as any).crop}`);
  if ((options as any).gravity) transformations.push(`g_${(options as any).gravity}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  const transformString = transformations.length ? `${transformations.join(',')}/` : '';
  return `${baseUrl}${transformString}${url}`;
};

export const uploadImageToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  // Prefer the dedicated profile preset if available; fall back to generic
  const profilePreset = getEnvVar('VITE_CLOUDINARY_PROFILE_PRESET', '');
  formData.append('upload_preset', profilePreset || CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  // Use a consistent folder for profile uploads when using this util
  formData.append('folder', 'users/profiles');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    try {
      const errData = await response.json();
      console.error('Cloudinary profile upload failed', {
        status: response.status,
        statusText: response.statusText,
        error: errData,
        preset: profilePreset || CLOUDINARY_UPLOAD_PRESET,
        cloudName: CLOUDINARY_CLOUD_NAME
      });
      throw new Error(errData?.error?.message || 'Image upload failed');
    } catch (e) {
      throw new Error('Image upload failed');
    }
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id
  };
};

export const deleteImageFromCloudinary = async (publicId: string): Promise<{ result: string }> => {
  const timestamp = Math.round((new Date()).getTime() / 1000);
  const signature = await generateSignature(publicId, timestamp);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_id: publicId,
        signature,
        api_key: CLOUDINARY_API_KEY,
        timestamp
      })
    }
  );

  if (!response.ok) {
    throw new Error('Image deletion failed');
  }

  return response.json();
};

export const getImageDimensions = async (url: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

// Helper function to extract public ID from Cloudinary URL
export const pathToPublicId = (url: string): string | undefined => {
  try {
    // First check if it's already a public ID
    if (!url.includes('res.cloudinary.com')) {
      return url;
    }

    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return undefined;

    const pathWithVersion = urlParts[1];
    const pathParts = pathWithVersion.split('/');
    const publicIdWithExtension = pathParts[pathParts.length - 1];

    // Remove version if present (e.g., v1234567890/)
    const publicId = publicIdWithExtension.split('/').pop()?.split('.').slice(0, -1).join('.');
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return undefined;
  }
};

// Type for banner data
export interface BannerData {
  publicId: string;
  version: string;
  uploadedAt: number;
}

export const optimizeImage = (url: string, options: ImageOptimizationOptions = {}): string => {
  return formatCloudinaryUrl(url, undefined, {
    quality: 'auto',
    ...options
  });
};

interface BannerOptimizationOptions extends ImageOptimizationOptions {
  version?: string;
}

export const getProfileImageUrl = (profilePicture: string | null, size: number = 200): string => {
  if (!profilePicture) return generateAvatarUrl('Unknown User', size); // Use avatar generator instead of missing file

  // Check if it's an external URL (Google, ui-avatars, etc.) - return as-is
  if (profilePicture.includes('ui-avatars.com') ||
      profilePicture.includes('googleusercontent.com') ||
      profilePicture.includes('gravatar.com') ||
      (profilePicture.startsWith('http') && !profilePicture.includes('cloudinary.com'))) {
    return profilePicture;
  }

  // Check if URL already has Cloudinary transformations
  if (profilePicture.includes('cloudinary.com') && profilePicture.includes('/c_fill')) {
    return profilePicture;
  }

  // Only process Cloudinary URLs or public IDs through formatCloudinaryUrl
  return formatCloudinaryUrl(profilePicture, undefined, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    format: 'auto'
  });
};

export const generateAvatarUrl = (displayName: string, size: number = 200): string => {
  // Simple initials avatar generator
  const initials = displayName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Use a consistent background color based on the name to avoid random changes
  const colors = ['3B82F6', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899', '06B6D4', 'F97316'];
  const colorIndex = displayName.length % colors.length;
  const backgroundColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor}&color=ffffff`;
};

export const logProfileImageInfo = (userId: string, imageUrl: string) => {
  // This function is deprecated - use logger instead
  // logger.debug(`Profile image info for user ${userId}`, 'IMAGE_UTILS', { imageUrl });
};

export const getBannerImageUrl = (bannerData: BannerData | null): string => {
  if (!bannerData) {
    // Return empty string for no banner instead of missing file
    return '';
  }

  const { publicId, version } = bannerData;
  return formatCloudinaryUrl(publicId, undefined, {
    version: `v${version}`,
    crop: 'fill',
    width: 1200,
    height: 300,
    quality: 'auto:good',
    format: 'auto'
  } as BannerOptimizationOptions);
};

// Helper functions
const generateSignature = async (publicId: string, timestamp: number): Promise<string> => {
  const str = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_KEY}`;
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Constants for common transformations
export const AVATAR_TRANSFORMATION = 'c_fill,g_face,w_200,h_200';
export const PORTFOLIO_THUMBNAIL = 'c_fill,w_400,h_300';
export const PORTFOLIO_FULL = 'c_scale,w_1200';
interface CloudinaryUrlInfo {
  publicId: string;
  version?: string;
}

function isCloudinaryUrlInfo(obj: any): obj is CloudinaryUrlInfo {
  return obj && typeof obj.publicId === 'string';
}

function parseCloudinaryUrl(url: string): CloudinaryUrlInfo | null {
  try {
    // Check if it's a valid Cloudinary URL
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
      return null;
    }

    // Extract parts after /upload/
    const uploadParts = url.split('/upload/');
    if (uploadParts.length < 2) return null;

    const postUploadPath = uploadParts[1];

    // Check if version is present (v1234567890)
    let version: string | undefined;
    let pathWithoutVersion = postUploadPath;

    const versionMatch = postUploadPath.match(/^v(\d+)\//);
    if (versionMatch) {
      version = versionMatch[1];
      pathWithoutVersion = postUploadPath.substring(versionMatch[0].length);
    }

    // Remove any transformations if present
    const transformParts = pathWithoutVersion.split('/');
    const filename = transformParts[transformParts.length - 1];

    // Remove file extension if present
    const publicId = filename.includes('.')
      ? filename.substring(0, filename.lastIndexOf('.'))
      : filename;

    return {
      publicId,
      version
    };
  } catch (error) {
    console.error('Error parsing Cloudinary URL:', error);
    return null;
  }
}

