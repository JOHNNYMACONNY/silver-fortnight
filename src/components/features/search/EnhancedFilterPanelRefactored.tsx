import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';
import { FilterButton, FilterChip, FilterTab, FilterSection } from './FilterButton';
import { filterConfig, filterSpacing, filterSizing, filterLayout } from './filterConfig';
import { useViewportAwareModal } from '../../../hooks/useViewportAwareModal';
import { useMobileOptimization } from '../../../hooks/useMobileOptimization';
import { useModalBottomHandling } from '../../../utils/modalBottomHandling';

interface FilterState {
  status?: string;
  category?: string;
  timeCommitment?: string;
  skillLevel?: string;
  reputation?: number | null;
  hasSkills?: boolean | null;
  skills?: string[];
  // Challenges-specific filters
  challengeCategory?: string;
  difficulty?: string;
  challengeStatus?: string;
  challengeType?: string;
}

interface EnhancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  className?: string;
  availableSkills?: string[];
  persistenceKey?: string;
}

export const EnhancedFilterPanelRefactored: React.FC<EnhancedFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  availableSkills = [],
  persistenceKey
}) => {
  const [activeTab, setActiveTab] = useState('status');
  const [skillQuery, setSkillQuery] = useState('');
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  
  // Handle scroll state for main content
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollState({
      scrollTop: target.scrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
    });
  };
  
  // Use viewport-aware modal positioning
  const { isMobile, isTablet, isDesktop } = useMobileOptimization();
  const { positioning, heights, isScrollable, layout } = useViewportAwareModal({
    headerHeight: isMobile ? 3.5 : 4, // Match actual navbar heights (h-14 mobile, h-16 desktop)
    footerHeight: isMobile ? 3.5 : 4, // Match modal header/footer heights
    topMargin: 0.5, // 0.5rem additional margin (reduced for better fit)
    bottomMargin: 0.5, // 0.5rem additional margin (reduced for better fit)
    minContentHeight: 20, // 20rem minimum (reduced for mobile)
    maxContentHeightPercent: isMobile ? 85 : isTablet ? 80 : 75, // Reduced to prevent overflow
  });

  // Use bottom handling utilities
  const { classes: bottomClasses } = useModalBottomHandling({
    useFlexboxLayout: true,
    footerHeight: isMobile ? 3.5 : 4, // Match actual heights
    headerHeight: isMobile ? 3.5 : 4, // Match actual heights
    preventFooterPush: true,
    enableSmoothScrolling: true,
  });

  // Restore persisted skill query
  React.useEffect(() => {
    if (!persistenceKey) return;
    try {
      const stored = sessionStorage.getItem(`${persistenceKey}:skillQuery`);
      if (stored) setSkillQuery(stored);
    } catch {}
  }, [persistenceKey]);

  // Persist skill query per session
  React.useEffect(() => {
    if (!persistenceKey) return;
    try {
      sessionStorage.setItem(`${persistenceKey}:skillQuery`, skillQuery);
    } catch {}
  }, [persistenceKey, skillQuery]);

  // Memoized active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    
    if (filters.status) chips.push({ key: 'status', label: 'Status', value: String(filters.status) });
    if (filters.category) chips.push({ key: 'category', label: 'Category', value: String(filters.category) });
    if (filters.timeCommitment) chips.push({ key: 'timeCommitment', label: 'Time', value: String(filters.timeCommitment) });
    if (filters.skillLevel) chips.push({ key: 'skillLevel', label: 'Level', value: String(filters.skillLevel) });
    if (filters.reputation !== null && filters.reputation !== undefined) {
      chips.push({ key: 'reputation', label: 'Min Reputation', value: String(filters.reputation) });
    }
    if (filters.hasSkills !== null && filters.hasSkills !== undefined) {
      chips.push({ key: 'hasSkills', label: 'Has Skills', value: filters.hasSkills ? 'Yes' : 'No' });
    }
    if (Array.isArray(filters.skills)) {
      filters.skills.forEach((s: string) => chips.push({ key: 'skills', label: 'Skill', value: s }));
    }
    // Challenges-specific chips
    if (filters.challengeCategory) chips.push({ key: 'challengeCategory', label: 'Category', value: String(filters.challengeCategory) });
    if (filters.difficulty) chips.push({ key: 'difficulty', label: 'Difficulty', value: String(filters.difficulty) });
    if (filters.challengeStatus) chips.push({ key: 'challengeStatus', label: 'Status', value: String(filters.challengeStatus) });
    if (filters.challengeType) chips.push({ key: 'challengeType', label: 'Type', value: String(filters.challengeType) });
    
    return chips;
  }, [filters]);

  // Memoized active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => 
      v !== '' && v !== undefined && v !== null && 
      (!Array.isArray(v) || v.length > 0)
    ).length;
  }, [filters]);

  // Memoized tab counts
  const tabCounts = useMemo(() => {
    return {
      status: filters.status ? 1 : 0,
      category: filters.category ? 1 : 0,
      time: filters.timeCommitment ? 1 : 0,
      skills: Array.isArray(filters.skills) ? filters.skills.length : 0,
      level: filters.skillLevel ? 1 : 0,
      reputation: filters.reputation !== null && filters.reputation !== undefined ? 1 : 0,
      hasSkills: filters.hasSkills !== null && filters.hasSkills !== undefined ? 1 : 0,
      presets: 0,
      // Challenges-specific counts
      challengeCategory: filters.challengeCategory ? 1 : 0,
      difficulty: filters.difficulty ? 1 : 0,
      challengeStatus: filters.challengeStatus ? 1 : 0,
      challengeType: filters.challengeType ? 1 : 0
    };
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleChipRemove = (chipKey: string, chipValue: string) => {
    if (chipKey === 'skills') {
      const current = Array.isArray(filters.skills) ? filters.skills : [];
      onFiltersChange({ ...filters, skills: current.filter((s: string) => s !== chipValue) });
    } else if (chipKey === 'reputation' || chipKey === 'hasSkills') {
      onFiltersChange({ ...filters, [chipKey]: null });
    } else if (chipKey === 'challengeCategory' || chipKey === 'difficulty' || chipKey === 'challengeStatus' || chipKey === 'challengeType') {
      onFiltersChange({ ...filters, [chipKey]: '' });
    } else {
      onFiltersChange({ ...filters, [chipKey]: undefined });
    }
  };

  const handleTabReset = (tabId: string) => {
    const tabConfig = filterConfig.tabs.find(tab => tab.id === tabId);
    if (tabConfig) {
      handleFilterChange(tabConfig.id as keyof FilterState, tabConfig.resetValue);
    }
  };

  const renderFilterButtons = (options: Array<{ value: string; label: string }>, filterKey: keyof FilterState, size: 'sm' | 'md' | 'lg' = 'md') => {
    return options.map((option) => {
      const isSelected = filters[filterKey] === option.value || 
        (filterKey === 'reputation' && filters[filterKey] === parseInt(option.value)) ||
        (filterKey === 'hasSkills' && filters[filterKey] === (option.value === 'true'));
      
      const handleClick = () => {
        let value: any = option.value;
        if (filterKey === 'reputation') {
          value = parseInt(option.value);
        } else if (filterKey === 'hasSkills') {
          value = option.value === 'true';
        }
        
        handleFilterChange(filterKey, isSelected ? 
          (filterKey === 'reputation' || filterKey === 'hasSkills' ? null : undefined) : 
          value
        );
      };

      return (
        <FilterButton
          key={option.value}
          value={option.value}
          label={option.label}
          isSelected={isSelected}
          onClick={handleClick}
          size={size}
        />
      );
    });
  };

  const renderSkillsFilter = () => {
    const filteredSkills = (availableSkills || [])
      .filter((s) => s.toLowerCase().includes(skillQuery.toLowerCase()));

    return (
      <FilterSection
        onReset={() => handleFilterChange('skills', [])}
        resetLabel="Reset skills"
        className={filterSpacing.section}
      >
        <div className="max-w-sm">
          <Input
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            placeholder="Filter skills..."
            className="h-10"
          />
        </div>
        {availableSkills && availableSkills.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            Top skills from current results
          </div>
        )}
        <div className={cn(filterLayout.buttons, "mt-1")}>
          {filteredSkills.map((skill) => {
            const selected = Array.isArray(filters.skills) ? filters.skills.includes(skill) : false;
            
            return (
              <FilterButton
                key={skill}
                value={skill}
                label={skill}
                isSelected={selected}
                onClick={() => {
                  const current: string[] = Array.isArray(filters.skills) ? [...filters.skills] : [];
                  const next = selected
                    ? current.filter((s: string) => s !== skill)
                    : [...current, skill];
                  handleFilterChange('skills', next);
                }}
                size="md"
              />
            );
          })}
        </div>
      </FilterSection>
    );
  };

  const renderPresetsFilter = () => {
    return (
      <FilterSection className={filterSpacing.section}>
        <div className={filterLayout.presets}>
          {filterConfig.presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => onFiltersChange({ ...filters, ...preset.filters })}
              className={cn(
                "flex items-center justify-center rounded-md border transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "border-border hover:border-primary/40 hover:bg-muted/30",
                filterSizing.preset
              )}
            >
              <span className="font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <FilterSection
            onReset={() => handleTabReset('status')}
            resetLabel="Reset status"
            className={filterSpacing.section}
          >
            <div className="text-xs text-muted-foreground mb-3">Choose one</div>
            {renderFilterButtons(filterConfig.options.status, 'status', 'sm')}
          </FilterSection>
        );
      
      case 'category':
        return (
          <FilterSection
            onReset={() => handleTabReset('category')}
            resetLabel="Reset category"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.category, 'category')}
          </FilterSection>
        );
      
      case 'time':
        return (
          <FilterSection
            onReset={() => handleTabReset('time')}
            resetLabel="Reset time"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.time, 'timeCommitment')}
          </FilterSection>
        );
      
      case 'skills':
        return renderSkillsFilter();
      
      case 'level':
        return (
          <FilterSection
            onReset={() => handleTabReset('level')}
            resetLabel="Reset level"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.level, 'skillLevel')}
          </FilterSection>
        );
      
      case 'reputation':
        return (
          <FilterSection
            onReset={() => handleTabReset('reputation')}
            resetLabel="Reset reputation"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.reputation, 'reputation')}
          </FilterSection>
        );
      
      case 'hasSkills':
        return (
          <FilterSection
            onReset={() => handleTabReset('hasSkills')}
            resetLabel="Reset has skills"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.hasSkills, 'hasSkills')}
          </FilterSection>
        );
      
      case 'presets':
        return renderPresetsFilter();
      
      case 'challengeCategory':
        return (
          <FilterSection
            onReset={() => handleTabReset('challengeCategory')}
            resetLabel="Reset category"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.challengeCategory, 'challengeCategory')}
          </FilterSection>
        );
      
      case 'difficulty':
        return (
          <FilterSection
            onReset={() => handleTabReset('difficulty')}
            resetLabel="Reset difficulty"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.difficulty, 'difficulty')}
          </FilterSection>
        );
      
      case 'challengeStatus':
        return (
          <FilterSection
            onReset={() => handleTabReset('challengeStatus')}
            resetLabel="Reset status"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.challengeStatus, 'challengeStatus')}
          </FilterSection>
        );
      
      case 'challengeType':
        return (
          <FilterSection
            onReset={() => handleTabReset('challengeType')}
            resetLabel="Reset type"
            className={filterSpacing.section}
          >
            {renderFilterButtons(filterConfig.options.challengeType, 'challengeType')}
          </FilterSection>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-background/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[10001] left-1/2 -translate-x-1/2 top-20 bottom-6 w-[calc(100vw-4rem)] max-w-6xl overflow-hidden rounded-2xl shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Card 
              variant="glass"
              tilt={false}
              depth="xl"
              glow="subtle"
              glowColor="orange"
              hover={false}
              interactive={false}
              className="h-full flex flex-col"
            >
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header - Auto height based on content */}
                <div className="flex items-center justify-between border-b border-glass bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-xl flex-shrink-0 p-4 sm:p-6 lg:p-8 xl:p-10 relative">
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Advanced Filters</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        Refine your search with powerful filters
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700/50">
                        {activeFilterCount} active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>

                {/* Content Area - Row with independent scrolling */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none"></div>
                  {/* Sidebar Tabs - Scrollable when needed */}
                  <div className="w-48 sm:w-56 md:w-64 lg:w-72 border-r border-glass bg-gradient-to-b from-card/60 via-card/50 to-card/60 backdrop-blur-lg flex-shrink-0 relative z-10">
                    <div className="h-full overflow-y-auto">
                      <div className="p-2 sm:p-4">
                        <div className={filterSpacing.tab}>
                          {filterConfig.tabs.map((tab) => (
                            <FilterTab
                              key={tab.id}
                              id={tab.id}
                              label={tab.label}
                              icon={tab.icon}
                              isActive={activeTab === tab.id}
                              count={tabCounts[tab.id as keyof typeof tabCounts]}
                              onClick={() => setActiveTab(tab.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto relative z-10" onScroll={handleScroll}>
                    <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
                      {/* Content begins */}
                      {/* Active filters summary */}
                      {activeChips.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-muted-foreground">Active filters</div>
                            <button
                              type="button"
                              onClick={() => {
                                onClearFilters();
                                setSkillQuery('');
                              }}
                              className="text-xs text-primary hover:text-primary/80 underline font-medium"
                              aria-label="Clear all filters"
                            >
                              Clear all ({activeChips.length})
                            </button>
                          </div>
                          <div className={filterLayout.chips}>
                            {activeChips.map((chip, idx) => (
                              <FilterChip
                                key={`${chip.key}-${chip.value}-${idx}`}
                                label={chip.label}
                                value={chip.value}
                                onRemove={() => handleChipRemove(chip.key, chip.value)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {renderTabContent()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Footer - Fixed height, does not shrink */}
                <div className="flex items-center justify-between border-t border-glass bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-xl gap-3 p-4 sm:p-6 lg:p-8 xl:p-10 flex-shrink-0 relative">
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="text-xs text-muted-foreground">{activeFilterCount} filters active</div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={onClearFilters}
                        disabled={activeFilterCount === 0}
                        aria-label="Clear all filters"
                      >
                        Clear all
                      </Button>
                      <Button onClick={onClose}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
