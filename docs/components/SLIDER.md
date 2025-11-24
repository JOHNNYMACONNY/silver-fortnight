# Slider Component

**Last Updated**: November 24, 2025

This document details the Slider component, which provides an intuitive input method for numeric ranges and discrete values.

## Overview

The Slider component is a reusable UI component that provides a more intuitive input method for selecting values within a range, particularly useful for skill levels and other discrete numeric selections.

## Component Details

**Location**: `src/components/ui/Slider.tsx`

**Type**: React Functional Component

## Props Interface

```tsx
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueLabels?: string[];
  className?: string;
}
```

### Props Description

- **label**: Optional label text displayed above the slider
- **value**: Current slider value (number)
- **onValueChange**: Callback function called when value changes
- **min**: Minimum value (default: 0)
- **max**: Maximum value (default: 100)
- **step**: Step increment (default: 1)
- **showValue**: Whether to display the current value (default: true)
- **valueLabels**: Optional array of string labels for discrete values
- **className**: Additional CSS classes

## Features

### Visual Design

- **Glassmorphic Styling**: Matches codebase design system
- **Smooth Transitions**: Animated value changes
- **Value Labels**: Optional labels for discrete steps
- **Active Label Highlighting**: Current value label is highlighted
- **Accessible**: Full keyboard and screen reader support

### Value Display

- **Inline Value**: Shows current value next to label (if label provided)
- **Value Labels**: Displays custom labels for discrete values
- **Active Highlighting**: Current value label is highlighted in primary color

## Usage Examples

### Basic Usage

```tsx
import { Slider } from '../components/ui/Slider';

function MyComponent() {
  const [value, setValue] = useState(50);
  
  return (
    <Slider
      label="Volume"
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      step={1}
    />
  );
}
```

### Skill Level Selection

```tsx
import { Slider } from '../components/ui/Slider';

function CreateTradePage() {
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  
  // Convert skill level to slider value (0-2)
  const levelToSlider = (level: 'beginner' | 'intermediate' | 'expert'): number => {
    switch (level) {
      case 'beginner': return 0;
      case 'intermediate': return 1;
      case 'expert': return 2;
      default: return 1;
    }
  };
  
  // Convert slider value to skill level
  const sliderToLevel = (value: number): 'beginner' | 'intermediate' | 'expert' => {
    switch (value) {
      case 0: return 'beginner';
      case 1: return 'intermediate';
      case 2: return 'expert';
      default: return 'intermediate';
    }
  };
  
  return (
    <Slider
      label="Skill Level"
      value={levelToSlider(skillLevel)}
      onValueChange={(value) => setSkillLevel(sliderToLevel(value))}
      min={0}
      max={2}
      step={1}
      valueLabels={['Beginner', 'Intermediate', 'Expert']}
    />
  );
}
```

### Integration with CreateTradePage

```tsx
// Feature flag for gradual rollout
const USE_SLIDER_INPUTS = true;

{USE_SLIDER_INPUTS ? (
  <Slider
    label="Skill Level"
    value={levelToSlider(newOfferedSkillLevel)}
    onValueChange={(value) => setNewOfferedSkillLevel(sliderToLevel(value))}
    min={0}
    max={2}
    step={1}
    valueLabels={['Beginner', 'Intermediate', 'Expert']}
    className="px-2"
  />
) : (
  <Select value={newOfferedSkillLevel} onValueChange={...}>
    {/* Fallback dropdown */}
  </Select>
)}
```

## Styling Details

### Slider Track

```tsx
<input
  type="range"
  className={cn(
    "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
    "bg-muted/50 glassmorphic backdrop-blur-sm",
    "accent-primary",
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md",
    "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
    "transition-all duration-200"
  )}
/>
```

### Value Labels

```tsx
{valueLabels && (
  <div className="flex justify-between text-xs text-muted-foreground">
    {valueLabels.map((label, index) => (
      <span key={index} className={cn(
        "transition-colors",
        index === value ? "text-primary font-medium" : ""
      )}>
        {label}
      </span>
    ))}
  </div>
)}
```

## Accessibility

- **Keyboard Navigation**: Arrow keys to adjust value
- **ARIA Labels**: Proper labeling for screen readers
- **Focus States**: Visible focus indicators
- **Value Announcement**: Screen readers announce value changes

## Benefits

1. **Intuitive Input**: More visual than dropdowns for ranges
2. **Better UX**: Faster selection for discrete values
3. **Space Efficient**: Takes less vertical space than dropdowns
4. **Touch Friendly**: Better for mobile/touch devices
5. **Visual Feedback**: Immediate visual feedback on value change

## Use Cases

### Recommended For

- Skill level selection (Beginner/Intermediate/Expert)
- Numeric ranges (0-100, etc.)
- Discrete value selection (3-5 options)
- Settings/preferences

### Not Recommended For

- Large option sets (>10 options)
- Complex hierarchical data
- Text-based selections
- When space is extremely limited

## Future Enhancements

Potential future improvements:

1. **Multi-Range Slider**: Support for range selection (min-max)
2. **Custom Thumb Styling**: Allow custom thumb appearance
3. **Tooltip Values**: Show value in tooltip on hover
4. **Animation Options**: Configurable animation styles
5. **Vertical Slider**: Support for vertical orientation

## Related Documentation

- [CreateTradePage](../pages/CreateTradePage.tsx)
- [Design System](../design/DESIGN_SYSTEM_DOCUMENTATION.md)

