import React from 'react';
import { VisualSelectionGroup, VisualSelectionOption } from './VisualSelectionGroup';
import { getSkillLevelIcon } from '../../utils/iconMappings';
import type { Topic } from '../../utils/semanticColors';

export interface SkillLevelSelectorProps {
  value: 'beginner' | 'intermediate' | 'expert';
  onChange: (value: 'beginner' | 'intermediate' | 'expert') => void;
  topic?: Topic;
  disabled?: boolean;
  className?: string;
}

/**
 * SkillLevelSelector Component
 * 
 * Specialized wrapper using VisualSelectionGroup for skill level selection.
 * Pre-configured for beginner/intermediate/expert levels.
 */
export const SkillLevelSelector: React.FC<SkillLevelSelectorProps> = ({
  value,
  onChange,
  topic = 'trades',
  disabled = false,
  className,
}) => {
  const options: VisualSelectionOption[] = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'Just starting out',
      icon: (() => {
        const Icon = getSkillLevelIcon('beginner');
        return Icon ? <Icon className="w-6 h-6" /> : undefined;
      })(),
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Some experience',
      icon: (() => {
        const Icon = getSkillLevelIcon('intermediate');
        return Icon ? <Icon className="w-6 h-6" /> : undefined;
      })(),
    },
    {
      value: 'expert',
      label: 'Expert',
      description: 'Highly skilled',
      icon: (() => {
        const Icon = getSkillLevelIcon('expert');
        return Icon ? <Icon className="w-6 h-6" /> : undefined;
      })(),
    },
  ];

  const handleChange = (newValue: string | string[]) => {
    // Single selection mode - value should be string
    const stringValue = typeof newValue === 'string' ? newValue : newValue[0] || '';
    if (stringValue === 'beginner' || stringValue === 'intermediate' || stringValue === 'expert') {
      onChange(stringValue);
    }
  };

  return (
    <VisualSelectionGroup
      options={options}
      value={value}
      onChange={handleChange}
      multiple={false}
      topic={topic}
      columns={3}
      disabled={disabled}
      className={className}
    />
  );
};

