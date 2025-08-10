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
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchChange('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Card 
        variant="glass"
        tilt={true}
        depth="lg"
        glow="subtle"
        glowColor="orange"
        hover={true}
        interactive={true}
        className="overflow-hidden border-0"
      >
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="relative">
            {/* Main Search Input */}
            <div className="relative flex items-center">
              {/* Search Icon */}
              <div className="absolute left-4 z-10">
                <motion.div
                  animate={isFocused ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isFocused ? "text-orange-500" : "text-muted-foreground"
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
                  "h-14 pl-12 pr-20 text-lg border-0 bg-transparent focus:ring-0 focus:border-0",
                  "placeholder:text-muted-foreground/60",
                  isFocused && "ring-2 ring-orange-500/20"
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
                  hasActiveFilters && "bg-orange-500 text-white shadow-lg hover:bg-orange-600"
                )}
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-background"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                )}
              </Button>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-50 bg-card/95 border border-border/50 rounded-b-lg shadow-xl backdrop-blur-md"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
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
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"
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
              
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50">
                  <Filter className="h-3 w-3 mr-1" />
                  Filters active
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