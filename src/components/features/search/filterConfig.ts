import { 
  Filter, 
  Clock, 
  Target, 
  Star,
  Tag,
  Award,
  CheckCircle,
  Users,
  Trophy
} from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterTabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  resetValue: any;
  resetLabel: string;
}

export interface FilterConfig {
  tabs: FilterTabConfig[];
  options: {
    status: FilterOption[];
    category: FilterOption[];
    time: FilterOption[];
    level: FilterOption[];
    reputation: FilterOption[];
    hasSkills: FilterOption[];
    // Challenges-specific filters
    challengeCategory: FilterOption[];
    difficulty: FilterOption[];
    challengeStatus: FilterOption[];
    challengeType: FilterOption[];
  };
  presets: Array<{
    label: string;
    filters: Record<string, any>;
  }>;
}

// Standardized filter configuration
export const filterConfig: FilterConfig = {
  tabs: [
    { 
      id: 'status', 
      label: 'Status', 
      icon: Target, 
      resetValue: undefined, 
      resetLabel: 'Reset status' 
    },
    { 
      id: 'category', 
      label: 'Category', 
      icon: Star, 
      resetValue: '', 
      resetLabel: 'Reset category' 
    },
    { 
      id: 'time', 
      label: 'Time', 
      icon: Clock, 
      resetValue: '', 
      resetLabel: 'Reset time' 
    },
    { 
      id: 'skills', 
      label: 'Skills', 
      icon: Tag, 
      resetValue: [], 
      resetLabel: 'Reset skills' 
    },
    { 
      id: 'level', 
      label: 'Level', 
      icon: Award, 
      resetValue: undefined, 
      resetLabel: 'Reset level' 
    },
    { 
      id: 'reputation', 
      label: 'Reputation', 
      icon: Star, 
      resetValue: null, 
      resetLabel: 'Reset reputation' 
    },
    { 
      id: 'hasSkills', 
      label: 'Has Skills', 
      icon: CheckCircle, 
      resetValue: null, 
      resetLabel: 'Reset has skills' 
    },
    { 
      id: 'presets', 
      label: 'Presets', 
      icon: Filter, 
      resetValue: null, 
      resetLabel: 'Reset presets' 
    },
    // Challenges-specific tabs
    { 
      id: 'challengeCategory', 
      label: 'Category', 
      icon: Trophy, 
      resetValue: '', 
      resetLabel: 'Reset category' 
    },
    { 
      id: 'difficulty', 
      label: 'Difficulty', 
      icon: Award, 
      resetValue: '', 
      resetLabel: 'Reset difficulty' 
    },
    { 
      id: 'challengeStatus', 
      label: 'Status', 
      icon: Target, 
      resetValue: '', 
      resetLabel: 'Reset status' 
    },
    { 
      id: 'challengeType', 
      label: 'Type', 
      icon: Users, 
      resetValue: '', 
      resetLabel: 'Reset type' 
    }
  ],
  options: {
    status: [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ],
    category: [
      { value: 'tech', label: 'Technology' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'writing', label: 'Writing' },
      { value: 'business', label: 'Business' },
      { value: 'creative', label: 'Creative' }
    ],
    time: [
      { value: '15-min', label: '15 minutes' },
      { value: '30-min', label: '30 minutes' },
      { value: '1-hour', label: '1 hour' },
      { value: '2-hour', label: '2 hours' },
      { value: 'multi-day', label: 'Multi-day' }
    ],
    level: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'expert', label: 'Expert' }
    ],
    reputation: [
      { value: '0', label: '0+ (All)' },
      { value: '10', label: '10+ (Good)' },
      { value: '25', label: '25+ (Very Good)' },
      { value: '50', label: '50+ (Excellent)' },
      { value: '100', label: '100+ (Outstanding)' }
    ],
    hasSkills: [
      { value: 'true', label: 'Has Skills' },
      { value: 'false', label: 'No Skills' }
    ],
    // Challenges-specific options
    challengeCategory: [
      { value: 'design', label: 'Design' },
      { value: 'development', label: 'Development' },
      { value: 'audio', label: 'Audio' },
      { value: 'video', label: 'Video' },
      { value: 'writing', label: 'Writing' },
      { value: 'photography', label: 'Photography' },
      { value: '3d', label: '3D' },
      { value: 'mixed_media', label: 'Mixed Media' },
      { value: 'trading', label: 'Trading' },
      { value: 'collaboration', label: 'Collaboration' },
      { value: 'community', label: 'Community' }
    ],
    difficulty: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
      { value: 'expert', label: 'Expert' }
    ],
    challengeStatus: [
      { value: 'draft', label: 'Draft' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'archived', label: 'Archived' },
      { value: 'cancelled', label: 'Cancelled' }
    ],
    challengeType: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'skill', label: 'Skill' },
      { value: 'community', label: 'Community' },
      { value: 'special_event', label: 'Special Event' },
      { value: 'personal', label: 'Personal' },
      { value: 'solo', label: 'Solo' },
      { value: 'trade', label: 'Trade' },
      { value: 'collaboration', label: 'Collaboration' }
    ]
  },
  presets: [
    { label: 'Quick Projects', filters: { timeCommitment: '1-hour' } },
    { label: 'Tech Focus', filters: { category: 'tech' } },
    { label: 'Beginner Friendly', filters: { skillLevel: 'beginner' } },
    { label: 'Active Projects', filters: { status: 'in_progress' } }
  ]
};

// Standardized spacing and sizing constants
export const filterSpacing = {
  section: 'space-y-4',
  button: 'gap-2',
  tab: 'space-y-1',
  chip: 'gap-2',
  preset: 'gap-3 lg:gap-4'
} as const;

export const filterSizing = {
  button: {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  },
  tab: 'px-3 py-2 lg:px-4 lg:py-3',
  chip: 'px-3 py-1.5 text-xs',
  preset: 'p-3 lg:p-4'
} as const;

export const filterLayout = {
  buttons: 'flex flex-wrap gap-2',
  tabs: 'space-y-1',
  presets: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4',
  chips: 'flex flex-wrap gap-2'
} as const;
