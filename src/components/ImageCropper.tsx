import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, Save, AlertCircle } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({ image, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropping, setCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    
    setCropping(true);
    setError(null);
    
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      await onCropComplete(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
      setError('Failed to crop image. Please try again.');
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-cyber-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-cyber-gray-900 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-cyber-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-display font-semibold text-cyber-gray-50">
            Adjust Profile Picture
          </h3>
          <button 
            onClick={onCancel} 
            className="p-2 text-cyber-gray-400 hover:text-neon-blue transition-colors"
            disabled={cropping}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Cropper */}
        <div className="relative h-96">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape="round"
            showGrid={false}
            style={{
              containerStyle: {
                background: 'rgb(26, 26, 26)',
              },
              cropAreaStyle: {
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(12, 12, 12, 0.85)',
              },
              mediaStyle: {
                background: 'rgb(26, 26, 26)',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-cyber-gray-800">
          {/* Zoom slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-cyber-gray-200 flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-cyber-gray-400" />
                Zoom Level
              </label>
              <span className="text-sm text-cyber-gray-400">{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full appearance-none bg-cyber-gray-800 h-2 rounded-full outline-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:hover:ring-2 [&::-webkit-slider-thumb]:hover:ring-white/50
                       [&::-webkit-slider-thumb]:transition-all"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={cropping}
              className="px-4 py-2 bg-cyber-gray-800 text-cyber-gray-50 rounded-lg 
                       hover:bg-cyber-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={cropping}
              className="px-4 py-2 bg-white text-cyber-gray-900 rounded-lg
                       hover:bg-cyber-gray-100 transition-colors disabled:opacity-50
                       flex items-center gap-2"
            >
              {cropping ? (
                <>
                  <div className="h-5 w-5 border-2 border-cyber-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}