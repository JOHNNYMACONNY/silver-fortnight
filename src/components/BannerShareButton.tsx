import { useState } from 'react';
import { Share, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import type { UserProfile } from '../types';
import { generateBannerPreview } from '../utils/banner-preview';
import { useToast } from '../contexts/ToastContext';

interface BannerShareButtonProps {
  profile: UserProfile;
  bannerId: string;
}

interface SharePlatform {
  name: string;
  icon: typeof Twitter;
  color: string;
  shareUrl: (url: string, title: string) => string;
}

const platforms: SharePlatform[] = [
  {
    name: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    shareUrl: (url, title) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: '#4267B2',
    shareUrl: (url) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0077B5',
    shareUrl: (url, title) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  }
];

export function BannerShareButton({ profile, bannerId }: BannerShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleShare = async (platform?: SharePlatform) => {
    setIsGenerating(true);
    try {
      // Generate preview image
      const previewImage = await generateBannerPreview(profile, bannerId);
      
      // Get banner name
      const bannerName = bannerId.split('-')[1].charAt(0).toUpperCase() + 
                        bannerId.split('-')[1].slice(1);
      
      // Create share URL with preview image
      const shareUrl = `${window.location.origin}/banner/${bannerId}/preview`;
      const shareTitle = `Check out my ${bannerName} banner on Trade Ya!`;

      if (platform) {
        // Share to platform
        window.open(platform.shareUrl(shareUrl, shareTitle), '_blank');
      } else {
        // Copy link and show success notification
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to share banner:', err);
      showToast('Failed to share banner', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
        disabled={isGenerating}
      >
        <Share className="h-4 w-4" />
        Share Banner
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-earth-800 
                      border border-earth-700 shadow-lg overflow-hidden z-50">
          <div className="p-1 space-y-1">
            {platforms.map(platform => (
              <button
                key={platform.name}
                onClick={() => handleShare(platform)}
                className="flex items-center gap-2 w-full p-2 hover:bg-earth-700 rounded
                         transition-colors duration-200"
                disabled={isGenerating}
              >
                <platform.icon 
                  className="h-4 w-4"
                  style={{ color: platform.color }}
                />
                {platform.name}
              </button>
            ))}
            <button
              onClick={() => handleShare()}
              className="flex items-center gap-2 w-full p-2 hover:bg-earth-700 rounded
                       transition-colors duration-200"
              disabled={isGenerating}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
