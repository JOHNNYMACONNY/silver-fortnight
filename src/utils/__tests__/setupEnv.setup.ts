import { jest, beforeEach } from '@jest/globals';

// Configure test environment variables
process.env = {
  ...process.env,
  // Firebase config
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST123456',
  
  // Cloudinary config
  VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud',
  VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
  VITE_CLOUDINARY_API_KEY: 'test-api-key',

  // App config
  VITE_APP_ENV: 'test',
  VITE_API_URL: 'http://localhost:5000',
  VITE_APP_URL: 'http://localhost:3000',
  
  // Test mode flags
  NODE_ENV: 'test',
  MODE: 'test',
  
  // Clear any real credentials
  FIREBASE_TOKEN: undefined,
  GOOGLE_APPLICATION_CREDENTIALS: undefined
};

// Setup global test hooks
beforeEach(() => {
  jest.clearAllMocks();
});