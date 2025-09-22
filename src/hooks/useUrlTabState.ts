import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface UseUrlTabStateOptions {
  defaultTab: string;
  validTabs: string[];
  hashPrefix?: string;
  persistToLocalStorage?: boolean;
  localStorageKey?: string;
}

export interface UseUrlTabStateReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isTabValid: (tab: string) => boolean;
}

/**
 * Hook for managing tab state with URL synchronization
 * Supports hash-based routing and localStorage persistence
 */
export const useUrlTabState = ({
  defaultTab,
  validTabs,
  hashPrefix = '',
  persistToLocalStorage = true,
  localStorageKey = 'active_tab'
}: UseUrlTabStateOptions): UseUrlTabStateReturn => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get initial tab from URL hash or localStorage
  const getInitialTab = useCallback((): string => {
    // First, try to get from URL hash
    const hash = location.hash.replace('#', '');
    const urlTab = hashPrefix ? hash.replace(hashPrefix, '') : hash;
    
    if (urlTab && validTabs.includes(urlTab)) {
      return urlTab;
    }
    
    // Fallback to localStorage if enabled
    if (persistToLocalStorage) {
      try {
        const savedTab = localStorage.getItem(localStorageKey);
        if (savedTab && validTabs.includes(savedTab)) {
          return savedTab;
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }
    
    return defaultTab;
  }, [location.hash, validTabs, defaultTab, hashPrefix, persistToLocalStorage, localStorageKey]);

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  // Update URL when tab changes
  const setActiveTab = useCallback((tab: string) => {
    if (!validTabs.includes(tab)) {
      console.warn(`Invalid tab: ${tab}. Valid tabs: ${validTabs.join(', ')}`);
      return;
    }

    setActiveTabState(tab);
    
    // Update URL hash
    const newHash = hashPrefix ? `#${hashPrefix}${tab}` : `#${tab}`;
    navigate(newHash, { replace: true });
    
    // Persist to localStorage if enabled
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(localStorageKey, tab);
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [validTabs, navigate, hashPrefix, persistToLocalStorage, localStorageKey]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      const urlTab = hashPrefix ? hash.replace(hashPrefix, '') : hash;
      
      if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
        setActiveTabState(urlTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [location.hash, validTabs, activeTab, hashPrefix]);

  // Check if a tab is valid
  const isTabValid = useCallback((tab: string): boolean => {
    return validTabs.includes(tab);
  }, [validTabs]);

  return {
    activeTab,
    setActiveTab,
    isTabValid
  };
};
