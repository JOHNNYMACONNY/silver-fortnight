import { useEffect } from "react";
import {
  preconnectToCommonDomains,
  preloadFonts,
  preloadImages,
  preloadStyles,
} from "../../utils/preloadUtils";

/**
 * Critical resources that should be preloaded as soon as the application starts
 */
const CRITICAL_FONTS: string[] = [
  // Only preload fonts that are actually used immediately in the critical rendering path
  // Remove inter-var.woff2 as it doesn't exist and causes 404s
];

const CRITICAL_IMAGES: string[] = [
  // Add your critical image URLs here (logo, common UI elements)
  // Example: 'https://res.cloudinary.com/doqqhj2nt/image/upload/v1/tradeya/logo.png'
];

const CRITICAL_STYLES: string[] = [
  // Only preload Google Fonts stylesheet if fonts are used immediately
  // Remove this to eliminate unused preload warnings
  // 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

/**
 * AppPreloader Component
 *
 * This component handles preloading critical resources when the application first loads.
 * It should be placed high in the component tree and will run once on initial mount.
 */
const AppPreloader = () => {
  useEffect(() => {
    // Preconnect to common domains
    preconnectToCommonDomains();

    // Preload critical styles (including Google Fonts stylesheet)
    if (CRITICAL_STYLES.length > 0) {
      preloadStyles(CRITICAL_STYLES);
    }

    // Preload critical images
    if (CRITICAL_IMAGES.length > 0) {
      preloadImages(CRITICAL_IMAGES);
    }

    // Preload critical fonts (if any)
    // Note: We're now letting the Google Fonts stylesheet handle font loading
    // instead of manually preloading specific font files
    if (CRITICAL_FONTS.length > 0) {
      preloadFonts(CRITICAL_FONTS);
    }

    // Log preloading activity in development (safe check for Storybook/Chromatic)
    if (
      (typeof import.meta !== "undefined" &&
        typeof import.meta.env !== "undefined" &&
        (import.meta.env.DEV || process.env.NODE_ENV === "development")) ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("[AppPreloader] Preloaded critical application resources");
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default AppPreloader;
