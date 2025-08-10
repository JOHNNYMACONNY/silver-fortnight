import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface NavItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  label,
  icon,
  isActive = false,
  onClick,
  className,
  variant = 'desktop'
}) => {
  const baseClasses = {
    desktop: cn(
      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
      isActive
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
      className
    ),
    mobile: cn(
      'flex items-center w-full px-3 py-2 text-base font-medium border-l-4 transition-colors duration-200',
      isActive
        ? 'bg-primary/10 border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground',
      className
    )
  };

  return (
    <Link to={to} className={baseClasses[variant]} onClick={onClick}>
      <span className="flex items-center">
        {icon && <span className={`${variant === 'desktop' ? 'mr-1' : 'mr-2'} h-5 w-5`}>{icon}</span>}
        <span>{label}</span>
      </span>
    </Link>
  );
};

export default NavItem;
