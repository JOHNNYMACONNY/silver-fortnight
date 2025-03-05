import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { ProfilePicture } from './ProfilePicture';
import { ImageCropper } from './ImageCropper';
import { uploadProfilePicture } from '../lib/storage';

interface ProfilePictureUploadProps {
  currentUrl?: string;
  userId: string;
  onUpload: (url: string) => void;
}

export function ProfilePictureUpload({ currentUrl, userId, onUpload }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const handleUpload = async (file: File | Blob) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await uploadProfilePicture(userId, file);
      onUpload(url);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.onerror = () => {
        setError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 5MB');
      } else if (error?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an image');
      } else {
        setError('Invalid file. Please try again');
      }
    }
  });

  const handleCropComplete = async (croppedImage: Blob) => {
    setCropImage(null);
    await handleUpload(croppedImage);
  };

  return (
    <div className="relative group">
      <div
        {...getRootProps()}
        className={`relative cursor-pointer transition-all duration-300
          ${isDragActive ? 'ring-2 ring-neon-blue ring-offset-2 ring-offset-cyber-black' : ''}`}
      >
        {/* Profile Picture with Hover Effects */}
        <div className="relative">
          {/* Animated Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-lg opacity-75 group-hover:opacity-100 blur transition-opacity"></div>
          
          {/* Profile Picture */}
          <div className="relative">
            <ProfilePicture 
              url={currentUrl} 
              size="xl" 
              className={`
                transition-all duration-300
                ${uploading ? 'opacity-50' : ''}
                ${isDragActive ? 'scale-105' : ''}
              `} 
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyber-gray-900/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Upload className="h-6 w-6 text-neon-blue mb-2" />
              <span className="text-sm font-medium text-cyber-gray-50">
                {isDragActive ? 'Drop to Upload' : 'Click or Drag'}
              </span>
              <span className="text-xs text-cyber-gray-400 mt-1">Max 5MB</span>
            </div>
          </div>
        </div>
        
        <input {...getInputProps()} />
      </div>
      
      {/* Loading State */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyber-gray-900/80 backdrop-blur-sm rounded-lg">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full animate-spin opacity-75 blur"></div>
            <div className="relative h-8 w-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-64">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-lg blur"></div>
            <div className="relative p-3 bg-cyber-gray-900 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImage(null)}
          aspectRatio={1}
        />
      )}
    </div>
  );
}