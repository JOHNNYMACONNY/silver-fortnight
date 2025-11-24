import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../AuthContext';
import { useCallback } from 'react';

export interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (term: string) => void;
  clearHistory: () => void;
  getHistory: () => string[];
}

/**
 * Hook for managing search history using localStorage
 * Follows the same pattern as useLocalStorage
 * Stores search history per user (anonymous fallback)
 */
export function useSearchHistory(maxItems: number = 10): UseSearchHistoryReturn {
  const { currentUser } = useAuth();
  const storageKey = currentUser 
    ? `tradeya_search_history_${currentUser.uid}` 
    : 'tradeya_search_history_anonymous';
  
  const [history, setHistory] = useLocalStorage<string[]>(storageKey, []);
  
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    setHistory(prev => {
      // Remove duplicates (case-insensitive)
      const filtered = prev.filter(h => h.toLowerCase() !== term.toLowerCase());
      // Add new term to front and limit to maxItems
      return [term.trim(), ...filtered].slice(0, maxItems);
    });
  }, [setHistory, maxItems]);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);
  
  const getHistory = useCallback(() => {
    return history;
  }, [history]);
  
  return { 
    history, 
    addToHistory, 
    clearHistory,
    getHistory
  };
}

