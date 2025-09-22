import React from 'react';
import { cn } from '../../../utils/cn';

interface FilterButtonProps {
  value: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  'aria-label'?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  value,
  label,
  isSelected,
  onClick,
  className,
  size = 'md',
  variant = 'default',
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: isSelected
      ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-600'
      : 'border-border/60 hover:bg-muted/40 text-foreground/80',
    outline: isSelected
      ? 'border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300'
      : 'border-border/60 hover:bg-muted/40 text-foreground/80',
    ghost: isSelected
      ? 'bg-muted/50 text-foreground border border-primary/30'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || `${isSelected ? 'Remove' : 'Add'} filter: ${label}`}
      aria-pressed={isSelected}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="font-medium">{label}</span>
    </button>
  );
};

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  className
}) => {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label} = ${value}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
        'border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-destructive/40 hover:text-destructive',
        'transition-all duration-200 group cursor-pointer',
        className
      )}
    >
      <span className="font-medium text-foreground/80">{label}:</span>
      <span className="text-foreground/80">{value}</span>
      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px] group-hover:bg-destructive/20 group-hover:text-destructive transition-colors">
        ×
      </span>
    </button>
  );
};

interface FilterTabProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  count: number;
  onClick: () => void;
  className?: string;
}

export const FilterTab: React.FC<FilterTabProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  count,
  onClick,
  className
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} filter tab${count > 0 ? ` (${count} active)` : ''}`}
      aria-selected={isActive}
      role="tab"
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-md text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isActive
          ? "bg-muted/50 text-foreground border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] px-1.5 h-5 min-w-[20px]">
          {count}
        </span>
      )}
    </button>
  );
};

interface FilterSectionProps {
  title?: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  onReset,
  resetLabel = "Reset",
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || onReset) && (
        <div className="flex items-center justify-between">
          {title && (
            <div className="text-xs text-muted-foreground">{title}</div>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {resetLabel}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
};
