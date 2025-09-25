# Badge Component Guide

## Overview

The Badge component provides a flexible system for displaying status indicators, labels, and semantic information with consistent styling and transparent backgrounds that match TradeYa's glassmorphism design.

## Features

- **7 Variants**: Default, secondary, destructive, outline, success, status, status-glow
- **4 Semantic Topics**: trades, collaboration, community, success
- **Transparent Backgrounds**: Glassmorphism-style transparent backgrounds for semantic topics
- **Dark Mode Support**: Full dark/light mode compatibility
- **Tailwind v4 Compatible**: Uses custom CSS classes for reliable opacity handling

## Variants

### Standard Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `default` | Primary brand color | General actions, primary status |
| `secondary` | Secondary brand color | Secondary information, popular items |
| `destructive` | Red color | Errors, warnings, destructive actions |
| `outline` | Transparent with border | Subtle indicators, optional items |
| `success` | Green color | Success states, completed items |

### Special Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `status` | Subtle transparent white | General status indicators |
| `status-glow` | Enhanced transparent white with pulse | Live/real-time indicators |

## Semantic Topics

When using `variant="default"` with a `topic` prop, badges get transparent backgrounds with semantic colors:

| Topic | Color | Background | Use Case |
|-------|-------|------------|----------|
| `trades` | Orange | `rgba(249, 115, 22, 0.2)` | Trade-related status, active trades |
| `collaboration` | Purple | `rgba(139, 92, 246, 0.2)` | Team activities, collaboration status |
| `community` | Blue | `rgba(14, 165, 233, 0.2)` | Community features, user interactions |
| `success` | Green | `rgba(34, 197, 94, 0.2)` | Rewards, achievements, positive status |

## Usage Examples

### Basic Usage

```tsx
import { Badge } from '@/components/ui/Badge';

// Standard variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
```

### Semantic Topic Badges

```tsx
// Semantic topic badges with transparent backgrounds
<Badge variant="default" topic="trades">Active</Badge>
<Badge variant="default" topic="collaboration">Team</Badge>
<Badge variant="default" topic="community">Community</Badge>
<Badge variant="default" topic="success">Rewards</Badge>
```

### Status Indicators

```tsx
// Live/real-time indicators
<Badge variant="status-glow">Live</Badge>
<Badge variant="status-glow">Real-time</Badge>

// General status
<Badge variant="status">Status</Badge>
```

### Homepage Implementation

```tsx
// Community Stats card
<Badge variant="status-glow" className="text-xs">Live</Badge>

// Recent Activity card  
<Badge variant="status-glow" className="text-xs">Real-time</Badge>

// Quick Actions card
<Badge variant="secondary" className="text-xs">Popular</Badge>

// Skill Trades card
<Badge variant="default" topic="trades" className="text-xs">Active</Badge>

// Collaborations card
<Badge variant="default" topic="collaboration" className="text-xs">Team</Badge>

// Challenges card
<Badge variant="default" topic="success" className="text-xs">Rewards</Badge>
```

## Props

```tsx
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'status' | 'status-glow';
  topic?: 'trades' | 'collaboration' | 'community' | 'success';
  className?: string;
  children: React.ReactNode;
}
```

## Implementation Details

### CSS Classes

The component uses custom CSS classes for reliable transparency in Tailwind v4:

```css
/* Light mode transparent backgrounds */
.bg-primary-transparent { background-color: rgba(249, 115, 22, 0.2); }
.bg-purple-transparent { background-color: rgba(139, 92, 246, 0.2); }
.bg-secondary-transparent { background-color: rgba(14, 165, 233, 0.2); }
.bg-success-transparent { background-color: rgba(34, 197, 94, 0.2); }

/* Dark mode transparent backgrounds */
.dark .bg-primary-transparent { background-color: rgba(249, 115, 22, 0.15); }
.dark .bg-purple-transparent { background-color: rgba(139, 92, 246, 0.15); }
.dark .bg-secondary-transparent { background-color: rgba(14, 165, 233, 0.15); }
.dark .bg-success-transparent { background-color: rgba(34, 197, 94, 0.15); }
```

### Component Logic

```tsx
// For default variant with topic → transparent backgrounds
if (variant === "default" && topic) {
  return topicClasses.badge; // Uses custom transparent classes
}

// For other variants → standard badge styling
return badgeVariants({ variant });
```

## Accessibility

- Uses semantic HTML (`<span>`)
- Includes focus states with ring indicators
- Supports screen readers with proper contrast ratios
- Maintains keyboard navigation compatibility

## Migration Notes

### From Previous Versions

- **Breaking Change**: `topic` prop now requires `variant="default"` for transparent backgrounds
- **New Variants**: Added `status` and `status-glow` variants
- **CSS Changes**: Moved from Tailwind opacity syntax to custom CSS classes for v4 compatibility

### Tailwind v4 Compatibility

- Uses custom CSS classes instead of `bg-color/20` syntax
- Relies on CSS variables defined in `@theme` directive
- Maintains consistent behavior across light/dark modes

## Testing

The component includes comprehensive Storybook stories covering:
- All variants
- All semantic topics
- Combined variant + topic usage
- Visual showcases for design review

Run `npm run storybook` to view all Badge examples and test different combinations.
