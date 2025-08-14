import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import {
  searchTrades,
  type Trade,
  type TradeFilters,
  type PaginationOptions,
  type ServiceResult,
  type PaginatedResult,
} from '../services/firestore-exports';

export interface UseTradeSearchOptions {
  enablePersistence?: boolean;
  pagination?: PaginationOptions;
}

export interface UseTradeSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Partial<TradeFilters>;
  setFilters: (filters: Partial<TradeFilters>) => void;
  results: Trade[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasActiveFilters: boolean;
  search: (term: string, filterOptions?: Partial<TradeFilters>) => Promise<void>;
  clearSearch: () => void;
}

export function useTradeSearch(options: UseTradeSearchOptions = {}): UseTradeSearchReturn {
  const { enablePersistence = true, pagination } = options;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Partial<TradeFilters>>({});
  const [results, setResults] = useState<Trade[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value && 'start' in value && 'end' in value) {
        const range = value as { start?: Date | null; end?: Date | null };
        return !!range.start || !!range.end;
      }
      return true;
    });
  }, [filters]);

  // Load from URL on mount
  useEffect(() => {
    if (!enablePersistence) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      if (q) setSearchTerm(q);
      const loaded: Partial<TradeFilters> = {};
      const status = params.get('status');
      const category = params.get('category');
      const time = params.get('time');
      const skillLevel = params.get('skillLevel');
      const skills = params.getAll('skills');
      if (status) loaded.status = status as any;
      if (category) (loaded as any).category = category;
      if (time) (loaded as any).timeCommitment = time;
      if (skillLevel) (loaded as any).skillLevel = skillLevel;
      if (skills.length) (loaded as any).skills = skills;
      if (Object.keys(loaded).length) setFilters(loaded);
    } catch {
      // no-op
    }
  }, [enablePersistence]);

  // Sync to URL on change
  useEffect(() => {
    if (!enablePersistence) return;
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if ((filters as any).status) params.set('status', String((filters as any).status));
      if ((filters as any).category) params.set('category', String((filters as any).category));
      if ((filters as any).timeCommitment) params.set('time', String((filters as any).timeCommitment));
      if ((filters as any).skillLevel) params.set('skillLevel', String((filters as any).skillLevel));
      if (Array.isArray((filters as any).skills)) (filters as any).skills.forEach((s: string) => params.append('skills', s));
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // no-op
    }
  }, [enablePersistence, searchTerm, filters]);

  const executeSearch = useCallback(
    async (term: string, filterOptions: Partial<TradeFilters> = {}) => {
      const id = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const result: ServiceResult<PaginatedResult<Trade>> = await searchTrades(
          term,
          {
            limit: pagination?.limit ?? 20,
            orderByField: pagination?.orderByField ?? 'title',
            orderDirection: pagination?.orderDirection ?? 'asc',
          },
          filterOptions as TradeFilters
        );
        if (id !== requestIdRef.current) return;
        if (result.error) throw new Error(result.error.message);
        const data = result.data;
        setResults(data?.items ?? []);
        setTotalCount(data?.totalCount ?? 0);
      } catch (err) {
        if (id !== requestIdRef.current) return;
        const message = err instanceof Error ? err.message : 'Failed to search trades';
        setError(message);
        setResults([]);
        setTotalCount(0);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    },
    [pagination]
  );

  const debouncedSearch = useMemo(() => debounce(executeSearch, 300), [executeSearch]);

  const search = useCallback(
    async (term: string, filterOptions: Partial<TradeFilters> = {}) => {
      setSearchTerm(term);
      await debouncedSearch(term, filterOptions);
    },
    [debouncedSearch]
  );

  // Cancel debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setResults([]);
    setTotalCount(0);
    setError(null);
    if (enablePersistence) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [enablePersistence]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    results,
    loading,
    error,
    totalCount,
    hasActiveFilters,
    search,
    clearSearch,
  };
}


