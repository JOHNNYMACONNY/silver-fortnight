import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  variant?: 'light' | 'dark';
  hover?: boolean;
  className?: string;
}

export function GlassPanel({ 
  children, 
  variant = 'light',
  hover = false,
  className = ''
}: GlassPanelProps) {
  return (
    <div className={`
      glass-panel-${variant}
      ${hover ? 'glass-panel-hover' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}