import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, Plus, TrendingUp, Users } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface SearchEmptyStateProps {
  searchTerm?: string;
  hasActiveFilters?: boolean;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onCreateCollaboration?: () => void;
  suggestions?: string[];
  className?: string;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  searchTerm,
  hasActiveFilters,
  onClearSearch,
  onClearFilters,
  onCreateCollaboration,
  suggestions = [],
  className
}) => {
  const defaultSuggestions = [
    'Try different keywords',
    'Check your spelling',
    'Use broader terms',
    'Remove some filters',
    'Browse all collaborations'
  ];

  const finalSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card
        variant="glass"
        className="backdrop-blur-md bg-glass-bg border border-glass-border rounded-xl shadow-glass p-12 text-center"
      >
        {/* Icon */}
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className="mx-auto w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center"
        >
          <Search className="w-10 h-10 text-orange-600 dark:text-orange-400" />
        </motion.div>

        {/* Title */}
        <motion.h3
          variants={itemVariants}
          initial="initial"
          animate="animate"
          className="text-2xl font-semibold text-foreground mb-3"
        >
          {searchTerm || hasActiveFilters ? 'No Collaborations Found' : 'Your Next Great Collaboration Awaits'}
        </motion.h3>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed"
        >
          {searchTerm || hasActiveFilters 
            ? `No collaborations match your search for "${searchTerm}". Try adjusting your search terms or filters to find what you're looking for.`
            : 'This is your space to team up, create amazing things, and grow your skills. Start a collaboration and see what you can build together.'
          }
        </motion.p>

        {/* Search Stats (if applicable) */}
        {searchTerm && (
          <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 bg-muted/30 rounded-lg"
          >
            <div className="text-sm text-muted-foreground">
              <p>Searched for: <span className="font-medium text-foreground">"{searchTerm}"</span></p>
              {hasActiveFilters && <p className="mt-1">With active filters applied</p>}
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h4 className="text-sm font-medium text-foreground mb-3">Try these suggestions:</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {finalSuggestions.slice(0, 3).map((suggestion, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 + index * 0.1 }}
                className="inline-flex items-center px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground"
              >
                <TrendingUp className="w-3 h-3 mr-1.5" />
                {suggestion}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {/* Clear Search/Filters */}
          {(searchTerm || hasActiveFilters) && (
            <>
              {searchTerm && onClearSearch && (
                <Button
                  variant="outline"
                  onClick={onClearSearch}
                  className="inline-flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Search
                </Button>
              )}
              {hasActiveFilters && onClearFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="inline-flex items-center"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </>
          )}

          {/* Create Collaboration */}
          <Button
            onClick={onCreateCollaboration}
            className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Your First Collaboration
          </Button>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-border/50"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Browse all collaborations</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Popular categories</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              <span>Advanced search</span>
            </div>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SearchEmptyState; 