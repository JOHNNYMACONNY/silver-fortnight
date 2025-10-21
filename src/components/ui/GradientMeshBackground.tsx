import React from 'react';
import { cn } from '../../utils/cn';

interface GradientMeshBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'custom';
  customColors?: string[];
  intensity?: 'light' | 'medium' | 'strong';
  animated?: boolean;
}

/**
 * GradientMeshBackground component for creating organic, flowing gradient backgrounds
 *
 * @param children - Content to display over the background
 * @param className - Additional CSS classes
 * @param variant - Color variant to use
 * @param customColors - Custom colors for the 'custom' variant
 * @param intensity - Intensity of the gradient effect
 * @param animated - Whether to animate the gradient
 */
export const GradientMeshBackground: React.FC<GradientMeshBackgroundProps> = ({
  children,
  className = '',
  variant = 'primary',
  customColors,
  intensity = 'medium',
  animated = false,
}) => {
  // Define gradient colors based on variant - used in meshStyle
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          circle1: 'rgba(249, 115, 22, 0.15)', // primary-500
          circle2: 'rgba(14, 165, 233, 0.15)', // secondary-500
          circle3: 'rgba(139, 92, 246, 0.15)'  // accent-500
        };
      case 'secondary':
        return {
          circle1: 'rgba(14, 165, 233, 0.15)', // secondary-500
          circle2: 'rgba(249, 115, 22, 0.15)', // primary-500
          circle3: 'rgba(139, 92, 246, 0.15)'  // accent-500
        };
      case 'accent':
        return {
          circle1: 'rgba(139, 92, 246, 0.15)', // accent-500
          circle2: 'rgba(249, 115, 22, 0.15)', // primary-500
          circle3: 'rgba(14, 165, 233, 0.15)'  // secondary-500
        };
      case 'custom':
        if (customColors && customColors.length >= 3) {
          return {
            circle1: customColors[0],
            circle2: customColors[1],
            circle3: customColors[2]
          };
        }
        return {
          circle1: 'rgba(249, 115, 22, 0.15)',
          circle2: 'rgba(14, 165, 233, 0.15)',
          circle3: 'rgba(139, 92, 246, 0.15)'
        };
      default:
        return {
          circle1: 'rgba(249, 115, 22, 0.15)',
          circle2: 'rgba(14, 165, 233, 0.15)',
          circle3: 'rgba(139, 92, 246, 0.15)'
        };
    }
  };

  // Define intensity classes
  const getIntensityClasses = () => {
    switch (intensity) {
      case 'light':
        return 'bg-opacity-10 dark:bg-opacity-5';
      case 'medium':
        return 'bg-opacity-20 dark:bg-opacity-10';
      case 'strong':
        return 'bg-opacity-30 dark:bg-opacity-15';
      default:
        return 'bg-opacity-20 dark:bg-opacity-10';
    }
  };

  // Define animation classes
  const getAnimationClasses = () => {
    return animated ? 'animate-shimmer bg-[length:200%_200%]' : '';
  };

  // Generate mesh effect with multiple radial and linear gradients
  const colors = getVariantColors();
  const meshStyle = {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, ${colors.circle1} 0%, transparent 70%),
      radial-gradient(circle at 80% 20%, ${colors.circle2} 0%, transparent 70%),
      radial-gradient(circle at 50% 80%, ${colors.circle3} 0%, transparent 70%),
      linear-gradient(60deg, ${colors.circle1.replace('0.15', '0.05')} 0%, ${colors.circle2.replace('0.15', '0.05')} 100%)
    `,
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        getIntensityClasses(),
        getAnimationClasses(),
        className
      )}
      style={meshStyle}
    >
      {/* Add a subtle noise texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default GradientMeshBackground;
