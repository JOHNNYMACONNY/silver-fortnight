import React from 'react';
import { motion } from 'framer-motion';
import { categoryConfig, SkillCategory } from '../../../utils/skillMapping';
import { semanticClasses } from '../../../utils/semanticColors';
import { cn } from '../../../utils/cn';
import { Badge } from '../../ui/Badge';

interface CategoryGridProps {
  onCategorySelect: (category: SkillCategory | 'all') => void;
  selectedCategory?: string;
  categoryCounts?: Record<string, number>;
  className?: string;
}

/**
 * Visual category grid component for browsing trade categories
 * Uses existing categoryConfig and semanticClasses for consistent styling
 * Follows glassmorphic design patterns from codebase
 */
export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onCategorySelect,
  selectedCategory,
  categoryCounts = {},
  className,
}) => {
  const categories = Object.entries(categoryConfig) as [SkillCategory, typeof categoryConfig[SkillCategory]][];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4", className)}>
      {/* All Categories Option */}
      <motion.button
        type="button"
        onClick={() => onCategorySelect('all')}
        data-testid="category-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative p-4 sm:p-5 rounded-xl glassmorphic border-glass backdrop-blur-xl transition-all duration-300",
          "hover:shadow-lg hover:bg-white/10",
          selectedCategory === 'all' || !selectedCategory
            ? "ring-2 ring-primary/50 bg-primary/10 shadow-md"
            : "bg-white/5 hover:bg-white/10"
        )}
      >
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            selectedCategory === 'all' || !selectedCategory
              ? "ring-2 ring-primary/50"
              : ""
          )}>
            <span className="text-lg sm:text-xl font-bold text-primary">All</span>
          </div>
          <span className={cn(
            "text-xs sm:text-sm font-medium text-center",
            selectedCategory === 'all' || !selectedCategory
              ? "text-foreground"
              : "text-muted-foreground"
          )}>
            All Categories
          </span>
        </div>
      </motion.button>

      {/* Category Cards */}
      {categories.map(([categoryKey, config]) => {
        const Icon = config.icon;
        const semanticClassesData = semanticClasses(config.topic);
        const isSelected = selectedCategory === categoryKey;
        const count = categoryCounts[categoryKey] || 0;

        return (
          <motion.button
            key={categoryKey}
            type="button"
            onClick={() => onCategorySelect(categoryKey)}
            data-testid={`category-${categoryKey}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative p-4 sm:p-5 rounded-xl glassmorphic border-glass backdrop-blur-xl transition-all duration-300",
              "hover:shadow-lg",
              isSelected
                ? "ring-2 ring-primary/50 bg-primary/10 shadow-md"
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {/* Icon with colored background */}
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
                "transition-all duration-300",
                isSelected
                  ? cn(semanticClassesData.bgSolid, "text-white ring-2 ring-primary/50")
                  : cn(semanticClassesData.bgSubtle, semanticClassesData.text)
              )}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs sm:text-sm font-medium text-center leading-tight",
                isSelected
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}>
                {config.label}
              </span>

              {/* Count Badge */}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0.5",
                    isSelected
                      ? semanticClassesData.badge
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {count}
                </Badge>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

