import { TradeSkill, SkillLevel } from '../types/skill';

/**
 * Parse a skill string that may contain level information
 * Format: "Skill Name (level)" or just "Skill Name"
 */
export const parseSkillString = (skillString: string): TradeSkill => {
  const trimmed = skillString.trim();
  
  // Check if skill contains level information in parentheses
  const levelMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  
  if (levelMatch) {
    const [, name, level] = levelMatch;
    const normalizedLevel = level.toLowerCase().trim();
    
    // Validate level
    if (Object.values(SkillLevel).includes(normalizedLevel as SkillLevel)) {
      return {
        name: name.trim(),
        level: normalizedLevel as SkillLevel
      };
    }
    // If level is invalid, treat the whole string as skill name
    return {
      name: trimmed,
      level: SkillLevel.INTERMEDIATE
    };
  }
  
  // Default to intermediate if no valid level found
  return {
    name: trimmed,
    level: SkillLevel.INTERMEDIATE
  };
};

/**
 * Parse a comma-separated string of skills
 */
export const parseSkillsString = (skillsString: string): TradeSkill[] => {
  if (!skillsString.trim()) return [];
  
  return skillsString
    .split(',')
    .map(parseSkillString)
    .filter(skill => skill.name.length > 0);
};

/**
 * Format a skill for display with level
 */
export const formatSkillForDisplay = (skill: TradeSkill): string => {
  return `${skill.name} (${skill.level})`;
};

/**
 * Format skills array for display
 */
export const formatSkillsForDisplay = (skills: TradeSkill[]): string => {
  return skills.map(formatSkillForDisplay).join(', ');
};

/**
 * Validate skill data
 */
export const validateSkill = (skill: TradeSkill): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!skill.name || skill.name.trim().length === 0) {
    errors.push('Skill name is required');
  }
  
  if (skill.name && skill.name.length > 100) {
    errors.push('Skill name must be less than 100 characters');
  }
  
  if (!Object.values(SkillLevel).includes(skill.level as SkillLevel)) {
    errors.push('Invalid skill level');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate skills array
 */
export const validateSkills = (skills: TradeSkill[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (skills.length === 0) {
    errors.push('At least one skill is required');
  }
  
  skills.forEach((skill, index) => {
    const validation = validateSkill(skill);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        errors.push(`Skill ${index + 1}: ${error}`);
      });
    }
  });
  
  // Check for duplicate skill names
  const skillNames = skills.map(s => s.name.toLowerCase());
  const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate skills found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Normalize skill name for comparison
 */
export const normalizeSkillName = (name: string): string => {
  return name.toLowerCase().trim();
};

/**
 * Check if two skills are the same (case-insensitive name comparison)
 */
export const areSkillsEqual = (skill1: TradeSkill, skill2: TradeSkill): boolean => {
  return normalizeSkillName(skill1.name) === normalizeSkillName(skill2.name);
};

/**
 * Find skill by name in an array
 */
export const findSkillByName = (skills: TradeSkill[], name: string): TradeSkill | undefined => {
  return skills.find(skill => normalizeSkillName(skill.name) === normalizeSkillName(name));
};
