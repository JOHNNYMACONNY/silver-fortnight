import { parseSkillString, parseSkillsString, validateSkill, validateSkills } from '../skillUtils';
import { SkillLevel } from '../../types/skill';

describe('skillUtils', () => {
  describe('parseSkillString', () => {
    it('should parse skill with level correctly', () => {
      const result = parseSkillString('React (expert)');
      expect(result).toEqual({
        name: 'React',
        level: SkillLevel.EXPERT
      });
    });

    it('should default to intermediate when no level provided', () => {
      const result = parseSkillString('JavaScript');
      expect(result).toEqual({
        name: 'JavaScript',
        level: SkillLevel.INTERMEDIATE
      });
    });

    it('should handle invalid level gracefully', () => {
      const result = parseSkillString('Python (invalid)');
      expect(result).toEqual({
        name: 'Python (invalid)',
        level: SkillLevel.INTERMEDIATE
      });
    });

    it('should trim whitespace correctly', () => {
      const result = parseSkillString('  React (expert)  ');
      expect(result).toEqual({
        name: 'React',
        level: SkillLevel.EXPERT
      });
    });
  });

  describe('parseSkillsString', () => {
    it('should parse multiple skills correctly', () => {
      const result = parseSkillsString('React (expert), JavaScript (intermediate), Python (beginner)');
      expect(result).toEqual([
        { name: 'React', level: SkillLevel.EXPERT },
        { name: 'JavaScript', level: SkillLevel.INTERMEDIATE },
        { name: 'Python', level: SkillLevel.BEGINNER }
      ]);
    });

    it('should handle mixed formats', () => {
      const result = parseSkillsString('React (expert), JavaScript, Python (advanced)');
      expect(result).toEqual([
        { name: 'React', level: SkillLevel.EXPERT },
        { name: 'JavaScript', level: SkillLevel.INTERMEDIATE },
        { name: 'Python', level: SkillLevel.ADVANCED }
      ]);
    });

    it('should handle empty string', () => {
      const result = parseSkillsString('');
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only string', () => {
      const result = parseSkillsString('   ');
      expect(result).toEqual([]);
    });
  });

  describe('validateSkill', () => {
    it('should validate correct skill', () => {
      const skill = { name: 'React', level: SkillLevel.EXPERT };
      const result = validateSkill(skill);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should catch missing name', () => {
      const skill = { name: '', level: SkillLevel.EXPERT };
      const result = validateSkill(skill);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Skill name is required');
    });

    it('should catch name too long', () => {
      const skill = { name: 'a'.repeat(101), level: SkillLevel.EXPERT };
      const result = validateSkill(skill);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Skill name must be less than 100 characters');
    });

    it('should catch invalid level', () => {
      const skill = { name: 'React', level: 'invalid' as any };
      const result = validateSkill(skill);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid skill level');
    });
  });

  describe('validateSkills', () => {
    it('should validate correct skills array', () => {
      const skills = [
        { name: 'React', level: SkillLevel.EXPERT },
        { name: 'JavaScript', level: SkillLevel.INTERMEDIATE }
      ];
      const result = validateSkills(skills);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should catch empty skills array', () => {
      const result = validateSkills([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one skill is required');
    });

    it('should catch duplicate skills', () => {
      const skills = [
        { name: 'React', level: SkillLevel.EXPERT },
        { name: 'react', level: SkillLevel.INTERMEDIATE }
      ];
      const result = validateSkills(skills);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate skills found: react');
    });
  });
});
