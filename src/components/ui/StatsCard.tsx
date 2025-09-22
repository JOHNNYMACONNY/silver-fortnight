import React from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    period: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  description,
  trend,
  icon,
  variant = 'default',
  size = 'md',
  className,
  loading = false,
  onClick,
  href,
  target
}) => {
  const isClickable = onClick || href;
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success-200 bg-success-50 text-success-900 dark:border-success-800 dark:bg-success-950 dark:text-success-100';
      case 'warning':
        return 'border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-100';
      case 'danger':
        return 'border-destructive-200 bg-destructive-50 text-destructive-900 dark:border-destructive-800 dark:bg-destructive-950 dark:text-destructive-100';
      case 'info':
        return 'border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-100';
      default:
        return 'border-border bg-card text-card-foreground';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const getValueSize = () => {
    switch (size) {
      case 'sm':
        return 'text-2xl';
      case 'lg':
        return 'text-5xl';
      default:
        return 'text-3xl';
    }
  };

  const getLabelSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="w-4 h-4 text-success-600 dark:text-success-400" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="w-4 h-4 text-destructive-600 dark:text-destructive-400" />;
    } else {
      return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.value > 0) {
      return 'text-success-600 dark:text-success-400';
    } else if (trend.value < 0) {
      return 'text-destructive-600 dark:text-destructive-400';
    } else {
      return 'text-muted-foreground';
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const formatTrendValue = (val: number) => {
    const absVal = Math.abs(val);
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const content = (
    <Card
      className={cn(
        'transition-all duration-200',
        getVariantStyles(),
        getSizeStyles(),
        isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {icon && (
                <div className="flex-shrink-0">
                  {icon}
                </div>
              )}
              <p className={cn(
                'font-medium text-muted-foreground truncate',
                getLabelSize()
              )}>
                {label}
              </p>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                {description && <div className="h-4 bg-muted rounded animate-pulse w-3/4" />}
              </div>
            ) : (
              <>
                <p className={cn(
                  'font-bold text-foreground',
                  getValueSize()
                )}>
                  {formatValue(value)}
                </p>
                
                {description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
                
                {trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon()}
                    <span className={cn('text-sm font-medium', getTrendColor())}>
                      {formatTrendValue(trend.value)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {trend.period}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default StatsCard;
