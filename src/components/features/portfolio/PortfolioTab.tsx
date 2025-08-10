// src/components/features/portfolio/PortfolioTab.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { getUserPortfolioItems } from '../../../services/portfolio';
import { PortfolioItem } from '../../../types/portfolio';
import PortfolioItemComponent from './PortfolioItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, List, Filter, Settings, Star } from 'lucide-react';
import Box from '../../layout/primitives/Box';
import Stack from '../../layout/primitives/Stack';
import Cluster from '../../layout/primitives/Cluster';
import Grid from '../../layout/primitives/Grid';

interface PortfolioTabProps {
  userId: string;
  isOwnProfile: boolean;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ userId, isOwnProfile }) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'trades' | 'collaborations' | 'featured'>('all');
  const [loading, setLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const fetchPortfolio = async () => {
    setLoading(true);
    const options = !isOwnProfile ? { onlyVisible: true } : {};
    const items = await getUserPortfolioItems(userId, options);
    setPortfolioItems(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();
    // eslint-disable-next-line
  }, [userId, isOwnProfile]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'trades':
        return portfolioItems.filter(item => item.sourceType === 'trade');
      case 'collaborations':
        return portfolioItems.filter(item => item.sourceType === 'collaboration');
      case 'featured':
        return portfolioItems.filter(item => item.featured);
      default:
        return portfolioItems;
    }
  }, [portfolioItems, filter]);

  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="portfolio-container"
      style={{ containerType: 'inline-size' }}
    >
      {/* Enhanced Header */}
      <Box className="portfolio-header">
        <Cluster
          justify="between"
          align="center"
          gap="md"
          wrap={true}
          className="flex-col sm:flex-row"
        >
          <Cluster gap="sm" align="center">
            <Box className="rounded-lg bg-accent/10 text-accent" style={{ padding: '0.5rem' }}>
              <Star className="w-5 h-5" />
            </Box>
            <Stack gap="xs">
              <h2 className="text-xl font-semibold text-text-primary">
                Portfolio
              </h2>
              <p className="text-sm text-text-muted">
                {portfolioItems.length} {portfolioItems.length === 1 ? 'item' : 'items'}
                {filteredItems.length !== portfolioItems.length && ` • ${filteredItems.length} shown`}
              </p>
            </Stack>
          </Cluster>

          {/* Controls */}
          <Cluster gap="sm" align="center">
            {/* View Mode Toggle */}
            <Box className="bg-background-secondary/50 backdrop-blur-sm border border-border/30 rounded-lg" style={{ display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </Box>

            {/* Filter Dropdown */}
            <Box className="relative">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className="appearance-none bg-background-secondary/50 backdrop-blur-sm border border-border/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                style={{ padding: '0.5rem 2rem 0.5rem 0.75rem' }}
              >
                <option value="all">All Items</option>
                <option value="trades">Trades</option>
                <option value="collaborations">Collaborations</option>
                <option value="featured">Featured</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            </Box>

            {/* Management Toggle */}
            {isOwnProfile && (
              <button
                onClick={() => setIsManaging(v => !v)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isManaging
                    ? 'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90'
                    : 'bg-background-secondary/50 backdrop-blur-sm border border-border/30 text-text-secondary hover:bg-background-secondary'
                }`}
                title={isManaging ? 'Exit management mode' : 'Manage portfolio'}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{isManaging ? 'Done' : 'Manage'}</span>
              </button>
            )}
          </Cluster>
        </Cluster>
      </Box>
      <Stack gap="lg">
        {loading ? (
          <Box
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
            style={{ padding: '3rem 0' }}
          >
            <Cluster gap="sm" justify="center" align="center" className="text-text-muted">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Loading portfolio...</span>
            </Cluster>
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="backdrop-blur-md bg-background-secondary/60 border border-border/30 rounded-xl shadow-lg text-center"
            style={{ padding: '3rem' }}
          >
            <Stack gap="lg" align="center">
              <Box className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star className="w-8 h-8 text-primary" />
              </Box>
              <Stack gap="sm" align="center">
                <h3 className="text-xl font-semibold text-text-primary">
                  {filter === 'all' ? 'No portfolio items yet' : `No ${filter} items found`}
                </h3>
                <p className="text-text-muted max-w-md leading-relaxed">
                  {isOwnProfile
                    ? 'Complete trades and collaborations to automatically build your portfolio and showcase your skills.'
                    : 'This user hasn\'t added any portfolio items yet.'
                  }
                </p>
              </Stack>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="rounded-lg text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem' }}
                >
                  View all items
                </button>
              )}
            </Stack>
          </Box>
      ) : (
          <AnimatePresence mode="wait">
            <Grid
              as={motion.div}
              key={`${viewMode}-${filter}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              columns={viewMode === 'list' ? { base: 1 } : { base: 1, md: 2, lg: 3 }}
              gap="lg"
              className="portfolio-items @container"
              style={{ containerType: 'inline-size' }}
            >
              {filteredItems.map((item, index) => (
                <Box
                  key={item.id}
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <PortfolioItemComponent
                    item={item}
                    isOwnProfile={isOwnProfile}
                    isManaging={isManaging}
                    onChange={fetchPortfolio}
                  />
                </Box>
              ))}
            </Grid>
          </AnimatePresence>
        )}
      </Stack>
    </Box>
  );
};

export default PortfolioTab;
