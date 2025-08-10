/**
 * Script to upload default placeholder images to Cloudinary
 * 
 * This script creates and uploads both profile and banner placeholder images
 * to ensure we have reliable default images for the platform.
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'doqqhj2nt';
const CLOUDINARY_UPLOAD_PRESET = 'TradeYa_Banner_Preset'; // Using banner preset

// Placeholder image configurations
const PLACEHOLDERS = [
  {
    type: 'profile',
    folder: 'tradeya/defaults/profiles',
    filename: 'default-profile.png',
    url: 'https://ui-avatars.com/api/?name=User&background=f97316&color=ffffff&size=400&bold=true&format=png',
    tags: ['default', 'placeholder', 'profile']
  },
  {
    type: 'banner',
    folder: 'tradeya/defaults/banners',
    filename: 'banner-placeholder.jpg',
    // Upload a small orange rectangle that we'll transform into a gradient
    url: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    backgroundColor: '#f97316', // TradeYa brand orange
    tags: ['default', 'placeholder', 'banner']
  }
];

/**
 * Uploads a placeholder image to Cloudinary
 * @param {Object} config Placeholder image configuration
 * @returns {Promise<Object>} Upload result
 */
async function uploadPlaceholder(config) {
  try {
    console.log(`Uploading ${config.type} placeholder image...`);
    
    // Fetch the image data
    const imageResponse = await fetch(config.url);
    const imageBuffer = await imageResponse.buffer();
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: config.filename });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', config.folder);
    formData.append('public_id', `default-${config.type}`);
    formData.append('tags', config.tags.join(','));
    
    // Add background color for banner if specified
    if (config.backgroundColor) {
      formData.append('background', config.backgroundColor);
    }
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${config.type} placeholder uploaded successfully:`, {
        url: data.secure_url,
        publicId: data.public_id
      });
      return { success: true, data };
    } else {
      console.error(`Error uploading ${config.type} placeholder:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error(`Error uploading ${config.type} placeholder:`, error);
    return { success: false, error };
  }
}

/**
 * Upload all placeholder images
 */
async function uploadAllPlaceholders() {
  console.log('Starting placeholder image uploads...');
  
  for (const config of PLACEHOLDERS) {
    const result = await uploadPlaceholder(config);
    if (!result.success) {
      console.error(`Failed to upload ${config.type} placeholder`);
    }
  }
  
  console.log('Finished uploading placeholder images');
}

// Run the upload function
uploadAllPlaceholders();