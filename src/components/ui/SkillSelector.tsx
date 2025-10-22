import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import SkillBadge, { SkillLevel } from './SkillBadge';
import { Skill } from '../../types/collaboration';

// Common skills for suggestions
const COMMON_SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Design',
  'Marketing',
  'Writing',
  'Photography',
  'Video Editing',
  'SEO',
  'Social Media',
  'Project Management',
  'UI/UX',
  'Data Analysis',
  'Copywriting',
  'Illustration',
  'Animation',
  'Teaching',
  'Consulting',
  'Mentoring'
];

export interface SkillSelectorProps {
  selectedSkills: Skill[];
  onChange: (skills: Skill[]) => void;
  maxSkills?: number;
  className?: string;
  withLevels?: boolean;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onChange,
  maxSkills = 10,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('intermediate');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = COMMON_SKILLS.filter(
      (skill) =>
        skill.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())
    ).slice(0, 5);

    setSuggestions(filtered);
  }, [inputValue, selectedSkills]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleAddSkill = (skillName: string) => {
    if (
      skillName.trim() === '' ||
      selectedSkills.length >= maxSkills ||
      selectedSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())
    ) {
      return;
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: skillName.trim(),
      level: selectedLevel
    };

    onChange([...selectedSkills, newSkill]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = [...selectedSkills];
    newSkills.splice(index, 1);
    onChange(newSkills);
  };

  const handleSuggestionClick = (skill: string) => {
    handleAddSkill(skill);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedSkills.map((skill, index) => (
          <SkillBadge
            key={index}
            skill={skill.name}
            level={skill.level}
            removable
            onRemove={() => handleRemoveSkill(index)}
          />
        ))}
      </div>

      <div className="relative">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={selectedSkills.length >= maxSkills ? "Max skills reached" : "Add a skill..."}
            disabled={selectedSkills.length >= maxSkills}
            className={cn(
              "flex-1 px-4 py-3 rounded-l-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200",
              selectedSkills.length >= maxSkills && "opacity-50 cursor-not-allowed"
            )}
          />

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as SkillLevel)}
            className={cn(
              "px-4 py-3 border-l-0 rounded-r-xl glassmorphic border-glass backdrop-blur-xl bg-white/5",
              "text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            )}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute z-10 w-full mt-1 rounded-xl shadow-lg max-h-60 overflow-auto",
              "glassmorphic border-glass backdrop-blur-xl bg-white/10 text-foreground"
            )}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-2 cursor-pointer",
                  "text-foreground",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className={cn("text-sm", "text-muted-foreground")}>
        {selectedSkills.length} of {maxSkills} skills added
      </p>
    </div>
  );
};

export default SkillSelector;
