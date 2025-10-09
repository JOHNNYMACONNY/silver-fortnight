import { 
  Palette, 
  Code, 
  Music, 
  Video, 
  PenTool, 
  Camera, 
  Layers, 
  TrendingUp, 
  GraduationCap,
  Zap
} from 'lucide-react';
import type { Topic } from './semanticColors';

/**
 * Skill category definitions with semantic topics and icons
 */
export type SkillCategory = 
  | 'design'
  | 'development'
  | 'audio'
  | 'video'
  | 'writing'
  | 'photography'
  | '3d'
  | 'business'
  | 'education'
  | 'general';

export interface SkillCategoryConfig {
  topic: Topic;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Category configuration mapping
 */
export const categoryConfig: Record<SkillCategory, SkillCategoryConfig> = {
  design: {
    topic: 'community',
    icon: Palette,
    label: 'Design & Visual Arts'
  },
  development: {
    topic: 'community',
    icon: Code,
    label: 'Development & Tech'
  },
  audio: {
    topic: 'community',
    icon: Music,
    label: 'Audio & Sound'
  },
  video: {
    topic: 'community',
    icon: Video,
    label: 'Video & Film'
  },
  writing: {
    topic: 'community',
    icon: PenTool,
    label: 'Writing & Content'
  },
  photography: {
    topic: 'community',
    icon: Camera,
    label: 'Photography & Visual Media'
  },
  '3d': {
    topic: 'community',
    icon: Layers,
    label: '3D & Animation'
  },
  business: {
    topic: 'community',
    icon: TrendingUp,
    label: 'Business & Marketing'
  },
  education: {
    topic: 'community',
    icon: GraduationCap,
    label: 'Education & Mentoring'
  },
  general: {
    topic: 'community',
    icon: Zap,
    label: 'General Skills'
  }
};

/**
 * Comprehensive skill-to-category mapping
 * This maps common skill names to their categories
 */
export const skillToCategoryMap: Record<string, SkillCategory> = {
  // Design & Visual Arts
  'ui/ux design': 'design',
  'ui/ux': 'design',
  'ux design': 'design',
  'ui design': 'design',
  'graphic design': 'design',
  'illustration': 'design',
  'brand design': 'design',
  'web design': 'design',
  'logo design': 'design',
  'figma': 'design',
  'sketch': 'design',
  'adobe xd': 'design',
  'photoshop': 'design',
  'illustrator': 'design',
  'design': 'design',
  
  // Development & Tech
  'react': 'development',
  'javascript': 'development',
  'typescript': 'development',
  'python': 'development',
  'node.js': 'development',
  'nodejs': 'development',
  'java': 'development',
  'c++': 'development',
  'c#': 'development',
  'ruby': 'development',
  'php': 'development',
  'swift': 'development',
  'kotlin': 'development',
  'go': 'development',
  'rust': 'development',
  'html': 'development',
  'css': 'development',
  'vue': 'development',
  'angular': 'development',
  'svelte': 'development',
  'next.js': 'development',
  'react native': 'development',
  'flutter': 'development',
  'sql': 'development',
  'mongodb': 'development',
  'postgresql': 'development',
  'firebase': 'development',
  'aws': 'development',
  'docker': 'development',
  'kubernetes': 'development',
  'git': 'development',
  'development': 'development',
  'programming': 'development',
  'coding': 'development',
  'web development': 'development',
  'frontend': 'development',
  'backend': 'development',
  'full stack': 'development',
  'fullstack': 'development',
  
  // Audio & Sound
  'music production': 'audio',
  'audio engineering': 'audio',
  'sound design': 'audio',
  'mixing & mastering': 'audio',
  'mixing': 'audio',
  'mastering': 'audio',
  'audio editing': 'audio',
  'podcast editing': 'audio',
  'voice over': 'audio',
  'voiceover': 'audio',
  'pro tools': 'audio',
  'logic pro': 'audio',
  'ableton': 'audio',
  'fl studio': 'audio',
  'cubase': 'audio',
  'reaper': 'audio',
  'music': 'audio',
  'audio': 'audio',
  'sound': 'audio',
  
  // Video & Film
  'video editing': 'video',
  'cinematography': 'video',
  'motion graphics': 'video',
  'filmmaking': 'video',
  'videography': 'video',
  'color grading': 'video',
  'premiere pro': 'video',
  'final cut pro': 'video',
  'after effects': 'video',
  'davinci resolve': 'video',
  'video production': 'video',
  'film': 'video',
  'video': 'video',
  
  // Writing & Content
  'copywriting': 'writing',
  'content writing': 'writing',
  'script writing': 'writing',
  'technical writing': 'writing',
  'creative writing': 'writing',
  'blogging': 'writing',
  'journalism': 'writing',
  'editing': 'writing',
  'proofreading': 'writing',
  'writing': 'writing',
  'content': 'writing',
  
  // Photography & Visual Media
  'photography': 'photography',
  'portrait photography': 'photography',
  'product photography': 'photography',
  'photojournalism': 'photography',
  'wedding photography': 'photography',
  'event photography': 'photography',
  'landscape photography': 'photography',
  'photo editing': 'photography',
  'lightroom': 'photography',
  
  // 3D & Animation
  '3d modeling': '3d',
  '3d modelling': '3d',
  'animation': '3d',
  'character design': '3d',
  'environment design': '3d',
  'blender': '3d',
  'maya': '3d',
  'cinema 4d': '3d',
  '3ds max': '3d',
  'zbrush': '3d',
  '3d': '3d',
  '3d animation': '3d',
  '2d animation': '3d',
  
  // Business & Marketing
  'marketing': 'business',
  'social media': 'business',
  'seo': 'business',
  'project management': 'business',
  'digital marketing': 'business',
  'email marketing': 'business',
  'content marketing': 'business',
  'branding': 'business',
  'strategy': 'business',
  'analytics': 'business',
  'business': 'business',
  'management': 'business',
  
  // Education & Mentoring
  'teaching': 'education',
  'mentoring': 'education',
  'consulting': 'education',
  'data analysis': 'education',
  'tutoring': 'education',
  'coaching': 'education',
  'training': 'education',
  'education': 'education',
};

/**
 * Get skill category from skill name
 * Returns 'general' if skill is not found in the mapping
 */
export function getSkillCategory(skillName: string): SkillCategory {
  const normalizedSkill = skillName.toLowerCase().trim();
  return skillToCategoryMap[normalizedSkill] || 'general';
}

/**
 * Get badge props (topic and icon) for a skill
 * This is the main helper function for rendering skill badges
 */
export function getSkillBadgeProps(skillName: string): {
  topic: Topic;
  Icon: React.ComponentType<{ className?: string }>;
  category: SkillCategory;
} {
  const category = getSkillCategory(skillName);
  const config = categoryConfig[category];
  
  return {
    topic: config.topic,
    Icon: config.icon,
    category
  };
}

/**
 * Get all skills for a specific category
 * Useful for filtering or grouping
 */
export function getSkillsByCategory(category: SkillCategory): string[] {
  return Object.entries(skillToCategoryMap)
    .filter(([_, cat]) => cat === category)
    .map(([skill]) => skill);
}

/**
 * Check if a skill exists in the mapping
 */
export function isKnownSkill(skillName: string): boolean {
  const normalizedSkill = skillName.toLowerCase().trim();
  return normalizedSkill in skillToCategoryMap;
}

