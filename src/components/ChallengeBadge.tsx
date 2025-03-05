import React from 'react';
import { BadgeGraphic, BadgeType } from './BadgeGraphic';
export type BadgeVariant = 'challenge' | 'profile';

interface ChallengeBadgeProps {
  type: BadgeType;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: BadgeVariant;
  isLocked?: boolean;
  progress?: number;
  description?: string;
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

export function ChallengeBadge({
  type,
  name,
  size = 'md',
  variant = 'challenge',
  isLocked = false,
  progress = 0,
  description,
  showLabel = false
}: ChallengeBadgeProps) {
  const containerClasses = `
    badge-container
    relative
    ${isLocked ? 'badge-locked' : ''}
    ${progress === 100 && !isLocked ? 'badge-claimed' : ''}
    ${progress < 100 && !isLocked ? 'badge-claimable' : ''}
    transition-all duration-300
  `.trim();

  const badgeClasses = `
    ${sizeClasses[size]}
    relative
    overflow-hidden
    rounded-lg
  `.trim();

  if (variant === 'profile') {
    return (
      <div
        className="group relative focus-within:ring-2 focus-within:ring-accent-clay rounded-lg"
        role="listitem"
        aria-label={`${name} ${type}: ${description || ''}`}
      >
        {/* Badge glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-clay to-accent-ochre 
                      opacity-0 group-hover:opacity-75 rounded-lg blur transition-all duration-300">
        </div>
        
        {/* Badge content */}
        <div className="relative p-4 bg-earth-800/95 rounded-lg border border-earth-700/50 
                      backdrop-blur-sm group-hover:border-accent-clay 
                      transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className={containerClasses}>
              <div className={badgeClasses}>
                <BadgeGraphic
                  type={type}
                  progress={progress}
                  isLocked={isLocked}
                />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-accent-rust transition-colors">
                {name}
              </p>
              {description && (
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badge = (
    <div className={containerClasses} title={name}>
      <div className={badgeClasses}>
        <BadgeGraphic
          type={type}
          progress={progress}
          isLocked={isLocked}
        />
      </div>
    </div>
  );

  if (showLabel) {
    return (
      <div className="flex items-center gap-2">
        {badge}
        <span className="text-sm text-gray-700">{name}</span>
      </div>
    );
  }

  return badge;
}
