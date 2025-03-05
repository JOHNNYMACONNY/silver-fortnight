import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Palette } from 'lucide-react';
import { BannerShareButton } from './BannerShareButton';
import { BannerGradient } from './BannerGradient';
import type { UserProfile } from '../types';

interface BannerStyle {
  id: string;
  name: string;
  style: string;
  levelRequired: number;
  description: string;
}

// Export banners for use in banner preview
export const defaultBanners: BannerStyle[] = [
  {
    id: 'banner-masculine',
    name: 'Earth Force',
    style: 'banner-masculine',
    levelRequired: 0,
    description: 'A bold, dynamic gradient inspired by natural strength'
  },
  {
    id: 'banner-feminine',
    name: 'Gentle Dawn',
    style: 'banner-feminine',
    levelRequired: 0,
    description: 'A soft, harmonious blend of warm earth tones'
  },
  {
    id: 'banner-neutral',
    name: 'Golden Balance',
    style: 'banner-neutral',
    levelRequired: 0,
    description: 'A balanced composition of earthy gold and warm beige'
  },
  {
    id: 'banner-advanced-masculine',
    name: 'Mountain Force',
    style: 'banner-masculine',
    levelRequired: 5,
    description: 'An advanced dynamic gradient for seasoned members'
  },
  {
    id: 'banner-advanced-feminine',
    name: 'Forest Dawn',
    style: 'banner-feminine',
    levelRequired: 10,
    description: 'A premium blend of natural tones for experienced members'
  },
  {
    id: 'banner-advanced-neutral',
    name: 'Mystic Balance',
    style: 'banner-neutral',
    levelRequired: 15,
    description: 'An elite composition unlocked through dedication'
  }
];

interface ProfileBannerProps {
  userId: string;
  selectedBanner?: string;
  userLevel: number;
  editable?: boolean;
  profile: UserProfile;
  onUpdate: (bannerId: string) => Promise<void>;
}

export function ProfileBanner({ 
  selectedBanner, 
  userLevel, 
  editable = false,
  profile,
  onUpdate 
}: ProfileBannerProps) {
  const [currentSelection, setCurrentSelection] = useState(selectedBanner);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Reset selection when selected banner changes
  useEffect(() => {
    setCurrentSelection(selectedBanner);
  }, [selectedBanner]);

  // Close dialog on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogRef.current?.open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedBanner]);

  // Memoize filtered banners to prevent recalculation on every render
  const { availableBanners, upcomingBanners } = useMemo(() => {
    return {
      availableBanners: defaultBanners.filter(b => b.levelRequired <= userLevel),
      upcomingBanners: defaultBanners.filter(b => b.levelRequired > userLevel)
    };
  }, [userLevel]);

  // Memoize banner selection handler
  const handleBannerSelect = useCallback(async (bannerId: string) => {
    try {
      setCurrentSelection(bannerId);
      await onUpdate(bannerId);
    } catch (error) {
      console.error('Failed to update banner:', error);
      setCurrentSelection(selectedBanner);
      // Show error message to user
      alert('Failed to update banner. Please try again.');
    }
  }, [onUpdate, selectedBanner]);

  const handleClose = useCallback(() => {
    setCurrentSelection(selectedBanner);
    dialogRef.current?.close();
  }, [selectedBanner]);

  // Show dialog
  const showDialog = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <div className="relative">
      <div className="profile-banner relative">
        <BannerGradient 
          style={defaultBanners.find(b => b.id === currentSelection)?.style || 'banner-default'} 
        />
        {editable && (
          <button 
            onClick={showDialog}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/10 backdrop-blur-sm
                     hover:bg-white/20 transition-all"
            aria-label="Customize Banner"
            title="Click to customize banner"
          >
            <Palette className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      <dialog ref={dialogRef} className="m-4">
        <div className="bg-earth-800 rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
          <div className="flex justify-between items-center border-b border-earth-700 p-4">
            <h3 className="text-lg font-display font-semibold text-white">
              Choose Your Banner
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-earth-700 active:bg-earth-600 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            {/* Banner Preview */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
              <div className="profile-banner h-32 rounded-lg">
                <BannerGradient 
                  style={defaultBanners.find(b => b.id === currentSelection)?.style || 'banner-default'} 
                  className="rounded-lg" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Available Banners */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-300">Available Styles</h4>
                  <span className="text-xs text-gray-500">Your Level: {userLevel}</span>
                </div>
                <div className="space-y-4">
                {availableBanners.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No banners available yet</p>
                    <p className="text-gray-500 text-sm mt-2">Level up to unlock banners!</p>
                  </div>
                )}
                  {availableBanners.map(banner => (
                    <button
                      key={banner.id}
                      onClick={() => handleBannerSelect(banner.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all
                                bg-earth-900/50 hover:bg-earth-900 relative
                                ${currentSelection === banner.id ? 'ring-2 ring-accent-clay' : 'hover:ring-1 ring-white/20'}`}
                    >
                      <div className="mb-2 h-20 rounded overflow-hidden">
                        <BannerGradient style={banner.style} />
                      </div>
                      <h5 className="font-medium text-white mb-1">{banner.name}</h5>
                      <p className="text-sm text-gray-400">{banner.description}</p>
                      {currentSelection === banner.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-accent-clay rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming Banners */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-4">Upcoming Styles</h4>
                <div className="space-y-4">
                  {upcomingBanners.map(banner => (
                    <div
                      key={banner.id}
                      className="p-4 rounded-lg bg-earth-900/30 border border-earth-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded overflow-hidden">
                          <BannerGradient style={banner.style} className="opacity-50" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-400">{banner.name}</h5>
                          <p className="text-sm text-gray-500 mb-1">{banner.description}</p>
                          <span className="inline-block px-2 py-1 text-xs rounded bg-earth-800 text-gray-400">
                            Unlocks at Level {banner.levelRequired}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-2 pt-4 border-t border-earth-700">
              <BannerShareButton
                profile={profile}
                bannerId={currentSelection || selectedBanner || 'banner-default'}
              />
              <button
                className="btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
