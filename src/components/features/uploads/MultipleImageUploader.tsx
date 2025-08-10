import React, { useState, useRef, useEffect } from 'react';
import {
  uploadImage as cloudinaryUploadImage,
  validateFile,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE
} from '../../../services/cloudinary/cloudinaryService';
import { useToast } from '../../../contexts/ToastContext';
import LazyImage from '../../ui/LazyImage';

interface MultipleImageUploaderProps {
  onImagesChange: (urls: string[]) => void;
  folder: string;
  initialImageUrls?: string[];
  maxImages?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}

export const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  onImagesChange,
  folder,
  initialImageUrls = [],
  maxImages = 5,
  maxWidth = 800,
  maxHeight = 800,
  className = ''
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Update imageUrls when initialImageUrls changes
  useEffect(() => {
    if (initialImageUrls) {
      setImageUrls(initialImageUrls);
    }
  }, [initialImageUrls]);

  // Notify parent component when imageUrls change
  useEffect(() => {
    onImagesChange(imageUrls);
  }, [imageUrls, onImagesChange]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(Array.from(files));

    // Reset the input value so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    await processFiles(Array.from(files));
  };

  // Process and upload multiple files
  const processFiles = async (files: File[]) => {
    // Check if adding these files would exceed the maximum
    if (imageUrls.length + files.length > maxImages) {
      addToast('error', `You can only upload a maximum of ${maxImages} images`);
      return;
    }

    // Filter for image files only
    const imageFiles = files.filter(file => ALLOWED_IMAGE_TYPES.includes(file.type));

    if (imageFiles.length === 0) {
      addToast('error', 'No valid image files selected');
      return;
    }

    setIsUploading(true);

    // Process each file
    const uploadPromises = imageFiles.map(async (file) => {
      // Validate the file
      const validation = validateFile(file);
      if (!validation.valid) {
        addToast('error', validation.error || 'Invalid file');
        return null;
      }

      try {
        // Create a unique ID for tracking progress
        const fileId = `${Date.now()}-${file.name}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min(prev[fileId] + Math.random() * 10, 90)
          }));
        }, 200);

        // Resize the image
        const resizedFile = await resizeImage(file, maxWidth, maxHeight);

        // Upload the file
        const result = await cloudinaryUploadImage(resizedFile, folder);

        clearInterval(progressInterval);

        if (result.error) {
          throw new Error(result.error);
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        // Prefer transformed URL if available, otherwise use base URL
        const finalUrl = result.transformedUrl || result.baseUrl;
        return finalUrl;
      } catch (err: any) {
        addToast('error', err.message || 'Failed to upload image');
        return null;
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);

    // Filter out null results and ensure string type
    const newUrls = results.filter((url): url is string => typeof url === 'string');

    if (newUrls.length > 0) {
      setImageUrls(prev => [...prev, ...newUrls]);
      addToast('success', `${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded successfully`);
    }

    setIsUploading(false);
    setUploadProgress({});
  };

  // Resize the image
  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Resize if larger than max dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create new file from blob
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              resolve(resizedFile);
            },
            file.type,
            0.9 // Quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  // Remove an image
  const removeImage = async (url: string, index: number) => {
    try {
      // Remove from state first for immediate UI update
      setImageUrls(prev => prev.filter((_, i) => i !== index));

      // Then delete from storage (if we have the public ID)
      // For Cloudinary, we would need the public ID to delete
      // Since we're just storing URLs, we'll just log this for now
      console.log('Would delete image from Cloudinary:', url);

      // In a real implementation, you would extract the public ID from the URL
      // and call deleteImage with it
    } catch (err: any) {
      console.error('Error removing image:', err);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Trigger file input click
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Reorder images with drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();

    if (draggedIndex === null) return;

    // Reorder the images
    const newImageUrls = [...imageUrls];
    const [movedImage] = newImageUrls.splice(draggedIndex, 1);
    newImageUrls.splice(index, 0, movedImage);

    setImageUrls(newImageUrls);
    setDraggedIndex(null);
  };

  return (
    <div className={className}>
      {/* Image grid */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {imageUrls.map((url, index) => (
            <div
              key={url}
              className="relative border rounded-lg overflow-hidden"
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e)}
              onDrop={(e) => handleImageDrop(e, index)}
            >
              <LazyImage
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-32 object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                onClick={() => removeImage(url, index)}
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                {index === 0 ? 'Main Image' : `Image ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {imageUrls.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="py-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop images, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {`${imageUrls.length} of ${maxImages} images uploaded`}
            </p>
            <p className="text-xs text-gray-500">
              {`Supported formats: ${ALLOWED_IMAGE_TYPES.map(type => type.split('/')[1]).join(', ')}`}
            </p>
            <p className="text-xs text-gray-500">
              {`Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB per image`}
            </p>
          </div>

          {isUploading && Object.keys(uploadProgress).length > 0 && (
            <div className="mt-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {progress < 100 ? 'Uploading...' : 'Upload complete'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {imageUrls.length >= maxImages && (
        <p className="text-sm text-orange-500 mt-2">
          Maximum number of images reached ({maxImages})
        </p>
      )}

      {imageUrls.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Tip: Drag and drop images to reorder them. The first image will be the main image.
        </p>
      )}
    </div>
  );
};
