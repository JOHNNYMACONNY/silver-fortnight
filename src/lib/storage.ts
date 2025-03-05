import { v4 as uuidv4 } from 'uuid';

export async function uploadProfilePicture(userId: string, file: File | Blob): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  try {
    // Validate file type for File objects
    if (file instanceof File && !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error('Missing Cloudinary configuration:', { CLOUD_NAME, UPLOAD_PRESET });
      throw new Error('Image upload is not properly configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'profile-pictures');
    formData.append('public_id', `${userId}_${uuidv4()}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    // Apply transformations via URL
    const transformedUrl = data.secure_url.replace(
      '/upload/',
      '/upload/c_fill,g_face,h_400,w_400,q_auto:best,f_auto/'
    );

    return transformedUrl;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    throw new Error('Failed to upload profile picture. Please try again.');
  }
}

export async function uploadProfileBanner(userId: string, file: File | Blob): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  try {
    // Validate file type for File objects
    if (file instanceof File && !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error('Missing Cloudinary configuration:', { CLOUD_NAME, UPLOAD_PRESET });
      throw new Error('Image upload is not properly configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'profile-banners');
    formData.append('public_id', `${userId}_banner_${uuidv4()}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    // Apply transformations via URL for banner optimization
    const transformedUrl = data.secure_url.replace(
      '/upload/',
      '/upload/c_fill,g_auto,h_400,w_1200,q_auto:best,f_auto/'
    );

    return transformedUrl;
  } catch (error) {
    console.error('Error in uploadProfileBanner:', error);
    
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    throw new Error('Failed to upload banner image. Please try again.');
  }
}