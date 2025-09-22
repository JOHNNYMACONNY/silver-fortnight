/**
 * AI Recommendations Hook
 * 
 * React hook for AI-powered recommendations including skill suggestions,
 * user matching, and intelligent content generation for TradeYa.
 */

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../services/ai/AIService';

interface SkillRecommendation {
  skill: string;
  confidence: number;
  reason: string;
  learningPath: string[];
  relatedSkills: string[];
  marketDemand: number;
}

interface UserMatch {
  userId: string;
  compatibility: number;
  reasons: string[];
  potentialTrades: string[];
  communicationScore: number;
  skillComplementarity: number;
}

interface AIRecommendationsState {
  skillRecommendations: SkillRecommendation[];
  userMatches: UserMatch[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface AIRecommendationsConfig {
  enableSkillRecommendations: boolean;
  enableUserMatching: boolean;
  enableContentGeneration: boolean;
  refreshInterval: number;
  maxRecommendations: number;
  maxMatches: number;
}

const DEFAULT_CONFIG: AIRecommendationsConfig = {
  enableSkillRecommendations: true,
  enableUserMatching: true,
  enableContentGeneration: true,
  refreshInterval: 300000, // 5 minutes
  maxRecommendations: 5,
  maxMatches: 10,
};

export function useAIRecommendations(
  userId: string | null,
  config: Partial<AIRecommendationsConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<AIRecommendationsState>({
    skillRecommendations: [],
    userMatches: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Load skill recommendations
  const loadSkillRecommendations = useCallback(async () => {
    if (!userId || !finalConfig.enableSkillRecommendations) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const recommendations = await aiService.getSkillRecommendations(
        userId,
        finalConfig.maxRecommendations
      );
      
      setState(prev => ({
        ...prev,
        skillRecommendations: recommendations,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('[AI Hook] Skill recommendations failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load skill recommendations',
        isLoading: false,
      }));
    }
  }, [userId, finalConfig.enableSkillRecommendations, finalConfig.maxRecommendations]);

  // Load user matches
  const loadUserMatches = useCallback(async () => {
    if (!userId || !finalConfig.enableUserMatching) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const matches = await aiService.findCompatibleUsers(
        userId,
        finalConfig.maxMatches
      );
      
      setState(prev => ({
        ...prev,
        userMatches: matches,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('[AI Hook] User matching failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load user matches',
        isLoading: false,
      }));
    }
  }, [userId, finalConfig.enableUserMatching, finalConfig.maxMatches]);

  // Generate AI content
  const generateContent = useCallback(async (
    type: 'profile' | 'description' | 'bio',
    context: any
  ): Promise<string> => {
    if (!finalConfig.enableContentGeneration) {
      return 'Content generation is disabled';
    }

    try {
      return await aiService.generateContent(type, context);
    } catch (error) {
      console.error('[AI Hook] Content generation failed:', error);
      return 'Failed to generate content';
    }
  }, [finalConfig.enableContentGeneration]);

  // Analyze user behavior
  const analyzeBehavior = useCallback(async () => {
    if (!userId) return null;

    try {
      return await aiService.analyzeUserBehavior(userId);
    } catch (error) {
      console.error('[AI Hook] Behavior analysis failed:', error);
      return null;
    }
  }, [userId]);

  // Get market insights
  const getMarketInsights = useCallback(async () => {
    try {
      return await aiService.getMarketInsights();
    } catch (error) {
      console.error('[AI Hook] Market insights failed:', error);
      return null;
    }
  }, []);

  // Refresh all recommendations
  const refreshRecommendations = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await Promise.all([
        loadSkillRecommendations(),
        loadUserMatches(),
      ]);
    } catch (error) {
      console.error('[AI Hook] Refresh failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh recommendations',
        isLoading: false,
      }));
    }
  }, [userId, loadSkillRecommendations, loadUserMatches]);

  // Auto-refresh recommendations
  useEffect(() => {
    if (!userId) return;

    // Initial load
    refreshRecommendations();

    // Set up auto-refresh
    const interval = setInterval(refreshRecommendations, finalConfig.refreshInterval);

    return () => clearInterval(interval);
  }, [userId, refreshRecommendations, finalConfig.refreshInterval]);

  // Get recommendation by skill
  const getRecommendationBySkill = useCallback((skill: string) => {
    return state.skillRecommendations.find(rec => rec.skill === skill);
  }, [state.skillRecommendations]);

  // Get match by user ID
  const getMatchByUserId = useCallback((targetUserId: string) => {
    return state.userMatches.find(match => match.userId === targetUserId);
  }, [state.userMatches]);

  // Get top recommendations
  const getTopRecommendations = useCallback((limit: number = 3) => {
    return state.skillRecommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }, [state.skillRecommendations]);

  // Get top matches
  const getTopMatches = useCallback((limit: number = 5) => {
    return state.userMatches
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, limit);
  }, [state.userMatches]);

  // Filter recommendations by confidence
  const getHighConfidenceRecommendations = useCallback((minConfidence: number = 0.8) => {
    return state.skillRecommendations.filter(rec => rec.confidence >= minConfidence);
  }, [state.skillRecommendations]);

  // Filter matches by compatibility
  const getHighCompatibilityMatches = useCallback((minCompatibility: number = 0.8) => {
    return state.userMatches.filter(match => match.compatibility >= minCompatibility);
  }, [state.userMatches]);

  // Get recommendations by category
  const getRecommendationsByCategory = useCallback((category: string) => {
    // This would need to be implemented based on skill categorization
    return state.skillRecommendations.filter(rec => 
      rec.skill.toLowerCase().includes(category.toLowerCase())
    );
  }, [state.skillRecommendations]);

  // Get matches by skill
  const getMatchesBySkill = useCallback((skill: string) => {
    return state.userMatches.filter(match => 
      match.potentialTrades.some(trade => 
        trade.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }, [state.userMatches]);

  // Clear recommendations
  const clearRecommendations = useCallback(() => {
    setState(prev => ({
      ...prev,
      skillRecommendations: [],
      userMatches: [],
      lastUpdated: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    loadSkillRecommendations,
    loadUserMatches,
    generateContent,
    analyzeBehavior,
    getMarketInsights,
    refreshRecommendations,
    clearRecommendations,
    clearError,
    
    // Utilities
    getRecommendationBySkill,
    getMatchByUserId,
    getTopRecommendations,
    getTopMatches,
    getHighConfidenceRecommendations,
    getHighCompatibilityMatches,
    getRecommendationsByCategory,
    getMatchesBySkill,
    
    // Computed properties
    hasRecommendations: state.skillRecommendations.length > 0,
    hasMatches: state.userMatches.length > 0,
    isReady: !state.isLoading && !state.error,
  };
}

export default useAIRecommendations;
