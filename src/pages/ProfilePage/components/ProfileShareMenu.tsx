import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link2, Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { logEvent } from "../../../services/analytics";
import { useToast } from "../../../contexts/ToastContext";

interface ProfileShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shareButtonRef: React.RefObject<HTMLButtonElement>;
  targetUserId: string;
  userProfile: {
    displayName?: string;
    handle?: string;
    handlePrivate?: boolean;
  } | null;
}

export const ProfileShareMenu: React.FC<ProfileShareMenuProps> = ({
  isOpen,
  onClose,
  shareButtonRef,
  targetUserId,
  userProfile,
}) => {
  const { showToast } = useToast();
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (isOpen && shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 = 14rem * 16px
      const dropdownHeight = 235; // Approximate height with 5 items
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const shouldFlipUp =
        spaceBelow < dropdownHeight + 16 && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldFlipUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: Math.max(
          16,
          Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 16)
        ),
      });
    }
  }, [isOpen, shareButtonRef]);

  // Helper to generate profile URL
  const getProfileUrl = (): string => {
    const path =
      userProfile?.handle && !userProfile?.handlePrivate
        ? `/profile/${userProfile.handle}`
        : `/profile/${targetUserId}`;
    return `${window.location.origin}${path}`;
  };

  // Handler for copying link
  const handleCopyLink = async () => {
    const url = getProfileUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied!", "success");
      onClose();
      await logEvent("profile_share", {
        userId: targetUserId,
        method: "clipboard",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      showToast("Failed to copy link", "error");
    }
  };

  // Handler for native share
  const handleShareNative = async () => {
    const url = getProfileUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userProfile?.displayName || "User"}'s TradeYa Profile`,
          text: `Check out ${
            userProfile?.displayName || "this user"
          }'s profile on TradeYa!`,
          url,
        });
        onClose();
        await logEvent("profile_share", {
          userId: targetUserId,
          method: "native",
        });
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  // Handler for Twitter share
  const handleShareTwitter = () => {
    const url = getProfileUrl();
    const text = `Check out ${
      userProfile?.displayName || "this user"
    }'s profile on TradeYa!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
    onClose();
    logEvent("profile_share", {
      userId: targetUserId,
      method: "twitter",
    });
  };

  // Handler for LinkedIn share
  const handleShareLinkedIn = () => {
    const url = getProfileUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
      "_blank"
    );
    onClose();
    logEvent("profile_share", {
      userId: targetUserId,
      method: "linkedin",
    });
  };

  // Handler for Facebook share
  const handleShareFacebook = () => {
    const url = getProfileUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
    onClose();
    logEvent("profile_share", {
      userId: targetUserId,
      method: "facebook",
    });
  };

  if (!isOpen || !dropdownPosition) {
    return null;
  }

  return createPortal(
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Share menu dropdown */}
      <div
        className="fixed z-50 w-56 glassmorphic bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl py-2"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
        role="menu"
        aria-label="Share profile options"
      >
        {/* Copy Link */}
        <button
          type="button"
          role="menuitem"
          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
          onClick={handleCopyLink}
          aria-label="Copy profile link to clipboard"
        >
          <Link2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm">Copy link</span>
        </button>

        {/* Native Share (if available) */}
        {typeof navigator !== "undefined" &&
          typeof navigator.share === "function" && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
              onClick={handleShareNative}
              aria-label="Share profile using native share dialog"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm">Share...</span>
            </button>
          )}

        {/* Divider */}
        <div className="h-px bg-border/50 my-2" role="separator" />

        {/* Twitter */}
        <button
          type="button"
          role="menuitem"
          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
          onClick={handleShareTwitter}
          aria-label="Share profile on Twitter"
        >
          <Twitter className="w-4 h-4 text-[#1DA1F2]" aria-hidden="true" />
          <span className="text-sm">Share on Twitter</span>
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          role="menuitem"
          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
          onClick={handleShareLinkedIn}
          aria-label="Share profile on LinkedIn"
        >
          <Linkedin className="w-4 h-4 text-[#0A66C2]" aria-hidden="true" />
          <span className="text-sm">Share on LinkedIn</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          role="menuitem"
          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
          aria-label="Share profile on Facebook"
          onClick={handleShareFacebook}
        >
          <Facebook className="w-4 h-4 text-[#1877F2]" />
          <span className="text-sm">Share on Facebook</span>
        </button>
      </div>
    </>,
    document.body
  );
};

