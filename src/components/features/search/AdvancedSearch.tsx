/**
 * Advanced Search and Filter Component
 * Enhanced with sophisticated micro-interactions and modern UI patterns
 * Aligned with CollaborationFilters interface for seamless integration
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Search, Filter, X, Sparkles, ChevronDown, Mic, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { cn } from '../../../utils/cn';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CollaborationFilters } from '../../../services/firestore-exports';
import Box from '../../layout/primitives/Box';
import Stack from '../../layout/primitives/Stack';
import Cluster from '../../layout/primitives/Cluster';
import Grid from '../../layout/primitives/Grid';

// Align with existing CollaborationFilters interface
interface AdvancedSearchFilters extends CollaborationFilters {
  // Additional UI-specific filters
  skillLevel?: 'beginner' | 'intermediate' | 'expert';
  timeEstimate?: '15-min' | '30-min' | '1-hour' | '2-hour' | 'multi-day';
}

interface AdvancedSearchProps {
  onSearch: (term: string, filters: AdvancedSearchFilters) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFiltersChange?: (filters: AdvancedSearchFilters) => void;
  isLoading?: boolean;
  resultsCount?: number;
  placeholder?: string;
  enableSuggestions?: boolean;
  enableVoiceSearch?: boolean;
  recentSearches?: string[];
  popularFilters?: Partial<AdvancedSearchFilters>[];
  // Pre-populated filters for external state management
  initialFilters?: AdvancedSearchFilters;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  searchTerm,
  onSearchChange,
  onFiltersChange,
  isLoading = false,
  resultsCount = 0,
  placeholder = "Search collaborations by title, description, or participants...",
  enableSuggestions = true,
  enableVoiceSearch = false,
  recentSearches = [],
  popularFilters = [],
  initialFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    status: undefined,
    category: '',
    location: '',
    timeCommitment: '',
    skillLevel: undefined,
    timeEstimate: undefined,
    maxParticipants: undefined,
    skillsRequired: [],
    dateRange: undefined,
    ...initialFilters
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(-1);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  
  // Animation controls and refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterButtonControls = useAnimation();
  const searchIconControls = useAnimation();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Motion values for interactive animations
  const searchInputScale = useMotionValue(1);
  
  // Reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Sample suggestions for demo (in real app, this would come from API/props)
  const allSuggestions = [
    'React Development', 'UI/UX Design', 'Python Programming', 'Digital Marketing',
    'Content Writing', 'Graphic Design', 'Data Analysis', 'Project Management',
    'Web Development', 'Mobile App Development', 'Photography', 'Video Editing',
    'Social Media Management', 'SEO Optimization', 'Business Strategy'
  ];

  // Predefined filter options
  const statusOptions = [
    { value: 'open', label: 'Open', icon: '🔓' },
    { value: 'in-progress', label: 'In Progress', icon: '⚡' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  const categoryOptions = [
    { value: 'tech', label: 'Technology', icon: '💻' },
    { value: 'design', label: 'Design', icon: '🎨' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'writing', label: 'Writing', icon: '✍️' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'creative', label: 'Creative', icon: '🎭' }
  ];

  const timeCommitmentOptions = [
    { value: '15-min', label: '15 minutes' },
    { value: '30-min', label: '30 minutes' },
    { value: '1-hour', label: '1 hour' },
    { value: '2-hour', label: '2 hours' },
    { value: 'multi-day', label: 'Multi-day' }
  ];

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'expert', label: 'Expert', color: 'bg-red-100 text-red-800' }
  ];

  // Check if any filters are active
  useEffect(() => {
    const activeFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'dateRange') return value && (value.start || value.end);
      if (key === 'skillsRequired') return value && value.length > 0;
      if (key === 'maxParticipants') return value !== undefined && value > 0;
      return value !== '' && value !== undefined;
    });
    setHasActiveFilters(activeFilters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof AdvancedSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: AdvancedSearchFilters = {
      status: undefined,
      category: '',
      location: '',
      timeCommitment: '',
      skillLevel: undefined,
      timeEstimate: undefined,
      maxParticipants: undefined,
      skillsRequired: [],
      dateRange: undefined
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [onFiltersChange]);

  // Apply popular filter
  const applyPopularFilter = useCallback((filter: Partial<AdvancedSearchFilters>) => {
    const newFilters = { ...filters, ...filter };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    onSearch(searchTerm, newFilters);
  }, [filters, onFiltersChange, onSearch, searchTerm]);

  // Handle search suggestions
  useEffect(() => {
    if (searchTerm && enableSuggestions) {
      const suggestions = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(suggestions.length > 0 && isSearchFocused);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [searchTerm, isSearchFocused, enableSuggestions]);

  // Enhanced search input handler with subtle micro-interactions
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Subtle search icon animation only on first character
    if (!prefersReducedMotion && value.length === 1) {
      searchIconControls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.2, ease: 'easeOut' }
      });
    }
  }, [onSearchChange, searchIconControls, prefersReducedMotion]);

  // Ripple effect for interactive elements
  const createRipple = useCallback((event: React.MouseEvent) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  }, []);

  // Enhanced filter toggle with subtle animations
  const toggleFilters = useCallback(() => {
    if (!prefersReducedMotion) {
      filterButtonControls.start({
        rotate: showFilters ? 0 : 180,
        scale: [1, 1.05, 1],
        transition: { duration: 0.2, ease: 'easeOut' }
      });
    }
    setShowFilters(!showFilters);
  }, [showFilters, filterButtonControls, prefersReducedMotion]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    setIsSearchFocused(false);
    onSearch(suggestion, filters);
  }, [onSearchChange, onSearch, filters]);

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedFilterIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedFilterIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedFilterIndex >= 0) {
          selectSuggestion(filteredSuggestions[selectedFilterIndex]);
        } else {
          onSearch(searchTerm, filters);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedFilterIndex(-1);
        break;
    }
  }, [showSuggestions, selectedFilterIndex, filteredSuggestions, selectSuggestion, searchTerm, filters, onSearch]);

  // Voice search functionality
  const initializeVoiceRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsVoiceRecording(false);
        onSearch(transcript, filters);
      };

      recognition.onerror = () => {
        setIsVoiceRecording(false);
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      setVoiceRecognition(recognition);
    }
  }, [onSearchChange, onSearch, filters]);

  const startVoiceSearch = useCallback(() => {
    if (voiceRecognition) {
      voiceRecognition.start();
    } else {
      initializeVoiceRecognition();
    }
  }, [voiceRecognition, initializeVoiceRecognition]);

  // Initialize voice recognition on mount
  useEffect(() => {
    if (enableVoiceSearch) {
      initializeVoiceRecognition();
    }

    // Cleanup function to properly dispose of voice recognition
    return () => {
      if (voiceRecognition) {
        try {
          voiceRecognition.abort();
        } catch (error) {
          // Voice recognition might already be stopped/cleaned up
          console.debug('Voice recognition cleanup:', error);
        }
        setVoiceRecognition(null);
        setIsVoiceRecording(false);
      }
    };
  }, [enableVoiceSearch, initializeVoiceRecognition]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, filters);
  };

  return (
    <Card className="w-full mx-auto rounded-2xl shadow-lg border-2 border-transparent focus-within:border-primary transition-all duration-300 bg-card">
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleFormSubmit}>
          <Stack gap="md">
            <Cluster gap="sm" align="center">
              <Box
                as={motion.div}
                ref={suggestionsRef}
                className="relative flex-grow"
                // @ts-expect-error motion props passthrough
                animate={searchIconControls}
              >
              <motion.div
                initial={false}
                animate={{ scale: isSearchFocused ? 1.02 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                <Search
                    className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-card-layer-1"
                />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={(e) => {
                    setIsSearchFocused(true);
                    if (recentSearches.length > 0) setShowRecentSearches(true);
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      setIsSearchFocused(false);
                      setShowRecentSearches(false);
                    }, 200)
                  }}
                  aria-label="Search"
                  className="pl-10 md:pl-12"
                />
              </motion.div>
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full w-full glassmorphic rounded-lg shadow-xl z-popover overflow-hidden mt-2"
                  >
                    <ul>
                      {filteredSuggestions.map((suggestion, index) => (
                        <li
                          key={suggestion}
                          className={cn(
                            "px-4 py-3 cursor-pointer hover:bg-muted transition-colors",
                            selectedFilterIndex === index && 'bg-primary text-primary-foreground'
                          )}
                          onMouseDown={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
                {showRecentSearches && !searchTerm && (
                   <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                   className="absolute top-full w-full glassmorphic rounded-lg shadow-xl z-popover overflow-hidden mt-2"
                  >
                    <h3 className="text-sm font-semibold text-muted-foreground px-4 py-2">Recent Searches</h3>
                    <ul>
                      {recentSearches.slice(0, 3).map((search) => (
                        <li
                          key={search}
                          className="cursor-pointer hover:bg-muted transition-colors px-4 py-3"
                          onMouseDown={() => selectSuggestion(search)}
                        >
                          {search}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
              </Box>

              {enableVoiceSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={startVoiceSearch}
                  className={cn(
                    "relative rounded-full",
                    isVoiceRecording && "bg-destructive text-destructive-foreground"
                  )}
                  aria-label="Search by voice"
                >
                  <Mic className="h-5 w-5" />
                  {isVoiceRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-destructive opacity-30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant={hasActiveFilters ? "default" : "outline"}
                onClick={toggleFilters}
                className="relative rounded-full"
                aria-label="Toggle search filters"
              >
                <motion.div animate={filterButtonControls} className="flex items-center">
                  <Filter className="h-5 w-5" />
                </motion.div>
                {hasActiveFilters && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-card"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 40 }}
                  />
                )}
              </Button>
            </Cluster>

            <Cluster justify="between" align="center" className="text-sm">
              <span className={cn(
                "font-medium transition-colors duration-200",
                resultsCount > 0
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}>
                {resultsCount > 0
                  ? `${resultsCount} ${resultsCount === 1 ? 'trade' : 'trades'} found`
                  : searchTerm || hasActiveFilters
                    ? 'No trades found'
                    : 'All trades'
                }
              </span>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Clear filters</span>
                </Button>
              )}
            </Cluster>
        
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card className="overflow-hidden glassmorphic shadow-xl">
                  <CardContent className="p-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Stack gap="xs" className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground">
                          Advanced Filters
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Refine your search with these powerful filters
                        </p>
                      </Stack>
                    </motion.div>

                    <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
                      {/* Status Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <Sparkles className="h-4 w-4" />
                          Status
                        </Cluster>
                        <select
                          value={filters.status || ''}
                          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                          <option value="">All Statuses</option>
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </Stack>

                      {/* Category Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <Sparkles className="h-4 w-4" />
                          Category
                        </Cluster>
                        <select
                          value={filters.category || ''}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                          <option value="">All Categories</option>
                          {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </Stack>

                      {/* Location Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Cluster>
                        <Input
                          type="text"
                          placeholder="Enter location..."
                          value={filters.location || ''}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                          className="w-full"
                        />
                      </Stack>

                      {/* Time Commitment Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <Clock className="h-4 w-4" />
                          Time Commitment
                        </Cluster>
                        <select
                          value={filters.timeCommitment || ''}
                          onChange={(e) => handleFilterChange('timeCommitment', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                          <option value="">Any Time</option>
                          {timeCommitmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Stack>

                      {/* Max Participants Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <Users className="h-4 w-4" />
                          Max Participants
                        </Cluster>
                        <Input
                          type="number"
                          placeholder="Enter max participants..."
                          value={filters.maxParticipants || ''}
                          onChange={(e) => handleFilterChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full"
                          min="1"
                        />
                      </Stack>

                      {/* Skill Level Filter */}
                      <Stack gap="xs">
                        <Cluster gap="xs" align="center" className="text-sm font-medium text-foreground">
                          <Sparkles className="h-4 w-4" />
                          Skill Level
                        </Cluster>
                        <select
                          value={filters.skillLevel || ''}
                          onChange={(e) => handleFilterChange('skillLevel', e.target.value || undefined)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                          <option value="">Any Level</option>
                          {skillLevelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Stack>
                    </Grid>

                    {/* Popular Filters */}
                    {popularFilters.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 pt-4 border-t border-border"
                      >
                        <Stack gap="sm">
                          <h4 className="text-sm font-medium text-foreground">Popular Filters</h4>
                          <Cluster gap="xs" wrap={true}>
                            {popularFilters.map((filter, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => applyPopularFilter(filter)}
                                className="text-xs"
                              >
                                {filter.status && `${filter.status} collaborations`}
                                {filter.category && `${filter.category} projects`}
                                {filter.skillLevel && `${filter.skillLevel} level`}
                              </Button>
                            ))}
                          </Cluster>
                        </Stack>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 pt-4 border-t border-border"
                    >
                      <Cluster justify="between" align="center">
                        <span className="text-sm text-muted-foreground">
                          {Object.values(filters).filter(v => v !== '').length} active filters
                        </span>

                        <Cluster gap="sm">
                          <Button
                            variant="ghost"
                            onClick={clearAllFilters}
                          >
                            Clear All
                          </Button>

                          <Button
                            onClick={() => setShowFilters(false)}
                          >
                            Apply Filters
                          </Button>
                        </Cluster>
                      </Cluster>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;
