// src/components/features/portfolio/PortfolioTab.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPortfolioItems } from '../../../services/portfolio';
import { PortfolioItem } from '../../../types/portfolio';
import PortfolioItemComponent from './PortfolioItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, List, Filter, Settings, Star, X } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'trades' | 'collaborations' | 'challenges' | 'featured'>('all');
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const navigate = useNavigate();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    const options = !isOwnProfile ? { onlyVisible: true } : {};
    const items = await getUserPortfolioItems(userId, options);
    setPortfolioItems(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId, isOwnProfile]);

  const filteredItems = useMemo(() => {
    let items = portfolioItems;
    switch (filter) {
      case 'trades':
        items = items.filter(item => item.sourceType === 'trade');
        break;
      case 'collaborations':
        items = items.filter(item => item.sourceType === 'collaboration');
        break;
      case 'challenges':
        items = items.filter(item => item.sourceType === 'challenge');
        break;
      case 'featured':
        items = items.filter(item => item.featured);
        break;
      default:
        break;
    }
    if (skillFilter) {
      const s = skillFilter.toLowerCase();
      items = items.filter(it => Array.isArray((it as any).skills) && (it as any).skills.some((k: string) => (k || '').toLowerCase() === s));
    }
    return items;
  }, [portfolioItems, filter, skillFilter]);

  // Split featured (pinned) items for 'all' view without skill filter
  const pinnedItems = useMemo(() => {
    if (filter !== 'all' || skillFilter) return [] as PortfolioItem[];
    return filteredItems.filter(it => !!it.featured);
  }, [filteredItems, filter, skillFilter]);

  const regularItems = useMemo(() => {
    if (filter !== 'all' || skillFilter) return filteredItems;
    const pinnedIds = new Set(pinnedItems.map(it => it.id));
    return filteredItems.filter(it => !pinnedIds.has(it.id));
  }, [filteredItems, pinnedItems, filter, skillFilter]);

  // Listen for skill filter events from the Profile header
  useEffect(() => {
    const onSkill = (e: Event) => {
      const detail = (e as CustomEvent).detail as { skill?: string };
      if (detail?.skill) setSkillFilter(detail.skill);
    };
    window.addEventListener('portfolio:filter-skill', onSkill as EventListener);
    return () => window.removeEventListener('portfolio:filter-skill', onSkill as EventListener);
  }, []);

  // Move focus to heading when a skill filter is applied for better a11y
  useEffect(() => {
    if (skillFilter && headingRef.current) {
      headingRef.current.focus();
    }
  }, [skillFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
      <div className="w-full space-y-6">
      {/* Enhanced Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 text-accent-500 p-2 shrink-0">
              <Star className="w-5 h-5 fill-current text-warning-500" />
            </div>
            <div>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-xl font-semibold text-text-primary outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded"
              >
                Portfolio
              </h2>
              <p className="text-sm text-text-muted">
                {portfolioItems.length} {portfolioItems.length === 1 ? 'item' : 'items'}
                {filteredItems.length !== portfolioItems.length && ` • ${filteredItems.length} shown`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {skillFilter && (
              <button
                type="button"
                onClick={() => setSkillFilter(null)}
                className="inline-flex items-center gap-1 rounded-full glassmorphic border-glass px-3 py-1 text-sm hover:bg-white/20 transition-all duration-200"
                aria-label={`Clear skill filter ${skillFilter}`}
                title="Clear skill filter"
              >
                <span className="font-medium">Skill:</span>
                <span>{skillFilter}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* View Mode Toggle */}
            <div className="glassmorphic border-glass flex items-center p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/10'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/10'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'trades' | 'collaborations' | 'challenges' | 'featured')}
                className="appearance-none glassmorphic border-glass rounded-lg text-sm text-text-primary outline-hidden focus:ring-2 focus:ring-primary/50 transition-all duration-200 py-2 pl-3 pr-8 w-full sm:w-auto"
                aria-label="Filter portfolio items"
              >
                <option value="all">All Items</option>
                <option value="trades">Trades</option>
                <option value="collaborations">Collaborations</option>
                <option value="challenges">Challenges</option>
                <option value="featured">Featured</option>
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            </div>

            {/* Management Toggle */}
            {isOwnProfile && (
              <button
                onClick={() => setIsManaging(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isManaging
                    ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                    : 'glassmorphic border-glass text-text-secondary hover:bg-white/20'
                }`}
                title={isManaging ? 'Exit management mode' : 'Manage portfolio'}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{isManaging ? 'Done' : 'Manage'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-6">
        {loading ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Cluster gap="sm" justify="center" align="center" className="text-text-muted">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Loading portfolio...</span>
            </Cluster>
          </motion.div>
         ) : filteredItems.length === 0 ? (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glassmorphic border-glass text-center p-12">
            <Stack gap="lg" align="center">
              <Box className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
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
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/portfolio')}
                  className="inline-flex items-center rounded-lg text-sm font-medium glassmorphic border-glass hover:bg-white/20 transition-all duration-200 px-4 py-2"
                >
                  Add project
                </button>
              )}
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="inline-flex items-center rounded-lg text-sm font-medium glassmorphic border-glass hover:bg-white/20 transition-all duration-200 px-4 py-2"
                >
                  View all items
                </button>
              )}
            </Stack>
          </motion.div>
      ) : (
           <AnimatePresence mode="wait">
            {/* Pinned row */}
            {pinnedItems.length > 0 && (
              <Stack gap="sm" className="mb-4">
                <div className="text-sm font-medium text-accent-500">Pinned</div>
                <Grid columns={viewMode === 'list' ? { base: 1 } : { base: 1, md: 2, xl: 3 }} gap="md">
                  {pinnedItems.map((item, index) => (
                    <motion.div key={`pinned-${item.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                      <Box>
                        <PortfolioItemComponent item={item} isOwnProfile={isOwnProfile} isManaging={isManaging} onChange={fetchPortfolio} />
                      </Box>
                    </motion.div>
                  ))}
                </Grid>
              </Stack>
            )}
            <motion.div key={`${viewMode}-${filter}-${skillFilter ? 'skill' : 'all'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Grid
                columns={viewMode === 'list' ? { base: 1 } : { base: 1, md: 2, xl: 3 }}
                gap="md"
                className="portfolio-items @container"
                style={{ containerType: 'inline-size' }}
              >
                {(filter === 'all' && !skillFilter ? regularItems : filteredItems).map((item, index) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <Box>
                      <PortfolioItemComponent
                        item={item}
                        isOwnProfile={isOwnProfile}
                        isManaging={isManaging}
                        onChange={fetchPortfolio}
                      />
                    </Box>
                  </motion.div>
                ))}
              </Grid>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      </div>
    </motion.div>
  );
};

export default PortfolioTab;
