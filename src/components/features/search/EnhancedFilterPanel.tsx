import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Clock, 
  Target, 
  Star,
  Tag
} from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';

interface FilterOption {
  value: string;
  label: string;
}

interface EnhancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
  availableSkills?: string[];
  persistenceKey?: string;
}

export const EnhancedFilterPanel: React.FC<EnhancedFilterPanelProps> = ({
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

  // Active filter chips summary
  const activeChips = () => {
    const chips: { key: string; label: string; value: string }[] = [];
    if (filters.status) chips.push({ key: 'status', label: 'Status', value: String(filters.status) });
    if (filters.category) chips.push({ key: 'category', label: 'Category', value: String(filters.category) });
    if (filters.timeCommitment) chips.push({ key: 'timeCommitment', label: 'Time', value: String(filters.timeCommitment) });
    if (filters.skillLevel) chips.push({ key: 'skillLevel', label: 'Level', value: String(filters.skillLevel) });
    if (Array.isArray((filters as any).skills)) {
      (filters as any).skills.forEach((s: string) => chips.push({ key: 'skills', label: 'Skill', value: s }));
    }
    return chips;
  };

  const statusOptions: FilterOption[] = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const categoryOptions: FilterOption[] = [
    { value: 'tech', label: 'Technology' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'writing', label: 'Writing' },
    { value: 'business', label: 'Business' },
    { value: 'creative', label: 'Creative' }
  ];

  const timeOptions: FilterOption[] = [
    { value: '15-min', label: '15 minutes' },
    { value: '30-min', label: '30 minutes' },
    { value: '1-hour', label: '1 hour' },
    { value: '2-hour', label: '2 hours' },
    { value: 'multi-day', label: 'Multi-day' }
  ];

  const levelOptions: FilterOption[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];

  const popularFilters = [
    { label: 'Quick Projects', filters: { timeCommitment: '1-hour' } },
    { label: 'Tech Focus', filters: { category: 'tech' } },
    { label: 'Beginner Friendly', filters: { skillLevel: 'beginner' } },
    { label: 'Active Projects', filters: { status: 'in_progress' } }
  ];

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== undefined && v !== null).length;
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: Target },
    { id: 'category', label: 'Category', icon: Star },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'skills', label: 'Skills', icon: Tag },
    { id: 'level', label: 'Level', icon: Star },
    { id: 'presets', label: 'Presets', icon: Star }
  ];

  const getTabCount = (tabId: string): number => {
    switch (tabId) {
      case 'status':
        return Array.isArray((filters as any).status)
          ? ((filters as any).status?.length || 0)
          : ((filters as any).status ? 1 : 0);
      case 'category':
        return (filters as any).category ? 1 : 0;
      case 'time':
        return (filters as any).timeCommitment ? 1 : 0;
      case 'skills':
        return Array.isArray((filters as any).skills) ? (filters as any).skills.length : 0;
      case 'level':
        return (filters as any).skillLevel ? 1 : 0;
      default:
        return 0;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute z-[10001] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[90vw] xl:max-w-7xl max-h-[90vh] overflow-hidden"
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
              className="shadow-2xl border-0"
            >
              <CardContent className="p-0">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 lg:p-8 xl:p-10 border-b border-border/50 bg-card/80 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Filter className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
                      <p className="text-sm text-muted-foreground">
                        Refine your search with powerful filters
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700/50">
                        {getActiveFilterCount()} active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex max-h-[80vh] h-[60vh]">
                  {/* Sidebar Tabs */}
                  <div className="w-56 lg:w-64 xl:w-72 border-r border-border/50 bg-muted/30">
                    <div className="p-4">
                      <div className="space-y-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                activeTab === tab.id
                                  ? "bg-muted/50 text-foreground border border-primary/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="flex-1 text-left">{tab.label}</span>
                              {getTabCount(tab.id) > 0 && (
                                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] px-1.5 h-5 min-w-[20px]">
                                  {getTabCount(tab.id)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 lg:p-8 xl:p-10">
                      {/* Active filters summary */}
                      {activeChips().length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-muted-foreground">Active filters</div>
                            <button
                              type="button"
                              onClick={() => {
                                onClearFilters();
                                setSkillQuery('');
                              }}
                              className="text-xs text-primary hover:text-primary/80 underline"
                              aria-label="Clear all filters"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeChips().map((chip, idx) => (
                              <button
                                key={`${chip.key}-${chip.value}-${idx}`}
                                onClick={() => {
                                  if (chip.key === 'skills') {
                                    const current = Array.isArray((filters as any).skills) ? (filters as any).skills : [];
                                    onFiltersChange({ ...filters, skills: current.filter((s: string) => s !== chip.value) });
                                  } else {
                                    onFiltersChange({ ...filters, [chip.key]: undefined });
                                  }
                                }}
                                className={cn(
                                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
                                  'border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors'
                                )}
                              >
                                <span className="font-medium text-foreground/80">{chip.label}:</span>
                                <span className="text-foreground/80">{chip.value}</span>
                                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">×</span>
                              </button>
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
                          {/* Status Tab */}
                          {activeTab === 'status' && (
                            <div className="space-y-3">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reset status
                                </button>
                              </div>
                              <div className="text-xs text-muted-foreground">Choose one</div>
                              <div className="flex flex-wrap gap-2">
                                {statusOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('status', filters.status === option.value ? undefined : option.value)}
                                    className={cn(
                                      'inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                      filters.status === option.value
                                        ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
                                        : 'border-border/60 hover:bg-muted/40 text-foreground/80'
                                    )}
                                  >
                                      <span className="font-medium">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Category Tab */}
                          {activeTab === 'category' && (
                            <div className="space-y-4">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onFiltersChange({ ...filters, category: '' })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reset category
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {categoryOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('category', filters.category === option.value ? '' : option.value)}
                                    className={cn(
                                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                      filters.category === option.value
                                        ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
                                        : 'border-border/60 hover:bg-muted/40 text-foreground/80'
                                    )}
                                  >
                                      <span className="font-medium">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Time Tab */}
                          {activeTab === 'time' && (
                            <div className="space-y-4">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onFiltersChange({ ...filters, timeCommitment: '' })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reset time
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {timeOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('timeCommitment', filters.timeCommitment === option.value ? '' : option.value)}
                                    className={cn(
                                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                      filters.timeCommitment === option.value
                                        ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
                                        : 'border-border/60 hover:bg-muted/40 text-foreground/80'
                                    )}
                                  >
                                      <span className="font-medium">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills Tab (multi-select from availableSkills) */}
                          {activeTab === 'skills' && (
                            <div className="space-y-4">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onFiltersChange({ ...filters, skills: [] })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reset skills
                                </button>
                              </div>
                              <div className="max-w-sm">
                                <Input
                                  value={skillQuery}
                                  onChange={(e) => setSkillQuery(e.target.value)}
                                  placeholder="Filter skills..."
                                  className="h-10"
                                />
                              </div>
                              {availableSkills && availableSkills.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-2">Top skills from current results</div>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(availableSkills || [])
                                  .filter((s) => s.toLowerCase().includes(skillQuery.toLowerCase()))
                                  .map((skill) => {
                                  const selected = Array.isArray((filters as any).skills)
                                    ? (filters as any).skills.includes(skill)
                                    : false;
                                  return (
                                    <button
                                      key={skill}
                                      onClick={() => {
                                        const current: string[] = Array.isArray((filters as any).skills)
                                          ? [...(filters as any).skills]
                                          : [];
                                        const next = selected
                                          ? current.filter((s: string) => s !== skill)
                                          : [...current, skill];
                                        onFiltersChange({ ...filters, skills: next });
                                      }}
                                      className={cn(
                                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                        selected
                                          ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
                                          : 'border-border/60 hover:bg-muted/40 text-foreground/80'
                                      )}
                                    >
                                      <span className="font-medium">{skill}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Level Tab */}
                          {activeTab === 'level' && (
                            <div className="space-y-4">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onFiltersChange({ ...filters, skillLevel: undefined })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reset level
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {levelOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('skillLevel', filters.skillLevel === option.value ? undefined : option.value)}
                                    className={cn(
                                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                      filters.skillLevel === option.value
                                        ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
                                        : 'border-border/60 hover:bg-muted/40 text-foreground/80'
                                    )}
                                  >
                                      <span className="font-medium">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                                    </div>
                          )}

                          {/* Presets Tab */}
                          {activeTab === 'presets' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                {popularFilters.map((preset, index) => (
                                  <button
                                    key={index}
                                    onClick={() => onFiltersChange({ ...filters, ...preset.filters })}
                                    className={cn(
                                      "flex items-center justify-center p-3 lg:p-4 rounded-md border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                      "border-border hover:border-primary/40 hover:bg-muted/30"
                                    )}
                                  >
                                    <span className="font-medium">{preset.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 flex items-center justify-between p-6 lg:p-8 xl:p-10 border-t border-border/50 bg-card/80 backdrop-blur gap-3">
                  <div className="text-xs text-muted-foreground">{getActiveFilterCount()} filters active</div>
                    <Button
                      variant="ghost"
                      onClick={onClearFilters}
                      disabled={getActiveFilterCount() === 0}
                    aria-label="Clear all filters"
                    >
                    Clear all
                    </Button>
                    <Button onClick={onClose}>
                      Apply Filters
                    </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 