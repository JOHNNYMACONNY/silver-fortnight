import React from 'react';
import { cn } from '../../utils/cn';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueLabels?: string[];
  className?: string;
}

/**
 * Slider component following existing UI patterns
 * Matches glassmorphic styling from codebase
 * Optimized for one-time setup inputs (like skill levels)
 */
export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  valueLabels,
  className,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onValueChange(newValue);
  };

  const getLabel = (val: number) => {
    if (valueLabels && valueLabels[val]) {
      return valueLabels[val];
    }
    return val.toString();
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {showValue && (
            <span className="ml-2 text-muted-foreground">
              ({getLabel(value)})
            </span>
          )}
        </label>
      )}
      <div className="relative flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
            "bg-muted/50 glassmorphic backdrop-blur-sm",
            "accent-primary",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md",
            "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
            "transition-all duration-200"
          )}
          {...props}
        />
        {showValue && !label && (
          <div className="min-w-[60px] text-right text-sm font-medium text-foreground">
            {getLabel(value)}
          </div>
        )}
      </div>
      {valueLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {valueLabels.map((label, index) => (
            <span key={index} className={cn(
              "transition-colors",
              index === value ? "text-primary font-medium" : ""
            )}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

