import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollaborationsPage from '../CollaborationsPage';

// Apply the AuthContextType mock pattern with userProfile: null for consistency
jest.mock('../../AuthContext', () => ({
  useAuth: () => ({
    user: null,
    currentUser: null,
    userProfile: null,
    loading: false,
    error: null,
    isAdmin: false,
    signIn: jest.fn(),
    signInWithEmail: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock heavy UI/animation dependencies
jest.mock('../../components/ui/PerformanceMonitor', () => () => null);


// Mock Firestore bindings used by the page's subscription
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  onSnapshot: jest.fn((_q: any, onNext: any) => {
    // Provide empty docs so page renders with empty/default state
    setTimeout(() => onNext({ docs: [] }), 0);
    return () => {};
  })
}));

// Mock firebase-config to avoid real initialization
jest.mock('../../firebase-config', () => ({
  getFirebaseInstances: jest.fn(async () => ({ db: {} })),
  getSyncFirebaseDb: jest.fn(() => ({})),
  initializeFirebase: jest.fn(async () => undefined)
}));

// Mock the search hook so we can validate page wiring to search results
jest.mock('../../hooks/useCollaborationSearch', () => ({
  useCollaborationSearch: () => ({
    searchTerm: 'react', // ensure page uses searchResults branch
    setSearchTerm: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    results: [{ id: 'c1', title: 'Open Source Project' }],
    loading: false,
    error: null,
    search: jest.fn(),
    clearSearch: jest.fn(),
    hasActiveFilters: true,
    saveCurrentFilters: jest.fn(),
    loadSavedFilters: jest.fn(async () => []),
    popularFilters: [],
    queryMetadata: null,
    totalCount: 1,
    trackSatisfaction: jest.fn()
  })
}));

// Make the result preview render a simple text to assert easily
jest.mock('../../components/features/search/SearchResultPreview', () => ({
  SearchResultPreview: ({ collaboration }: any) => require('react').createElement('div', null, collaboration.title)
}));

// ToastContext minimal mock
jest.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ addToast: jest.fn() }) }));


describe('CollaborationsPage integration (render with mocked services)', () => {
  it('renders search results from useCollaborationSearch without errors', async () => {
    render(
      <MemoryRouter>
        <CollaborationsPage />
      </MemoryRouter>
    );

    // The mocked SearchResultPreview renders the title directly
    expect(await screen.findByText('Open Source Project')).toBeInTheDocument();
  });
});

