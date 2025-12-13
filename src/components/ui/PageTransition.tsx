import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  duration?: number;
  location?: string; // For integration with router location
}

/**
 * PageTransition - A component for smooth transitions between pages
 * 
 * This component uses Framer Motion to provide smooth transitions between pages.
 * It can be used with React Router to create a more polished user experience.
 * 
 * @example
 * // Basic usage in a component
 * <PageTransition>
 *   <div>Page content</div>
 * </PageTransition>
 * 
 * @example
 * // With React Router
 * <PageTransition location={location.pathname}>
 *   <Routes>
 *     <Route path="/" element={<HomePage />} />
 *     <Route path="/about" element={<AboutPage />} />
 *   </Routes>
 * </PageTransition>
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  animation = 'fade',
  duration = 0.3,
  location,
}) => {
  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      // Add listener for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Skip animation if animation type is 'none' or reduced motion is preferred
  if (animation === 'none' || prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  // Define animation variants with enhanced bounce effects
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    slide: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    bounce: {
      initial: { opacity: 0, x: 20, scale: 0.98 },
      animate: { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      },
      exit: { 
        opacity: 0, 
        x: -20, 
        scale: 0.98,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      }
    }
  };

  const selectedVariant = variants[animation];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location} // Change key when location changes to trigger animation
        className={cn(className)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={selectedVariant}
        transition={selectedVariant.transition || { duration }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
