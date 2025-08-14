import React from 'react';
import { themeClasses } from '../../utils/themeUtils';

export type BannerDesign =
  // Legacy/basic
  | 'glass'
  | 'gradient'
  | 'simple'
  // Gradient styles
  | 'gradient1'
  | 'gradient2'
  | 'gradient3'
  | 'gradient3d'
  // Patterns
  | 'geometric1'
  | 'geometric2'
  | 'waves'
  | 'dots'
  // Modern styles
  | 'glassmorphism1'
  | 'glassmorphism2'
  | 'liquid'
  | 'abstract3d'
  // Artistic
  | 'neobrutalism1'
  | 'neobrutalism2'
  | 'memphis'
  | 'cyberpunk'
  // Minimal
  | 'minimal'
  // Utility
  | 'random';

export interface DefaultBannerProps {
  design?: BannerDesign;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const heightClassMap: Record<NonNullable<DefaultBannerProps['height']>, string> = {
  sm: 'h-24',
  md: 'h-40',
  lg: 'h-56',
};

function computeDesignClasses(design: BannerDesign): string {
  // Handle legacy/basic
  if (design === 'glass' || design.startsWith('glassmorphism')) {
  return 'glassmorphic';
  }
  if (design === 'gradient' || design.startsWith('gradient')) {
    // Map different gradient variants to a sensible default
    return 'bg-gradient-to-r from-primary-500 to-secondary-500';
  }
  if (
    design === 'geometric1' ||
    design === 'geometric2' ||
    design === 'waves' ||
    design === 'dots'
  ) {
    return `${themeClasses.card}`;
  }
  if (
    design === 'neobrutalism1' ||
    design === 'neobrutalism2' ||
    design === 'memphis' ||
    design === 'cyberpunk' ||
    design === 'abstract3d' ||
    design === 'liquid'
  ) {
    return `${themeClasses.card}`;
  }
  if (design === 'minimal') {
    return `${themeClasses.card}`;
  }
  if (design === 'random') {
    // Pick between a couple defaults for now
    return Math.random() > 0.5
      ? 'bg-gradient-to-r from-primary-500 to-secondary-500'
    : 'glassmorphic';
  }
  // Fallback
  return `${themeClasses.card}`;
}

const DefaultBanner: React.FC<DefaultBannerProps> = ({
  design = 'simple',
  height = 'md',
  className,
  children,
}) => {
  return (
    <div
      className={`rounded-md ${computeDesignClasses(design)} ${heightClassMap[height]} ${
        themeClasses.text
      } ${className ?? ''}`}
    >
      {children ?? <p>This is a default banner that adapts to the current theme.</p>}
    </div>
  );
};

export default DefaultBanner;
