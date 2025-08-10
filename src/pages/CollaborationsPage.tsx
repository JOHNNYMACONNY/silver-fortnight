import React, { useState, useEffect, useCallback } from 'react';
import { getCollaborations, Collaboration } from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { PlusCircle } from '../utils/icons';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// Import the enhanced CollaborationCard component
import { CollaborationCard } from '../components/features/collaborations/CollaborationCard';
import { SearchResultPreview } from '../components/features/search/SearchResultPreview';
import { SearchResultPreviewSkeleton } from '../components/ui/skeletons/SearchResultPreviewSkeleton';
import { SearchEmptyState } from '../components/features/search/SearchEmptyState';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { EnhancedFilterPanel } from '../components/features/search/EnhancedFilterPanel';
// Import search functionality
import { useCollaborationSearch } from '../hooks/useCollaborationSearch';
import { AdvancedSearch } from '../components/features/search/AdvancedSearch';


export const CollaborationsPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Enhanced search functionality with backend integration
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clearSearch,
    hasActiveFilters,
    // New backend integration features
    saveCurrentFilters,
    loadSavedFilters,
    popularFilters,
    queryMetadata,
    totalCount,
    trackSatisfaction
  } = useCollaborationSearch({
    enablePersistence: true,
    enableAnalytics: true,
    userId: 'current-user-id', // TODO: Get from auth context
    pagination: {
      limit: 50,
      orderByField: 'createdAt',
      orderDirection: 'desc'
    }
  });

  // Handle filter changes from AdvancedSearch
  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    // Trigger search with new filters
    if (searchTerm || Object.values(newFilters).some(v => v !== '' && v !== undefined)) {
      search(searchTerm, newFilters);
    }
  }, [searchTerm, setFilters, search]);

  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCollaborations, setSavedCollaborations] = useState<Set<string>>(new Set());
  const [joinedCollaborations, setJoinedCollaborations] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    fetchCollaborations();
  }, []);



  const fetchCollaborations = async () => {
    setLoading(true);
    setError(null);

    try {
      const collaborationsResult = await getCollaborations();
      if (collaborationsResult.error) throw new Error(collaborationsResult.error.message);
      if (collaborationsResult.data) {
        console.log('Fetched collaborations:', collaborationsResult.data);
        console.log('Number of collaborations:', collaborationsResult.data.length);
        setCollaborations(collaborationsResult.data);
      } else {
        setCollaborations([]);
        console.log('No collaborations found');
      }
    } catch (err: any) {
      console.error('Error fetching collaborations:', err);
      setError(err.message || 'Failed to fetch collaborations');
      addToast('error', err.message || 'Failed to fetch collaborations');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (term: string, searchFilters: any) => {
    if (term.trim() || hasActiveFilters) {
      await search(term, searchFilters);
    } else {
      // If no search term and no filters, show all collaborations
      setSearchTerm('');
      setFilters({});
    }
  };

  // Quick action handlers
  const handleSaveCollaboration = async (collaborationId: string) => {
    setSavedCollaborations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collaborationId)) {
        newSet.delete(collaborationId);
        addToast('info', 'Removed from saved');
      } else {
        newSet.add(collaborationId);
        addToast('success', 'Saved to your collection');
      }
      return newSet;
    });
  };

  const handleShareCollaboration = (collaborationId: string) => {
    const url = `${window.location.origin}/collaborations/${collaborationId}`;
    navigator.clipboard.writeText(url);
    addToast('success', 'Link copied to clipboard');
  };

  const handleJoinCollaboration = (collaborationId: string) => {
    setJoinedCollaborations(prev => {
      const newSet = new Set(prev);
      newSet.add(collaborationId);
      return newSet;
    });
    addToast('success', 'Joined collaboration!');
    navigate(`/collaborations/${collaborationId}`);
  };

  // Determine which collaborations to display
  const displayCollaborations = searchTerm || hasActiveFilters ? searchResults : collaborations;
  const displayLoading = searchTerm || hasActiveFilters ? searchLoading : loading;
  const displayError = searchError || error;



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Performance monitoring (invisible) */}
      <PerformanceMonitor pageName="CollaborationsPage" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Collaborations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join forces with other creators to bring your ideas to life.
            </p>
          </div>

        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => navigate('/collaborations/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Collaboration
          </button>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="mb-8">
        <EnhancedSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={(term) => handleSearch(term, filters)}
          onToggleFilters={() => setShowFilterPanel(true)}
          hasActiveFilters={hasActiveFilters}
          resultsCount={displayCollaborations.length}
          isLoading={searchLoading}
          placeholder="Search collaborations by title, description, or participants..."
        />
        
        <EnhancedFilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {/* Enhanced Search Results Summary */}
      {(searchTerm || hasActiveFilters) && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {searchLoading ? (
                'Searching...'
              ) : (
                `Found ${totalCount || displayCollaborations.length} collaboration${(totalCount || displayCollaborations.length) !== 1 ? 's' : ''}`
              )}
            </div>
            {queryMetadata && (
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {queryMetadata.constraintCount} filters • {queryMetadata.hasComplexFilters ? 'Complex' : 'Simple'} query
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {(searchTerm || hasActiveFilters) && (
              <>
                <button
                  onClick={() => saveCurrentFilters('My Search')}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Save filters
                </button>
                <button
                  onClick={clearSearch}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {displayError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          {displayError}
        </div>
      )}

      {displayLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <SearchResultPreviewSkeleton
              key={index}
              variant="default"
              showQuickActions={true}
            />
          ))}
        </div>
      ) : displayCollaborations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCollaborations.map((collab) => (
            <SearchResultPreview
              key={collab.id}
              collaboration={collab}
              variant="default"
              showQuickActions={true}
              showAnalytics={false}
              onSave={handleSaveCollaboration}
              onShare={handleShareCollaboration}
              onJoin={handleJoinCollaboration}
              isSaved={savedCollaborations.has(collab.id!)}
              isJoined={joinedCollaborations.has(collab.id!)}
            />
          ))}
        </div>
      ) : (
        <SearchEmptyState
          searchTerm={searchTerm}
          hasActiveFilters={hasActiveFilters}
          onClearSearch={clearSearch}
          onClearFilters={() => setFilters({})}
          onCreateCollaboration={() => navigate('/collaborations/new')}
          suggestions={[
            'Try searching for "design" or "development"',
            'Filter by "open" status',
            'Browse all collaborations',
            'Create your own collaboration'
          ]}
        />
      )}
    </div>
  );
};

export default CollaborationsPage;
