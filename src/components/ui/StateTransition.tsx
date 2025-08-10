import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface StateTransitionProps {
  children: React.ReactNode;
  state: UIState;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  successComponent?: React.ReactNode;
  duration?: number;
}

/**
 * StateTransition - A component for smooth transitions between UI states
 * 
 * This component provides smooth transitions between different UI states like
 * loading, success, error, and empty states. It helps create a more polished
 * user experience when data is being fetched or processed.
 * 
 * @example
 * // Basic usage
 * <StateTransition 
 *   state={isLoading ? 'loading' : data.length === 0 ? 'empty' : 'success'}
 *   loadingComponent={<Spinner />}
 *   emptyComponent={<EmptyState />}
 * >
 *   <DataTable data={data} />
 * </StateTransition>
 */
const StateTransition: React.FC<StateTransitionProps> = ({
  children,
  state,
  className = '',
  loadingComponent = <DefaultLoading />,
  errorComponent = <DefaultError />,
  emptyComponent = <DefaultEmpty />,
  successComponent = null,
  duration = 0.3,
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

  // Define animation variants
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Render the appropriate component based on the state
  const renderContent = () => {
    switch (state) {
      case 'loading':
        return loadingComponent;
      case 'error':
        return errorComponent;
      case 'empty':
        return emptyComponent;
      case 'success':
        return successComponent || children;
      default:
        return children;
    }
  };

  // If reduced motion is preferred, render without animations
  if (prefersReducedMotion) {
    return <div className={cn(className)}>{renderContent()}</div>;
  }

  return (
    <div className={cn(className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ duration }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Default loading component
const DefaultLoading: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
  </div>
);

// Default error component
const DefaultError: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-error-500 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-error-700 dark:text-error-300">Error Occurred</h3>
    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
      Something went wrong. Please try again later.
    </p>
  </div>
);

// Default empty component
const DefaultEmpty: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-neutral-400 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300">No Data Found</h3>
    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
      There's nothing to display at the moment.
    </p>
  </div>
);

export default StateTransition;
