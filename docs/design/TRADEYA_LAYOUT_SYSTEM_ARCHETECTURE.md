# TradeYa Layout System Architecture
**Version:** 1.0  
**Date:** June 16, 2025  
**Status:** Comprehensive Reference Guide  
**Related Documents:** [Technical Architecture](./TRADEYA_REFACTORING_TECHNICAL_ARCHITECTURE.md) | [Component Enhancement Guide](./COMPONENT_ENHANCEMENT_TECHNIQUES.md)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Styling Architecture](#styling-architecture)
4. [Responsive Breakpoints](#responsive-breakpoints)
5. [Grid Systems](#grid-systems)
6. [Positioning Strategies](#positioning-strategies)
7. [Dependency Relationships](#dependency-relationships)
8. [Data Flow Patterns](#data-flow-patterns)
9. [State Management](#state-management)
10. [CSS Class Naming Conventions](#css-class-naming-conventions)
11. [Media Queries](#media-queries)
12. [Flexbox & Grid Implementations](#flexbox--grid-implementations)
13. [Z-Index Stacking Contexts](#z-index-stacking-contexts)
14. [JavaScript Layout Interactions](#javascript-layout-interactions)
15. [Performance Considerations](#performance-considerations)
16. [Browser Compatibility](#browser-compatibility)
17. [Gotchas & Fragile Areas](#gotchas--fragile-areas)
18. [Cross-References](#cross-references)

---

## Overview

The TradeYa layout system is a sophisticated, multi-layered architecture that combines React component composition, Tailwind CSS utility classes, CSS custom properties, and context-driven state management. The system is currently in transition from a monolithic structure to a modular, domain-driven design.

### Key Architectural Principles

- **Component-based Layout**: Reusable layout components with configurable variants
- **Utility-first Styling**: Tailwind CSS with custom extensions and themes
- **Responsive Design**: Mobile-first approach with comprehensive breakpoint system
- **Theme-aware Architecture**: Dark/light mode with CSS custom properties
- **Performance Optimization**: Lazy loading, code splitting, and route preloading

---

## Component Hierarchy

### 1. Application Root Layout
```
App.tsx (Root Container)
├── ErrorBoundaryWrapper
├── ThemeProvider
├── ToastProvider
├── AuthProvider
├── AutoResolutionProvider
├── NotificationsProvider
├── GamificationNotificationProvider
├── MessageProvider
├── PerformanceProvider
└── SmartPerformanceProvider
    └── Layout Container
        ├── Navbar (Sticky Header)
        ├── Main Content Area
        │   ├── RouteErrorBoundary
        │   └── Page Components
        ├── Footer
        ├── NetworkStatusIndicator
        ├── GamificationIntegration
        └── NotificationContainer
```

### 2. Layout Component Files
```
src/components/layout/
├── MainLayout.tsx          # Primary layout wrapper (underutilized)
├── Navbar.tsx             # Main navigation component
└── Footer.tsx             # Footer component

src/components/ui/
├── NavItem.tsx            # Navigation item component
├── MobileMenu.tsx         # Mobile navigation menu
├── UserMenu.tsx           # User dropdown menu
├── Card.tsx               # Card layout component
├── BentoGrid.tsx          # Advanced grid system
├── Modal.tsx              # Modal layout component
└── PageTransition.tsx     # Page transition wrapper
```

### 3. Layout Component Details

#### MainLayout Component
**File:** [`src/components/layout/MainLayout.tsx`](../src/components/layout/MainLayout.tsx)

```typescript
interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
```

**Usage Pattern:**
- **Intended Use:** Consistent layout wrapper for all pages
- **Current State:** Underutilized - most pages implement layout directly
- **Layout Strategy:** Three-section flexbox (header, main, footer)
- **Container Pattern:** `container mx-auto px-4 py-8`

#### Navbar Component
**File:** [`src/components/layout/Navbar.tsx`](../src/components/layout/Navbar.tsx)

```typescript
// Key CSS Classes and Layout Strategy
const navbarClasses = {
  container: "sticky top-0 z-50 bg-white dark:bg-gray-800",
  scrollAware: scrolled ? 'shadow-md dark:shadow-gray-900/30' : 'shadow-sm dark:shadow-gray-700/20',
  responsive: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  layout: "flex justify-between h-16"
};
```

**Layout Features:**
- **Positioning:** `sticky top-0 z-50` for persistent header
- **Scroll Awareness:** Dynamic shadow based on scroll position
- **Responsive Design:** Different layouts for desktop/mobile
- **Theme Integration:** Dark mode with automatic class switching

---

## Styling Architecture

### 1. CSS Architecture Stack

```
Build Pipeline:
├── Vite (Build Tool)
├── PostCSS (CSS Processing)
├── Tailwind CSS (Utility Framework)
├── CSS Custom Properties (Theme Variables)
└── CSS Modules (Component-specific styles)
```

### 2. CSS File Structure

#### Root Styles
**File:** [`src/index.css`](../src/index.css)

```css
/* CSS Custom Properties for Theme System */
:root {
  /* Base typography */
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Light mode variables */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-border: #e5e7eb;
  --color-shadow: rgba(0, 0, 0, 0.05);
  
  /* Brand colors */
  --color-primary: #f97316;
  --color-primary-hover: #ea580c;
  --color-secondary: #0ea5e9;
  --color-accent: #8b5cf6;
}

.dark {
  /* Dark mode overrides */
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-bg-card: #1f2937;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
  --color-shadow: rgba(0, 0, 0, 0.3);
  
  /* Adjusted brand colors for dark mode */
  --color-primary: #fb923c;
  --color-primary-hover: #f97316;
  --color-secondary: #38bdf8;
  --color-accent: #a78bfa;
}
```

#### Tailwind Configuration
**File:** [`tailwind.config.ts`](../tailwind.config.ts)

```typescript
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Class-based dark mode
  theme: {
    extend: {
      // Extended color palette linking to CSS variables
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'text-primary': 'var(--color-text-primary)',
        primary: {
          500: '#f97316', // Main orange
          600: '#ea580c', // Hover orange
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        }
      },
      // Typography system
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system'],
        heading: ['Outfit', 'Inter var', 'system-ui'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas']
      },
      // Animation system with 16 custom animations
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        // ... 12 more animations
      }
    }
  }
}
```

### 3. Theme Utilities System
**File:** [`src/utils/themeUtils.ts`](../src/utils/themeUtils.ts)

```typescript
export const themeClasses = {
  // Background patterns
  card: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  page: 'bg-neutral-50 dark:bg-neutral-900',
  
  // Text patterns
  text: 'text-neutral-900 dark:text-neutral-100',
  textMuted: 'text-neutral-500 dark:text-neutral-400',
  
  // Interactive elements
  primaryButton: 'bg-primary-500 hover:bg-primary-600 text-white',
  hoverCard: 'hover:shadow-md hover:-translate-y-1 dark:hover:bg-neutral-700/70',
  
  // Transitions
  transition: 'transition-all duration-200',
  
  // Typography scale
  heading1: 'font-heading font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white',
  body: 'font-sans text-base text-neutral-700 dark:text-neutral-300 leading-relaxed'
};

// Utility function for dynamic theme classes
export const withDarkMode = (baseClasses: string, darkClasses: string): string => {
  const darkClassesWithPrefix = darkClasses
    .split(' ')
    .map(cls => `dark:${cls}`)
    .join(' ');
  return `${baseClasses} ${darkClassesWithPrefix}`;
};
```

### 4. Class Name Merging Utility
**File:** [`src/utils/cn.ts`](../src/utils/cn.ts)

```typescript
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage Pattern:**
```typescript
// Resolves Tailwind conflicts and conditional classes
cn(
  "p-2 bg-red-500",      // Base classes
  "p-4 bg-blue-500",     // Override classes (p-4 and bg-blue-500 win)
  isActive && "ring-2",  // Conditional classes
  className              // External className prop
)
// Result: "p-4 bg-blue-500 ring-2"
```

---

## Responsive Breakpoints

### 1. Tailwind Breakpoint System

```typescript
// Default Tailwind breakpoints used throughout the application
const breakpoints = {
  'sm': '640px',   // Small devices (tablets)
  'md': '768px',   // Medium devices (small laptops)
  'lg': '1024px',  // Large devices (laptops)
  'xl': '1280px',  // Extra large devices (desktops)
  '2xl': '1536px'  // 2X large devices (large desktops)
};
```

### 2. Responsive Patterns Used

#### Container Pattern
```css
/* Standard container pattern used across pages */
.container-pattern {
  max-width: 1280px;        /* xl breakpoint */
  margin: 0 auto;           /* Center alignment */
  padding: 0 1rem;          /* Base: 16px */
}

@media (min-width: 640px) {   /* sm: */
  .container-pattern { padding: 0 1.5rem; }  /* 24px */
}

@media (min-width: 1024px) {  /* lg: */
  .container-pattern { padding: 0 2rem; }    /* 32px */
}
```

#### Grid Responsive Pattern
```typescript
// BentoGrid responsive columns
const gridCols = {
  1: 'grid-cols-1',                              // Mobile: 1 column
  2: 'grid-cols-1 md:grid-cols-2',              // Mobile: 1, Tablet+: 2
  3: 'grid-cols-1 md:grid-cols-3',              // Mobile: 1, Tablet+: 3
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', // Mobile: 1, Tablet: 2, Desktop: 4
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' // Full responsive
};
```

#### Navigation Responsive Pattern
```typescript
// Navbar responsive behavior
const navbarResponsive = {
  desktop: "hidden md:ml-8 md:flex md:space-x-4 lg:space-x-8",  // Hidden on mobile
  mobile: "md:hidden",                                          // Hidden on desktop
  mobileButton: "inline-flex items-center justify-center p-2 md:hidden"
};
```

### 3. Media Query Usage Patterns

#### CSS Custom Media Queries
```css
/* Used in component-specific styles */
@media (prefers-reduced-motion: reduce) {
  .animation-element {
    animation: none;
    transition: none;
  }
}

@media (prefers-color-scheme: dark) {
  /* Automatic dark mode detection - overridden by class-based system */
}

@media (max-width: 767px) {
  /* Mobile-specific overrides when Tailwind classes aren't sufficient */
}
```

---

## Grid Systems

### 1. BentoGrid System
**File:** [`src/components/ui/BentoGrid.tsx`](../src/components/ui/BentoGrid.tsx)

```typescript
type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  columns?: 1 | 2 | 3 | 4 | 6;
  rows?: number;
};

type BentoItemProps = {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 6;
  rowSpan?: 1 | 2 | 3 | 4;
  featured?: boolean;
};
```

#### Gap Sizing System
```typescript
const gapSizes = {
  none: 'gap-0',     // 0px
  sm: 'gap-2',       // 8px
  md: 'gap-4',       // 16px
  lg: 'gap-6',       // 24px
  xl: 'gap-8',       // 32px
};
```

#### Column Span Classes
```typescript
const colSpanClasses = {
  1: 'md:col-span-1',   // 1/6 width on medium+ screens
  2: 'md:col-span-2',   // 2/6 width on medium+ screens
  3: 'md:col-span-3',   // 3/6 width on medium+ screens
  4: 'md:col-span-4',   // 4/6 width on medium+ screens
  6: 'md:col-span-6',   // Full width on medium+ screens
};

const rowSpanClasses = {
  1: 'md:row-span-1',   // Single row height
  2: 'md:row-span-2',   // Double row height
  3: 'md:row-span-3',   // Triple row height
  4: 'md:row-span-4',   // Quadruple row height
};
```

#### Usage Example
```typescript
// From HomePage.tsx
<BentoGrid columns={6} gap="md" className="mb-12">
  {/* Featured item - large */}
  <BentoItem colSpan={3} rowSpan={2} className="overflow-hidden">
    <Card variant="glass" hover className="h-full">
      <CardBody>
        <h2>Skill Trades</h2>
        <p>Exchange your skills with others...</p>
      </CardBody>
    </Card>
  </BentoItem>
  
  {/* Regular items */}
  <BentoItem colSpan={3} rowSpan={1}>
    <Card variant="glass" hover className="h-full">
      <CardBody>
        <h2>Projects</h2>
        <p>Join collaborative projects...</p>
      </CardBody>
    </Card>
  </BentoItem>
</BentoGrid>
```

### 2. Card Grid System
**File:** [`src/components/ui/Card.tsx`](../src/components/ui/Card.tsx)

```typescript
// Card component structure
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'elevated';
  hover?: boolean;
}

// Card sub-components for structured layout
export const CardHeader: React.FC<CardHeaderProps>;  // p-6 space-y-1.5
export const CardTitle: React.FC<CardTitleProps>;    // text-2xl font-semibold
export const CardContent: React.FC<CardContentProps>; // p-6 pt-0
export const CardBody: React.FC<CardBodyProps>;      // Alias for CardContent
export const CardFooter: React.FC<CardFooterProps>;  // p-6 pt-0 flex items-center
```

### 3. Standard Layout Grids

#### CSS Grid Patterns
```css
/* Standard content grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Sidebar layout grid */
.sidebar-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .sidebar-grid {
    grid-template-columns: 1fr;
  }
}
```

#### Flexbox Patterns
```css
/* Primary app layout */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-layout > main {
  flex: 1;  /* flex-grow: 1 */
}

/* Navigation layout */
.nav-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;  /* 64px */
}
```

---

## Positioning Strategies

### 1. Z-Index Stacking Contexts

```typescript
// Z-index hierarchy used across components
const zIndexLayers = {
  base: 0,              // Default layer
  content: 1,           // Regular content
  dropdown: 10,         // Dropdown menus
  sticky: 20,           // Sticky elements
  header: 50,           // Navigation header
  overlay: 100,         // Modal overlays
  modal: 1000,          // Modal content
  toast: 2000,          // Toast notifications
  tooltip: 3000,        // Tooltips
};
```

#### Critical Z-Index Usage
```typescript
// Navbar (sticky header)
"sticky top-0 z-50"

// Modal overlay
"fixed inset-0 z-[100] bg-black/50"

// Modal content
"fixed left-1/2 top-1/2 z-[1000] transform -translate-x-1/2 -translate-y-1/2"

// Toast notifications
"fixed top-4 right-4 z-[2000]"

// Dropdown menus
"absolute right-0 mt-2 w-48 z-10"
```

### 2. Positioning Patterns

#### Sticky Navigation
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  transition: box-shadow 0.2s ease;
}

.navbar.scrolled {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

#### Fixed Elements
```css
/* Network status indicator */
.network-status {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 100;
}

/* Notification container */
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}
```

#### Absolute Positioning
```css
/* Dropdown positioning */
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  z-index: 10;
}

/* Modal centering */
.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
```

---

## Dependency Relationships

### 1. Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "framer-motion": "^10.0.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0"
  }
}
```

### 2. Dependency Relationship Map

```
Layout System Dependencies:
├── React (Core Framework)
│   ├── React Router DOM (Navigation)
│   ├── Framer Motion (Animations)
│   └── Context Providers (State)
├── Tailwind CSS (Styling Framework)
│   ├── PostCSS (Processing)
│   ├── Autoprefixer (Browser support)
│   └── CSS Custom Properties (Theming)
├── Class Utilities
│   ├── clsx (Conditional classes)
│   └── tailwind-merge (Conflict resolution)
└── Icons & Assets
    ├── Lucide React (Icons)
    └── Custom Assets (Images, fonts)
```

### 3. Build Pipeline Dependencies

**File:** [`vite.config.ts`](../vite.config.ts)
```typescript
// Build configuration affecting layout
export default defineConfig({
  plugins: [
    react({
      // React optimization for production
      babel: {
        plugins: mode === 'production' ? [
          ['@babel/plugin-transform-react-inline-elements'],
          ['@babel/plugin-transform-react-constant-elements']
        ] : []
      }
    })
  ],
  css: {
    postcss: './postcss.config.cjs'  // PostCSS configuration
  }
});
```

**File:** [`postcss.config.cjs`](../postcss.config.cjs)
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  // Tailwind processing
    autoprefixer: {},            // Browser prefixes
  },
}
```

---

## Data Flow Patterns

### 1. Context Provider Flow

```typescript
// Provider nesting hierarchy (affects layout state)
<BrowserRouter>
  <ErrorBoundaryWrapper>
    <ThemeProvider>           // Theme state (dark/light mode)
      <ToastProvider>         // Toast notifications positioning
        <AuthProvider>        // User state (affects navigation)
          <AutoResolutionProvider>
            <NotificationsProvider>  // Notification state
              <GamificationNotificationProvider>
                <MessageProvider>    // Message state
                  <PerformanceProvider>  // Performance monitoring
                    <SmartPerformanceProvider>
                      {/* Layout Content */}
                    </SmartPerformanceProvider>
                  </PerformanceProvider>
                </MessageProvider>
              </GamificationNotificationProvider>
            </NotificationsProvider>
          </AutoResolutionProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundaryWrapper>
</BrowserRouter>
```

### 2. Theme Data Flow
**File:** [`src/contexts/ThemeContext.tsx`](../src/contexts/ThemeContext.tsx)

```typescript
// Theme state flow
localStorage.getItem('theme') 
  ↓
ThemeContext.state 
  ↓ 
document.documentElement.classList (add/remove 'dark')
  ↓
CSS custom properties switch
  ↓
Component re-render with new theme classes
```

#### Theme Integration Pattern
```typescript
// Component theme integration
const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800",     // Theme-aware background
      "text-gray-900 dark:text-white", // Theme-aware text
      themeClasses.transition          // Smooth transitions
    )}>
      {/* Content */}
    </div>
  );
};
```

### 3. Route-Based Layout Flow

```typescript
// Route change flow affecting layout
URL Change 
  ↓
React Router navigation
  ↓
RoutePreloader (preload resources)
  ↓
RouteErrorBoundary (error handling)
  ↓
Page Component (layout implementation)
  ↓
Layout state updates (navbar active states, etc.)
```

### 4. Performance Data Flow
**File:** [`src/contexts/PerformanceContext.tsx`](../src/contexts/PerformanceContext.tsx)

```typescript
// Performance monitoring affecting layout decisions
Route Change Event
  ↓
Performance metrics collection
  ↓
Context state update
  ↓
Layout optimization decisions
  ↓
Conditional rendering/lazy loading
```

---

## State Management

### 1. Layout-Related State

#### Theme State
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Usage in layout components
const { theme, toggleTheme } = useTheme();
```

#### Navigation State
```typescript
// Navbar state management
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [scrolled, setScrolled] = useState(false);

// Scroll detection for navbar styling
useEffect(() => {
  const handleScroll = () => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== scrolled) {
      setScrolled(isScrolled);
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [scrolled]);
```

#### Modal/Overlay State
```typescript
// Global modal state pattern
const [isOpen, setIsOpen] = useState(false);
const [modalContent, setModalContent] = useState<ReactNode>(null);

// Click outside detection
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };
  
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 2. Layout State Patterns

#### Responsive State
```typescript
// Responsive layout state
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  
  handleResize(); // Initial check
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

#### Loading State
```typescript
// Loading state affecting layout
const [loading, setLoading] = useState(true);

// Conditional layout rendering
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-orange-500"></div>
    </div>
  );
}
```

---

## CSS Class Naming Conventions

### 1. Tailwind Class Patterns

#### Standard Utility Patterns
```typescript
// Layout patterns
"flex flex-col min-h-screen"              // Full height flex container
"container mx-auto px-4 sm:px-6 lg:px-8"  // Responsive container
"grid grid-cols-1 md:grid-cols-2 gap-4"   // Responsive grid
"sticky top-0 z-50"                       // Sticky positioning

// Component patterns
"bg-white dark:bg-gray-800"               // Theme-aware background
"text-gray-900 dark:text-white"           // Theme-aware text
"hover:shadow-md transition-shadow"       // Interactive states
"focus:ring-2 focus:ring-blue-500"        // Focus states
```

#### Responsive Modifier Patterns
```typescript
// Mobile-first responsive patterns
"block md:hidden"                   // Mobile only
"hidden md:block"                   // Desktop only
"grid-cols-1 md:grid-cols-2 lg:grid-cols-3"  // Progressive columns
"text-sm md:text-base lg:text-lg"   // Progressive text sizes
"p-4 md:p-6 lg:p-8"                // Progressive padding
```

### 2. Component Class Patterns

#### Theme Class Integration
```typescript
// Using themeClasses utility
import { themeClasses } from '../utils/themeUtils';

<div className={cn(
  themeClasses.card,        // Pre-defined theme-aware card styles
  themeClasses.transition,  // Standard transition
  className                 // External override classes
)}>
```

#### Conditional Class Patterns
```typescript
// Using cn utility for conditional classes
cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes",
  variant === 'primary' && "primary-classes",
  className
)
```

### 3. CSS Custom Class Patterns

#### BEM-style Component Classes (Rare Usage)
```css
/* Used only for component-specific styles that can't be achieved with Tailwind */
.navbar__menu-button {
  /* Custom button styles */
}

.navbar__menu-button--active {
  /* Active state styles */
}

.card__hover-effect {
  /* Complex hover animations */
}
```

---

## Media Queries

### 1. Tailwind Responsive System

```css
/* Tailwind's responsive breakpoints */
/* Base styles (mobile-first) */
.responsive-element {
  padding: 1rem;
  font-size: 0.875rem;
}

/* sm: 640px and up */
@media (min-width: 640px) {
  .responsive-element {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* md: 768px and up */
@media (min-width: 768px) {
  .responsive-element {
    padding: 2rem;
    font-size: 1.125rem;
  }
}

/* lg: 1024px and up */
@media (min-width: 1024px) {
  .responsive-element {
    padding: 2.5rem;
    font-size: 1.25rem;
  }
}

/* xl: 1280px and up */
@media (min-width: 1280px) {
  .responsive-element {
    padding: 3rem;
    font-size: 1.5rem;
  }
}
```

### 2. Custom Media Queries

#### Accessibility Media Queries
```css
/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .animate-element {
    animation: none;
    transition: none;
  }
  
  .page-transition {
    transform: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .card {
    border-width: 2px;
    border-color: currentColor;
  }
}
```

#### Color Scheme Detection
```css
/* System theme detection (overridden by class-based system) */
@media (prefers-color-scheme: dark) {
  :root {
    /* Default dark mode values */
  }
}

@media (prefers-color-scheme: light) {
  :root {
    /* Default light mode values */
  }
}
```

#### Container Queries (Future Enhancement)
```css
/* Container queries for component-level responsiveness */
@container (min-width: 400px) {
  .card-content {
    grid-template-columns: 1fr 1fr;
  }
}
```

### 3. Print Media Queries
```css
/* Print styles for layout components */
@media print {
  .navbar,
  .footer,
  .sidebar {
    display: none !important;
  }
  
  .main-content {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #000 !important;
  }
}
```

---

## Flexbox & Grid Implementations

### 1. Primary Layout Implementations

#### Application Root Layout (Flexbox)
```typescript
// App.tsx layout structure
<div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  <Navbar />                    {/* Fixed height header */}
  <main className="flex-grow">  {/* Flexible main content */}
    <Routes>{/* Page content */}</Routes>
  </main>
  <Footer />                    {/* Fixed height footer */}
</div>
```

#### Navigation Layout (Flexbox)
```typescript
// Navbar.tsx internal layout
<nav className="sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">  {/* Main flex container */}
      <div className="flex items-center">       {/* Logo + navigation */}
        <Logo />
        <div className="hidden md:flex md:space-x-4">  {/* Desktop nav */}
          {navItems.map(item => <NavItem key={item.path} {...item} />)}
        </div>
      </div>
      <div className="hidden md:flex md:items-center md:space-x-4">  {/* Actions */}
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </div>
  </div>
</nav>
```

### 2. Grid Implementations

#### BentoGrid System (CSS Grid)
```typescript
// BentoGrid.tsx implementation
<div
  className={cn(
    'grid',                    // CSS Grid container
    gridCols[columns],         // Dynamic column configuration
    gridRows,                  // Optional row configuration
    gapSizes[gap],            // Gap sizing
    className
  )}
>
  {children}  {/* BentoItem components */}
</div>

// BentoItem implementation
<div
  className={cn(
    'rounded-xl overflow-hidden',
    colSpanClasses[colSpan],    // grid-column span
    rowSpanClasses[rowSpan],    // grid-row span
    featuredClasses,            // Special featured styling
    className
  )}
>
  {children}
</div>
```

#### Content Grid Patterns
```css
/* Auto-fit grid for dynamic content */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Fixed grid with named areas */
.page-grid {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.page-grid .header { grid-area: header; }
.page-grid .sidebar { grid-area: sidebar; }
.page-grid .main { grid-area: main; }
.page-grid .footer { grid-area: footer; }
```

### 3. Complex Layout Patterns

#### Card Layout (Flexbox)
```typescript
// Card.tsx internal structure
<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
  <div className="flex flex-col space-y-1.5 p-6">      {/* CardHeader */}
    <h3 className="text-2xl font-semibold">Title</h3>
  </div>
  <div className="p-6 pt-0">                           {/* CardContent */}
    {/* Main content */}
  </div>
  <div className="flex items-center p-6 pt-0">         {/* CardFooter */}
    {/* Footer actions */}
  </div>
</div>
```

#### Modal Layout (Fixed Positioning + Flexbox)
```typescript
// Modal implementation pattern
<div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
    <div className="flex items-center justify-between p-6 border-b">
      <h2>Modal Title</h2>
      <button>×</button>
    </div>
    <div className="p-6">
      {/* Modal content */}
    </div>
    <div className="flex justify-end space-x-2 p-6 border-t">
      {/* Modal actions */}
    </div>
  </div>
</div>
```

---

## Z-Index Stacking Contexts

### 1. Z-Index Hierarchy

```typescript
// Application-wide z-index scale
const zIndexScale = {
  // Base layers
  base: 0,              // Default content
  raised: 1,            // Slightly elevated content
  
  // Interactive layers
  dropdown: 10,         // Dropdown menus
  tooltip: 20,          // Tooltips
  sticky: 30,           // Sticky elements
  
  // Navigation layers
  header: 50,           // Site header/navbar
  sidebar: 40,          // Sidebar navigation
  
  // Overlay layers
  backdrop: 100,        // Modal backdrops
  dialog: 200,          // Dialog/modal content
  popover: 300,         // Popovers
  
  // Notification layers
  snackbar: 400,        // Snackbar notifications
  toast: 500,           // Toast notifications
  
  // System layers
  loading: 900,         // Loading overlays
  error: 1000,          // Error overlays
  debug: 9999,          // Debug overlays
};
```

### 2. Critical Z-Index Usage

#### Navbar (Persistent Header)
```typescript
// Navbar.tsx - Highest priority for navigation
<nav className="sticky top-0 z-50 bg-white dark:bg-gray-800">
  {/* Navigation content */}
</nav>
```

#### Modal System
```typescript
// Modal backdrop
<div className="fixed inset-0 z-[100] bg-black/50" />

// Modal content
<div className="fixed left-1/2 top-1/2 z-[200] transform -translate-x-1/2 -translate-y-1/2">
  {/* Modal content */}
</div>
```

#### Dropdown Menus
```typescript
// UserMenu.tsx dropdown
<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10">
  {/* Dropdown content */}
</div>
```

#### Toast Notifications
```typescript
// NotificationContainer positioning
<div className="fixed top-4 right-4 z-[500] space-y-2">
  {/* Toast notifications */}
</div>
```

### 3. Stacking Context Management

#### Creating Stacking Contexts
```css
/* Elements that create new stacking contexts */
.stacking-context {
  position: relative;  /* or absolute, fixed, sticky */
  z-index: 1;         /* Any z-index value */
  /* This creates a new stacking context */
}

.transform-context {
  transform: translateZ(0);  /* Creates stacking context */
}

.opacity-context {
  opacity: 0.99;  /* Values < 1 create stacking context */
}
```

#### Avoiding Z-Index Conflicts
```typescript
// Using CSS custom properties for consistent z-index management
const zIndexVars = {
  '--z-dropdown': '10',
  '--z-sticky': '30',
  '--z-header': '50',
  '--z-modal': '100',
  '--z-toast': '500'
};

// Component implementation
<div className="relative z-[var(--z-dropdown)]">
  {/* Dropdown content */}
</div>
```

---

## JavaScript Layout Interactions

### 1. Scroll-Based Interactions

#### Navbar Scroll Detection
```typescript
// Navbar.tsx scroll interaction
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== scrolled) {
      setScrolled(isScrolled);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [scrolled]);

// Dynamic className based on scroll state
<nav className={cn(
  "sticky top-0 z-50 bg-white dark:bg-gray-800",
  scrolled 
    ? 'shadow-md dark:shadow-gray-900/30' 
    : 'shadow-sm dark:shadow-gray-