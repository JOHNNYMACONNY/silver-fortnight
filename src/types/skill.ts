/**
 * Standardized TradeSkill interface for the TradeYa application
 * This interface should be used consistently across all components and services
 */

export interface TradeSkill {
  /** Unique identifier for the skill (optional for backward compatibility) */
  id?: string;
  /** Name of the skill */
  name: string;
  /** Proficiency level of the skill */
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Optional category for grouping related skills */
  category?: string;
  /** Optional description of the skill */
  description?: string;
  /** Optional estimated hours for skill completion */
  estimatedHours?: number;
}

/**
 * Skill level enum for type safety
 */
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Common skill categories
 */
export enum SkillCategory {
  PROGRAMMING = 'programming',
  DESIGN = 'design',
  MARKETING = 'marketing',
  WRITING = 'writing',
  BUSINESS = 'business',
  LANGUAGES = 'languages',
  MUSIC = 'music',
  ART = 'art',
  OTHER = 'other'
}

/**
 * Utility type for skill arrays
 */
export type TradeSkillArray = TradeSkill[];

/**
 * Utility type for skill names (string array)
 */
export type SkillNameArray = string[];

/**
 * Skill validation result
 */
export interface SkillValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Skill matching result
 */
export interface SkillMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
}
