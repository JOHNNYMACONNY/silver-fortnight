import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUserProfile, User, getAllTrades } from '../services/firestore-exports';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import TradeCard, { ExtendedTrade } from '../components/features/trades/TradeCard';
import { motion } from 'framer-motion';
import { AdvancedSearch } from '../components/features/search/AdvancedSearch';
import { TradeListSkeleton } from '../components/ui/skeletons/TradeCardSkeleton';
import { useToast } from '../contexts/ToastContext';
import { AnimatedButton } from '../components/animations';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';

export const TradesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<ExtendedTrade[]>([]);
  const [tradeCreators, setTradeCreators] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState({ searchTerm: '', category: '' });

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

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filters
      const filters = {
        status: 'open' as const
      };

      // Build pagination
      const pagination = {
        limit: 20,
        orderByField: 'createdAt',
        orderDirection: 'desc' as const
      };

      // Fetch trades directly from Firestore
      const { data: tradesResult, error: tradesError } = await getAllTrades(pagination, filters);

      if (tradesError) {
        throw new Error(tradesError.message);
      }

      if (tradesResult?.items) {
        console.log(`✅ TradesPage: Fetched ${tradesResult.items.length} trades`);
        setTrades(tradesResult.items as ExtendedTrade[]);

        // Fetch creators for the trades
        const creatorIds = tradesResult.items
          .map(trade => trade.creatorId)
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (creatorIds.length > 0) {
          await fetchTradeCreators(creatorIds as string[]);
        }
      } else {
        setTrades([]);
      }
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message || 'Failed to fetch trades');
      addToast('error', 'Failed to load trades. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchTradeCreators]);

  // Fetch trades on component mount
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

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

  // Filter trades based on search term
  const filteredTrades = useMemo(() => {
    if (!searchFilter.searchTerm) return trades;
    
    const lowercasedFilter = searchFilter.searchTerm.toLowerCase();
    
    return trades.filter(trade => {
      const titleMatch = trade.title?.toLowerCase().includes(lowercasedFilter);
      const offeredSkillsMatch = getTradeSkills(trade, 'offered').some(skill =>
        skill.toLowerCase().includes(lowercasedFilter)
      );
      const wantedSkillsMatch = getTradeSkills(trade, 'wanted').some(skill =>
        skill.toLowerCase().includes(lowercasedFilter)
      );
      return titleMatch || offeredSkillsMatch || wantedSkillsMatch;
    });
  }, [trades, searchFilter.searchTerm, getTradeSkills]);

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

  const handleSearch = (term: string, filters: { category?: string }) => {
    setSearchFilter({ searchTerm: term, category: filters.category || '' });
  };

  const handleSearchTermChange = (term: string) => {
    setSearchFilter(prev => ({ ...prev, searchTerm: term }));
  };

  return (
    <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stack gap="lg">
        <Cluster justify="between" align="center" gap="md" className="mb-6 flex-col md:flex-row">
          <h1 className="text-3xl font-bold text-foreground">Available Trades</h1>
          <Cluster gap="sm" align="center">
            <PerformanceMonitor pageName="TradesPage" />
            <AnimatedButton
              onClick={() => navigate('/trades/new')}
              className="whitespace-nowrap"
              tradingContext="proposal"
              variant="primary"
            >
              Create New Trade
            </AnimatedButton>
          </Cluster>
        </Cluster>

        <Box className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border mb-8">
          <AdvancedSearch 
            onSearch={handleSearch} 
            searchTerm={searchFilter.searchTerm}
            onSearchChange={handleSearchTermChange}
          />
        </Box>

        {loading ? (
          <TradeListSkeleton count={5} />
        ) : error ? (
          <Box className="col-span-full bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center">
            <p className="text-destructive-foreground">{error}</p>
            <AnimatedButton onClick={fetchTrades} className="mt-4" tradingContext="general" variant="secondary">
              Try Again
            </AnimatedButton>
          </Box>
        ) : enhancedTrades.length === 0 ? (
          <Box className="col-span-full bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center">
            <h3 className="text-xl font-semibold text-foreground">No Trades Found</h3>
            <p className="text-muted-foreground mt-2">
              No trades match your search criteria. Try a different search term or create a new trade!
            </p>
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
