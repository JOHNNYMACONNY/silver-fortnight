import type { UserProfile } from '../types';
import type { BannerStyle } from '../components/ProfileBanner';
import { defaultBanners } from '../components/ProfileBanner';

// Export BannerStyle type for better type safety
export type { BannerStyle };

interface BannerPreviewOptions {
  width?: number;
  height?: number;
  includeProfile?: boolean;
}

const defaultOptions: BannerPreviewOptions = {
  width: 1200,  // Twitter card optimal size
  height: 630,
  includeProfile: true
};

// Load an image and return as HTMLImageElement
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new HTMLImageElement();
    img.crossOrigin = 'anonymous';  // Enable CORS for external images
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Draw a rounded rectangle
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Get banner gradient colors
const getBannerColors = (bannerId: string): [string, string] => {
  switch (bannerId) {
    case 'banner-masculine':
      return ['#4A5D43', '#2F3B2F'];  // accent-moss to earth-900
    case 'banner-feminine':
      return ['#C67D63', '#8B9D83'];  // accent-clay to accent-sage
    case 'banner-neutral':
      return ['#D69F4C', '#F5F2EA'];  // accent-ochre to earth-800
    default:
      return ['#F5F2EA', '#E5E1D8'];  // earth-800 to earth-700 (default)
  }
};

export const generateBannerPreview = async (
  profile: UserProfile,
  bannerId: string,
  options: BannerPreviewOptions = {}
): Promise<string> => {
  const { width, height, includeProfile } = { ...defaultOptions, ...options };
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw banner gradient background
  const [color1, color2] = getBannerColors(bannerId);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add texture overlay
  ctx.globalAlpha = 0.05;
  const noisePattern = await loadImage('/noise-texture.png');
  ctx.fillStyle = ctx.createPattern(noisePattern, 'repeat')!;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  if (includeProfile) {
    // Add dark overlay at bottom
    const overlayGradient = ctx.createLinearGradient(0, height - 200, 0, height);
    overlayGradient.addColorStop(0, 'rgba(47, 59, 47, 0)');
    overlayGradient.addColorStop(1, 'rgba(47, 59, 47, 0.8)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, height - 200, width, 200);

    // Draw profile picture if available
    if (profile.profilePicture) {
      try {
        const img = await loadImage(profile.profilePicture);
        ctx.save();
        
        // Create circular clip for profile picture
        ctx.beginPath();
        ctx.arc(100, height - 100, 50, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw the image
        ctx.drawImage(img, 50, height - 150, 100, 100);
        ctx.restore();
      } catch (err) {
        console.error('Failed to load profile picture:', err);
      }
    }

    // Add text overlay
    ctx.fillStyle = '#F5F2EA';  // earth-800
    ctx.font = 'bold 48px "Space Grotesk"';
    ctx.fillText(profile.displayName, 180, height - 120);
    
    ctx.font = '24px "Inter"';
    ctx.fillText(`Level ${profile.level}`, 180, height - 80);

    // Add banner name
    try {
      const banner = defaultBanners.find(b => b.id === bannerId);
      if (banner) {
        ctx.font = 'bold 32px "Space Grotesk"';
        ctx.fillText(banner.name, 180, height - 30);
      }
    } catch (err) {
      console.error('Failed to render banner name:', err);
    }
  }

  return canvas.toDataURL('image/png');
};
