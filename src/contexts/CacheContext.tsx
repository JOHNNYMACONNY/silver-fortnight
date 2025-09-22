// src/contexts/CacheContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cacheManager } from '../services/cache/cacheManager';
import { cacheWarmingService } from '../services/cache/cacheWarmingService';
import { multiLevelCache } from '../utils/performance/advancedCaching';

export interface CacheContextValue {
  // Cache statistics
  stats: {
    multiLevel: any;
    simple: any;
    analytics: any;
  };
  
  // Cache management
  invalidatePattern: (pattern: string) => Promise<void>;
  invalidateByTags: (tags: string[]) => Promise<void>;
  optimizeCache: () => Promise<void>;
  
  // Cache warming
  warmUserData: (userId: string) => Promise<void>;
  warmGlobalData: () => Promise<void>;
  warmBasedOnNavigation: (path: string, userId?: string) => Promise<void>;
  
  // Cache configuration
  isWarmingEnabled: boolean;
  setWarmingEnabled: (enabled: boolean) => void;
  
  // Loading states
  isOptimizing: boolean;
  isWarming: boolean;
}

const CacheContext = createContext<CacheContextValue | undefined>(undefined);

export interface CacheProviderProps {
  children: ReactNode;
  enableWarming?: boolean;
  enableAnalytics?: boolean;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({
  children,
  enableWarming = true,
  enableAnalytics = true
}) => {
  const [stats, setStats] = useState(cacheManager.getStats());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isWarming, setIsWarming] = useState(false);
  const [isWarmingEnabled, setIsWarmingEnabled] = useState(enableWarming);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Cache management functions
  const invalidatePattern = async (pattern: string) => {
    await cacheManager.invalidatePattern(pattern);
    setStats(cacheManager.getStats());
  };

  const invalidateByTags = async (tags: string[]) => {
    await cacheManager.invalidateByTags(tags);
    setStats(cacheManager.getStats());
  };

  const optimizeCache = async () => {
    setIsOptimizing(true);
    try {
      await cacheManager.optimizeCache();
      setStats(cacheManager.getStats());
    } finally {
      setIsOptimizing(false);
    }
  };

  // Cache warming functions
  const warmUserData = async (userId: string) => {
    if (!isWarmingEnabled) return;
    
    setIsWarming(true);
    try {
      await cacheWarmingService.warmUserData(userId);
    } finally {
      setIsWarming(false);
    }
  };

  const warmGlobalData = async () => {
    if (!isWarmingEnabled) return;
    
    setIsWarming(true);
    try {
      await cacheWarmingService.warmGlobalData();
    } finally {
      setIsWarming(false);
    }
  };

  const warmBasedOnNavigation = async (path: string, userId?: string) => {
    if (!isWarmingEnabled) return;
    
    setIsWarming(true);
    try {
      await cacheWarmingService.warmBasedOnNavigation(path, userId);
    } finally {
      setIsWarming(false);
    }
  };

  const setWarmingEnabled = (enabled: boolean) => {
    setIsWarmingEnabled(enabled);
    if (!enabled) {
      cacheWarmingService.stopWarming();
    }
  };

  const value: CacheContextValue = {
    stats,
    invalidatePattern,
    invalidateByTags,
    optimizeCache,
    warmUserData,
    warmGlobalData,
    warmBasedOnNavigation,
    isWarmingEnabled,
    setWarmingEnabled,
    isOptimizing,
    isWarming
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextValue => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

// Hook for cache warming based on navigation
export const useCacheWarming = (currentPath: string, userId?: string) => {
  const { warmBasedOnNavigation, isWarming } = useCache();

  useEffect(() => {
    if (currentPath && isWarming) {
      warmBasedOnNavigation(currentPath, userId);
    }
  }, [currentPath, userId, warmBasedOnNavigation, isWarming]);
};
