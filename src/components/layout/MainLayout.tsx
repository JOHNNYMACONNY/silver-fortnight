import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { cn } from '../../utils/cn';
import { DynamicBackground } from '../background/DynamicBackground';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import Box from './primitives/Box';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  containerized?: boolean;
}

/**
 * MainLayout Component
 *
 * Provides consistent layout structure across the application with:
 * - Dynamic animated background using WebGL
 * - Responsive navigation header
 * - Main content area with optional containerization
 * - Footer
 * - Proper responsive spacing and max-width constraints
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
  containerized = true
}) => {
  const {
    isMobile,
    isTablet,
    shouldUseReducedAnimations,
    getOptimalSpacing,
  } = useMobileOptimization();

  return (
    <Box className="relative flex flex-col min-h-screen">
      {/* Dynamic Background - positioned behind all content */}
      <DynamicBackground
        colors={{
          primary: '#f97316',   // TradeYa Orange
          secondary: '#0ea5e9', // TradeYa Blue
          accent: '#8b5cf6'     // TradeYa Purple
        }}
        className={cn(
          'fixed inset-0 -z-10',
          // Reduce background complexity on mobile for performance
          shouldUseReducedAnimations() && 'opacity-50'
        )}
      />
      <Navbar />
      <Box
        className={cn(
          'flex-grow',
          // Responsive padding
          isMobile ? 'py-4' : isTablet ? 'py-6' : 'py-8',
          containerized ? (
            isMobile
              ? 'container mx-auto px-3'
              : 'container mx-auto px-4 sm:px-6 lg:px-8'
          ) : '',
          className
        )}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
