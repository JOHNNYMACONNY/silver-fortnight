import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Sparkles, TrendingUp, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';

interface EnhancedSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: (term: string, filters?: any) => void;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
  resultsCount: number;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  onToggleFilters,
  hasActiveFilters,
  activeFiltersCount = 0,
  resultsCount,
  isLoading = false,
  placeholder = "Search collaborations by title, description, or participants...",
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular search suggestions
  const suggestions = [
    'React Development',
    'UI/UX Design', 
    'Mobile App Development',
    'Content Writing',
    'Digital Marketing',
    'Data Analysis'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Let page-level debounced effects react to searchTerm changes.
    if (searchTerm.trim()) {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Card 
        variant="glass"
        tilt={false}
        depth="lg"
        glow="subtle"
        glowColor="orange"
        hover={true}
        interactive={true}
        className="overflow-hidden border-0"
      >
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="relative w-full">
            {/* Main Search Input */}
            <div className="relative flex items-center w-full">
              {/* Search Icon */}
              <div className="absolute left-4 z-card-layer-1">
                <motion.div
                  animate={isFocused ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isFocused ? "text-primary" : "text-muted-foreground"
                  )} />
                </motion.div>
              </div>

              {/* Input Field */}
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setIsFocused(false);
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder={placeholder}
                className={cn(
                  "h-14 w-full pl-12 pr-20 text-lg border-0 bg-transparent focus:ring-0 focus:border-0",
                  "placeholder:text-muted-foreground/60",
                  isFocused && "ring-2 ring-primary/20"
                )}
              />

              {/* Clear Button */}
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    type="button"
                    onClick={clearSearch}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-16 p-1 rounded-full hover:bg-muted/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Filter Button */}
              <Button
                type="button"
                variant={hasActiveFilters ? "default" : "ghost"}
                size="sm"
                onClick={onToggleFilters}
                className={cn(
                  "absolute right-2 h-10 w-10 rounded-full transition-all duration-200",
                  hasActiveFilters && "bg-primary-500 text-white shadow-lg hover:bg-primary-600"
                )}
                aria-label={hasActiveFilters ? `${activeFiltersCount} filters active. Open filters` : 'Open filters'}
                title={hasActiveFilters ? `${activeFiltersCount} filters active` : 'Open filters'}
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && <span className="sr-only">{activeFiltersCount} filters active</span>}
                {hasActiveFilters && activeFiltersCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 min-w-[16px] min-h-[16px] px-1 rounded-full bg-background text-foreground text-[10px] leading-[16px] border border-border"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {Math.min(activeFiltersCount, 9)}
                  </motion.span>
                )}
              </Button>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && isFocused && searchTerm.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-popover glassmorphic rounded-b-xl border-t-0"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Popular searches</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="text-left p-2 rounded-md hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <AnimatePresence>
        {(searchTerm || hasActiveFilters) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Searching...
                    </span>
                  ) : (
                    `${resultsCount} collaboration${resultsCount !== 1 ? 's' : ''} found`
                  )}
                </span>
              </div>
              
              {hasActiveFilters && activeFiltersCount > 0 && (
                <Badge variant="secondary" className="bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700/50">
                  <Filter className="h-3 w-3 mr-1" />
                  {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Real-time results</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 