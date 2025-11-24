import React from 'react';
import {
  Palette,
  Code,
  Music,
  Video,
  PenTool,
  Camera,
  Layers,
  TrendingUp,
  Briefcase,
  Sparkles,
  Zap,
  ShoppingBag,
  Book,
  Award,
  Home,
  Car,
  CircleDot,
  Star,
  Trophy,
  Crown,
} from '../utils/icons';

// Icon component type (matches codebase pattern from CategoryGrid.tsx and skillMapping.ts)
export type IconComponent = React.ComponentType<{ className?: string }>;

// Category icons - return React component types (not JSX elements)
// NOTE: Categories match CreateTradePage.tsx (capitalized: 'Design', 'Development', etc.)
export const categoryIcons: Record<string, IconComponent> = {
  'Design': Palette,
  'Development': Code,
  'Marketing': TrendingUp,
  'Writing': PenTool,
  'Photography': Camera,
  'Video Editing': Video,
  'Business': Briefcase,
  'Music': Music,
  'Art': Sparkles,
  'Other': Layers,
};

export const getCategoryIcon = (category: string): IconComponent | null => {
  return categoryIcons[category] || null;
};

// Skill level icons - return React component types (not emoji strings)
export const skillLevelIcons: Record<string, IconComponent> = {
  'beginner': CircleDot,
  'intermediate': Star,
  'expert': Trophy,
};

export const getSkillLevelIcon = (level: string): IconComponent | null => {
  return skillLevelIcons[level] || null;
};

// Experience level icons - return React component types (not emoji strings)
// NOTE: Values must match EXPERIENCE_LEVELS in ProfileCompletionSteps.tsx: beginner, intermediate, experienced, expert
export const experienceLevelIcons: Record<string, IconComponent> = {
  'beginner': CircleDot,
  'intermediate': Star,
  'experienced': Trophy,
  'expert': Crown,
};

export const getExperienceLevelIcon = (level: string): IconComponent | null => {
  return experienceLevelIcons[level] || null;
};

// Trading interest icons - return React component types (not JSX elements)
// NOTE: Values match TRADING_INTERESTS in ProfileCompletionSteps.tsx (lowercase: 'electronics', 'clothing', etc.)
export const tradingInterestIcons: Record<string, IconComponent> = {
  'electronics': Zap,
  'clothing': ShoppingBag,
  'books': Book,
  'sports': Award,
  'home': Home,
  'collectibles': Sparkles,
  'automotive': Car,
  'crafts': Palette,
};

export const getTradingInterestIcon = (interest: string): IconComponent | null => {
  return tradingInterestIcons[interest] || null;
};

