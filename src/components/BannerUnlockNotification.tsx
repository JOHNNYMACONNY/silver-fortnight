import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BannerUnlockNotificationProps {
  bannerId: string;
  onClose: () => void;
  onClick: () => void;
}

const getBannerName = (bannerId: string) => {
  switch (bannerId) {
    case 'banner-masculine':
      return 'Earth Force';
    case 'banner-feminine':
      return 'Gentle Dawn';
    case 'banner-neutral':
      return 'Golden Balance';
    default:
      return 'New Banner';
  }
};

export function BannerUnlockNotification({ 
  bannerId,
  onClose,
  onClick
}: BannerUnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Remove after animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-4 p-4
                bg-earth-800 border border-earth-700 rounded-lg shadow-lg 
                transform transition-all duration-500 ${
                  isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
    >
      {/* Preview */}
      <div className={`w-16 h-16 rounded-lg overflow-hidden ${bannerId}`} />
      
      {/* Content */}
      <div className="flex-1">
        <h4 className="font-display font-semibold text-gray-900">
          New Banner Unlocked!
        </h4>
        <p className="text-sm text-gray-600">
          {getBannerName(bannerId)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClick}
          className="btn-primary text-sm"
        >
          Try it
        </button>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
          className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
