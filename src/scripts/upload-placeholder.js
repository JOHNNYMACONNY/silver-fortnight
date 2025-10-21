/**
 * Script to upload a default profile placeholder image to Cloudinary
 * 
 * This script creates a simple placeholder image and uploads it to Cloudinary
 * so we have a reliable default profile image.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'doqqhj2nt';
const CLOUDINARY_UPLOAD_PRESET = 'TradeYa_Prof_Pic_Preset';
const CLOUDINARY_API_KEY = '411756985482938';
const CLOUDINARY_API_SECRET = 'Yc3gsui6wCADha6zruVUFMx_1BM';
const CLOUDINARY_ID = 'f1414a70ffee9854e4e5031231cbc1';

// Function to upload the placeholder image to Cloudinary
async function uploadPlaceholderImage() {
  try {
    // Generate a placeholder image URL from UI Avatars
    const placeholderUrl = 'https://ui-avatars.com/api/?name=User&background=f97316&color=ffffff&size=200&bold=true&format=png';
    
    // Fetch the image data
    const imageResponse = await fetch(placeholderUrl);
    const imageBuffer = await imageResponse.buffer();
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'profile-placeholder.png' });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('folder', 'tradeya/defaults');
    formData.append('public_id', 'profile-placeholder');
    formData.append('timestamp', Date.now().toString());
    formData.append('tags', 'default,placeholder,profile');
    
    // Upload to Cloudinary
    console.log(`Uploading placeholder image to Cloudinary: https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Placeholder image uploaded successfully:', {
        url: data.secure_url,
        publicId: data.public_id
      });
    } else {
      console.error('Error uploading placeholder image:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the upload function
uploadPlaceholderImage();
