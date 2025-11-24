/**
 * useSearchHistory Hook Tests
 * 
 * Tests for the useSearchHistory hook that manages search history
 * using localStorage with per-user isolation.
 */

import { renderHook, act } from '@testing-library/react';
import { useSearchHistory } from '../useSearchHistory';
import { useAuth } from '../../../AuthContext';

// Mock useAuth
jest.mock('../../../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useLocalStorage
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

import { useLocalStorage } from '../useLocalStorage';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>;

// Mock variables
const mockSetHistory = jest.fn();
let mockHistory: string[] = [];

describe('useSearchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHistory = [];
    mockSetHistory.mockClear();
    mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'test@example.com' },
        userProfile: null,
        loading: false,
      } as any);
    });

    it('should use user-specific storage key', () => {
      renderHook(() => useSearchHistory());
      
      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'tradeya_search_history_user123',
        []
      );
    });

    it('should add term to history', () => {
      const { result } = renderHook(() => useSearchHistory());
      
      act(() => {
        result.current.addToHistory('React Development');
      });

      expect(mockSetHistory).toHaveBeenCalledWith(expect.any(Function));
      
      const updateFn = mockSetHistory.mock.calls[0][0];
      const newHistory = updateFn([]);
      
      expect(newHistory).toEqual(['React Development']);
    });

    it('should remove duplicates (case-insensitive)', () => {
      mockHistory = ['React Development', 'UI/UX Design'];
      mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
      
      const { result } = renderHook(() => useSearchHistory());
      
      act(() => {
        result.current.addToHistory('react development');
      });

      const updateFn = mockSetHistory.mock.calls[0][0];
      const newHistory = updateFn(mockHistory);
      
      expect(newHistory).toEqual(['react development', 'UI/UX Design']);
      expect(newHistory).toHaveLength(2);
    });

    it('should limit history to maxItems', () => {
      mockHistory = Array.from({ length: 10 }, (_, i) => `Search ${i}`);
      mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
      
      const { result } = renderHook(() => useSearchHistory(10));
      
      act(() => {
        result.current.addToHistory('New Search');
      });

      const updateFn = mockSetHistory.mock.calls[0][0];
      const newHistory = updateFn(mockHistory);
      
      expect(newHistory).toHaveLength(10);
      expect(newHistory[0]).toBe('New Search');
    });

    it('should not add empty strings', () => {
      const { result } = renderHook(() => useSearchHistory());
      
      act(() => {
        result.current.addToHistory('');
      });

      act(() => {
        result.current.addToHistory('   ');
      });

      expect(mockSetHistory).not.toHaveBeenCalled();
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useSearchHistory());
      
      act(() => {
        result.current.clearHistory();
      });

      expect(mockSetHistory).toHaveBeenCalledWith([]);
    });

    it('should return current history', () => {
      mockHistory = ['Search 1', 'Search 2'];
      mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
      
      const { result } = renderHook(() => useSearchHistory());
      
      expect(result.current.history).toEqual(['Search 1', 'Search 2']);
      expect(result.current.getHistory()).toEqual(['Search 1', 'Search 2']);
    });
  });

  describe('Anonymous User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        loading: false,
      } as any);
    });

    it('should use anonymous storage key', () => {
      renderHook(() => useSearchHistory());
      
      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'tradeya_search_history_anonymous',
        []
      );
    });

    it('should maintain separate history from authenticated users', () => {
      mockHistory = [];
      mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
      
      const { result } = renderHook(() => useSearchHistory());
      
      act(() => {
        result.current.addToHistory('Anonymous Search');
      });

      expect(mockSetHistory).toHaveBeenCalled();
      const updateFn = mockSetHistory.mock.calls[0][0];
      const newHistory = updateFn([]);
      
      expect(newHistory).toEqual(['Anonymous Search']);
    });
  });

  describe('Custom maxItems', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: null,
        loading: false,
      } as any);
    });

    it('should respect custom maxItems', () => {
      mockHistory = Array.from({ length: 5 }, (_, i) => `Search ${i}`);
      mockUseLocalStorage.mockReturnValue([mockHistory, mockSetHistory] as any);
      
      const { result } = renderHook(() => useSearchHistory(5));
      
      act(() => {
        result.current.addToHistory('New Search');
      });

      const updateFn = mockSetHistory.mock.calls[0][0];
      const newHistory = updateFn(mockHistory);
      
      expect(newHistory).toHaveLength(5);
    });
  });
});

