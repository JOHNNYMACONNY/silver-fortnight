import React, { useState, useEffect } from 'react';
import { Skill } from '../../types/collaboration';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
// Minimal inline collapsible to avoid missing import
const Collapsible: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode; }> = ({ open, onOpenChange, children }) => (
  <div data-open={open}>{children}</div>
);
const CollapsibleTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; }> = ({ children }) => <>{children}</>;
const CollapsibleContent: React.FC<{ asChild?: boolean; children: React.ReactNode; }> = ({ children }) => <>{children}</>;
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Label } from '../ui/Label';

export interface RoleFilterOptions {
  search: string;
  status: ('open' | 'filled' | 'completed' | 'abandoned' | 'unneeded' | 'all')[];
  skills: string[];
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'status';
  sortDirection: 'asc' | 'desc';
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

interface RoleFilterControlsProps {
  availableSkills: Skill[];
  filters: RoleFilterOptions;
  onChange: (filters: RoleFilterOptions) => void;
  onReset: () => void;
}

export const RoleFilterControls: React.FC<RoleFilterControlsProps> = ({
  availableSkills,
  filters,
  onChange,
  onReset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<RoleFilterOptions>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...localFilters,
      search: e.target.value
    };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle status filter change
  const handleStatusChange = (status: 'open' | 'filled' | 'completed' | 'abandoned' | 'unneeded' | 'all') => {
    let newStatuses: ('open' | 'filled' | 'completed' | 'abandoned' | 'unneeded' | 'all')[];

    if (status === 'all') {
      // If 'all' is selected, clear other selections
      newStatuses = ['all'];
    } else {
      // If a specific status is selected, remove 'all' if present
      const currentStatuses = localFilters.status.filter(s => s !== 'all');

      if (currentStatuses.includes(status)) {
        // If status is already selected, remove it
        newStatuses = currentStatuses.filter(s => s !== status);
        // If no statuses left, default to 'all'
        if (newStatuses.length === 0) {
          newStatuses = ['all'];
        }
      } else {
        // Add the status
        newStatuses = [...currentStatuses, status];
      }
    }

    const newFilters = {
      ...localFilters,
      status: newStatuses
    };

    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle skill filter change
  const handleSkillChange = (skill: string) => {
    let newSkills: string[];

    if (localFilters.skills.includes(skill)) {
      // If skill is already selected, remove it
      newSkills = localFilters.skills.filter(s => s !== skill);
    } else {
      // Add the skill
      newSkills = [...localFilters.skills, skill];
    }

    const newFilters = {
      ...localFilters,
      skills: newSkills
    };

    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle sort change
  const handleSortChange = (sortBy: 'createdAt' | 'updatedAt' | 'title' | 'status') => {
    const newFilters: RoleFilterOptions = {
      ...localFilters,
      sortBy,
      // If clicking the same sort field, toggle direction
      sortDirection: localFilters.sortBy === sortBy && localFilters.sortDirection === 'asc' ? 'desc' : 'asc'
    };

    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle date range change
  const handleDateChange = (type: 'start' | 'end', date: string) => {
    const newDateRange = {
      start: localFilters.dateRange?.start || null,
      end: localFilters.dateRange?.end || null,
      [type]: date ? new Date(date) : null
    };

    const newFilters: RoleFilterOptions = {
      ...localFilters,
      dateRange: newDateRange
    };

    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Reset filters
  const handleReset = () => {
    onReset();
  };

  // Get unique skill names from available skills
  const uniqueSkillNames = Array.from(new Set(availableSkills.map(skill => skill.name)));

  const statusColors = {
    all: 'default',
    open: 'success',
    filled: 'secondary',
    completed: 'secondary',
    abandoned: 'destructive',
    unneeded: 'outline',
  } as const;

  return (
    <Card className="p-4 mb-6">
      <div className="relative flex items-center mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={localFilters.search}
          onChange={handleSearchChange}
          placeholder="Search roles by title or description..."
          className="pl-10 pr-10"
        />
        {localFilters.search && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newFilters = { ...localFilters, search: '' };
              setLocalFilters(newFilters);
              onChange(newFilters);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(statusColors).map(([status, variant]) => (
          <Badge
            key={status}
            variant={localFilters.status.includes(status as any) ? variant : 'outline'}
            onClick={() => handleStatusChange(status as any)}
            className="cursor-pointer"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        ))}
      </div>

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="mb-4">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Advanced Filters
            {showAdvanced ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Required Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uniqueSkillNames.map(skill => (
                        <Badge
                          key={skill}
                          variant={localFilters.skills.includes(skill) ? 'default' : 'secondary'}
                          onClick={() => handleSkillChange(skill)}
                          className="cursor-pointer"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Sort By</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Select
                        value={localFilters.sortBy}
                        onValueChange={(value) => handleSortChange(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Creation Date</SelectItem>
                          <SelectItem value="updatedAt">Last Updated</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSortChange(localFilters.sortBy)}
                      >
                        {localFilters.sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Date Range</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="date"
                        value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                        onChange={e => handleDateChange('start', e.target.value)}
                      />
                      <span>-</span>
                      <Input
                        type="date"
                        value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                        onChange={e => handleDateChange('end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleReset}>Reset Filters</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default RoleFilterControls;
