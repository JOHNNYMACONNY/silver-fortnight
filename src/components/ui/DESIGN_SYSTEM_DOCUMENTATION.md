# TradeYa Design System Documentation

This document provides comprehensive documentation for the TradeYa design system, including color palettes, typography, components, and usage guidelines.

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Theme Utilities](#theme-utilities)
4. [Core Components](#core-components)
5. [Advanced Components](#advanced-components)
6. [HomePage Patterns](#homepage-patterns)
7. [Responsive Design](#responsive-design)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Usage Examples](#usage-examples)

## Color System

The TradeYa design system uses a comprehensive color system with primary, secondary, accent, neutral, and semantic colors. Each color has a range of shades from 50 to 950.

### Primary Colors

The primary color palette is based on orange, which represents creativity and energy:

```jsx
// Primary (Orange)
primary: {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316', // Main orange
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
}
```

### Secondary Colors

The secondary color palette is based on blue, which complements the primary orange:

```jsx
// Secondary (Blue)
secondary: {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
}
```

### Semantic Colors

The design system includes semantic colors for success, warning, and error states:

```jsx
// Success (Green)
success: {
  50: '#f0fdf4',
  // ... other shades
  500: '#22c55e', // Main green
  // ... other shades
}

// Warning (Amber)
warning: {
  50: '#fffbeb',
  // ... other shades
  500: '#f59e0b', // Main amber
  // ... other shades
}

// Error (Red)
error: {
  50: '#fef2f2',
  // ... other shades
  500: '#ef4444', // Main red
  // ... other shades
}
```

### Using Colors

Colors can be used directly in Tailwind classes:

```jsx
<div className="bg-primary-500 text-white">Primary Button</div>
<div className="bg-secondary-500 text-white">Secondary Button</div>
<div className="text-success-500">Success Message</div>
```

Or through theme utilities:

```jsx
<div className={themeClasses.primaryButton}>Primary Button</div>
```

### Topic-Based Semantic Colors

The design system includes a sophisticated topic-based semantic color system for consistent branding across different content types:

#### Available Topics

- **trades**: Orange theme for trading-related content
- **collaboration**: Purple theme for collaboration features  
- **community**: Blue theme for community features
- **success**: Green theme for achievements and success states

#### Usage with semanticClasses()

```jsx
import { semanticClasses } from '../utils/semanticColors';

// Get all semantic classes for a topic
const classes = semanticClasses('trades');

// Apply to different elements
<div className={classes.bgSolid}>Solid background</div>
<div className={classes.bgSubtle}>Subtle background</div>
<div className={classes.text}>Colored text</div>
<div className={classes.badge}>Badge styling</div>
<div className={classes.link}>Link styling</div>
<div className={classes.ring}>Focus ring</div>
```

#### Common Usage Patterns

**Badge Components:**
```jsx
// Status badges with topic colors
<Badge className={semanticClasses('trades').badge}>Active Trade</Badge>
<Badge className={semanticClasses('collaboration').badge}>In Progress</Badge>
<Badge className={semanticClasses('community').badge}>Verified User</Badge>
<Badge className={semanticClasses('success').badge}>Completed</Badge>
```

**Button Components:**
```jsx
// Topic-themed buttons
<Button className={semanticClasses('trades').bgSolid + ' text-white'}>
  Create Trade
</Button>
<Button className={semanticClasses('collaboration').bgSubtle + ' ' + semanticClasses('collaboration').text}>
  Start Collaboration
</Button>
```

**Card Components:**
```jsx
// Topic-themed cards
<Card className={semanticClasses('success').bgSubtle + ' border-l-4 ' + semanticClasses('success').ring}>
  <CardContent>
    <h3 className={semanticClasses('success').text}>Challenge Complete!</h3>
  </CardContent>
</Card>
```

**Search Components:**
```jsx
// EnhancedSearchBar with topic theming
<EnhancedSearchBar 
  topic="trades"
  placeholder="Search trades..."
  // Automatically applies orange theme
/>

<EnhancedSearchBar 
  topic="community"
  placeholder="Search users..."
  // Automatically applies blue theme
/>
```

**Link Components:**
```jsx
// Topic-themed links
<Link className={semanticClasses('trades').link}>View Trade Details</Link>
<Link className={semanticClasses('collaboration').link}>Join Collaboration</Link>
```

#### Advanced Usage Examples

**Dynamic Topic Selection:**
```jsx
const getTopicForContent = (contentType) => {
  switch(contentType) {
    case 'trade': return 'trades';
    case 'collaboration': return 'collaboration';
    case 'user': return 'community';
    case 'achievement': return 'success';
    default: return 'trades';
  }
};

const ContentCard = ({ contentType, title }) => {
  const topic = getTopicForContent(contentType);
  const classes = semanticClasses(topic);
  
  return (
    <Card className={classes.bgSubtle}>
      <CardHeader>
        <CardTitle className={classes.text}>{title}</CardTitle>
        <Badge className={classes.badge}>{contentType}</Badge>
      </CardHeader>
    </Card>
  );
};
```

**Conditional Styling:**
```jsx
const StatusIndicator = ({ status, type }) => {
  const topic = type === 'trade' ? 'trades' : 'collaboration';
  const classes = semanticClasses(topic);
  
  return (
    <div className={`
      ${status === 'active' ? classes.bgSolid : classes.bgSubtle}
      ${classes.text}
      px-3 py-1 rounded-full text-sm font-medium
    `}>
      {status}
    </div>
  );
};
```

#### Best Practices

1. **Consistency**: Always use the same topic for related content types
2. **Context**: Choose topics that match the content context (trades = orange, community = blue, etc.)
3. **Accessibility**: Ensure sufficient contrast when combining colors
4. **Semantic Meaning**: Use topics that convey meaning, not just visual preference
5. **Component Integration**: Leverage built-in topic support in components like EnhancedSearchBar

## Typography

The TradeYa design system uses a modern typography system with three font families:

1. **Sans-serif** (Inter): Used for body text and general UI
2. **Heading** (Outfit): Used for headings and titles
3. **Monospace** (JetBrains Mono): Used for code and technical content

### Font Sizes

The design system includes a comprehensive set of font sizes with appropriate line heights:

```jsx
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem', { lineHeight: '1.5rem' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1.15' }],
  '6xl': ['3.75rem', { lineHeight: '1.1' }],
  '7xl': ['4.5rem', { lineHeight: '1.05' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
}
```

### Typography Classes

The design system includes typography classes for headings, body text, and other text styles:

```jsx
// Headings
heading1: 'font-heading font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white',
heading2: 'font-heading font-semibold text-3xl md:text-4xl text-neutral-900 dark:text-white',
// ... other heading styles

// Body Text
bodyLarge: 'font-sans text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed',
body: 'font-sans text-base text-neutral-700 dark:text-neutral-300 leading-relaxed',
bodySmall: 'font-sans text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed',

// Other Text Styles
caption: 'font-sans text-xs text-neutral-500 dark:text-neutral-500',
overline: 'font-sans text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-medium',
link: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline-offset-2 hover:underline',
```

### Using Typography

Typography classes can be used directly:

```jsx
<h1 className={themeClasses.heading1}>Page Title</h1>
<p className={themeClasses.body}>This is a paragraph of text.</p>
<span className={themeClasses.caption}>Caption text</span>
```

## Theme Utilities

The design system includes theme utilities for common UI patterns:

### Background and Surface

```jsx
card: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
page: 'bg-neutral-50 dark:bg-neutral-900',
```

### Text Colors

```jsx
text: 'text-neutral-900 dark:text-neutral-100',
textMuted: 'text-neutral-500 dark:text-neutral-400',
```

### Borders and Shadows

```jsx
border: 'border-neutral-200 dark:border-neutral-700',
shadowSm: 'shadow-sm dark:shadow-neutral-900/30',
shadow: 'shadow dark:shadow-neutral-900/30',
```

### Hover Effects

```jsx
hoverCard: 'hover:shadow-md hover:-translate-y-1 dark:hover:bg-neutral-700/70 dark:hover:shadow-[0_0_12px_rgba(251,146,60,0.15)]',
```

This utility creates a more visible and appealing hover effect in dark mode by:

- Adding a subtle background color change
- Adding a colored glow effect using the primary color
- Maintaining the elevation effect with a slight translation

This hover effect is consistently applied to all card components throughout the application, including feature cards on the home page, project cards, challenge cards, and empty state cards.

### Using Theme Utilities

Theme utilities can be used with the `cn` utility:

```jsx
import { cn } from '../../utils/cn';
import { themeClasses } from '../../utils/themeUtils';

<div className={cn(themeClasses.card, 'p-4')}>
  <h2 className={themeClasses.heading2}>Card Title</h2>
  <p className={themeClasses.body}>Card content</p>
</div>
```

## Core Components

### Button Component

The Button component is a versatile component for user interactions.

#### Props

- `variant`: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger' | 'success' | 'ghost'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `isLoading`: boolean
- `fullWidth`: boolean
- `rounded`: boolean
- ...other button props

#### Usage

```jsx
import { Button } from '../components/ui/Button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>

// Loading state
<Button isLoading>Loading</Button>

// Full width
<Button fullWidth>Full Width</Button>

// Rounded (pill style)
<Button rounded>Rounded</Button>
```

### Card Component

The Card component is used to group related content.

#### Props

- `variant`: 'elevated' | 'outlined' | 'filled'
- `hover`: boolean
- `interactive`: boolean
- `hoverable`: boolean (legacy)
- `className`: string

#### Subcomponents

- `Card.Header`: For card headers
- `Card.Body`: For card content
- `Card.Footer`: For card footers

#### Usage

```jsx
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';

// Basic usage
<Card>
  <CardBody>
    <p>Card content</p>
  </CardBody>
</Card>

// With header and footer
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// With variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="filled">Filled Card</Card>

// With hover effect
<Card hover>Hover Card</Card>

// Interactive card
<Card interactive>Interactive Card</Card>

// Using the hoverCard utility directly
<div className={cn("bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300", themeClasses.hoverCard)}>
  Custom card with hover effect
</div>
```

### Input Component

The Input component is used for text input.

#### Props

- `label`: string
- `helperText`: string
- `error`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean
- ...other input props

#### Usage

```jsx
import { Input } from '../components/ui/Input';

// Basic usage
<Input placeholder="Enter text" />

// With label
<Input label="Email" placeholder="Enter your email" />

// With helper text
<Input
  label="Username"
  placeholder="Enter username"
  helperText="Username must be at least 3 characters"
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password is required"
/>

// With icons
<Input
  label="Search"
  placeholder="Search..."
  leftIcon={<SearchIcon />}
/>

// Full width
<Input fullWidth placeholder="Full width input" />
```

### EnhancedSearchBar Component

The EnhancedSearchBar is a sophisticated search component with topic-based semantic styling, real-time suggestions, and integrated filtering capabilities.

#### Props

- `value`: string - Current search value
- `onChange`: (value: string) => void - Search value change handler
- `onSearch`: (value: string, filters?: any) => void - Search submission handler
- `placeholder`: string - Input placeholder text
- `topic`: 'trades' | 'collaboration' | 'community' | 'success' - Semantic color theme
- `showFilterPanel`: boolean - Whether to show filter panel
- `onToggleFilters`: () => void - Filter panel toggle handler
- `activeFiltersCount`: number - Number of active filters
- `suggestions`: string[] - Real-time search suggestions
- `resultsCount`: number - Number of search results
- `isLoading`: boolean - Loading state
- `className`: string - Additional CSS classes

#### Features

- **Topic-Based Semantic Styling**: Automatically applies colors based on topic (orange for trades, purple for collaboration, etc.)
- **Glassmorphic Design**: Translucent background with backdrop blur
- **Real-Time Suggestions**: Dropdown with search suggestions
- **Integrated Filtering**: Built-in filter button with count badge
- **Focus Animations**: Spring-based animations on focus
- **Topic-Aware Focus Glow**: Dynamic glow effect based on semantic topic
- **Responsive Design**: Adapts to different screen sizes

#### Usage

```jsx
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';

// Basic usage with trades topic
<EnhancedSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
  placeholder="Type here to search trades..."
  topic="trades"
/>

// With filtering capabilities
<EnhancedSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
  placeholder="Type here to search collaborations..."
  topic="collaboration"
  showFilterPanel={showFilters}
  onToggleFilters={toggleFilters}
  activeFiltersCount={activeFilters.length}
/>

// With suggestions and loading state
<EnhancedSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
  placeholder="Type here to search users..."
  topic="community"
  suggestions={suggestions}
  resultsCount={results.length}
  isLoading={isSearching}
/>
```

#### Topic Color Mapping

- **trades**: Orange theme (`orange-500`, `orange-100`, etc.)
- **collaboration**: Purple theme (`purple-500`, `purple-100`, etc.)
- **community**: Blue theme (`blue-500`, `blue-100`, etc.)
- **success**: Green theme (`green-500`, `green-100`, etc.)

#### Styling Guidelines

- Always wrap in a `Card variant="glass"` for consistent glassmorphic appearance
- Use semantic topic colors for brand consistency
- Ensure proper spacing with `p-4 md:p-6` padding on wrapper cards
- Apply `rounded-xl` for consistent border radius
- Use `mb-6` or `mb-8` for consistent vertical spacing

## Advanced Components

### Modal Component

The Modal component is used for dialogs and popovers. We provide two implementations:

1. **Standard Modal**: A feature-rich modal with customizable header, body, and footer
2. **SimpleModal**: A lightweight alternative with basic functionality

#### Standard Modal Props

- `isOpen`: boolean - Controls whether the modal is visible
- `onClose`: () => void - Function called when the modal is closed
- `title`: string (optional) - Title displayed in the header
- `children`: ReactNode - Content of the modal
- `footer`: ReactNode (optional) - Footer content, typically containing action buttons
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' - Controls the width of the modal
- `closeOnClickOutside`: boolean - Whether clicking outside the modal closes it
- `closeOnEsc`: boolean - Whether pressing the Escape key closes the modal

#### Standard Modal Usage

```jsx
import { Modal } from '../components/ui/Modal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="tertiary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>Confirm</Button>
          </div>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

#### SimpleModal Props

- `isOpen`: boolean - Controls whether the modal is visible
- `onClose`: () => void - Function called when the modal is closed
- `title`: string - Title displayed in the header
- `children`: ReactNode - Content of the modal

#### SimpleModal Usage

```jsx
import { SimpleModal } from '../components/ui/SimpleModal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Simple Modal</Button>

      <SimpleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Simple Modal Title"
      >
        <p>Modal content goes here</p>
        <Button onClick={() => setIsOpen(false)}>Close</Button>
      </SimpleModal>
    </>
  );
}
```

#### Modal Features

Both modal implementations include:

- Backdrop overlay that dims the background content
- Close button in the header
- Ability to close by clicking outside or pressing Escape
- Automatic dark mode support
- Prevention of background scrolling when open

### Toast Component

The Toast component is used for notifications and feedback.

#### Props

- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: string
- `duration`: number
- `onClose`: () => void

#### Usage

```jsx
import { Toast } from '../components/ui/Toast';
import { useState } from 'react';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <Button onClick={() => setShowToast(true)}>Show Toast</Button>

      {showToast && (
        <Toast
          type="success"
          message="Operation completed successfully"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
```

### Tooltip Component

The Tooltip component is used to display additional information on hover. It has been updated to work with any component, including function components that don't use forwardRef.

#### Props

- `content`: ReactNode - The content to display in the tooltip
- `children`: ReactElement - The element that triggers the tooltip
- `position`: 'top' | 'right' | 'bottom' | 'left' - The position of the tooltip relative to the trigger
- `delay`: number - Delay in milliseconds before showing the tooltip
- `className`: string - Additional CSS classes for the tooltip

#### Usage

```jsx
import { Tooltip } from '../components/ui/Tooltip';

<Tooltip content="This is a tooltip">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip content="Right tooltip" position="right">
  <Button>Hover me</Button>
</Tooltip>

{/* Works with any component, including function components */}
<Tooltip content="Tooltip on a custom component">
  <MyCustomComponent />
</Tooltip>
```

#### Features

- Works with any component, including function components
- Automatically positions itself based on available space
- Supports different positions (top, right, bottom, left)
- Customizable delay for showing/hiding
- Fully styled for both light and dark modes
- Uses data attributes for targeting instead of refs

### Transition Component

The Transition component is used for animations when showing or hiding elements. It has been enhanced with more pronounced animations and better handling of first render.

#### Transition Props

- `show`: boolean - Controls whether the content is visible
- `type`: 'fade' | 'slide' | 'zoom' | 'bounce' - The type of animation to use
- `duration`: number - Duration of the animation in milliseconds (default: 400ms)
- `children`: ReactNode - The content to animate
- `className`: string - Additional CSS classes
- `onExited`: () => void - Callback function called when the exit animation completes

#### Transition Usage

```jsx
import { Transition } from '../components/ui/transitions/Transition';
import { useState } from 'react';

function MyComponent() {
  const [show, setShow] = useState(false);

  return (
    <>
      <Button onClick={() => setShow(!show)}>
        {show ? 'Hide' : 'Show'}
      </Button>

      <Transition show={show} type="fade" duration={600}>
        <div className="p-4 bg-white dark:bg-neutral-800 shadow rounded">
          This content will fade in and out
        </div>
      </Transition>
    </>
  );
}
```

#### Animation Types

- **Fade**: Simple opacity transition
- **Slide**: Combination of vertical movement and opacity
- **Zoom**: Scale and opacity transition
- **Bounce**: Scale, position, and opacity with a bouncy effect

#### Features

- Properly handles first render to ensure animations work correctly
- Uses transform-origin for better animation appearance
- Supports callback when exit animation completes
- Optimized for both entering and exiting animations
- Customizable duration for different animation speeds

### EmptyState Component

The EmptyState component is used to display empty states.

#### Props

- `icon`: ReactNode
- `title`: string
- `description`: string
- `actionLabel`: string
- `onAction`: () => void
- `className`: string

#### Usage

```jsx
import { EmptyState } from '../components/ui/EmptyState';

<EmptyState
  icon={<InboxIcon />}
  title="No messages"
  description="You don't have any messages yet"
  actionLabel="New Message"
  onAction={() => console.log('Action clicked')}
/>
```

### Skeleton Components

Skeleton components are used for loading states.

#### Components

- `Skeleton`: Base skeleton component
- `SkeletonText`: For text loading
- `SkeletonCircle`: For avatar or icon loading
- `SkeletonButton`: For button loading
- `CardSkeleton`: For card loading

#### Usage

```jsx
import { SkeletonText, SkeletonCircle, SkeletonButton } from '../components/ui/skeletons/Skeleton';
import { CardSkeleton } from '../components/ui/skeletons/CardSkeleton';

// Loading text
<SkeletonText />
<SkeletonText className="w-3/4" />

// Loading avatar
<SkeletonCircle />

// Loading button
<SkeletonButton />

// Loading card
<CardSkeleton hasImage hasFooter />
```

## HomePage Patterns

The HomePage serves as the gold standard for TradeYa's visual design and user experience. This section documents the successful patterns used in the HomePage that should be replicated across other pages for consistency.

### HomePage Layout Structure

The HomePage uses a sophisticated layout system with asymmetric grids, gradient backgrounds, and premium card variants:

```jsx
import { classPatterns, animations } from '../utils/designSystem';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { GradientMeshBackground } from '../components/ui/GradientMeshBackground';
import { AnimatedHeading } from '../components/ui/AnimatedHeading';

// HomePage container pattern
<Box className={classPatterns.homepageContainer}>
  <PerformanceMonitor pageName="HomePage" />
  <Stack gap="md">
    {/* Hero Section with gradient background */}
    <Box className={classPatterns.homepageHero}>
      <GradientMeshBackground 
        variant="primary" 
        intensity="medium" 
        className={classPatterns.homepageHeroContent}
      >
        <AnimatedHeading 
          as="h1" 
          animation="kinetic" 
          className="text-4xl md:text-5xl font-bold text-foreground mb-4"
        >
          Welcome to TradeYa
        </AnimatedHeading>
        <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn">
          Connect with others, exchange skills, and collaborate on exciting projects.
        </p>
      </GradientMeshBackground>
    </Box>
  </Stack>
</Box>
```

### HomePage Card Patterns

HomePage uses premium card variants with advanced effects:

```jsx
// Premium card with tilt and glow effects
<Card 
  variant="premium" 
  tilt={true}
  depth="lg"
  glow="subtle"
  glowColor="orange"
  interactive={true}
  className="h-[280px] flex flex-col cursor-pointer overflow-hidden"
>
  <CardHeader className={classPatterns.homepageCardHeader}>
    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
  </CardHeader>
  <CardContent className={classPatterns.homepageCardContent}>
    {/* Card content */}
  </CardContent>
  <CardFooter className={classPatterns.homepageCardFooter}>
    <TopicLink to="/trades" topic="trades" className="w-full text-center text-sm font-medium transition-colors">
      Start Trading Skills →
    </TopicLink>
  </CardFooter>
</Card>
```

### HomePage Asymmetric Grid System

The HomePage uses BentoGrid with asymmetric layouts for visual interest:

```jsx
<BentoGrid
  layoutPattern="asymmetric"
  visualRhythm="alternating"
  contentAwareLayout={true}
  className={classPatterns.homepageGrid}
  gap="lg"
>
  {/* Small item (1/3 width) */}
  <BentoItem
    asymmetricSize="small"
    contentType="feature"
    layoutRole="simple"
  >
    <Card variant="premium" glowColor="orange">
      {/* Simple content */}
    </Card>
  </BentoItem>

  {/* Large item (2/3 width) */}
  <BentoItem
    asymmetricSize="large"
    contentType="mixed"
    layoutRole="complex"
  >
    <Card variant="premium" glowColor="purple">
      {/* Complex content */}
    </Card>
  </BentoItem>
</BentoGrid>
```

### HomePage Animation Patterns

HomePage uses sophisticated animations for enhanced user experience:

```jsx
// Kinetic heading animation
<AnimatedHeading 
  as="h1" 
  animation="kinetic" 
  className="text-4xl md:text-5xl font-bold text-foreground mb-4"
>
  Page Title
</AnimatedHeading>

// Slide heading animation
<AnimatedHeading 
  as="h2" 
  animation="slide" 
  className="text-2xl md:text-3xl font-semibold text-foreground mb-6"
>
  Section Title
</AnimatedHeading>

// Card entrance animation
<motion.div
  className="h-full"
  {...animations.homepageCardEntrance}
  transition={{
    ...animations.homepageCardEntrance.transition,
    delay: index * 0.1
  }}
>
  <Card>Content</Card>
</motion.div>
```

### HomePage Color Usage

HomePage uses semantic colors consistently:

```jsx
// Topic-based badges
<Badge variant="default" topic="trades">Active</Badge>
<Badge variant="default" topic="collaboration">Team</Badge>
<Badge variant="default" topic="success">Rewards</Badge>

// Topic-based links
<TopicLink to="/trades" topic="trades">
  Browse Trades
</TopicLink>

// Semantic background classes
<div className={`${semanticClasses('trades').bgSubtle} rounded-lg`}>
  Trade content
</div>
```

### Implementing HomePage Patterns on Other Pages

To bring other pages up to HomePage quality, follow these patterns:

1. **Use HomePage container**: `classPatterns.homepageContainer`
2. **Add gradient hero section**: Use `GradientMeshBackground` with `AnimatedHeading`
3. **Choose appropriate grid layout**: 
   - Use `BentoGrid` with asymmetric layouts for showcase pages (HomePage)
   - Use uniform `Grid` layouts for listing pages (Trades, Collaborations, Directory)
4. **Use premium cards**: Apply `variant="premium"` with tilt and glow effects
5. **Add sophisticated animations**: Use `animations.homepageCardEntrance` and `animations.homepageGridStagger`
6. **Apply semantic colors**: Use `semanticClasses()` and topic-based components

#### Grid Layout Guidelines

**Use BentoGrid (Asymmetric) for:**
- HomePage showcase sections
- Feature highlight areas
- Mixed content types with different priorities

**Use Grid (Uniform) for:**
- Trades listing page
- Collaborations listing page
- User directory page
- Any page where users need to compare similar items

### HomePage Pattern Utilities

The design system includes utilities specifically for HomePage patterns:

```jsx
// Import HomePage patterns
import { classPatterns, animations } from '../utils/designSystem';

// Available HomePage class patterns
classPatterns.homepageContainer        // Main page container
classPatterns.homepageHero            // Hero section styling
classPatterns.homepageHeroContent     // Hero content padding
classPatterns.homepageSection         // Section spacing
classPatterns.homepageGrid            // Grid spacing
classPatterns.homepageCard            // Card dimensions and layout
classPatterns.homepageCardHeader      // Card header styling
classPatterns.homepageCardContent     // Card content styling
classPatterns.homepageCardFooter      // Card footer styling

// Available HomePage animations
animations.kineticHeading             // Kinetic heading animation
animations.slideHeading               // Slide heading animation
animations.homepageCardEntrance       // Card entrance animation
animations.homepageGridStagger        // Grid stagger animation
animations.homepagePremiumCardHover   // Premium card hover effect
```

## Responsive Design

The design system is built with a mobile-first approach. All components are responsive by default and adapt to different screen sizes.

### Breakpoints

The design system uses the following breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Responsive Utilities

Use Tailwind's responsive utilities to create responsive designs:

```jsx
<div className="text-sm md:text-base lg:text-lg">
  This text changes size based on screen size
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

## Accessibility Guidelines

The design system is built with accessibility in mind:

1. **Color Contrast**: All colors meet WCAG AA standards for contrast
2. **Keyboard Navigation**: All interactive elements are keyboard accessible
3. **Screen Readers**: Components include appropriate ARIA attributes
4. **Focus States**: All interactive elements have visible focus states

### Focus Rings

Use the focus utility for consistent focus states:

```jsx
<button className={themeClasses.focus}>
  Focusable Button
</button>
```

## Usage Examples

### Form Example

```jsx
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <h2 className={themeClasses.heading2}>Login</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
          />
        </div>
      </CardBody>
      <CardFooter>
        <div className="flex justify-end">
          <Button variant="primary">Login</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### Dashboard Card Example

```jsx
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

function DashboardCard() {
  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar src="/user-avatar.jpg" alt="User" />
          <div>
            <h3 className={themeClasses.heading5}>John Doe</h3>
            <p className={themeClasses.bodySmall}>Web Developer</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          <p className={themeClasses.body}>
            Recent activity and statistics will appear here.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded">
              <p className={themeClasses.caption}>Projects</p>
              <p className={themeClasses.heading4}>12</p>
            </div>
            <div className="p-2 bg-secondary-50 dark:bg-secondary-900/20 rounded">
              <p className={themeClasses.caption}>Tasks</p>
              <p className={themeClasses.heading4}>34</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```
