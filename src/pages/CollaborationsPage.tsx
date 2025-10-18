import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCollaborations, Collaboration } from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { PlusCircle, Search, Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassmorphicInput } from "../components/ui/GlassmorphicInput";
// Import the enhanced CollaborationCard component
import { CollaborationCard } from '../components/features/collaborations/CollaborationCard';
import { SearchResultPreview } from '../components/features/search/SearchResultPreview';
import { SearchResultPreviewSkeleton } from '../components/ui/skeletons/SearchResultPreviewSkeleton';
import { SearchEmptyState } from '../components/features/search/SearchEmptyState';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { EnhancedFilterPanel } from '../components/features/search/EnhancedFilterPanel';
import { Button } from '../components/ui/Button';
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
import { Modal } from "../components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import { Target, Tag, Clock, MapPin } from 'lucide-react';
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
  const [showAnalytics, setShowAnalytics] = useState(false);
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
        // Fix: Always filter by public flag for list queries (Firestore requirement)
        // List queries require ALL documents in result to pass security rules
        const visibilityConstraint = [where('public', '==', true)];
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

  // Available skills for filter panel (now after displayCollaborations is defined)
  const availableSkills = useMemo(() => {
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
  }, [displayCollaborations]);

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
              className={`text-4xl md:text-5xl font-bold ${semanticClasses('collaboration').text} mb-4`}
            >
              Collaborations
            </AnimatedHeading>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              Join forces with other creators to bring your ideas to life and build amazing projects together.
            </p>
            <Cluster gap="sm" align="center">
              <Button
                onClick={() => navigate("/collaborations/new")}
                variant="glassmorphic"
                topic="collaboration"
              >
                <PlusCircle className="me-2 h-4 w-4" />
                Create New Collaboration
              </Button>
              <Badge variant="default" topic="collaboration" className="text-caption">
                {displayCollaborations.length} Active Collaborations
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>


        {/* Enhanced Search Section with HomePage-style card */}
        <Card
          variant="glass"
          className="rounded-xl p-4 md:p-6 mb-lg hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
          interactive={true}
          hover={true}
        >
          <CardHeader className={classPatterns.homepageCardHeader}>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Find Your Perfect Collaboration
              <Badge variant="secondary" className="text-xs">
                {displayCollaborations.length} Results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className={classPatterns.homepageCardContent}>
            <div className="space-y-md w-full">
              {/* Enhanced Search Input with Design System */}
              <Box className="relative w-full">
                <GlassmorphicInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search collaborations by skill, category, or description..."
                  variant="glass"
                  size="lg"
                  brandAccent="purple"
                  icon={<Search className="h-5 w-5" />}
                  className="pr-20 bg-white/10 backdrop-blur-xl w-full"
                />
                <Button
                  onClick={() => setShowFilterPanel(true)}
                  variant="glassmorphic"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px]"
                  topic="collaboration"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </Box>

              {/* Active Filters Display - Always show when filters are active */}
              {hasActiveFilters && (
                <Card variant="glass" className="p-md hover:shadow-md hover:shadow-purple-500/5 transition-all duration-200" interactive={true}>
                  <CardHeader className="pb-3">
                    <Cluster justify="between" align="center">
                      <CardTitle className="text-body-large text-purple-600 dark:text-purple-400">Active Filters</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        topic="collaboration"
                        onClick={() => {
                          setFilters({});
                          clearSearch();
                        }}
                        className="text-body-small min-h-[44px] min-w-[44px]"
                      >
                        Clear All
                      </Button>
                    </Cluster>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-xs">
                      {Object.entries(filters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;

                        let displayValue = '';
                        if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'object' && value && 'start' in value && 'end' in value) {
                          displayValue = `${(value as any).start} - ${(value as any).end}`;
                        } else {
                          displayValue = String(value);
                        }

                        return (
                          <Badge
                            key={key}
                            variant="default"
              topic="collaboration"
                            className="cursor-pointer"
                            onClick={() => {
                              const newFilters = { ...filters };
                              delete newFilters[key];
                              setFilters(newFilters);
                              search(searchTerm, newFilters);
                            }}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}: {displayValue}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clear Search Button */}
              {searchTerm && (
                <div className="text-right">
                  <Button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    variant="ghost"
                    size="sm"
                    className="text-body-small text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                    aria-label="Clear search"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        
        {/* Enhanced Filter Panel with Modal Component */}
        <Modal
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          title="Advanced Filters"
          size="xxl"
        >
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 glassmorphic border-glass backdrop-blur-2xl bg-white/5 p-4 sm:p-6 rounded-xl max-h-[85vh] overflow-y-auto">
            <p className="glassmorphic border-glass backdrop-blur-sm bg-white/5 text-white/90 p-3 sm:p-4 rounded-xl mb-4 text-sm sm:text-base">
              Refine your search with specific criteria
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6 sm:gap-8 p-4 sm:p-6">
              {/* Status Filter */}
              <Card
                variant="glass"
                className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                    <span className="leading-tight break-words">Collaboration Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, status: value === "all" ? undefined : value };
                      setFilters(newFilters);
                      search(searchTerm, newFilters);
                    }}
                  >
                    <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="recruiting">Recruiting</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Skills Filter */}
              <Card
                variant="glass"
                className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                    <span className="leading-tight break-words">Skills Needed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={filters.skills || "all"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, skills: value === "all" ? undefined : [value] };
                      setFilters(newFilters);
                      search(searchTerm, newFilters);
                    }}
                  >
                    <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                      <SelectItem value="all">All Skills</SelectItem>
                      {availableSkills.map((skill) => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Timeline Filter */}
              <Card
                variant="glass"
                className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                    <span className="leading-tight break-words">Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={filters.timeline || "all"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, timeline: value === "all" ? undefined : value };
                      setFilters(newFilters);
                      search(searchTerm, newFilters);
                    }}
                  >
                    <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                      <SelectItem value="all">Any Timeline</SelectItem>
                      <SelectItem value="short-term">Short-term (days)</SelectItem>
                      <SelectItem value="medium-term">Medium-term (weeks)</SelectItem>
                      <SelectItem value="long-term">Long-term (months)</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Location Filter */}
              <Card
                variant="glass"
                className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                    <span className="leading-tight break-words">Location</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={filters.location || "all"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, location: value === "all" ? undefined : value };
                      setFilters(newFilters);
                      search(searchTerm, newFilters);
                    }}
                  >
                    <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Clear All Filters */}
            <div className="pt-3 sm:pt-4 lg:pt-6">
              <Button
                variant="premium-outline"
                topic="collaboration"
                onClick={() => {
                  setFilters({});
                  clearSearch();
                }}
                className="w-full glassmorphic border-glass backdrop-blur-sm bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 h-10 sm:h-11 text-sm sm:text-base min-h-[44px]"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-2" />
                <span className="break-words">Clear All Filters</span>
              </Button>
            </div>
          </div>
        </Modal>
        </Card>

        {/* Collapsible Analytics Section */}
        <section className="mb-lg">
          <div className="mb-lg">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-foreground hover:text-foreground/80 transition-all duration-200 flex items-center gap-2 group"
            >
              <AnimatedHeading as="h2" animation="slide" className="text-section-heading md:text-3xl">
                Collaboration Analytics
              </AnimatedHeading>
              {showAnalytics ? (
                <ChevronUp className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
          </div>
          {showAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <Card
                variant="premium"
                className="p-lg hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                tilt={true}
                depth="lg"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader>
                  <CardTitle className="text-component-title text-foreground">Active Collaborations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{displayCollaborations.length}</div>
                  <div className="text-sm text-muted-foreground">Currently available</div>
                  {/* Simple bar chart placeholder */}
                  <div className="mt-4 flex items-end gap-1 h-16">
                    <div className="bg-purple-500/20 rounded-t w-full h-12"></div>
                    <div className="bg-purple-500/40 rounded-t w-full h-8"></div>
                    <div className="bg-purple-500/60 rounded-t w-full h-16"></div>
                    <div className="bg-purple-500/30 rounded-t w-full h-6"></div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant="premium"
                className="p-lg hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                tilt={true}
                depth="lg"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader>
                  <CardTitle className="text-component-title text-purple-600 dark:text-purple-400">Skills Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {new Set(displayCollaborations.map(collab => (collab as any).category)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Skill categories</div>
                  {/* Pie chart placeholder */}
                  <div className="mt-4 w-16 h-16 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="60 100" className="text-purple-500/60" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="40 100" strokeDashoffset="-60" className="text-purple-400" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant="premium"
                className="p-lg hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                tilt={true}
                depth="lg"
                glow="subtle"
                glowColor="purple"
                interactive={true}
                hover={true}
              >
                <CardHeader>
                  <CardTitle className="text-component-title text-purple-600 dark:text-purple-400">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">85%</div>
                  <div className="text-sm text-muted-foreground">Completion rate</div>
                  {/* Dynamic progress ring */}
                  <div className="mt-4 w-16 h-16 mx-auto relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-purple-500/20" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="213 251"
                        className="text-purple-500 transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                      85%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

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
