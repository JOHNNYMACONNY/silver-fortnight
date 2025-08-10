import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  Database,
  Server,
  Image as ImageIcon,
  FileText,
  Users,
  MessageSquare
} from 'lucide-react';

// Generic Loading Fallback
export const LoadingFallback: React.FC<{ 
  message?: string; 
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}> = ({ 
  message = 'Loading...', 
  size = 'md',
  showProgress = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} text-blue-600`}
      >
        <RefreshCw className="w-full h-full" />
      </motion.div>
      <p className="text-gray-600 dark:text-gray-400 text-center">{message}</p>
      {showProgress && (
        <div className="w-48 bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      )}
    </div>
  );
};

// Network Error Fallback
export const NetworkErrorFallback: React.FC<{
  onRetry?: () => void;
  isOffline?: boolean;
}> = ({ onRetry, isOffline = false }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
      {isOffline ? (
        <WifiOff className="w-8 h-8 text-red-600" />
      ) : (
        <Server className="w-8 h-8 text-red-600" />
      )}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {isOffline ? 'No Internet Connection' : 'Connection Error'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {isOffline 
          ? 'Please check your internet connection and try again.'
          : 'Unable to connect to our servers. Please try again.'}
      </p>
    </div>
    {onRetry && (
      <motion.button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </motion.button>
    )}
  </div>
);

// Data Loading Error Fallback
export const DataErrorFallback: React.FC<{
  message?: string;
  onRetry?: () => void;
  showCachedData?: boolean;
}> = ({ 
  message = 'Failed to load data', 
  onRetry,
  showCachedData = false 
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
      <Database className="w-8 h-8 text-yellow-600" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Data Unavailable
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      {showCachedData && (
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Showing cached data from your last visit
        </p>
      )}
    </div>
    {onRetry && (
      <motion.button
        onClick={onRetry}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Data
      </motion.button>
    )}
  </div>
);

// Image Loading Fallback
export const ImageFallback: React.FC<{
  alt?: string;
  className?: string;
  showIcon?: boolean;
}> = ({ alt = 'Image', className = '', showIcon = true }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
    {showIcon && (
      <div className="text-gray-400 dark:text-gray-500">
        <ImageIcon className="w-8 h-8" />
      </div>
    )}
    <span className="sr-only">{alt}</span>
  </div>
);

// Feature Unavailable Fallback
export const FeatureUnavailableFallback: React.FC<{
  featureName: string;
  reason?: string;
  estimatedReturn?: string;
  alternativeAction?: {
    label: string;
    action: () => void;
  };
}> = ({ 
  featureName, 
  reason = 'temporarily unavailable',
  estimatedReturn,
  alternativeAction 
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
      <AlertTriangle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {featureName} is {reason}
      </h3>
      {estimatedReturn && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Expected to return: {estimatedReturn}
        </p>
      )}
    </div>
    {alternativeAction && (
      <motion.button
        onClick={alternativeAction.action}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {alternativeAction.label}
      </motion.button>
    )}
  </div>
);

// Skeleton Loading Components
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <motion.div
        key={i}
        className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        style={{ width: `${Math.random() * 40 + 60}%` }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{
  showImage?: boolean;
  showActions?: boolean;
  className?: string;
}> = ({ showImage = true, showActions = true, className = '' }) => (
  <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
    {showImage && (
      <motion.div
        className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />
    )}
    <SkeletonText lines={2} className="mb-4" />
    {showActions && (
      <div className="flex space-x-2">
        <motion.div
          className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    )}
  </div>
);

// Content-Specific Fallbacks
export const TradeListFallback: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <Users className="w-5 h-5 text-gray-400" />
      <SkeletonText lines={1} className="flex-1" />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <SkeletonCard key={i} showImage={true} showActions={true} />
    ))}
  </div>
);

export const ChatFallback: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <MessageSquare className="w-5 h-5 text-gray-400" />
      <SkeletonText lines={1} className="flex-1" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <motion.div
          className={`max-w-xs p-3 rounded-lg ${
            i % 2 === 0 
              ? 'bg-gray-200 dark:bg-gray-700' 
              : 'bg-blue-200 dark:bg-blue-800'
          } animate-pulse`}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        >
          <SkeletonText lines={Math.floor(Math.random() * 3) + 1} />
        </motion.div>
      </div>
    ))}
  </div>
);

export const ProfileFallback: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center space-x-4">
      <motion.div
        className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
    <SkeletonText lines={4} />
    <div className="grid grid-cols-2 gap-4">
      <SkeletonCard showImage={false} showActions={false} />
      <SkeletonCard showImage={false} showActions={false} />
    </div>
  </div>
);

// Higher-Order Component for Fallback Wrapping
export const withFallback = <P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<any> = LoadingFallback
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} ref={ref} />
    </Suspense>
  ));
};

// Fallback Provider Context
interface FallbackContextType {
  showFallback: (type: string, props?: any) => void;
  hideFallback: (type: string) => void;
  activeFallbacks: Map<string, any>;
}

const FallbackContext = React.createContext<FallbackContextType | null>(null);

export const FallbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFallbacks, setActiveFallbacks] = React.useState(new Map());

  const showFallback = React.useCallback((type: string, props?: any) => {
    setActiveFallbacks(prev => new Map(prev.set(type, props)));
  }, []);

  const hideFallback = React.useCallback((type: string) => {
    setActiveFallbacks(prev => {
      const newMap = new Map(prev);
      newMap.delete(type);
      return newMap;
    });
  }, []);

  return (
    <FallbackContext.Provider value={{ showFallback, hideFallback, activeFallbacks }}>
      {children}
    </FallbackContext.Provider>
  );
};

export const useFallback = () => {
  const context = React.useContext(FallbackContext);
  if (!context) {
    throw new Error('useFallback must be used within a FallbackProvider');
  }
  return context;
};
