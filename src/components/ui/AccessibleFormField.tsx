import React from 'react';
import { cn } from '../../utils/cn';

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  children,
  error,
  hint,
  className
}) => {
  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-hint`} className="text-xs text-muted-foreground mt-0.5">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="text-xs text-red-500 mt-0.5" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default AccessibleFormField; 