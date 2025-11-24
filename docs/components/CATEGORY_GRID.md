# Category Grid Component

**Last Updated**: November 24, 2025

This document details the CategoryGrid component, which provides a visual grid interface for browsing trade categories.

## Overview

The CategoryGrid component displays skill categories in an interactive grid format, allowing users to visually browse and select categories. It provides an alternative to dropdown-based category selection with a more engaging, visual interface.

## Component Details

**Location**: `src/components/features/trades/CategoryGrid.tsx`

**Type**: React Functional Component

## Props Interface

```tsx
interface CategoryGridProps {
  onCategorySelect: (category: SkillCategory | 'all') => void;
  selectedCategory?: string;
  categoryCounts?: Record<string, number>;
  className?: string;
}
```

### Props Description

- **onCategorySelect**: Callback function called when a category is selected. Receives the category key or 'all'.
- **selectedCategory**: Currently selected category key (optional).
- **categoryCounts**: Object mapping category keys to trade counts (optional). Used to display count badges.
- **className**: Additional CSS classes (optional).

## Features

### Visual Design

- **Glassmorphic Styling**: Uses glassmorphic design patterns consistent with the codebase
- **Semantic Colors**: Each category uses semantic color classes based on its topic
- **Hover Effects**: Scale animations on hover (1.05x) and tap (0.95x)
- **Selected State**: Ring highlight and background color change for selected category
- **Count Badges**: Displays trade count for each category when available

### Category Display

- **All Categories Option**: Special "All" button to clear category filter
- **Category Icons**: Each category displays its configured icon
- **Category Labels**: Clear, readable labels for each category
- **Responsive Grid**: Adapts to screen size (2-5 columns based on breakpoint)

### Grid Layout

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
  {/* Category cards */}
</div>
```

## Usage Examples

### Basic Usage

```tsx
import { CategoryGrid } from '../components/features/trades/CategoryGrid';
import { SkillCategory } from '../utils/skillMapping';

function TradesPage() {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | undefined>();
  
  const handleCategorySelect = (category: SkillCategory | 'all') => {
    setSelectedCategory(category === 'all' ? undefined : category);
  };
  
  return (
    <CategoryGrid
      onCategorySelect={handleCategorySelect}
      selectedCategory={selectedCategory}
    />
  );
}
```

### With Category Counts

```tsx
import { CategoryGrid } from '../components/features/trades/CategoryGrid';

function TradesPage() {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach(trade => {
      if (trade.category) {
        counts[trade.category] = (counts[trade.category] || 0) + 1;
      }
    });
    return counts;
  }, [trades]);
  
  return (
    <CategoryGrid
      onCategorySelect={handleCategorySelect}
      selectedCategory={selectedCategory}
      categoryCounts={categoryCounts}
    />
  );
}
```

### Integration with TradesPage

```tsx
// In TradesPage.tsx
const [categoryViewMode, setCategoryViewMode] = useState<'grid' | 'dropdown'>('grid');

// Toggle between grid and dropdown views
<div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
  <button onClick={() => setCategoryViewMode('grid')}>
    <GridIcon className="h-4 w-4" />
  </button>
  <button onClick={() => setCategoryViewMode('dropdown')}>
    <List className="h-4 w-4" />
  </button>
</div>

{categoryViewMode === 'grid' ? (
  <CategoryGrid
    onCategorySelect={(category) => {
      const newFilters = { ...filters, category: category === 'all' ? undefined : category };
      setFilters(newFilters);
      search(searchTerm, newFilters);
    }}
    selectedCategory={filters.category}
    categoryCounts={categoryCounts}
  />
) : (
  <Select>
    {/* Dropdown implementation */}
  </Select>
)}
```

## Category Configuration

The component uses `categoryConfig` from `skillMapping.ts`:

```tsx
import { categoryConfig, SkillCategory } from '../../../utils/skillMapping';

const categories = Object.entries(categoryConfig) as [
  SkillCategory, 
  typeof categoryConfig[SkillCategory]
][];
```

Each category configuration includes:
- **icon**: Lucide React icon component
- **label**: Display name
- **topic**: Semantic topic for color theming

## Styling Details

### Selected State

```tsx
className={cn(
  "relative p-4 sm:p-5 rounded-xl glassmorphic border-glass backdrop-blur-xl",
  isSelected
    ? "ring-2 ring-primary/50 bg-primary/10 shadow-md"
    : "bg-white/5 hover:bg-white/10"
)}
```

### Icon Styling

```tsx
<div className={cn(
  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
  isSelected
    ? cn(semanticClassesData.bgSolid, "text-white ring-2 ring-primary/50")
    : cn(semanticClassesData.bgSubtle, semanticClassesData.text)
)}>
  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
</div>
```

### Count Badge

```tsx
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
```

## Responsive Design

- **Mobile (default)**: 2 columns
- **Small screens (sm)**: 3 columns
- **Medium screens (md)**: 4 columns
- **Large screens (lg)**: 5 columns

## Accessibility

- **Keyboard Navigation**: All category buttons are keyboard accessible
- **ARIA Labels**: Category names serve as accessible labels
- **Focus States**: Visible focus indicators
- **Screen Reader Support**: Semantic HTML structure

## Benefits

1. **Visual Appeal**: More engaging than dropdown menus
2. **Quick Selection**: Faster category selection with visual feedback
3. **Category Discovery**: Users can see all categories at once
4. **Count Visibility**: Trade counts help users understand category popularity
5. **Consistent Design**: Matches glassmorphic design system

## Future Enhancements

Potential future improvements:

1. **Category Icons Animation**: Animate icons on hover
2. **Category Descriptions**: Tooltips with category descriptions
3. **Category Filtering**: Search/filter categories
4. **Custom Categories**: Allow users to create custom category views
5. **Category Analytics**: Show trending categories

## Related Documentation

- [Skill Mapping](../utils/skillMapping.ts)
- [Semantic Colors](../utils/semanticColors.ts)
- [TradesPage](../pages/TradesPage.tsx)

