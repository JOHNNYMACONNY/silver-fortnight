import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/skeletons/CardSkeleton';
import {
  getUserPortfolioItems,
  deletePortfolioItem,
  updatePortfolioItem,
  copyPortfolioItemLink
} from '../services/portfolio';
import { PortfolioItem } from '../types/portfolio';
import { getDisplayData, getBadgeVariant } from '../utils/portfolioHelpers';
import { formatDateWithTooltip } from '../utils/dateFormatters';
import { 
  User, Star, Calendar, Award, ExternalLink, FolderKanban, Code, CheckCircle,
  Search, Filter, MoreVertical, Edit, Share2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { PortfolioItemEditModal } from '../components/features/portfolio/PortfolioItemEditModal';

const PortfolioPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'trades' | 'collaborations' | 'challenges' | 'featured'>('all');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadPortfolioItems = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const items = await getUserPortfolioItems(userId);
      setPortfolioItems(items);
    } catch (err) {
      setError('Failed to load portfolio. Please try again later.');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    if (!currentUser?.uid) return;
    await loadPortfolioItems(currentUser.uid);
  };

  // Close quick actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQuickActions && !(event.target as Element).closest('.quick-actions-menu')) {
        setShowQuickActions(null);
      }
    };
    
    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickActions]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    void loadPortfolioItems(currentUser.uid);
  }, [currentUser?.uid]);

  // Calculate stats dynamically
  const stats = useMemo(() => {
    const uniqueSkills = new Set(portfolioItems.flatMap(item => item.skills || []));
    return {
      totalProjects: portfolioItems.length,
      averageRating: 4.7, // Placeholder - PortfolioItem doesn't have rating field
      skillsCount: uniqueSkills.size,
      completedTrades: portfolioItems.filter(item => item.sourceType === 'trade').length
    };
  }, [portfolioItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = portfolioItems;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.skills || []).some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    // Apply type filter
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
    
    return items;
  }, [portfolioItems, searchTerm, filter]);

  // Handle stat clicks for filtering
  const handleStatClick = (statType: 'all' | 'trades' | 'skills') => {
    if (statType === 'all') {
      setFilter('all');
      setSearchTerm('');
    } else if (statType === 'trades') {
      setFilter('trades');
    } else if (statType === 'skills') {
      // Could show skill breakdown or filter by most common skill
      setFilter('all');
    }
  };

  // Handle quick actions
  const handleQuickAction = async (action: 'edit' | 'share' | 'delete', itemId: string) => {
    setShowQuickActions(null);
    setActionLoading(itemId);

    try {
      switch (action) {
        case 'edit':
          if (!currentUser?.uid) {
            showToast('You must be logged in to edit', 'error');
            break;
          }
          {
            const itemToEdit = portfolioItems.find(i => i.id === itemId);
            if (itemToEdit) {
              setEditingItem(itemToEdit);
              setIsEditModalOpen(true);
            } else {
              showToast('Portfolio item not found', 'error');
            }
          }
          break;
        case 'share':
          if (!currentUser?.uid) {
            showToast('You must be logged in to share', 'error');
            break;
          }
          {
            const result = await copyPortfolioItemLink(currentUser.uid, itemId);
            if (result.success) {
              showToast('Link copied to clipboard!', 'success');
            } else {
              showToast(result.error || 'Failed to copy link', 'error');
            }
          }
          break;
        case 'delete':
          if (!currentUser?.uid) {
            showToast('You must be logged in to delete', 'error');
            break;
          }
          if (!window.confirm('Are you sure you want to delete this portfolio item? This action cannot be undone.')) {
            setActionLoading(null);
            return;
          }
          {
            const result = await deletePortfolioItem(currentUser.uid, itemId);
            if (result.success) {
              await refreshPortfolio();
              showToast('Portfolio item deleted', 'success');
            } else {
              showToast(result.error || 'Failed to delete item', 'error');
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error in quick action:', error);
      showToast('An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-foreground">
          {currentUser ? `${currentUser.displayName}'s Portfolio` : 'Portfolio'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Showcase your best work and skills to attract potential <span className="text-accent-500">trading partners</span>
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} variant="elevated" className="p-6" />
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card 
                variant="elevated" 
                className="p-6 text-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleStatClick('all')}
                aria-label="Total Projects - Click to view all items"
              >
                <div className="flex items-center justify-center mb-2">
                  <FolderKanban className="h-6 w-6 text-primary-500 mr-2" />
                  <div className="text-2xl font-bold text-primary-500">{stats.totalProjects}</div>
                </div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card variant="elevated" className="p-6 text-center">
                <div className="flex items-center justify-center text-2xl font-bold text-accent-500">
                  {stats.averageRating}
                  <Star className="h-5 w-5 ml-1 fill-current text-warning-500" />
                </div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card 
                variant="elevated" 
                className="p-6 text-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleStatClick('skills')}
                aria-label="Skills - Click to view skill breakdown"
              >
                <div className="flex items-center justify-center mb-2">
                  <Code className="h-6 w-6 text-secondary-600 dark:text-secondary-400 mr-2" />
                  <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{stats.skillsCount}</div>
                </div>
                <div className="text-sm text-muted-foreground">Skills</div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card 
                variant="elevated" 
                className="p-6 text-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleStatClick('trades')}
                aria-label="Completed Trades - Click to filter by trades"
              >
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-primary-500 mr-2" />
                  <div className="text-2xl font-bold text-primary-500">{stats.completedTrades}</div>
                </div>
                <div className="text-sm text-muted-foreground">Completed Trades</div>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card variant="elevated" className="p-6 border-destructive/50 bg-destructive/10">
          <p className="text-destructive text-center">{error}</p>
        </Card>
      )}

      {/* Portfolio Items */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Portfolio <span className="text-accent-500">Items</span>
          </h2>
          <Button 
            variant="glassmorphic"
            onClick={() => navigate('/portfolio/add')}
            aria-label="Add new project to portfolio"
          >
            <Award className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search portfolio items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Search portfolio items"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="appearance-none glassmorphic border-glass rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 py-2 pl-10 pr-8 w-full sm:w-auto"
              aria-label="Filter portfolio items"
            >
              <option value="all">All Items</option>
              <option value="trades">Trades</option>
              <option value="collaborations">Collaborations</option>
              <option value="challenges">Challenges</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>

        {/* Portfolio Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} variant="premium" className="p-6" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card variant="premium" className="p-12 text-center" glow="subtle" glowColor="orange">
            <Search className="h-16 w-16 mx-auto text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm || filter !== 'all' ? 'No items found' : 'No portfolio items yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter to find what you\'re looking for.'
                : 'Start showcasing your work to attract better trades and collaboration opportunities.'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button 
                variant="glassmorphic"
                onClick={() => navigate('/portfolio/add')}
              >
                <Award className="h-4 w-4 mr-2" />
                Add Your First Project
              </Button>
            )}
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${searchTerm}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item, index) => {
                const displayData = getDisplayData(item);
                const dateInfo = formatDateWithTooltip(item.completedAt);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card variant="premium" className="p-6 relative group" hover={true}>
                      {/* Quick Actions Menu */}
                      <div className="absolute top-4 right-4 z-10 quick-actions-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQuickActions(showQuickActions === item.id ? null : item.id);
                          }}
                          className="p-2 rounded-lg glassmorphic border-glass hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                          aria-label="More options"
                          aria-expanded={showQuickActions === item.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {showQuickActions === item.id && (
                          <div 
                            className="absolute right-0 mt-2 w-48 glassmorphic border-glass rounded-lg shadow-lg p-2 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleQuickAction('edit', item.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/20 transition-colors text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading === item.id}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleQuickAction('share', item.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/20 transition-colors text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading === item.id}
                            >
                              <Share2 className="h-4 w-4" />
                              Share
                            </button>
                            <button
                              onClick={() => handleQuickAction('delete', item.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/20 text-destructive transition-colors text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading === item.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <h3 className="font-semibold text-foreground">{displayData.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{displayData.description}</p>
                          </div>
                          <Badge 
                            variant={getBadgeVariant(displayData.sourceType, displayData.category)} 
                            className="capitalize shrink-0"
                          >
                            {displayData.displayType}
                          </Badge>
                        </div>

                        {displayData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {displayData.skills.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {displayData.skills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{displayData.skills.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div 
                            className="flex items-center"
                            title={dateInfo.tooltip}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            {dateInfo.display}
                          </div>
                          {item.featured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          )}
                        </div>

                        {displayData.displayLink && (
                          <Button variant="glassmorphic" className="w-full" asChild>
                            <a href={displayData.displayLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Project
                            </a>
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Empty State for New Users */}
      {!loading && portfolioItems.length === 0 && (
        <Card variant="premium" className="p-12 text-center" glow="subtle" glowColor="orange">
          <User className="h-16 w-16 mx-auto text-primary-500 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Build Your Portfolio
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Start showcasing your work to attract better trades and collaboration opportunities
          </p>
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6 max-w-lg mx-auto text-left">
            <h4 className="text-sm font-semibold text-foreground mb-2">Tips for a great portfolio:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Include screenshots and evidence of your work</li>
              <li>Describe your process and key achievements</li>
              <li>Highlight the skills you used</li>
              <li>Link to live projects or repositories when possible</li>
            </ul>
          </div>
          <Button 
            variant="glassmorphic"
            onClick={() => navigate('/portfolio/add')}
          >
            <Award className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </Card>
      )}

      {/* Call to Action - Conditional Display */}
      {!loading && portfolioItems.length > 0 && portfolioItems.length < 3 && (
        <Card variant="premium" className="p-8 text-center" glow="subtle" glowColor="orange">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Ready to Start Trading?
          </h3>
          <p className="text-muted-foreground mb-4">
            Your portfolio showcases your skills. Now find others to trade with!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="glassmorphic" asChild topic="trades">
              <a href="/trades">Browse Trades</a>
            </Button>
            <Button variant="premium-outline" asChild>
              <a href="/collaborations">Find Collaborations</a>
            </Button>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <PortfolioItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSuccess={async () => {
          await refreshPortfolio();
          showToast('Portfolio item updated successfully', 'success');
        }}
      />
    </div>
  );
};

export default PortfolioPage; 