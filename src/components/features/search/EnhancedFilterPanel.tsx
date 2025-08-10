import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Sparkles, 
  MapPin, 
  Clock, 
  Users, 
  Target, 
  Calendar,
  Zap,
  TrendingUp,
  Star
} from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
}

interface EnhancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

export const EnhancedFilterPanel: React.FC<EnhancedFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  className
}) => {
  const [activeTab, setActiveTab] = useState('status');

  const statusOptions: FilterOption[] = [
    { value: 'open', label: 'Open', icon: '🔓', count: 12 },
    { value: 'in-progress', label: 'In Progress', icon: '⚡', count: 8 },
    { value: 'completed', label: 'Completed', icon: '✅', count: 24 },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', count: 3 }
  ];

  const categoryOptions: FilterOption[] = [
    { value: 'tech', label: 'Technology', icon: '💻', count: 15 },
    { value: 'design', label: 'Design', icon: '🎨', count: 9 },
    { value: 'marketing', label: 'Marketing', icon: '📢', count: 7 },
    { value: 'writing', label: 'Writing', icon: '✍️', count: 5 },
    { value: 'business', label: 'Business', icon: '💼', count: 11 },
    { value: 'creative', label: 'Creative', icon: '🎭', count: 6 }
  ];

  const timeOptions: FilterOption[] = [
    { value: '15-min', label: '15 minutes', count: 8 },
    { value: '30-min', label: '30 minutes', count: 12 },
    { value: '1-hour', label: '1 hour', count: 18 },
    { value: '2-hour', label: '2 hours', count: 14 },
    { value: 'multi-day', label: 'Multi-day', count: 9 }
  ];

  const skillOptions: FilterOption[] = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800', count: 22 },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', count: 31 },
    { value: 'expert', label: 'Expert', color: 'bg-red-100 text-red-800', count: 15 }
  ];

  const popularFilters = [
    { label: 'Quick Projects', filters: { timeCommitment: '1-hour' } },
    { label: 'Tech Focus', filters: { category: 'tech' } },
    { label: 'Beginner Friendly', filters: { skillLevel: 'beginner' } },
    { label: 'Active Projects', filters: { status: 'in-progress' } }
  ];

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== undefined && v !== null).length;
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: Target },
    { id: 'category', label: 'Category', icon: Sparkles },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'skills', label: 'Skills', icon: Star }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[90vw] xl:max-w-7xl max-h-[90vh] overflow-hidden"
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
                <div className="flex items-center justify-between p-6 lg:p-8 xl:p-10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Filter className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50">
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

                <div className="flex h-[60vh]">
                  {/* Sidebar Tabs */}
                  <div className="w-56 lg:w-72 xl:w-80 border-r border-border/50 bg-muted/30">
                    <div className="p-4">
                      <div className="space-y-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === tab.id
                                  ? "bg-orange-500 text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 lg:p-8 xl:p-10">
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
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {statusOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('status', filters.status === option.value ? undefined : option.value)}
                                    className={cn(
                                      "flex items-center justify-between p-3 lg:p-4 xl:p-5 rounded-lg border transition-all duration-200",
                                      filters.status === option.value
                                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                        : "border-border hover:border-orange-500/50 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{option.icon}</span>
                                      <span className="font-medium">{option.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {option.count}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Category Tab */}
                          {activeTab === 'category' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {categoryOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('category', filters.category === option.value ? '' : option.value)}
                                    className={cn(
                                      "flex items-center justify-between p-3 lg:p-4 xl:p-5 rounded-lg border transition-all duration-200",
                                      filters.category === option.value
                                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                        : "border-border hover:border-orange-500/50 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{option.icon}</span>
                                      <span className="font-medium">{option.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {option.count}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Time Tab */}
                          {activeTab === 'time' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {timeOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('timeCommitment', filters.timeCommitment === option.value ? '' : option.value)}
                                    className={cn(
                                      "flex items-center justify-between p-3 lg:p-4 xl:p-5 rounded-lg border transition-all duration-200",
                                      filters.timeCommitment === option.value
                                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                        : "border-border hover:border-orange-500/50 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium">{option.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {option.count}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills Tab */}
                          {activeTab === 'skills' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {skillOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('skillLevel', filters.skillLevel === option.value ? undefined : option.value)}
                                    className={cn(
                                      "flex items-center justify-between p-3 lg:p-4 xl:p-5 rounded-lg border transition-all duration-200",
                                      filters.skillLevel === option.value
                                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                        : "border-border hover:border-orange-500/50 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Star className="h-4 w-4" />
                                      <span className="font-medium">{option.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {option.count}
                                    </Badge>
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
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 lg:p-8 xl:p-10 border-t border-border/50 bg-muted/20 gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Popular filters</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularFilters.map((filter, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => onFiltersChange({ ...filters, ...filter.filters })}
                          className="text-xs whitespace-nowrap"
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={onClearFilters}
                      disabled={getActiveFilterCount() === 0}
                    >
                      Clear All
                    </Button>
                    <Button onClick={onClose}>
                      Apply Filters
                    </Button>
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