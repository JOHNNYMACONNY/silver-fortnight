/**
 * Tabs Component - Temporary Implementation
 * 
 * Simple tabs component for performance monitoring UI.
 * This is a minimal implementation to resolve import errors.
 */

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

// Tabs Context
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Tabs Root Component
export interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  children,
  className = '',
  defaultValue
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  const currentOnValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: currentOnValueChange }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tabs List Component
export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md glassmorphic border-glass backdrop-blur-xl bg-white/5 p-1 text-muted-foreground shadow-lg shadow-orange-500/10 ${className}`}>
      {children}
    </div>
  );
};

// Tabs Trigger Component
export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = '',
  disabled = false
}) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = value === selectedValue;

  return (
    <button
      className={cn(
        `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium
        transition-all duration-300 ease-out focus-visible:outline-none 
        focus-visible:bg-white/10 focus-visible:backdrop-blur-sm focus-visible:shadow-lg 
        focus-visible:shadow-orange-500/20 focus-visible:border focus-visible:border-orange-400/30
        disabled:pointer-events-none disabled:opacity-50 
        hover:bg-white/5 hover:backdrop-blur-sm hover:shadow-md hover:shadow-orange-500/10
        data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:backdrop-blur-md
        data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 data-[state=active]:border
        data-[state=active]:border-orange-400/40`,
        className
      )}
      onClick={() => !disabled && onValueChange(value)}
      disabled={disabled}
      data-state={isSelected ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
};

// Tabs Content Component
export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const { value: selectedValue } = useTabsContext();
  
  if (value !== selectedValue) {
    return null;
  }

  return (
    <div 
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      data-state="active"
    >
      {children}
    </div>
  );
};

export default Tabs;