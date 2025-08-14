import React from 'react';
import { useTheme } from '../../utils/themeInitializer';
import { cn } from '../../utils/cn';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center">
      <button
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-md flex items-center gap-2 transition-colors duration-200",
          'bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className="relative">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-primary" />
          ) : (
            <Moon className="w-5 h-5 text-secondary" />
          )}
        </span>
        <span className="text-xs font-medium hidden sm:inline">
          {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
        </span>
      </button>
    </div>
  );
};
