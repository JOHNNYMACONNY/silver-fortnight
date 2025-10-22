import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import DefaultBanner, { BannerDesign } from './DefaultBanner';

interface BannerSelectorProps {
  onSelect: (design: BannerDesign) => void;
  onCategoryChange?: (category: string | null) => void; // New prop for category changes
  selectedDesign?: BannerDesign;
  className?: string;
}

/**
 * BannerSelector Component
 *
 * A component that displays a grid of banner options for users to select from
 * when customizing their profile.
 */
const BannerSelector: React.FC<BannerSelectorProps> = ({
  onSelect,
  onCategoryChange,
  selectedDesign,
  className
}) => {
  // Define banner group categories type
  type BannerGroupCategory = 'Gradients' | 'Patterns' | 'Modern Styles' | 'Artistic' | 'Minimal';

  // Group banner designs by category
  const bannerGroups = {
    'Gradients': ['gradient1', 'gradient2', 'gradient3', 'gradient3d'] as BannerDesign[],
    'Patterns': ['geometric1', 'geometric2', 'waves', 'dots'] as BannerDesign[],
    'Modern Styles': ['glassmorphism1', 'glassmorphism2', 'liquid', 'abstract3d'] as BannerDesign[],
    'Artistic': ['neobrutalism1', 'neobrutalism2', 'memphis', 'cyberpunk'] as BannerDesign[],
    'Minimal': ['minimal'] as BannerDesign[]
  };

  // State to track which category is expanded
  const [expandedCategory, setExpandedCategory] = useState<BannerGroupCategory | null>('Gradients');

  return (
    <div className={cn("w-full space-y-4", className)}>
      <h3 className={cn("text-lg font-medium", "text-foreground")}>Choose a Banner Style</h3>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(bannerGroups) as BannerGroupCategory[]).map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => {
              const newCategory = expandedCategory === category ? null : category;
              setExpandedCategory(newCategory);
              // Notify parent component about category change
              onCategoryChange?.(newCategory);
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors",
              expandedCategory === category
                ? "bg-primary-500 text-white"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Banner options */}
      {expandedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bannerGroups[expandedCategory].map((design) => (
            <div
              key={design}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault(); // Prevent any form submission
                onSelect(design);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault(); // Prevent any form submission
                  onSelect(design);
                }
              }}
              aria-label={`Select banner: ${formatDesignName(design)}`}
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                "hover:shadow-md hover:scale-[1.02]",
                selectedDesign === design && "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-900"
              )}
            >
              <DefaultBanner design={design} height="sm" />
              <div className={cn(
                "py-2 px-3 text-sm font-medium",
                "text-foreground"
              )}>
                {formatDesignName(design)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to format design names for display
const formatDesignName = (design: BannerDesign): string => {
  switch (design) {
    case 'gradient1': return 'Orange Blue Gradient';
    case 'gradient2': return 'Orange Purple Gradient';
    case 'gradient3': return 'Teal Orange Gradient';
    case 'gradient3d': return '3D Gradient Effect';
    case 'geometric1': return 'Geometric Pattern (Orange)';
    case 'geometric2': return 'Geometric Pattern (Blue)';
    case 'waves': return 'Wave Pattern';
    case 'dots': return 'Dot Pattern';
    case 'glassmorphism1': return 'Glassmorphism (Orange)';
    case 'glassmorphism2': return 'Glassmorphism (Blue)';
    case 'neobrutalism1': return 'Neobrutalism Bold';
    case 'neobrutalism2': return 'Neobrutalism Pattern';
    case 'abstract3d': return 'Abstract 3D Shapes';
    case 'liquid': return 'Liquid Shapes';
    case 'memphis': return 'Memphis Style';
    case 'cyberpunk': return 'Cyberpunk Neon';
    case 'minimal': return 'Minimalist Design';
    default: return design;
  }
};

export default BannerSelector;
