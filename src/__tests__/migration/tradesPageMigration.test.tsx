/**
 * TradesPage Migration Tests
 * 
 * Tests the migration compatibility features implemented in TradesPage.tsx
 * Validates real-world migration scenarios and compatibility layer functionality.
 */

// Ensure firebase_config getSyncFirebaseDb is mocked before other imports
jest.mock('../../firebase_config', () => ({
  getSyncFirebaseDb: () => ({
    collection: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
    doc: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }) })),
  }),
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TradesPage } from '../../pages/TradesPage';
import { migrationRegistry } from '../../services/migration/migrationRegistry';
import { TradeCompatibilityService } from '../../services/migration/tradeCompatibility';
import { AuthProvider } from '../../AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('../../services/firestore');
jest.mock('framer-motion', () => {
  const React = require('react');

  const stripFramerProps = (props = {}) => {
    const out = {};
    Object.keys(props || {}).forEach((k) => {
      if (/^(initial|animate|exit|transition|variants|layoutId|layout$|layout[A-Z].*|drag|while|onPan|onDrag)/.test(k)) return;
      out[k] = props[k];
    });
    return out;
  };

  const make = (tag) => ({ children, ...props }) => React.createElement(String(tag), stripFramerProps(props), children);

  const motion = new Proxy({}, {
    get: (_target, prop) => make(prop)
  });

  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});
jest.mock('../../contexts/PerformanceContext', () => ({
  usePerformance: () => ({
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    recordMetric: jest.fn(),
    trackJourneyStep: jest.fn(),
    collectMetrics: jest.fn() // Add this to fix the error
  })
}));
jest.mock('../../components/features/search/AdvancedSearch', () => {
  const { jsx, jsxs } = require('react/jsx-runtime');
  const React = require('react');
  return {
    AdvancedSearch: ({ onSearch, onSearchChange }) => (
      jsxs('div', {
        children: [
          jsx('input', {
            placeholder: 'Search',
            onChange: (e) => {
              onSearchChange && onSearchChange(e.target.value);
              onSearch && onSearch(e.target.value, {});
            },
            'data-testid': 'search-input'
          }),
          jsx('button', { onClick: () => onSearch && onSearch('', { category: 'Design' }), children: 'Mock Category: Design' }),
          jsx('button', { onClick: () => onSearch && onSearch('', { category: 'Development' }), children: 'Mock Category: Development' }),
          jsx('button', { onClick: () => onSearch && onSearch('', { category: 'Invalid' }), children: 'Mock Category: Invalid' })
        ]
      })
    )
  };
});
jest.mock('../../components/ui/skeletons/TradeCardSkeleton', () => {
  const React = require('react');
  return {
    __esModule: true,
    TradeListSkeleton: function TradeListSkeleton({ count = 6 }) {
      return React.createElement('div', { 'data-testid': 'mock-trade-list-skeleton' }, `Mock Skeleton x${count}`);
    }
  };
});
jest.mock('../../components/ui/AnimatedList', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function AnimatedListMock(props) {
      return React.createElement('div', props, props.children);
    }
  };
});
jest.mock('../../components/features/trades/TradeCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function TradeCardMock(props) {
      // Render the trade title if present, fallback to children
      return React.createElement('div', {}, props.trade?.title || props.children);
    }
  };
});
const mockTradeCompatibility = TradeCompatibilityService as jest.Mocked<typeof TradeCompatibilityService>;

// Remove Object.defineProperty for .trades (let the real getter work)

// Test data - represents both old and new schema formats
const legacyTradeData = {
  id: 'legacy-trade-1',
  title: 'Web Development for Logo Design',
  description: 'I can build you a website in exchange for a professional logo',
  offeredSkills: ['React', 'JavaScript', 'CSS'],
  requestedSkills: ['Graphic Design', 'Logo Design'],
  creatorId: 'user-123',
  participantId: null,
  status: 'active',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15')
};

const modernTradeData = {
  id: 'modern-trade-1',
  title: 'Data Analysis for Content Writing',
  description: 'I can provide data analysis services for quality content writing',
  skillsOffered: [
    { id: 'python', name: 'Python', level: 'expert' },
    { id: 'data-analysis', name: 'Data Analysis', level: 'expert' }
  ],
  skillsWanted: [
    { id: 'content-writing', name: 'Content Writing', level: 'intermediate' },
    { id: 'copywriting', name: 'Copywriting', level: 'intermediate' }
  ],
  participants: {
    creator: 'user-456',
    participant: null
  },
  status: 'active',
  createdAt: new Date('2024-02-15'),
  updatedAt: new Date('2024-02-15'),
  schemaVersion: '2.0'
};

// Mock user profiles
const mockUserProfiles = {
  'user-123': {
    uid: 'user-123',
    displayName: 'John Developer',
    profilePicture: 'https://example.com/john.jpg',
    location: 'San Francisco, CA'
  },
  'user-456': {
    uid: 'user-456',
    displayName: 'Sarah Analyst',
    profilePicture: 'https://example.com/sarah.jpg',
    location: 'New York, NY'
  }
};

// Mock getUserProfile to return user data from mockUserProfiles
const firestoreExports = require('../../services/firestore');
firestoreExports.getUserProfile = jest.fn((userId) => {
  const user = mockUserProfiles[userId];
  if (user) {
    return Promise.resolve({ data: user, error: null });
  }
  return Promise.resolve({ data: null, error: { code: 'not-found', message: 'User not found' } });
});

// Additional Firestore mocks to intercept all Firestore usage
firestoreExports.getFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ docs: [] }),
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    })),
  })),
  doc: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
  })),
}));

firestoreExports.collection = jest.fn(() => ({
  get: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
  })),
}));

firestoreExports.doc = jest.fn(() => ({
  get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
}));

firestoreExports.getDocs = jest.fn().mockResolvedValue({ docs: [] });
firestoreExports.getDoc = jest.fn().mockResolvedValue({ exists: true, data: () => ({}) });

// Mock firebase/firestore methods used by TradeCompatibilityService
jest.mock('firebase/firestore', () => {
  // Return mock functions for all Firestore methods used in the service
  return {
    doc: jest.fn((...args) => ({ id: args[2] || 'mockDocId', data: () => ({}) })),
    getDoc: jest.fn(async (docRef) => ({ exists: () => true, id: docRef.id, data: () => ({}) })),
    getDocs: jest.fn(async (q) => ({ docs: [] })),
    collection: jest.fn(() => ({})),
    query: jest.fn((...args) => args[0]),
    where: jest.fn((fieldPath, opStr, value) => ({ fieldPath, opStr, value })),
    orderBy: jest.fn((fieldPath, directionStr) => ({ fieldPath, directionStr })),
    limit: jest.fn((n) => n),
    onSnapshot: jest.fn((q, cb) => {
      // Immediately invoke callback with empty snapshot-like object
      Promise.resolve().then(() => cb({ docs: [] }));
      return () => {};
    }),
    Firestore: jest.fn(),
    DocumentData: jest.fn(),
    QueryConstraint: jest.fn(),
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe('TradesPage Migration Tests', () => {
  let queryTradesSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock performance.now and performance.getEntriesByType for jsdom
    globalThis._originalPerformance = { ...globalThis.performance };
    globalThis.performance.now = jest.fn(() => Date.now());
    globalThis.performance.getEntriesByType = jest.fn(() => []);
  });
  afterAll(() => {
    // Restore original performance methods
    if (globalThis._originalPerformance) {
      globalThis.performance.now = globalThis._originalPerformance.now;
      globalThis.performance.getEntriesByType = globalThis._originalPerformance.getEntriesByType;
      delete globalThis._originalPerformance;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Provide a more realistic Firestore mock object with minimal Firestore-like methods
    const mockFirestore = {
      app: {},
      _delegate: {},
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        })),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      })),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      })),
      get: jest.fn().mockResolvedValue({ docs: [] }),
    } as any;
    migrationRegistry.reset();
    migrationRegistry.initialize(mockFirestore); // Pass a more valid Firestore mock
    migrationRegistry.enableMigrationMode();
    // Setup spy for instance method
    queryTradesSpy = jest.spyOn(TradeCompatibilityService.prototype, 'queryTrades');
    // Add logging to spy for queryTrades
    queryTradesSpy.mockImplementation(function (...args) {
       
      console.log('[TEST-SPY] queryTrades called with:', ...args);
      // Default mock return (can be overridden in individual tests)
      return Promise.resolve([]);
    });
    // Debug logs for registry state
     
    console.log('Test: migrationRegistry.isInitialized()', migrationRegistry.isInitialized());
     
    console.log('Test: migrationRegistry.trades', migrationRegistry.trades);
  });

  afterEach(() => {
    if (queryTradesSpy) queryTradesSpy.mockRestore();
  });

  describe('Migration Status Detection', () => {
    test('should detect when migration registry is ready', async () => {
      // Set NODE_ENV to development for this test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      // Setup: Migration registry is ready
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockResolvedValue([modernTradeData]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      // Should show compatibility mode indicator in development
      await waitFor(() => {
        const statusIndicator = screen.getByText(/compatibility mode/i);
        expect(statusIndicator).toBeInTheDocument();
      });

      expect(queryTradesSpy).toHaveBeenCalled();
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle migration registry not ready state', async () => {
      // Setup: Migration registry is not ready
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(false);
      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );
      await waitFor(() => {
        // The UI shows 'No trades available at the moment.' when not ready
        const statusText = screen.getByText(/no trades available at the moment/i);
        expect(statusText).toBeInTheDocument();
      });
    });

    test('should activate fallback mode when migration service fails', async () => {
      // Setup: Migration registry is ready but service fails
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockRejectedValue(new Error('Migration service error'));

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const fallbackIndicator = screen.getByText(/fallback/i);
        expect(fallbackIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Data Compatibility', () => {
    test('should handle legacy trade data format', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Return legacy format data
      queryTradesSpy.mockResolvedValue([legacyTradeData]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Web Development for Logo Design')).toBeInTheDocument();
      });

      // Verify that legacy data is properly handled
      expect(queryTradesSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ fieldPath: 'status', opStr: '==', value: 'active' })
        ]),
        20
      );
    });

    test('should handle modern trade data format', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockResolvedValue([modernTradeData]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Data Analysis for Content Writing')).toBeInTheDocument();
      });
    });

    test('should handle mixed legacy and modern data formats', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Return both legacy and modern format data
      queryTradesSpy.mockResolvedValue([legacyTradeData, modernTradeData]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Web Development for Logo Design')).toBeInTheDocument();
        expect(screen.getByText('Data Analysis for Content Writing')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering with Migration Data', () => {
    beforeEach(() => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });
    });

    test('should search in both legacy and modern skill formats', async () => {
      // Patch legacy trade to use skill objects
      const legacyTradePatched = {
        ...legacyTradeData,
        offeredSkills: legacyTradeData.offeredSkills.map(s => ({ name: s })),
        requestedSkills: legacyTradeData.requestedSkills.map(s => ({ name: s })),
      };
      const modernTradePatched = {
        ...modernTradeData,
        skillsOffered: modernTradeData.skillsOffered.map(s => ({ ...s })),
        skillsWanted: modernTradeData.skillsWanted.map(s => ({ ...s })),
      };
      // Always normalize the trades before returning
      const legacyNormalized = TradeCompatibilityService.normalizeTradeData(legacyTradePatched);
      const modernNormalized = TradeCompatibilityService.normalizeTradeData(modernTradePatched);
      queryTradesSpy.mockResolvedValue([legacyNormalized, modernNormalized]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      // Wait for trades to load
      await waitFor(() => {
        expect(screen.getByText('Web Development for Logo Design')).toBeInTheDocument();
      });

      // Search for a skill that exists in legacy format
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'React' } });

      // Debug: log all trade titles currently rendered
      await waitFor(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tradeTitles = allDivs.map(div => div.textContent).filter(Boolean);
         
        console.log('DEBUG: Rendered trade titles after search:', tradeTitles);
        expect(screen.getByText('Web Development for Logo Design')).toBeInTheDocument();
        expect(screen.queryByText('Data Analysis for Content Writing')).not.toBeInTheDocument();
      });
    });

    test('should search in modern skill format', async () => {
      // Patch legacy trade to use skill objects
      const legacyTradePatched = {
        ...legacyTradeData,
        offeredSkills: legacyTradeData.offeredSkills.map(s => ({ name: s })),
        requestedSkills: legacyTradeData.requestedSkills.map(s => ({ name: s })),
      };
      const modernTradePatched = {
        ...modernTradeData,
        skillsOffered: modernTradeData.skillsOffered.map(s => ({ ...s })),
        skillsWanted: modernTradeData.skillsWanted.map(s => ({ ...s })),
      };
      // Always normalize the trades before returning
      const legacyNormalized = TradeCompatibilityService.normalizeTradeData(legacyTradePatched);
      const modernNormalized = TradeCompatibilityService.normalizeTradeData(modernTradePatched);
      queryTradesSpy.mockResolvedValue([legacyNormalized, modernNormalized]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Data Analysis for Content Writing')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Python' } });

      // Debug: log all trade titles currently rendered
      await waitFor(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tradeTitles = allDivs.map(div => div.textContent).filter(Boolean);
         
        console.log('DEBUG: Rendered trade titles after search:', tradeTitles);
        expect(screen.queryByText('Web Development for Logo Design')).not.toBeInTheDocument();
        expect(screen.getByText('Data Analysis for Content Writing')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should display user-friendly error when migration service fails', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockRejectedValue(new Error('Database connection failed'));

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load trades/i)).toBeInTheDocument();
        expect(screen.getByText(/operating in fallback mode/i)).toBeInTheDocument();
      });
    });

    test('should allow manual refresh when in error state', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Patch modernTradeData for refresh
      const modernTradePatched = {
        ...modernTradeData,
        skillsOffered: modernTradeData.skillsOffered.map(s => ({ ...s })),
        skillsWanted: modernTradeData.skillsWanted.map(s => ({ ...s })),
      };
      // First call fails, second succeeds (normalize the trade)
      const modernNormalized = TradeCompatibilityService.normalizeTradeData(modernTradePatched);
      queryTradesSpy
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce([modernNormalized]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/failed to load trades/i)).toBeInTheDocument();
      });

      // Click refresh button (safely handle undefined)
      const refreshButton = screen.getAllByText(/refresh/i).find(el => el.tagName === 'BUTTON');
      if (refreshButton) fireEvent.click(refreshButton);

      // Debug: log all trade titles currently rendered after refresh
      await waitFor(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tradeTitles = allDivs.map(div => div.textContent).filter(Boolean);
         
        console.log('DEBUG: Rendered trade titles after refresh:', tradeTitles);
        expect(screen.getByText('Data Analysis for Content Writing')).toBeInTheDocument();
      });

      expect(queryTradesSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Impact Validation', () => {
    test('should not significantly impact performance when using migration compatibility', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Mock large dataset
      const largeTrades = Array.from({ length: 20 }, (_, i) => ({
        ...modernTradeData,
        id: `trade-${i}`,
        title: `Trade ${i}`
      }));

      queryTradesSpy.mockResolvedValue(largeTrades);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Trade 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete within reasonable time (2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('User Experience during Migration', () => {
    test('should provide clear migration status indicators in development', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockResolvedValue([]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/compatibility mode/i)).toBeInTheDocument();
      });

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    test('should hide migration indicators in production', async () => {
      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockResolvedValue([]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/compatibility mode/i)).not.toBeInTheDocument();
      });

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Migration Query Compatibility', () => {
    test('should build proper Firestore queries with migration service', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      queryTradesSpy.mockResolvedValue([]);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(queryTradesSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ fieldPath: 'status', opStr: '==' }),
            expect.objectContaining({ fieldPath: 'createdAt' })
          ]),
          20
        );
      });
    });

    test('should handle category filtering through migration service', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Provide trades with categories for filtering
      const legacyTradePatched = {
        ...legacyTradeData, title: 'Legacy Design Trade', category: 'Design',
        offeredSkills: legacyTradeData.offeredSkills.map(s => ({ name: s })),
        requestedSkills: legacyTradeData.requestedSkills.map(s => ({ name: s })),
      };
      const modernTradePatched = {
        ...modernTradeData, title: 'Modern Dev Trade', category: 'Development',
        skillsOffered: modernTradeData.skillsOffered.map(s => ({ ...s })),
        skillsWanted: modernTradeData.skillsWanted.map(s => ({ ...s })),
      };
      // Normalize and re-add category
      const legacyNormalized = {
        ...TradeCompatibilityService.normalizeTradeData(legacyTradePatched),
        category: 'Design',
      };
      const modernNormalized = {
        ...TradeCompatibilityService.normalizeTradeData(modernTradePatched),
        category: 'Development',
      };
      const categoryTrades = [legacyNormalized, modernNormalized];
      // Patch the spy to filter by category and normalize
      queryTradesSpy.mockImplementation((queryArr) => {
        const catFilter = queryArr.find(q => q.fieldPath === 'category');
        if (catFilter) {
          return Promise.resolve(categoryTrades.filter(t => t.category === catFilter.value));
        }
        return Promise.resolve(categoryTrades);
      });

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      // Wait for both trades to appear
      await waitFor(() => {
        expect(screen.getByText('Legacy Design Trade')).toBeInTheDocument();
        expect(screen.getByText('Modern Dev Trade')).toBeInTheDocument();
      });

      // Simulate category filter: Design
      const designButton = screen.getByText('Mock Category: Design');
      fireEvent.click(designButton);
      await waitFor(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tradeTitles = allDivs.map(div => div.textContent).filter(Boolean);
         
        console.log('DEBUG: Rendered trade titles after Design filter:', tradeTitles);
        expect(screen.getByText('Legacy Design Trade')).toBeInTheDocument();
        expect(screen.queryByText('Modern Dev Trade')).not.toBeInTheDocument();
      });

      // Simulate category filter: Development
      const devButton = screen.getByText('Mock Category: Development');
      fireEvent.click(devButton);
      await waitFor(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tradeTitles = allDivs.map(div => div.textContent).filter(Boolean);
         
        console.log('DEBUG: Rendered trade titles after Development filter:', tradeTitles);
        expect(screen.getByText('Modern Dev Trade')).toBeInTheDocument();
        expect(screen.queryByText('Legacy Design Trade')).not.toBeInTheDocument();
      });
    });

    test('should show no results for invalid category', async () => {
      jest.spyOn(require('../../services/migration'), 'isMigrationReady').mockReturnValue(true);
      jest.spyOn(require('../../services/migration'), 'getMigrationStatus').mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      const categoryTrades = [
        { ...legacyTradeData, title: 'Legacy Design Trade', category: 'Design' },
        { ...modernTradeData, title: 'Modern Dev Trade', category: 'Development' }
      ];
      queryTradesSpy.mockResolvedValue(categoryTrades);

      render(
        <TestWrapper>
          <TradesPage />
        </TestWrapper>
      );

      // Wait for both trades to appear
      await waitFor(() => {
        expect(screen.getByText('Legacy Design Trade')).toBeInTheDocument();
        expect(screen.getByText('Modern Dev Trade')).toBeInTheDocument();
      });

      // Simulate invalid category filter
      const invalidButton = screen.getByText('Mock Category: Invalid');
      fireEvent.click(invalidButton);
      await waitFor(() => {
        expect(screen.queryByText('Legacy Design Trade')).not.toBeInTheDocument();
        expect(screen.queryByText('Modern Dev Trade')).not.toBeInTheDocument();
      });
    });
  });
});
