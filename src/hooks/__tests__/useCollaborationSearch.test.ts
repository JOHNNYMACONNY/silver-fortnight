import { renderHook, act } from '@testing-library/react';
import { useCollaborationSearch } from '../useCollaborationSearch';
import { getAllCollaborations } from '../../services/firestore-exports';

// Mock the firestore service
jest.mock('../../services/firestore-exports', () => ({
  getAllCollaborations: jest.fn()
}));

describe('useCollaborationSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should update search term', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    act(() => {
      result.current.setSearchTerm('React Development');
    });

    expect(result.current.searchTerm).toBe('React Development');
  });

  it('should update filters', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    act(() => {
      result.current.setFilters({ status: 'open', category: 'tech' });
    });

    expect(result.current.filters).toEqual({ status: 'open', category: 'tech' });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    act(() => {
      result.current.setSearchTerm('React Development');
      result.current.setFilters({ status: 'open' });
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    // No active filters initially
    expect(result.current.hasActiveFilters).toBe(false);

    // Add active filter
    act(() => {
      result.current.setFilters({ status: 'open' });
    });
    expect(result.current.hasActiveFilters).toBe(true);

    // Clear filters
    act(() => {
      result.current.setFilters({});
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should handle search state correctly', () => {
    const { result } = renderHook(() => useCollaborationSearch());

    // Test that search term and filters are properly set
    act(() => {
      result.current.setSearchTerm('React Development');
      result.current.setFilters({ status: 'open', category: 'tech' });
    });

    expect(result.current.searchTerm).toBe('React Development');
    expect(result.current.filters).toEqual({ status: 'open', category: 'tech' });
    expect(result.current.hasActiveFilters).toBe(true);
  });
}); 