// Mock implementation of image utilities for testing

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
}

// Mock implementations
export const formatCloudinaryUrl = (imageUrl: string, options = {}): string => {
  return `https://res.cloudinary.com/mock-cloud/image/upload/mock-transform/${imageUrl}`;
};

export const uploadImageToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  return {
    url: `https://res.cloudinary.com/mock-cloud/image/upload/mock-upload/${file.name}`,
    publicId: `mock-upload/${file.name}`
  };
};

export const deleteImageFromCloudinary = async (): Promise<{ result: string }> => {
  return { result: 'ok' };
};

export const getImageDimensions = async (): Promise<ImageDimensions> => {
  return {
    width: 800,
    height: 600
  };
};

export const optimizeImage = (url: string, options: ImageOptimizationOptions = {}): string => {
  const transformations: string[] = [];
  const { width, height, quality = 'auto' } = options;
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  
  return `${url}/t_optimized,${transformations.join(',')}`;
};

// Mock environment variables
export const CLOUDINARY_CLOUD_NAME = 'mock-cloud-name';
export const CLOUDINARY_UPLOAD_PRESET = 'mock-upload-preset';
export const CLOUDINARY_API_KEY = 'mock-api-key';

// Mock transformation constants
export const AVATAR_TRANSFORMATION = 'c_fill,g_face,w_200,h_200';
export const PORTFOLIO_THUMBNAIL = 'c_fill,w_400,h_300';
export const PORTFOLIO_FULL = 'c_scale,w_1200';

// Mock utility functions
export const getTransformedUrl = (url: string, transformation: string): string => {
  return `${url}/t_${transformation}`;
};

export const isValidCloudinaryUrl = (url: string): boolean => {
  return url.startsWith('https://res.cloudinary.com/');
};

export const extractPublicId = (url: string): string => {
  const matches = url.match(/upload\/(.+)$/);
  return matches ? matches[1] : '';
};

export const buildUploadParams = (options: { preset?: string; folder?: string } = {}): Record<string, string> => {
  return {
    upload_preset: options.preset || CLOUDINARY_UPLOAD_PRESET,
    folder: options.folder || 'default',
    cloud_name: CLOUDINARY_CLOUD_NAME
  };
};