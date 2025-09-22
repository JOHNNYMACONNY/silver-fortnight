// src/services/portfolioStats.ts

import { PortfolioItem } from '../types/portfolio';
import { getUserPortfolioItems } from './portfolio';
import { ServiceResponse } from './collaboration';

export interface PortfolioStats {
  totalProjects: number;
  averageRating: number;
  skillsCount: number;
  completedTrades: number;
  featuredProjects: number;
  recentProjects: number;
  tradesCount: number;
  collaborationsCount: number;
  uniqueSkills: string[];
  completionRate: number;
}

export interface PortfolioStatsOptions {
  includePrivate?: boolean;
  timeRange?: 'all' | 'month' | 'quarter' | 'year';
}

/**
 * Calculate portfolio statistics for a user
 */
export async function getPortfolioStats(
  userId: string,
  options: PortfolioStatsOptions = {}
): Promise<ServiceResponse<PortfolioStats>> {
  try {
    const { includePrivate = false, timeRange = 'all' } = options;
    
    // Fetch portfolio items
    const portfolioOptions = includePrivate ? {} : { onlyVisible: true };
    const portfolioItems = await getUserPortfolioItems(userId, portfolioOptions);
    
    // Filter by time range if specified
    let filteredItems = portfolioItems;
    if (timeRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeRange) {
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredItems = portfolioItems.filter(item => {
        if (!item.completedAt) return false;
        const completedDate = item.completedAt instanceof Date 
          ? item.completedAt 
          : item.completedAt.toDate();
        return completedDate >= cutoffDate;
      });
    }
    
    // Calculate statistics
    const totalProjects = filteredItems.length;
    const featuredProjects = filteredItems.filter(item => item.featured).length;
    
    // Calculate trades and collaborations
    const tradesCount = filteredItems.filter(item => item.sourceType === 'trade').length;
    const collaborationsCount = filteredItems.filter(item => item.sourceType === 'collaboration').length;
    const completedTrades = tradesCount; // All portfolio items are completed by definition
    
    // Calculate average rating from portfolio items
    const ratings = portfolioItems
      .filter(item => item.rating && item.rating > 0)
      .map(item => item.rating!);
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    // Calculate unique skills
    const allSkills = filteredItems
      .flatMap(item => item.skills || [])
      .filter(skill => skill && typeof skill === 'string')
      .map(skill => skill.toLowerCase().trim());
    
    const uniqueSkills = [...new Set(allSkills)];
    const skillsCount = uniqueSkills.length;
    
    // Calculate recent projects (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProjects = filteredItems.filter(item => {
      if (!item.completedAt) return false;
      const completedDate = item.completedAt instanceof Date 
        ? item.completedAt 
        : item.completedAt.toDate();
      return completedDate >= thirtyDaysAgo;
    }).length;
    
    // Calculate completion rate (for now, assume all portfolio items are completed)
    // In a real implementation, you might want to track incomplete items
    const completionRate = 100; // All portfolio items are completed by definition
    
    const stats: PortfolioStats = {
      totalProjects,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      skillsCount,
      completedTrades,
      featuredProjects,
      recentProjects,
      tradesCount,
      collaborationsCount,
      uniqueSkills,
      completionRate
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error calculating portfolio stats:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate portfolio statistics'
    };
  }
}

/**
 * Get portfolio statistics for display in UI components
 */
export async function getPortfolioStatsForDisplay(
  userId: string,
  options: PortfolioStatsOptions = {}
): Promise<ServiceResponse<{
  totalProjects: number;
  averageRating: number;
  skillsCount: number;
  completedTrades: number;
  featuredProjects: number;
  recentProjects: number;
}>> {
  try {
    const result = await getPortfolioStats(userId, options);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error || 'Failed to fetch portfolio stats'
      };
    }
    
    // Return only the fields needed for display
    const displayStats = {
      totalProjects: result.data.totalProjects,
      averageRating: result.data.averageRating,
      skillsCount: result.data.skillsCount,
      completedTrades: result.data.completedTrades,
      featuredProjects: result.data.featuredProjects,
      recentProjects: result.data.recentProjects
    };
    
    return {
      success: true,
      data: displayStats
    };
  } catch (error) {
    console.error('Error getting portfolio stats for display:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get portfolio stats for display'
    };
  }
}

/**
 * Get portfolio statistics with fallback values for when data is not available
 */
export function getPortfolioStatsFallback(): PortfolioStats {
  return {
    totalProjects: 0,
    averageRating: 0,
    skillsCount: 0,
    completedTrades: 0,
    featuredProjects: 0,
    recentProjects: 0,
    tradesCount: 0,
    collaborationsCount: 0,
    uniqueSkills: [],
    completionRate: 0
  };
}
