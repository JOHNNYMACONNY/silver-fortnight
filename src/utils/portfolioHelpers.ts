// src/utils/portfolioHelpers.ts

import { PortfolioItem } from '../types/portfolio';

/**
 * Transform PortfolioItem for display purposes
 * Handles data structure differences between mock and real data
 */
export interface DisplayPortfolioItem {
  id: string;
  title: string;
  description: string;
  skills: string[];
  displayDate: string;
  displayLink: string | null;
  displayType: string;
  sourceType: 'trade' | 'collaboration' | 'challenge';
  category?: string;
  featured: boolean;
  pinned: boolean;
  evidence?: any[];
}

export function getDisplayData(item: PortfolioItem): DisplayPortfolioItem {
  // Format date from completedAt timestamp
  const displayDate = formatPortfolioDate(item.completedAt);
  
  // Use first evidence URL as link, or null
  const displayLink = item.evidence && item.evidence.length > 0 
    ? item.evidence[0].url 
    : null;
  
  // Use category if available, otherwise use sourceType for display
  const displayType = item.category || item.sourceType;
  
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    skills: item.skills || [],
    displayDate,
    displayLink,
    displayType,
    sourceType: item.sourceType,
    category: item.category,
    featured: item.featured,
    pinned: item.pinned,
    evidence: item.evidence
  };
}

/**
 * Format date for portfolio display
 * Handles Firestore timestamps and regular dates
 */
export function formatPortfolioDate(date: any): string {
  if (!date) return 'Unknown date';
  
  try {
    // Handle Firestore Timestamp
    const d = date.toDate ? date.toDate() : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return 'Invalid date';
    
    // Use relative dates for items older than 30 days
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      // For older items, show full date
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    return 'Unknown date';
  }
}

/**
 * Get badge variant based on sourceType or category
 */
export function getBadgeVariant(sourceType: string, category?: string): 'default' | 'info' | 'secondary' {
  if (category) {
    // Map categories to variants
    if (category.toLowerCase().includes('design')) return 'info';
    if (category.toLowerCase().includes('development') || category.toLowerCase().includes('web') || category.toLowerCase().includes('mobile')) return 'default';
  }
  
  // Fallback to sourceType
  switch (sourceType) {
    case 'trade':
      return 'default';
    case 'collaboration':
      return 'info';
    case 'challenge':
      return 'secondary';
    default:
      return 'default';
  }
}

