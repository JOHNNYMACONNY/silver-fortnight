import React, { useMemo } from 'react';
import { VisualSelectionCard, VisualSelectionCardProps } from './VisualSelectionCard';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import type { Topic } from '../../utils/semanticColors';

export interface VisualSelectionOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface VisualSelectionGroupProps {
  options: VisualSelectionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  topic?: Topic;
  columns?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * VisualSelectionGroup Component
 * 
 * Wrapper for multiple VisualSelectionCard components.
 * Supports both single and multiple selection modes.
 * Handles both string and string[] value types for compatibility with GlassmorphicDropdown.
 */
export const VisualSelectionGroup: React.FC<VisualSelectionGroupProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  topic = 'trades',
  columns = 4,
  disabled = false,
  className,
}) => {
  const { isMobile, isTablet, getOptimalColumns } = useMobileOptimization();

  // Determine responsive grid classes
  const gridClasses = useMemo(() => {
    if (isMobile) {
      return 'grid-cols-2'; // Mobile: 2 columns
    }
    if (isTablet) {
      return 'grid-cols-3'; // Tablet: 3 columns
    }
    // Desktop: use provided columns
    const desktopColumns = columns || 4;
    const columnMap: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    return columnMap[desktopColumns] || 'grid-cols-4';
  }, [isMobile, isTablet, columns]);

  // Convert value to array for easier handling
  const selectedValues = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return typeof value === 'string' && value ? [value] : [];
  }, [value, multiple]);

  const handleCardClick = (optionValue: string) => {
    if (disabled) return;

    if (multiple) {
      // Toggle selection in array
      const currentArray = Array.isArray(value) ? value : [];
      const newValue = currentArray.includes(optionValue)
        ? currentArray.filter((v) => v !== optionValue)
        : [...currentArray, optionValue];
      onChange(newValue);
    } else {
      // Single selection - set string value
      const newValue = selectedValues.includes(optionValue) ? '' : optionValue;
      onChange(newValue);
    }
  };

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        gridClasses,
        className
      )}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label="Selection options"
    >
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);

        return (
          <VisualSelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={isSelected}
            onClick={() => handleCardClick(option.value)}
            topic={topic}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
};

