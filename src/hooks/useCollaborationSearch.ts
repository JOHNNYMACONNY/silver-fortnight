import { useState, useMemo, useCallback, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { getAllCollaborations, CollaborationFilters, Collaboration } from '../services/firestore-exports';
import { useFilterPersistence } from '../services/filterPersistence';

interface UseCollaborationSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: CollaborationFilters;
  setFilters: (filters: CollaborationFilters) => void;
  results: Collaboration[];
  loading: boolean;
  error: string | null;
  search: (term: string, filterOptions?: CollaborationFilters) => Promise<void>;
  clearSearch: () => void;
  hasActiveFilters: boolean;
  // New features
  saveCurrentFilters: (name: string) => Promise<void>;
  loadSavedFilters: () => Promise<any[]>;
  popularFilters: Partial<CollaborationFilters>[];
  queryMetadata: any;
  totalCount: number;
  trackSatisfaction: (rating: number) => Promise<void>;
}

interface SearchOptions {
  enablePersistence?: boolean;
  enableAnalytics?: boolean;
  userId?: string;
  pagination?: {
    limit?: number;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
  };
}

export const useCollaborationSearch = (options: SearchOptions = {}): UseCollaborationSearchReturn => {
  const {
    enablePersistence = true,
    enableAnalytics = true,
    userId,
    pagination = { limit: 50, orderByField: 'createdAt', orderDirection: 'desc' }
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CollaborationFilters>({});
  const [results, setResults] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryMetadata, setQueryMetadata] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [popularFilters, setPopularFilters] = useState<Partial<CollaborationFilters>[]>([]);

  // Filter persistence service
  const filterPersistence = useFilterPersistence(userId);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (enablePersistence) {
      const urlFilters = filterPersistence.getFromUrl();
      if (Object.keys(urlFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...urlFilters }));
      }
    }
  }, [enablePersistence, filterPersistence]);

  // Load popular filters on mount
  useEffect(() => {
    if (enableAnalytics && userId) {
      filterPersistence.getPopularFilters().then(setPopularFilters);
    }
  }, [enableAnalytics, userId, filterPersistence]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && 'start' in value && 'end' in value) {
        return value.start !== null || value.end !== null;
      }
      return true;
    });
  }, [filters]);

  // Enhanced debounced search with backend optimization
  const debouncedSearch = useMemo(
    () => debounce(async (term: string, filterOptions: CollaborationFilters = {}) => {
      setLoading(true);
      setError(null);
      
      try {
        const searchFilters: CollaborationFilters = {
          ...filterOptions,
          ...(term && { searchQuery: term })
        };

        // Sync filters to URL if persistence is enabled
        if (enablePersistence) {
          filterPersistence.syncToUrl(searchFilters);
        }

        const result = await getAllCollaborations(
          { 
            limit: pagination.limit || 50, 
            orderByField: pagination.orderByField || 'createdAt', 
            orderDirection: pagination.orderDirection || 'desc' 
          },
          searchFilters
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        const data = result.data;
        setResults(data?.items || []);
        setTotalCount(data?.totalCount || 0);
        setQueryMetadata(data?.queryMetadata || null);

        // Track analytics if enabled
        if (enableAnalytics && userId) {
          await filterPersistence.trackUsage(
            searchFilters, 
            data?.items?.length || 0
          );
        }
      } catch (err: any) {
        setError(err.message || 'Failed to search collaborations');
        setResults([]);
        setTotalCount(0);
        setQueryMetadata(null);
      } finally {
        setLoading(false);
      }
    }, 300),
    [enablePersistence, enableAnalytics, userId, pagination]
  );

  // Enhanced search function
  const search = useCallback(async (term: string, filterOptions: CollaborationFilters = {}) => {
    setSearchTerm(term);
    await debouncedSearch(term, filterOptions);
  }, [debouncedSearch]);

  // Clear search with persistence cleanup
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setResults([]);
    setError(null);
    setQueryMetadata(null);
    setTotalCount(0);

    // Clear URL filters
    if (enablePersistence) {
      filterPersistence.syncToUrl({});
    }
  }, [enablePersistence]);

  // Save current filter combination
  const saveCurrentFilters = useCallback(async (name: string) => {
    if (!enablePersistence || !userId) return;

    const currentFilters = {
      ...filters,
      ...(searchTerm && { searchQuery: searchTerm })
    };

    await filterPersistence.savePreferences(name, currentFilters);
  }, [enablePersistence, userId, filters, searchTerm]);

  // Load saved filters
  const loadSavedFilters = useCallback(async () => {
    if (!enablePersistence || !userId) return [];

    const preferences = await filterPersistence.getPreferences();
    return preferences?.savedFilters || [];
  }, [enablePersistence, userId]);

  // Track user satisfaction
  const trackSatisfaction = useCallback(async (rating: number) => {
    if (!enableAnalytics || !userId) return;

    const currentFilters = {
      ...filters,
      ...(searchTerm && { searchQuery: searchTerm })
    };

    await filterPersistence.trackUsage(
      currentFilters, 
      results.length, 
      rating
    );
  }, [enableAnalytics, userId, filters, searchTerm, results.length]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    results,
    loading,
    error,
    search,
    clearSearch,
    hasActiveFilters,
    // New features
    saveCurrentFilters,
    loadSavedFilters,
    popularFilters,
    queryMetadata,
    totalCount,
    trackSatisfaction
  };
}; 