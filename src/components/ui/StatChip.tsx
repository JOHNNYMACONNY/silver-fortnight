import React from 'react';
import { cn } from '../../utils/cn';

export interface StatChipProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export const StatChip: React.FC<StatChipProps> = ({
  label,
  value,
  icon,
  className,
  onClick,
  ariaLabel,
}) => {
  const Content = (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm',
        className
      )}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-foreground">{value}</strong>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="group"
        onClick={onClick}
        aria-label={ariaLabel || label}
      >
        {Content}
      </button>
    );
  }

  return Content;
};

export default StatChip;


