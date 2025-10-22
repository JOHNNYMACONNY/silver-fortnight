/**
 * Test script to verify Cloudinary configuration
 */

// Log environment variables
console.log('Cloudinary Cloud Name:', import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME);
console.log('Cloudinary Upload Preset:', import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET ?? process.env.VITE_CLOUDINARY_UPLOAD_PRESET);

// Log all environment variables
console.log('All environment variables:', import.meta.env);

// Import Cloudinary service
import { uploadImage } from './services/cloudinary/cloudinaryService';

// Test function
async function testCloudinaryUpload() {
  console.log('Testing Cloudinary upload...');

  // Create a simple canvas with some content
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Test Image', 50, 100);
  }

  return new Promise<void>((resolve, reject) => {
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        reject(new Error('Failed to create blob'));
        return;
      }

      try {
        // Create file from blob
        const file = new File([blob], 'test-image.png', { type: 'image/png' });

        // Upload to Cloudinary
        const result = await uploadImage(file, 'tradeya/test');

        console.log('Upload result:', {
          baseUrl: result.baseUrl,
          transformedUrl: result.transformedUrl,
          url: result.url,
          publicId: result.publicId,
          version: result.version
        });

        if (result.error) {
          throw new Error(result.error);
        }

        // Use transformed URL if available, otherwise use base URL
        const displayUrl = result.transformedUrl || result.baseUrl;

        // Display the image
      const img = document.createElement('img');
      img.src = displayUrl;
      img.style.width = '200px';
      img.style.height = '200px';
      img.style.border = '1px solid black';

      const container = document.createElement('div');
      container.appendChild(img);
      container.style.position = 'fixed';
      container.style.top = '10px';
      container.style.right = '10px';
      container.style.zIndex = '9999';
      container.style.background = 'white';
      container.style.padding = '10px';
      container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.onclick = () => document.body.removeChild(container);
      container.appendChild(closeBtn);

        document.body.appendChild(container);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 'image/png');
  });
}

// Export the test function
export { testCloudinaryUpload };
