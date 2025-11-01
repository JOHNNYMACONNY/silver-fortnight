import { useState, useEffect, useCallback } from "react";

/**
 * Valid tab types for ProfilePage
 */
export type TabType =
  | "about"
  | "portfolio"
  | "gamification"
  | "collaborations"
  | "trades";

/**
 * Return type for useTabNavigation hook
 */
export interface TabNavigationHookReturn {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  handleTabChange: (tab: TabType) => void;
}

/**
 * Custom hook for managing tab navigation state
 * Handles:
 * - Active tab state management
 * - Deep linking via URL hash (#about, #portfolio, etc.)
 * - localStorage persistence of last viewed tab
 * - Smooth scrolling to tab panels
 *
 * @returns TabNavigationHookReturn object with activeTab, setActiveTab, and handleTabChange
 *
 * @example
 * const { activeTab, setActiveTab, handleTabChange } = useTabNavigation();
 * // Use activeTab to render the correct tab content
 * // Call handleTabChange when user clicks a tab
 */
export const useTabNavigation = (): TabNavigationHookReturn => {
  const [activeTab, setActiveTabState] = useState<TabType>("about");

  // Valid tab types
  const VALID_TABS: TabType[] = [
    "about",
    "portfolio",
    "gamification",
    "collaborations",
    "trades",
  ];

  // Storage key for persisting last viewed tab
  const STORAGE_KEY = "tradeya_profile_last_tab";

  /**
   * Set active tab and persist to localStorage
   */
  const setActiveTab = useCallback((tab: TabType) => {
    if (VALID_TABS.includes(tab)) {
      setActiveTabState(tab);
      try {
        localStorage.setItem(STORAGE_KEY, tab);
      } catch {
        // Silently fail if localStorage is unavailable
      }
    }
  }, []);

  /**
   * Handle tab change with smooth scroll to panel
   */
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      // Update URL hash for deep linking
      window.location.hash = tab;
      // Scroll to the panel for a11y
      const panel = document.getElementById(`panel-${tab}`);
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setActiveTab]
  );

  // Initialize tab from URL hash or localStorage on mount
  useEffect(() => {
    const hash = (window.location.hash || "").replace("#", "");

    // Priority 1: URL hash
    if (VALID_TABS.includes(hash as TabType)) {
      setActiveTabState(hash as TabType);
      // Scroll to the panel for a11y
      const panel = document.getElementById(`panel-${hash}`);
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Priority 2: localStorage
      try {
        const last = localStorage.getItem(STORAGE_KEY) as TabType | null;
        if (last && VALID_TABS.includes(last)) {
          setActiveTabState(last);
        }
      } catch {
        // Silently fail if localStorage is unavailable
      }
    }

    // Listen for hash changes (deep linking)
    const onHashChange = () => {
      const h = (window.location.hash || "").replace("#", "");
      if (VALID_TABS.includes(h as TabType)) {
        setActiveTabState(h as TabType);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
  };
};
