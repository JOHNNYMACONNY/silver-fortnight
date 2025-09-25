import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import StatChip from '../components/ui/StatChip';
// Import search functionality
import { useCollaborationSearch } from '../hooks/useCollaborationSearch';
import { AdvancedSearch } from '../components/features/search/AdvancedSearch';
import { getFirebaseInstances } from '../firebase-config';
import { collection, query as fsQuery, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
// HomePage patterns imports
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { classPatterns, animations } from '../utils/designSystem';
import { semanticClasses } from '../utils/semanticColors';
import { TopicLink } from '../components/ui/TopicLink';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';


export const CollaborationsPage: React.FC = () => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
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
    userId: currentUser?.uid,
    pagination: {
      limit: 50,
      orderByField: 'createdAt',
      orderDirection: 'desc'
    },
    includeNonPublic: !!currentUser
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
  const [visibleCount, setVisibleCount] = useState(12);
  const activeFiltersCount = useMemo(() => {
    const entries = Object.entries(filters || {});
    return entries.filter(([_, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
  }, [filters]);

  // Realtime collaborations subscription (waits for Firebase init)
  useEffect(() => {
    // Load saved/joined sets from localStorage for continuity
    try {
      const savedRaw = localStorage.getItem('tradeya_saved_collaborations');
      const joinedRaw = localStorage.getItem('tradeya_joined_collaborations');
      if (savedRaw) setSavedCollaborations(new Set(JSON.parse(savedRaw)));
      if (joinedRaw) setJoinedCollaborations(new Set(JSON.parse(joinedRaw)));
    } catch {
      // ignore storage errors
    }

    let unsubscribe: (() => void) | null = null;
    const includeNonPublic = !!currentUser;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { db } = await getFirebaseInstances();
        const collabCol = collection(db, 'collaborations');
        const constraints = [orderBy('createdAt', 'desc'), limit(50)];
        const visibilityConstraint = includeNonPublic ? [] : [where('visibility', '==', 'public')];
        const q = fsQuery(collabCol, ...visibilityConstraint, ...constraints);

        unsubscribe = onSnapshot(q, (snapshot) => {
          try {
            const raw = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Collaboration[];
            // Client-side filter to include common visible statuses
            const items = raw.filter(c => ['open', 'recruiting'].includes((c as any).status || 'open'));
            setCollaborations(items);
            setLoading(false);
          } catch (err: any) {
            console.error('Error processing realtime collaborations:', err);
            setError(err.message || 'Failed to process collaborations');
            setLoading(false);
          }
        }, (err) => {
          console.error('Error subscribing to collaborations:', err);
          setError(err.message || 'Failed to subscribe to collaborations');
          setLoading(false);
        });
      } catch (err: any) {
        console.error('Error initializing Firebase for collaborations:', err);
        setError(err.message || 'Failed to initialize data');
        setLoading(false);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

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
      try { localStorage.setItem('tradeya_saved_collaborations', JSON.stringify(Array.from(newSet))); } catch {}
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
      try { localStorage.setItem('tradeya_joined_collaborations', JSON.stringify(Array.from(newSet))); } catch {}
      return newSet;
    });
    addToast('success', 'Joined collaboration!');
    navigate(`/collaborations/${collaborationId}`);
  };

  // Determine which collaborations to display
  const displayCollaborations = searchTerm || hasActiveFilters ? searchResults : collaborations;
  const displayLoading = searchTerm || hasActiveFilters ? searchLoading : loading;
  const displayError = searchError || error;
  const totalVisible = displayCollaborations.length;
  const savedCount = savedCollaborations.size;
  const joinedCount = joinedCollaborations.size;

  // Debounced search when term or filters change (MVP: 300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchTerm || hasActiveFilters) {
        search(searchTerm, filters);
      } else {
        clearSearch();
      }
      setVisibleCount(12);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, filters, hasActiveFilters, search, clearSearch]);



  return (
    <Box className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="CollaborationsPage" />
      <Stack gap="md">
        {/* Hero Section with HomePage-style gradient background */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground 
            variant="secondary" 
            intensity="medium" 
            className={classPatterns.homepageHeroContent}
          >
            <AnimatedHeading 
              as="h1" 
              animation="kinetic" 
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Collaborations
            </AnimatedHeading>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              Join forces with other creators to bring your ideas to life and build amazing projects together.
            </p>
            <Cluster gap="sm" align="center">
              <Button asChild topic="collaboration" variant="primary">
            <Link to="/collaborations/new">
              <PlusCircle className="me-2 h-4 w-4" />
              Create Collaboration
            </Link>
          </Button>
              <Badge variant="default" topic="collaboration" className="text-xs">
                {displayCollaborations.length} Active Collaborations
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>

        {/* Summary Stats with HomePage-style cards */}
        <Grid columns={{ base: 2, md: 3 }} gap="sm" className="mb-6">
          <Card variant="glass" className="p-4">
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-foreground">{totalVisible}</div>
              <div className="text-sm text-muted-foreground">Results</div>
            </CardContent>
          </Card>
          <Card variant="glass" className="p-4 hidden sm:block">
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-foreground">{savedCount}</div>
              <div className="text-sm text-muted-foreground">Saved</div>
            </CardContent>
          </Card>
          <Card variant="glass" className="p-4 hidden sm:block">
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-foreground">{joinedCount}</div>
              <div className="text-sm text-muted-foreground">Joined</div>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Search Section with HomePage-style card */}
        <Card variant="glass" className="static rounded-xl p-4 md:p-6 mb-8">
          <CardHeader className={classPatterns.homepageCardHeader}>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Find Your Perfect Collaboration
              <Badge variant="secondary" className="text-xs">
                {displayCollaborations.length} Results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className={classPatterns.homepageCardContent}>
            <EnhancedSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={(term) => handleSearch(term, filters)}
              onToggleFilters={() => setShowFilterPanel(true)}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
              resultsCount={displayCollaborations.length}
              isLoading={searchLoading}
              placeholder="Type here to search collaborations..."
              topic="collaboration"
            />
          </CardContent>
        
        <EnhancedFilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={() => setFilters({})}
          availableSkills={useMemo(() => {
            const frequencyByKey: Record<string, number> = {};
            const displayByKey: Record<string, string> = {};
            (displayCollaborations || []).forEach(collab => {
              const req: unknown[] = (collab as any).skillsRequired || [];
              const needed: unknown[] = (collab as any).skillsNeeded || [];
              [...req, ...needed].forEach((raw) => {
                const s = String(raw || '').trim();
                if (!s) return;
                const key = s.toLowerCase();
                if (!displayByKey[key]) displayByKey[key] = s;
                frequencyByKey[key] = (frequencyByKey[key] || 0) + 1;
              });
            });
            return Object.keys(frequencyByKey)
              .sort((a, b) => {
                const byFreq = (frequencyByKey[b] || 0) - (frequencyByKey[a] || 0);
                if (byFreq !== 0) return byFreq;
                return displayByKey[a].localeCompare(displayByKey[b]);
              })
              .map(k => displayByKey[k])
              .slice(0, 50);
          }, [displayCollaborations])}
          persistenceKey="collabs-filters"
        />
        </Card>

      {/* Mobile helper: show applied filters + clear beneath sticky search */}
      {hasActiveFilters && (
        <div className="sm:hidden -mt-6 mb-6 text-xs text-muted-foreground flex items-center gap-2">
          <span>{activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} applied</span>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setFilters({}); clearSearch(); }}
            className="underline text-primary"
          >
            Clear
          </button>
        </div>
      )}

      {/* Enhanced Search Results Summary */}
      {(searchTerm || hasActiveFilters) && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground" aria-live="polite">
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
          <button
            onClick={() => { setSearchTerm(''); setFilters({}); clearSearch(); }}
            className="text-sm text-primary hover:text-primary/80 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            aria-label="Clear search and filters"
          >
            Clear
          </button>
        </div>
      )}

      {displayError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          {displayError}
        </div>
      )}

        {/* Featured Collaborations Section with HomePage-style asymmetric layout */}
        <AnimatedHeading as="h2" animation="slide" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Featured Collaborations
        </AnimatedHeading>

      {displayLoading ? (
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
          {[...Array(6)].map((_, index) => (
            <SearchResultPreviewSkeleton
              key={index}
              variant="default"
              showQuickActions={true}
            />
          ))}
          </Grid>
      ) : displayCollaborations.length > 0 ? (
        <>
            <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
              {displayCollaborations.slice(0, visibleCount).map((collab, index) => (
                <motion.div
                  key={collab.id}
                  className="h-full"
                  {...animations.homepageCardEntrance}
                  transition={{
                    ...animations.homepageCardEntrance.transition,
                    delay: index * 0.1
                  }}
                >
            <SearchResultPreview
              collaboration={collab}
              variant="default"
              showQuickActions={false}
              showAnalytics={false}
              onSave={handleSaveCollaboration}
              onShare={handleShareCollaboration}
              onJoin={handleJoinCollaboration}
              isSaved={savedCollaborations.has(collab.id!)}
              isJoined={joinedCollaborations.has(collab.id!)}
            />
                </motion.div>
          ))}
            </Grid>

        {visibleCount < displayCollaborations.length && (
              <Card variant="glass" className="mt-8">
                <CardContent className="p-4">
                  <Cluster justify="center" gap="md">
            <div className="text-sm text-muted-foreground" aria-live="polite">
              Showing {Math.min(visibleCount, displayCollaborations.length)} of {displayCollaborations.length}
            </div>
            <Button
              variant="outline"
              onClick={() => setVisibleCount((n) => Math.min(n + 12, displayCollaborations.length))}
              aria-controls="collaborations-list"
            >
              Load more
            </Button>
                  </Cluster>
                </CardContent>
              </Card>
        )}
        </>
      ) : (
          <Card variant="glass" className="text-center p-8">
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
          </Card>
      )}
      </Stack>
    </Box>
  );
};

export default CollaborationsPage;
