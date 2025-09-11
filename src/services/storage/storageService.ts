/**
 * Storage Service
 * 
 * This file provides utilities for working with Firebase Storage
 * for uploading, downloading, and managing files.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getSyncFirebaseStorage } from '../../firebase-config';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates a file before upload
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 * @returns An object with validation result and error message if any
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
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
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

/**
 * Uploads a file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path (e.g., 'users/user123/profile')
 * @param metadata Optional metadata for the file
 * @returns An object with the download URL or error
 */
export const uploadFile = async (
  file: File,
  path: string,
  metadata?: any
): Promise<{ url: string | null; error: string | null }> => {
  try {
    // Validate the file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Invalid file' };
    }
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create a reference to the file location
    const storageRef = ref(getSyncFirebaseStorage(), fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { url: downloadURL, error: null };
  } catch (err: any) {
    console.error('Error uploading file:', err);
    return { 
      url: null, 
      error: err.message || 'Failed to upload file'
    };
  }
};

/**
 * Deletes a file from Firebase Storage
 * @param url The download URL of the file to delete
 * @returns An object with success status or error
 */
export const deleteFile = async (
  url: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Extract the path from the URL
    const decodedUrl = decodeURIComponent(url);
    const path = decodedUrl.split('?')[0].split('/o/')[1];
    
    if (!path) {
      return { success: false, error: 'Invalid file URL' };
    }
    
    // Create a reference to the file
    const fileRef = ref(getSyncFirebaseStorage(), path);
    
    // Delete the file
    await deleteObject(fileRef);
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting file:', err);
    return { 
      success: false, 
      error: err.message || 'Failed to delete file'
    };
  }
};

/**
 * Lists all files in a directory
 * @param path The storage path to list files from
 * @returns An object with the list of file URLs or error
 */
export const listFiles = async (
  path: string
): Promise<{ urls: string[] | null; error: string | null }> => {
  try {
    // Create a reference to the directory
    const directoryRef = ref(getSyncFirebaseStorage(), path);
    
    // List all items in the directory
    const result = await listAll(directoryRef);
    
    // Get download URLs for all items
    const urlPromises = result.items.map(itemRef => getDownloadURL(itemRef));
    const urls = await Promise.all(urlPromises);
    
    return { urls, error: null };
  } catch (err: any) {
    console.error('Error listing files:', err);
    return { 
      urls: null, 
      error: err.message || 'Failed to list files'
    };
  }
};

export default {
  validateFile,
  uploadFile,
  deleteFile,
  listFiles,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES
};
