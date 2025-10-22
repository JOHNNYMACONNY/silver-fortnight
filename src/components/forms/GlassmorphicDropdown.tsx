/**
 * GlassmorphicDropdown Component
 * 
 * Sophisticated glassmorphic dropdown with search, multi-select,
 * and TradeYa brand integration.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { 
  ChevronDownIcon, 
  CheckIcon, 
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Option Interface
export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}

// Dropdown Props Interface
export interface GlassmorphicDropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  variant?: 'glass' | 'elevated-glass' | 'modal-glass';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  searchable?: boolean;
  multiSelect?: boolean;
  clearable?: boolean;
  maxHeight?: number;
  className?: string;
  id?: string;
  required?: boolean;
}

/**
 * GlassmorphicDropdown Component
 */
export const GlassmorphicDropdown: React.FC<GlassmorphicDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  hint,
  disabled = false,
  variant = 'glass',
  brandAccent = 'gradient',
  searchable = false,
  multiSelect = false,
  clearable = false,
  maxHeight = 240,
  className = '',
  id,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Convert value to array for consistent handling
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const hasValue = selectedValues.length > 0;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.group?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Group options if they have groups
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(option);
    return groups;
  }, {} as Record<string, DropdownOption[]>);

  // Dropdown variant styles
  const dropdownVariants = {
    glass: `glassmorphic rounded-2xl`,
    'elevated-glass': `glassmorphic rounded-3xl shadow-xl`,
    'modal-glass': `glassmorphic rounded-2xl shadow-xl`
  };

  // Trigger variant styles
  const triggerVariants = {
    glass: `
      glassmorphic
    `,
    'elevated-glass': `
      glassmorphic shadow-lg
    `,
    'modal-glass': `
      glassmorphic shadow-xl
    `
  };

  // Brand accent classes
  const brandAccentClasses = {
    orange: 'focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50',
    blue: 'focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500/50', 
    purple: 'focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500/50',
    gradient: `
      focus:ring-2 focus:ring-gradient-to-r 
      focus:from-primary-500/30 focus:via-secondary-500/30 focus:to-accent-500/30
    `
  };

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiSelect ? [] : '');
  };

  // Get display text for selected values
  const getDisplayText = () => {
    if (!hasValue) return placeholder;
    
    if (multiSelect) {
      if (selectedValues.length === 1) {
        return options.find(opt => opt.value === selectedValues[0])?.label || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    
    return options.find(opt => opt.value === selectedValues[0])?.label || selectedValues[0];
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={cn(
            "block text-sm font-medium mb-2 transition-colors duration-200",
            isFocused || hasValue 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-600 dark:text-gray-300"
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      {/* Dropdown Trigger */}
      <button
        type="button"
        role="combobox"
        id={id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !isOpen && setIsFocused(false)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'w-full px-4 py-3 text-left rounded-xl transition-all duration-300',
          'flex items-center justify-between',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none',
          triggerVariants[variant],
          !error && brandAccentClasses[brandAccent],
           error && 'ring-2 ring-error-500/30 border-error-500/50'
        )}
      >
        <span className={cn(
          'truncate',
          hasValue ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        )}>
          {getDisplayText()}
        </span>
        
        <div className="flex items-center gap-2">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" data-testid="x-mark-icon" />
            </button>
          )}
          
          <ChevronDownIcon
            className={cn(
              'h-5 w-5 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
            data-testid="chevron-down"
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              'absolute w-full mt-2 py-2 overflow-hidden',
              'z-[9999]', // Ensure dropdown is always on top
              dropdownVariants[variant]
            )}
            style={{ maxHeight }}
          >
            {/* Search Input */}
            {searchable && (
              <div className="px-3 pb-2 border-b border-border">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" data-testid="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-3 py-2 text-sm rounded-lg',
                      'bg-transparent',
                      'border-0 focus:outline-none focus:ring-2 focus:ring-secondary-500/30',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'text-gray-900 dark:text-white'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No options found
                </div>
              ) : (
                Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                  <div key={groupName}>
                    {groupName !== 'default' && (
                        <div
                          className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-divider"
                        data-testid={`group-header-${groupName.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {groupName}
                      </div>
                    )}
                    {groupOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        data-testid={`dropdown-option-${option.value}`}
                        onClick={() => !option.disabled && handleOptionSelect(option.value)}
                        disabled={option.disabled}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'w-full px-3 py-2 text-left flex items-center gap-3',
                          'hover:bg-white/10 dark:hover:bg-neutral-700/20',
                          'transition-colors duration-150',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                           selectedValues.includes(option.value) && 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400'
                        )}
                      >
                        {option.icon && (
                          <span className="flex-shrink-0">
                            {option.icon}
                          </span>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>

                        {selectedValues.includes(option.value) && (
                          <CheckIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400 flex-shrink-0" data-testid="check-icon" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <ExclamationCircleIcon className="h-4 w-4" data-testid="exclamation-icon" />
          {error}
        </motion.p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
};

export default GlassmorphicDropdown;
