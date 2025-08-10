 /**
 * Filter Persistence and Analytics Service
 * Handles URL state management, user preferences, and filter analytics
 */

import { useCallback, useMemo } from 'react';
import { CollaborationFilters } from './firestore-exports';

// Filter persistence interfaces
export interface FilterAnalytics {
  filterType: keyof CollaborationFilters;
  usageCount: number;
  lastUsed: Date;
  averageResults: number;
  userSatisfaction?: number; // 1-5 scale
}

export interface UserFilterPreferences {
  userId: string;
  savedFilters: {
    name: string;
    filters: CollaborationFilters;
    createdAt: Date;
    lastUsed: Date;
    usageCount: number;
  }[];
  defaultFilters?: CollaborationFilters;
  analytics: FilterAnalytics[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterPersistenceConfig {
  enableUrlSync: boolean;
  enableUserPreferences: boolean;
  enableAnalytics: boolean;
  maxSavedFilters: number;
  analyticsRetentionDays: number;
}

// Default configuration
const DEFAULT_CONFIG: FilterPersistenceConfig = {
  enableUrlSync: true,
  enableUserPreferences: true,
  enableAnalytics: true,
  maxSavedFilters: 10,
  analyticsRetentionDays: 90
};

export class FilterPersistenceService {
  private config: FilterPersistenceConfig;
  private storageKey = 'tradeya_filter_preferences';
  private analyticsKey = 'tradeya_filter_analytics';

  constructor(config: Partial<FilterPersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // URL State Management
  syncFiltersToUrl(filters: CollaborationFilters): void {
    if (!this.config.enableUrlSync) return;

    try {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;

      // Clear existing filter params
      const filterKeys = Object.keys(filters) as (keyof CollaborationFilters)[];
      filterKeys.forEach(key => searchParams.delete(key.toString()));

      // Add active filters to URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              searchParams.set(key, value.join(','));
            }
          } else if (typeof value === 'object' && value !== null) {
            // Handle date range objects
            if ('start' in value && 'end' in value) {
              searchParams.set(`${key}_start`, (value as any).start.toISOString());
              searchParams.set(`${key}_end`, (value as any).end.toISOString());
            }
          } else {
            searchParams.set(key, String(value));
          }
        }
      });

      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.warn('Failed to sync filters to URL:', error);
    }
  }

  getFiltersFromUrl(): Partial<CollaborationFilters> {
    if (!this.config.enableUrlSync) return {};

    try {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const filters: Partial<CollaborationFilters> = {};

      // Extract filter parameters
      Object.keys(searchParams).forEach(key => {
        const value = searchParams.get(key);
        if (value) {
          if (key === 'skillsRequired') {
            filters.skillsRequired = value.split(',').filter(Boolean);
          } else if (key === 'maxParticipants') {
            filters.maxParticipants = parseInt(value, 10);
          } else if (key === 'dateRange_start' && searchParams.get('dateRange_end')) {
            filters.dateRange = {
              start: new Date(value),
              end: new Date(searchParams.get('dateRange_end')!)
            };
          } else if (!key.includes('_start') && !key.includes('_end')) {
            // Handle other filter types
            (filters as any)[key] = value;
          }
        }
      });

      return filters;
    } catch (error) {
      console.warn('Failed to get filters from URL:', error);
      return {};
    }
  }

  // User Preferences Management
  async saveUserFilterPreferences(
    userId: string, 
    name: string, 
    filters: CollaborationFilters
  ): Promise<void> {
    if (!this.config.enableUserPreferences) return;

    try {
      const preferences = await this.getUserFilterPreferences(userId);
      
      // Check if filter with same name exists
      const existingIndex = preferences.savedFilters.findIndex(f => f.name === name);
      
      if (existingIndex >= 0) {
        // Update existing filter
        preferences.savedFilters[existingIndex] = {
          ...preferences.savedFilters[existingIndex],
          filters,
          lastUsed: new Date(),
          usageCount: preferences.savedFilters[existingIndex].usageCount + 1
        };
      } else {
        // Add new filter
        preferences.savedFilters.unshift({
          name,
          filters,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 1
        });

        // Limit saved filters
        if (preferences.savedFilters.length > this.config.maxSavedFilters) {
          preferences.savedFilters = preferences.savedFilters.slice(0, this.config.maxSavedFilters);
        }
      }

      preferences.updatedAt = new Date();
      await this.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Failed to save user filter preferences:', error);
    }
  }

  async getUserFilterPreferences(userId: string): Promise<UserFilterPreferences> {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_${userId}`);
      if (stored) {
        const preferences = JSON.parse(stored);
        return {
          ...preferences,
          savedFilters: preferences.savedFilters.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            lastUsed: new Date(f.lastUsed)
          })),
          createdAt: new Date(preferences.createdAt),
          updatedAt: new Date(preferences.updatedAt)
        };
      }
    } catch (error) {
      console.warn('Failed to load user filter preferences:', error);
    }

    // Return default preferences
    return {
      userId,
      savedFilters: [],
      analytics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async setDefaultFilters(userId: string, filters: CollaborationFilters): Promise<void> {
    if (!this.config.enableUserPreferences) return;

    try {
      const preferences = await this.getUserFilterPreferences(userId);
      preferences.defaultFilters = filters;
      preferences.updatedAt = new Date();
      await this.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Failed to set default filters:', error);
    }
  }

  private async saveUserPreferences(userId: string, preferences: UserFilterPreferences): Promise<void> {
    try {
      localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Analytics Tracking
  async trackFilterUsage(
    userId: string,
    filters: CollaborationFilters,
    resultsCount: number,
    userSatisfaction?: number
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      const preferences = await this.getUserFilterPreferences(userId);
      const now = new Date();

      // Track usage for each active filter
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          const filterType = key as keyof CollaborationFilters;
          const existingAnalytics = preferences.analytics.find(a => a.filterType === filterType);

          if (existingAnalytics) {
            existingAnalytics.usageCount += 1;
            existingAnalytics.lastUsed = now;
            existingAnalytics.averageResults = 
              (existingAnalytics.averageResults + resultsCount) / 2;
            if (userSatisfaction) {
              existingAnalytics.userSatisfaction = 
                existingAnalytics.userSatisfaction 
                  ? (existingAnalytics.userSatisfaction + userSatisfaction) / 2
                  : userSatisfaction;
            }
          } else {
            preferences.analytics.push({
              filterType,
              usageCount: 1,
              lastUsed: now,
              averageResults: resultsCount,
              userSatisfaction
            });
          }
        }
      });

      // Clean up old analytics
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.analyticsRetentionDays);
      preferences.analytics = preferences.analytics.filter(
        a => a.lastUsed > cutoffDate
      );

      preferences.updatedAt = now;
      await this.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Failed to track filter usage:', error);
    }
  }

  async getFilterAnalytics(userId: string): Promise<FilterAnalytics[]> {
    try {
      const preferences = await this.getUserFilterPreferences(userId);
      return preferences.analytics.sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
      console.error('Failed to get filter analytics:', error);
      return [];
    }
  }

  // Popular Filters Generation
  async getPopularFilters(userId: string): Promise<Partial<CollaborationFilters>[]> {
    try {
      const analytics = await this.getFilterAnalytics(userId);
      const popularFilters: Partial<CollaborationFilters>[] = [];

      // Generate popular filter combinations based on analytics
      const mostUsedFilters = analytics
        .filter(a => a.usageCount > 1)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      mostUsedFilters.forEach(analytics => {
        // Create filter object based on analytics
        const filter: Partial<CollaborationFilters> = {};
        (filter as any)[analytics.filterType] = 'popular'; // Placeholder value
        popularFilters.push(filter);
      });

      return popularFilters;
    } catch (error) {
      console.error('Failed to get popular filters:', error);
      return [];
    }
  }

  // Utility Methods
  clearUserPreferences(userId: string): void {
    try {
      localStorage.removeItem(`${this.storageKey}_${userId}`);
    } catch (error) {
      console.error('Failed to clear user preferences:', error);
    }
  }

  exportUserPreferences(userId: string): string {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_${userId}`);
      return stored || '{}';
    } catch (error) {
      console.error('Failed to export user preferences:', error);
      return '{}';
    }
  }

  importUserPreferences(userId: string, data: string): boolean {
    try {
      const preferences = JSON.parse(data);
      localStorage.setItem(`${this.storageKey}_${userId}`, data);
      return true;
    } catch (error) {
      console.error('Failed to import user preferences:', error);
      return false;
    }
  }
}

// Export singleton instance
export const filterPersistenceService = new FilterPersistenceService();

// React Hook for filter persistence
export const useFilterPersistence = (userId?: string) => {
  const service = filterPersistenceService;

  const syncToUrl = useCallback((filters: CollaborationFilters) => {
    service.syncFiltersToUrl(filters);
  }, []);

  const getFromUrl = useCallback(() => {
    return service.getFiltersFromUrl();
  }, []);

  const savePreferences = useCallback(async (name: string, filters: CollaborationFilters) => {
    if (userId) {
      await service.saveUserFilterPreferences(userId, name, filters);
    }
  }, [userId]);

  const getPreferences = useCallback(async () => {
    if (userId) {
      return await service.getUserFilterPreferences(userId);
    }
    return null;
  }, [userId]);

  const trackUsage = useCallback(async (filters: CollaborationFilters, resultsCount: number, satisfaction?: number) => {
    if (userId) {
      await service.trackFilterUsage(userId, filters, resultsCount, satisfaction);
    }
  }, [userId]);

  const getPopularFilters = useCallback(async () => {
    if (userId) {
      return await service.getPopularFilters(userId);
    }
    return [];
  }, [userId]);

  return useMemo(() => ({
    syncToUrl,
    getFromUrl,
    savePreferences,
    getPreferences,
    trackUsage,
    getPopularFilters
  }), [syncToUrl, getFromUrl, savePreferences, getPreferences, trackUsage, getPopularFilters]);
}; 