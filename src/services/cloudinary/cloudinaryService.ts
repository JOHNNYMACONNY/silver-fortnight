/**
 * Cloudinary Service
 *
 * This file provides utilities for working with Cloudinary
 * for uploading, managing, and optimizing images.
 */

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_PROFILE_PRESET,
  CLOUDINARY_BANNER_PRESET,
  CLOUDINARY_PORTFOLIO_PRESET,
  CLOUDINARY_PROJECT_PRESET,
  isDevelopment
} from '../../config/env';

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Upload preset constants to prevent typos
export const UPLOAD_PRESETS = {
  PROFILE: CLOUDINARY_PROFILE_PRESET,
  BANNER: CLOUDINARY_BANNER_PRESET,
  PORTFOLIO: CLOUDINARY_PORTFOLIO_PRESET,
  PROJECT: CLOUDINARY_PROJECT_PRESET
} as const;

// Validate environment variables
if (!CLOUDINARY_CLOUD_NAME) {
  console.error('Missing Cloudinary cloud name');
}

// Safe dev environment check for logging
const isDev = isDevelopment();

if (isDev) {
  console.log('Initializing Cloudinary Service with presets:', {
    PROFILE: UPLOAD_PRESETS.PROFILE,
    BANNER: UPLOAD_PRESETS.BANNER,
    PORTFOLIO: UPLOAD_PRESETS.PORTFOLIO,
    PROJECT: UPLOAD_PRESETS.PROJECT,
    rawEnvValue: CLOUDINARY_BANNER_PRESET || process.env.VITE_CLOUDINARY_BANNER_PRESET
  });
}

Object.entries(UPLOAD_PRESETS).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing Cloudinary upload preset: ${key}`);
  }
});

/**
 * Type for upload preset names
 */
export type UploadPresetName = keyof typeof UPLOAD_PRESETS;

/**
 * Interface for upload response
 */
export interface CloudinaryResponse {
  baseUrl: string;  // URL without transformations
  transformedUrl: string | null;  // URL with transformations (added later)
  url: string;  // Primary URL to use (same as baseUrl if no transformations)
  version: string;
  publicId: string;
  error?: string;
}

export interface CloudinaryUploadResult {
  url: string;
  baseUrl: string;
  transformedUrl: string | null;
  error?: string;
  publicId: string;
  version: string;
  uploadedAt?: number;
}

export interface CloudinaryUploadResponse extends CloudinaryResponse {
  uploadedAt: number | null;
  url: string; // Explicitly include url from CloudinaryResponse
}

export function convertToUploadResult(response: CloudinaryUploadResponse): CloudinaryUploadResult {
  return {
    url: response.url,
    baseUrl: response.baseUrl,
    transformedUrl: response.transformedUrl,
    error: response.error,
    publicId: response.publicId,
    version: response.version,
    uploadedAt: response.uploadedAt || undefined
  };
}

/**
 * Interface for transformation options
 */
export interface CloudinaryTransformations {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'crop';
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

/**
 * Validates a preset name matches expected format
 */
export const validatePreset = (preset: string): { valid: boolean; error?: string } => {
  console.log('Validating preset:', {
    preset,
    availablePresets: UPLOAD_PRESETS,
    environmentValue: CLOUDINARY_BANNER_PRESET || process.env.VITE_CLOUDINARY_BANNER_PRESET
  });

  if (!preset) {
    return { valid: false, error: 'Upload preset is required' };
  }

  // Check for spaces
  if (preset.includes(' ')) {
    return { valid: false, error: 'Upload preset cannot contain spaces' };
  }

  // Check if preset exists in our configuration
  const presetValues = Object.values(UPLOAD_PRESETS);
  if (!presetValues.includes(preset)) {
    console.warn('Preset validation failed:', {
      providedPreset: preset,
      availablePresets: presetValues,
      envValue: CLOUDINARY_BANNER_PRESET || process.env.VITE_CLOUDINARY_BANNER_PRESET
    });
    return {
      valid: false,
      error: 'Invalid upload preset. Please verify preset name matches Cloudinary configuration.'
    };
  }

  return { valid: true };
};

/**
 * Validates a file before upload
 */
export const validateFile = (
  file: File,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
    };
  }

  return { valid: true };
};

interface UploadConfig {
  folder: string;
  preset: string;
  tags?: string[];
  transformation?: CloudinaryTransformations;
}

/**
 * Generate a Cloudinary URL from publicId and version with optional transformations
 */
export const generateCloudinaryUrl = (
  publicId: string,
  version: string = 'v1',
  transformations: CloudinaryTransformations = {}
): string => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Missing Cloudinary cloud name');
  }

  // Debug: Log input parameters
  console.log('Generating Cloudinary URL:', {
    publicId,
    version,
    transformations,
    cloudName: CLOUDINARY_CLOUD_NAME
  });

  const transforms: string[] = [];

  if (transformations.width) {
    transforms.push(`w_${transformations.width}`);
  }
  if (transformations.height) {
    transforms.push(`h_${transformations.height}`);
  }
  if (transformations.crop) {
    transforms.push(`c_${transformations.crop}`);
  }
  if (transformations.quality) {
    transforms.push(`q_${transformations.quality}`);
  }
  if (transformations.format) {
    transforms.push(`f_${transformations.format}`);
  }

  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';
  version = version.startsWith('v') ? version : `v${version}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}${version}/${publicId}`;
};

/**
 * Uploads an image to Cloudinary with specific configuration
 */
export const uploadWithConfig = async (
  file: File,
  config: UploadConfig
): Promise<CloudinaryUploadResponse> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Missing Cloudinary cloud name');
    }

    // Validate the file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    // Validate the preset
    const presetValidation = validatePreset(config.preset);
    if (!presetValidation.valid) {
      throw new Error(presetValidation.error || 'Invalid preset');
    }

    // Create form data for unsigned upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.preset);
    formData.append('folder', config.folder);
    formData.append('timestamp', Date.now().toString());

    // Add tags if provided
    if (config.tags?.length) {
      formData.append('tags', config.tags.join(','));
    }

    // Add transformations if provided
    if (config.transformation) {
      const { width, height, crop } = config.transformation;
      if (width) formData.append('width', width.toString());
      if (height) formData.append('height', height.toString());
      if (crop) formData.append('crop', crop);
    }

    // Debug: Log FormData contents
    console.log('Uploading to Cloudinary with configuration:', {
      preset: config.preset,
      folder: config.folder,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      tags: config.tags,
      transformation: config.transformation
    });

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorHeader = response.headers.get('X-Cld-Error');
      const errorData = await response.json().catch(() => null);

      // Log detailed error information
      console.error('Cloudinary Upload Error:', {
        status: response.status,
        statusText: response.statusText,
        cloudinaryError: errorHeader,
        errorData,
        preset: config.preset,
        folder: config.folder
      });

      // Provide specific error messages for common cases
      let errorMessage = 'Upload failed';
      if (response.status === 401) {
        errorMessage = 'Invalid upload preset or unauthorized access';
      } else if (response.status === 404) {
        errorMessage = 'Upload preset not found';
      } else if (response.status === 413) {
        errorMessage = 'File size too large for Cloudinary';
      }

      throw new Error(
        errorData?.error?.message || errorHeader ||
        `${errorMessage}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const uploadedAt = Date.now();
    const version = data.version ? `v${data.version}` : 'v1';

    // Generate URL with transformations based on upload type
    // Generate base URL without transformations
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${version}/${data.public_id}`;

    // Generate transformed URL if transformations are provided
    const transformedUrl = config.transformation ?
      generateCloudinaryUrl(data.public_id, version, config.transformation) :
      null;

    return {
      baseUrl,
      transformedUrl,
      url: transformedUrl || baseUrl,
      version,
      publicId: data.public_id,
      uploadedAt
    };
  } catch (err: any) {
    console.error('Error uploading to Cloudinary:', err);
    return {
      baseUrl: '',
      transformedUrl: null,
      url: '',
      version: 'v1',
      publicId: 'error',
      uploadedAt: null,
      error: err.message || 'Failed to upload image'
    };
  }
};

/**
 * Uploads a profile picture to Cloudinary
 */
export const uploadProfileImage = async (file: File): Promise<CloudinaryUploadResponse> => {
  return uploadWithConfig(file, {
    folder: 'users/profiles',
    preset: UPLOAD_PRESETS.PROFILE,
    tags: ['profile', 'user'],
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill'
    }
  });
};

/**
 * Uploads a banner image to Cloudinary
 */
export const uploadBannerImage = async (file: File): Promise<CloudinaryUploadResponse> => {
  console.log('Starting banner upload with preset:', UPLOAD_PRESETS.BANNER);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESETS.BANNER);
    formData.append('folder', 'users/banners');
    formData.append('tags', 'banner,user');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const version = `v${result.version}`;
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${version}/${result.public_id}`;

    // Log base URL success
    console.log('Base URL generated successfully:', baseUrl);

    // Generate transformed URL
    const transformedUrl = generateCloudinaryUrl(result.public_id, version, {
      width: 1200,
      height: 300,
      crop: 'fill',
      quality: 90,
      format: 'auto'
    });

    // Log transformed URL generation
    console.log('Transformed URL generated:', transformedUrl);

    return {
      baseUrl,
      transformedUrl,
      url: transformedUrl || baseUrl,
      version,
      publicId: result.public_id,
      uploadedAt: Date.now()
    };
  } catch (err: any) {
    console.error('Banner upload error:', err);
    return {
      baseUrl: '',
      transformedUrl: null,
      url: '',
      version: '',
      publicId: '',
      uploadedAt: null,
      error: err.message || 'Failed to upload banner'
    };
  }
};

/**
 * Deletes an image from Cloudinary
 * Note: This should be handled server-side for security
 */
export const deleteImage = async (
  publicId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log(`Image deletion would be handled server-side for: ${publicId}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting from Cloudinary:', err);
    return {
      success: false,
      error: err.message || 'Failed to delete image'
    };
  }
};

/**
 * Transforms an existing Cloudinary image URL with new transformations
 */
export const transformImage = (input: string | CloudinaryUploadResult, transformations: CloudinaryTransformations): string => {
  // Get the URL string regardless of input type
  const url = typeof input === 'string' ? input : input.url;

  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Extract base URL and original transformations if any
  const urlParts = url.split('/image/upload/');
  if (urlParts.length !== 2) return url;

  const [baseUrl, pathWithVersion] = urlParts;

  // Find version in the path
  const versionMatch = pathWithVersion.match(/\/?v\d+\//);
  const version = versionMatch ? versionMatch[0].replace(/\//g, '') : 'v1';
  const cleanPath = pathWithVersion.replace(/\/?v\d+\//, '');

  // Build transformation string
  const transformParams = [];
  if (transformations.width) transformParams.push(`w_${transformations.width}`);
  if (transformations.height) transformParams.push(`h_${transformations.height}`);
  if (transformations.crop) transformParams.push(`c_${transformations.crop}`);
  if (transformations.quality) transformParams.push(`q_${transformations.quality}`);
  if (transformations.format) transformParams.push(`f_${transformations.format}`);

  const transformString = transformParams.length > 0 ? transformParams.join(',') + '/' : '';

  // Construct final URL with transformations before version
  return `${baseUrl}/image/upload/${transformString}${version}/${cleanPath}`;
};

/**
 * General purpose image upload function
 */
export const uploadImage = async (file: File, folder: string): Promise<CloudinaryUploadResult> => {
  const response = await uploadWithConfig(file, {
    folder,
    preset: UPLOAD_PRESETS.PORTFOLIO, // Use portfolio preset as default
    tags: ['portfolio']
  });

  return {
    url: response.url,
    baseUrl: response.baseUrl,
    transformedUrl: response.transformedUrl,
    error: response.error,
    publicId: response.publicId,
    version: response.version,
    uploadedAt: response.uploadedAt || undefined
  };
};

// Export default object with all utilities
export default {
  validateFile,
  validatePreset,
  uploadProfileImage,
  uploadBannerImage,
  deleteImage,
  transformImage,
  uploadWithConfig,
  uploadImage,
  generateCloudinaryUrl,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  UPLOAD_PRESETS
};
