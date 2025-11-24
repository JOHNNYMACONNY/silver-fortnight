# Search History Implementation

**Last Updated**: November 24, 2025

This document details the implementation of the search history feature, which provides users with persistent search history across sessions.

## Overview

The search history feature allows users to quickly access their recent searches, improving the search experience by reducing repetitive typing and enabling quick access to frequently searched terms.

## Architecture

### useSearchHistory Hook

The `useSearchHistory` hook manages search history using localStorage with per-user isolation.

**Location**: `src/hooks/useSearchHistory.ts`

**Interface**:
```tsx
export interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (term: string) => void;
  clearHistory: () => void;
  getHistory: () => string[];
}

export function useSearchHistory(maxItems: number = 10): UseSearchHistoryReturn
```

**Features**:
- Per-user search history isolation (anonymous fallback for logged-out users)
- Automatic duplicate removal (case-insensitive)
- Configurable max items (default: 10, most recent first)
- localStorage persistence
- Automatic cleanup of old entries

**Storage Key Format**:
- Authenticated users: `tradeya_search_history_${userId}`
- Anonymous users: `tradeya_search_history_anonymous`

## Implementation Details

### Hook Implementation

```tsx
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
  
  return { history, addToHistory, clearHistory, getHistory: () => history };
}
```

### Integration with useTradeSearch

The `useTradeSearch` hook automatically tracks search history:

```tsx
import { useSearchHistory } from './useSearchHistory';

export function useTradeSearch(options: UseTradeSearchOptions = {}): UseTradeSearchReturn {
  // ... other code ...
  
  const { addToHistory } = useSearchHistory(10);
  
  const executeSearch = useCallback(
    async (term: string, filterOptions: Partial<TradeFilters> = {}) => {
      // ... search logic ...
      
      // Add to search history on successful search
      if (term.trim() && data && data.items && data.items.length > 0) {
        addToHistory(term);
      }
    },
    [pagination, addToHistory]
  );
  
  // ... rest of implementation
}
```

### Integration with EnhancedSearchBar

The `EnhancedSearchBar` component displays search history:

```tsx
interface EnhancedSearchBarProps {
  // ... other props ...
  enableSearchHistory?: boolean;
  recentSearches?: string[];
  onSearchHistoryClear?: () => void;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  // ... other props ...
  enableSearchHistory = true,
  onSearchHistoryClear,
}) => {
  const { history, addToHistory, clearHistory } = useSearchHistory(10);
  
  // Determine which suggestions to show
  const hasHistory = enableSearchHistory && history.length > 0;
  const displaySuggestions = hasHistory ? history : suggestions;
  
  const handleClearHistory = () => {
    clearHistory();
    if (onSearchHistoryClear) {
      onSearchHistoryClear();
    }
  };
  
  // ... render logic with recent searches display
}
```

## Usage Examples

### Basic Usage

```tsx
import { useSearchHistory } from '../hooks/useSearchHistory';

function MyComponent() {
  const { history, addToHistory, clearHistory } = useSearchHistory(10);
  
  const handleSearch = (term: string) => {
    // Perform search
    performSearch(term);
    
    // Add to history
    addToHistory(term);
  };
  
  return (
    <div>
      <input onSearch={handleSearch} />
      {history.length > 0 && (
        <div>
          <h3>Recent Searches</h3>
          {history.map((term, index) => (
            <button key={index} onClick={() => handleSearch(term)}>
              {term}
            </button>
          ))}
          <button onClick={clearHistory}>Clear History</button>
        </div>
      )}
    </div>
  );
}
```

### With EnhancedSearchBar

```tsx
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { useSearchHistory } from '../hooks/useSearchHistory';

function SearchPage() {
  const { history, clearHistory } = useSearchHistory(10);
  
  return (
    <EnhancedSearchBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onSearch={handleSearch}
      enableSearchHistory={true}
      recentSearches={history}
      onSearchHistoryClear={clearHistory}
      // ... other props
    />
  );
}
```

## Data Structure

### localStorage Structure

```json
{
  "tradeya_search_history_user123": [
    "React Development",
    "UI/UX Design",
    "Web Development",
    "Graphic Design",
    "Video Editing"
  ],
  "tradeya_search_history_anonymous": [
    "React",
    "Design"
  ]
}
```

### History Entry Format

- **Type**: `string[]`
- **Order**: Most recent first
- **Max Length**: Configurable (default: 10)
- **Deduplication**: Case-insensitive
- **Validation**: Empty strings are filtered out

## Benefits

1. **Improved UX**: Users can quickly access recent searches
2. **Reduced Typing**: No need to retype common search terms
3. **Personalization**: Per-user history provides personalized experience
4. **Persistence**: History persists across sessions
5. **Privacy**: Anonymous users have separate history

## Privacy & Security

- Search history is stored locally in the browser (localStorage)
- No search history is sent to the server
- Per-user isolation ensures privacy
- Users can clear their history at any time
- Anonymous users have a separate history that doesn't persist across devices

## Future Enhancements

Potential future improvements:

1. **Search Analytics**: Track popular searches (anonymized)
2. **Search Suggestions**: AI-powered suggestions based on history
3. **History Sync**: Optional cloud sync for authenticated users
4. **Export/Import**: Allow users to export their search history
5. **Search Categories**: Group history by category or date

## Related Documentation

- [Advanced Search Enhancement Summary](./ADVANCED_SEARCH_ENHANCEMENT_SUMMARY.md)
- [EnhancedSearchBar Component](../design/DESIGN_SYSTEM_DOCUMENTATION.md#enhancedsearchbar-component)

