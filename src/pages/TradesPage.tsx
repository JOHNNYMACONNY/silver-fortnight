import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUserProfile, User, getAllTrades } from '../services/firestore-exports';
import { tradeService } from '../services/entities/TradeService';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import TradeCard, { ExtendedTrade } from '../components/features/trades/TradeCard';
import { motion } from 'framer-motion';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { EnhancedFilterPanel } from '../components/features/search/EnhancedFilterPanel';
import { TradeListSkeleton } from '../components/ui/skeletons/TradeCardSkeleton';
import { useToast } from '../contexts/ToastContext';
import { AnimatedButton } from '../components/animations';
import { Button } from '../components/ui/Button';
import { PlusCircle } from '../utils/icons';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';
import { useTradeSearch } from '../hooks/useTradeSearch';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query as fsQuery, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { StandardPageHeader } from '../components/layout/StandardPageHeader';

export const TradesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<ExtendedTrade[]>([]);
  const [tradeCreators, setTradeCreators] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const {
    searchTerm,
    setSearchTerm,
    results: searchedTrades,
    loading: searchLoading,
    totalCount,
    search,
    clearSearch
  } = useTradeSearch({ enablePersistence: false, pagination: { limit: 20, orderByField: 'title', orderDirection: 'asc' } });

  // Fetch trade creators
  const fetchTradeCreators = useCallback(async (creatorIds: string[]) => {
    const creators: { [key: string]: User } = {};

    for (const creatorId of creatorIds) {
      if (creatorId) {
        const { data, error } = await getUserProfile(creatorId);
        if (!error && data) {
          creators[creatorId] = data as User;
        }
      }
    }

    setTradeCreators(creators);
  }, []);

  // Fallback function to fetch trades using TradeService
  const fetchTradesFallback = useCallback(async () => {
    try {
      console.log('Using fallback method to fetch trades...');
      const result = await tradeService.getTradesByStatus('open', 20);
      
      if (result.error) {
        console.error('Fallback fetch failed:', result.error);
        setError(result.error.message || 'Failed to fetch trades');
        return;
      }

      if (result.data) {
        console.log('Fallback fetched trades:', result.data.length, 'items');
        setTrades(result.data as ExtendedTrade[]);
        
        // Fetch creators for the trades
        const creatorIds = result.data
          .map(trade => trade.creatorId)
          .filter((id, index, self) => id && self.indexOf(id) === index);
        
        if (creatorIds.length > 0) {
          await fetchTradeCreators(creatorIds);
        }
      }
    } catch (err: any) {
      console.error('Fallback fetch error:', err);
      setError(err.message || 'Failed to fetch trades');
    }
  }, [fetchTradeCreators]);

  // Realtime trades via onSnapshot
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      const db = getSyncFirebaseDb();
      const tradesCol = collection(db, 'trades');
      const q = fsQuery(
        tradesCol,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const items = snapshot.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
            .filter(trade => !!trade.id) as ExtendedTrade[];
          
          console.log('Fetched trades:', items.length, 'items');
          setTrades(items);

          // Fetch creators for the trades
          const creatorIds = items
            .map(trade => (trade as any).creatorId)
            .filter((id, index, self) => id && self.indexOf(id) === index) as string[];
          
          if (creatorIds.length > 0) {
            await fetchTradeCreators(creatorIds);
          }
          setLoading(false);
        } catch (err: any) {
          console.error('Error processing realtime trades:', err);
          setError(err.message || 'Failed to process trades');
          setLoading(false);
        }
      }, (err) => {
        console.error('Error subscribing to trades:', err);
        console.log('Attempting fallback fetch...');
        fetchTradesFallback().finally(() => setLoading(false));
      });

      return () => {
        unsubscribe();
      };
    } catch (err: any) {
      console.error('Error setting up trades listener:', err);
      console.log('Attempting fallback fetch...');
      fetchTradesFallback().finally(() => setLoading(false));
    }
  }, [fetchTradeCreators, fetchTradesFallback]);

  // Load search and filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const status = params.get('status') || '';
    const category = params.get('category') || '';
    const time = params.get('time') || '';
    const skillLevel = params.get('skillLevel') || '';
    const skills = params.getAll('skills');

    if (q) {
      setSearchTerm(q);
    }

    const loadedFilters: any = {};
    if (status) loadedFilters.status = status;
    if (category) loadedFilters.category = category;
    if (time) loadedFilters.timeCommitment = time;
    if (skillLevel) loadedFilters.skillLevel = skillLevel;
    if (skills.length > 0) loadedFilters.skills = skills;
    if (Object.keys(loadedFilters).length > 0) setFilters(loadedFilters);
  }, []);

  // Sync search and filters to URL on change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (filters.status) params.set('status', String(filters.status));
    if (filters.category) params.set('category', String(filters.category));
    if (filters.timeCommitment) params.set('time', String(filters.timeCommitment));
    if (filters.skillLevel) params.set('skillLevel', String(filters.skillLevel));
    if (Array.isArray(filters.skills) && filters.skills.length > 0) {
      filters.skills.forEach((s: string) => params.append('skills', s));
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, filters]);

  // Handle initiate trade button click
  const handleInitiateTrade = useCallback((tradeId: string) => {
    if (!currentUser) {
      addToast('error', 'Please log in to initiate a trade');
      return;
    }

    if (!tradeId) {
      addToast('error', 'Invalid trade ID');
      return;
    }

    navigate(`/trades/${tradeId}`);
  }, [currentUser, navigate, addToast]);

  // Helper function to get skills
  const getTradeSkills = useCallback((trade: ExtendedTrade, type: 'offered' | 'wanted') => {
    let skills: any[] = [];
    if (type === 'offered') {
      skills = trade.skillsOffered || trade.offeredSkills || [];
    } else {
      skills = trade.skillsWanted || trade.requestedSkills || [];
    }
    
    // Extract skill names for filtering (handle both string and object formats)
    return skills.map(skill => {
      if (typeof skill === 'string') return skill;
      if (typeof skill === 'object' && skill.name) return skill.name;
      return String(skill);
    });
  }, []);

  // Choose backend results when searching/filters are active; apply client-only filters afterward
  const filteredTrades = useMemo(() => {
    const hasFiltersActive = Object.values(filters).some(v => v !== '' && v !== undefined && v !== null && (!(Array.isArray(v)) || v.length > 0));
    let result: ExtendedTrade[] = (searchTerm || hasFiltersActive)
      ? (searchedTrades as unknown as ExtendedTrade[])
      : trades;

    if (filters.timeCommitment) {
      result = result.filter(trade => String((trade as any).timeCommitment || '').toLowerCase() === String(filters.timeCommitment).toLowerCase());
    }

    if (filters.skillLevel) {
      result = result.filter(trade => String((trade as any).skillLevel || '').toLowerCase() === String(filters.skillLevel).toLowerCase());
    }

    if (Array.isArray(filters.skills) && filters.skills.length > 0) {
      const selected = filters.skills.map((s: string) => s.toLowerCase());
      result = result.filter(trade => {
        const offered = getTradeSkills(trade, 'offered').map(s => String(s).toLowerCase());
        const wanted = getTradeSkills(trade, 'wanted').map(s => String(s).toLowerCase());
        return selected.some((s: string) => offered.includes(s) || wanted.includes(s));
      });
    }

    return result;
  }, [trades, searchedTrades, searchTerm, filters, getTradeSkills]);

  // Enhanced trades with creator info
  const enhancedTrades = useMemo(() => {
    return filteredTrades
      .filter(trade => trade.id) // Only include trades with valid IDs
      .map(trade => {
        const creator = tradeCreators[trade.creatorId || ''];
        return {
          ...trade,
          id: trade.id!, // Assert that id exists since we filtered above
          creatorName: creator?.displayName || 'Unknown User',
          creatorPhotoURL: creator?.photoURL || creator?.profilePicture,
                  } as ExtendedTrade;
      });
  }, [filteredTrades, tradeCreators]);

  // Derive available skills from current trades (offered + wanted)
  const availableSkills = useMemo(() => {
    const frequencyByKey: Record<string, number> = {};
    const displayByKey: Record<string, string> = {};
    const source = trades.length > 0 ? trades : filteredTrades;
    const addSkill = (raw: unknown) => {
      const s = String(raw || '').trim();
      if (!s) return;
      const key = s.toLowerCase();
      if (!displayByKey[key]) displayByKey[key] = s;
      frequencyByKey[key] = (frequencyByKey[key] || 0) + 1;
    };
    source.forEach(trade => {
      getTradeSkills(trade as ExtendedTrade, 'offered').forEach(addSkill);
      getTradeSkills(trade as ExtendedTrade, 'wanted').forEach(addSkill);
    });
    return Object.keys(frequencyByKey)
      .sort((a, b) => {
        const byFreq = (frequencyByKey[b] || 0) - (frequencyByKey[a] || 0);
        if (byFreq !== 0) return byFreq;
        return displayByKey[a].localeCompare(displayByKey[b]);
      })
      .map(k => displayByKey[k])
      .slice(0, 50);
  }, [trades, filteredTrades, getTradeSkills]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value && 'start' in value && 'end' in value) {
        // @ts-ignore
        return value.start != null || value.end != null;
      }
      return true;
    });
  }, [filters]);

  // Debounced search when term or filters change (MVP: 300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchTerm || hasActiveFilters) {
        search(searchTerm, filters);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, filters, hasActiveFilters, search, clearSearch]);

  const handleSearch = (term: string, f: { category?: string }) => {
    search(term, { ...filters, category: f.category || filters.category });
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stack gap="lg">
        <StandardPageHeader
          title="Available Trades"
          description="Discover and participate in skill exchanges with other developers"
          isLoading={loading}
          loadingMessage="Loading trades..."
          actions={
            <div className="flex gap-2 items-center">
              <PerformanceMonitor pageName="TradesPage" />
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/trades/new')}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Trade
              </Button>
            </div>
          }
        />

        <Box className="mb-8">
          <EnhancedSearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchTermChange}
            onSearch={(term) => search(term, filters)}
            onToggleFilters={() => setShowFilterPanel(true)}
            hasActiveFilters={hasActiveFilters}
            resultsCount={searchTerm || hasActiveFilters ? totalCount : enhancedTrades.length}
            isLoading={loading || searchLoading}
            placeholder="Search trades by title, offered or wanted skills..."
          />

          <EnhancedFilterPanel
            isOpen={showFilterPanel}
            onClose={() => setShowFilterPanel(false)}
            filters={filters}
            onFiltersChange={(f: any) => {
              setFilters(f);
              search(searchTerm, f);
            }}
            onClearFilters={() => {
              setFilters({});
              clearSearch();
            }}
            availableSkills={availableSkills}
            persistenceKey="trades-filters"
          />

          {searchTerm && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-sm text-primary hover:text-primary/80 underline"
                aria-label="Clear search"
              >
                Clear search
              </button>
            </div>
          )}
        </Box>

        {loading ? (
          <TradeListSkeleton count={5} />
        ) : error ? (
          <Box className="col-span-full bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center">
            <p className="text-destructive-foreground">{error}</p>
            <div className="mt-2 text-sm text-muted-foreground">
              Debug info: Trades count: {trades.length}, Enhanced trades: {enhancedTrades.length}
            </div>
            <AnimatedButton onClick={() => window.location.reload()} className="mt-4" tradingContext="general" variant="secondary">
              Try Again
            </AnimatedButton>
          </Box>
        ) : enhancedTrades.length === 0 ? (
          <Box className="col-span-full bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center">
            <h3 className="text-xl font-semibold text-foreground">No Trades Found</h3>
            <p className="text-muted-foreground mt-2">
              No trades match your search criteria. Try a different search term or create a new trade!
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              Debug info: Raw trades: {trades.length}, Filtered trades: {filteredTrades.length}, Enhanced trades: {enhancedTrades.length}
            </div>
            <AnimatedButton onClick={() => navigate('/trades/new')} className="mt-4" tradingContext="proposal" variant="primary">
              Create Your First Trade
            </AnimatedButton>
          </Box>
        ) : (
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
            {enhancedTrades.map((trade) => (
              <motion.div
                key={trade.id}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <TradeCard
                  trade={trade}
                  onInitiateTrade={handleInitiateTrade}
                  className="h-full"
                />
              </motion.div>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        <Cluster justify="center" gap="md" className="mt-8">
          <AnimatedButton variant="outline" disabled tradingContext="general">
            Previous
          </AnimatedButton>
          <AnimatedButton variant="outline" disabled tradingContext="general">
            Next
          </AnimatedButton>
        </Cluster>
      </Stack>
    </Box>
  );
};

export default TradesPage;
