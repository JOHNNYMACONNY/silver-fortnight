# Decision Log

This file records architectural and implementation decisions using a list format.
2025-12-06 08:57:13 - Log of updates made.

## Decision: React + TypeScript Frontend Architecture

**Rationale:** Chosen React with TypeScript for type safety, component reusability, and strong ecosystem support. Vite build system for fast development and optimized production builds.

**Implementation Details:**

- Component-based architecture with custom hooks for complex state management
- Context API for global state (authentication, themes, performance monitoring)
- Tailwind CSS for consistent styling and responsive design

## Decision: Firebase Backend Infrastructure

**Rationale:** Firebase provides comprehensive backend services (Firestore, Authentication, Storage, Functions) with real-time capabilities and scalable infrastructure.

**Implementation Details:**

- Firestore for document-based data storage with real-time subscriptions
- Firebase Authentication for secure user management
- Cloud Storage for file uploads and evidence galleries
- Security rules for role-based access control

## Decision: Comprehensive Migration Infrastructure

**Rationale:** Need for safe, reversible schema evolution as the platform grows and requirements change.

**Implementation Details:**

- Versioned migration system with compatibility layers
- Rollback procedures and validation testing
- Production monitoring and automated alerts
- Phased migration execution with stakeholder coordination

## Decision: Advanced Performance Monitoring

**Rationale:** Real user monitoring essential for maintaining performance at scale and identifying optimization opportunities.

**Implementation Details:**

- RUM service for performance metrics collection
- Smart preloading and adaptive resource loading
- Virtualization for large data sets
- Bundle optimization and tree shaking

## Decision: Robust Security Framework

**Rationale:** Security-first approach necessary for user trust and data protection in collaborative platform.

**Implementation Details:**

- Role-based access control with hierarchical permissions
- Input validation and sanitization
- Security monitoring and audit logging
- Firestore security rules with extensive testing

## Decision: Single Tailwind Configuration File Strategy

**Rationale:** Resolved critical CSS compilation failure caused by conflicting Tailwind configuration files. The presence of both tailwind.config.js (44-line debug config) and tailwind.config.ts (278-line production config) created build system conflicts that prevented proper CSS class application.

**Implementation Details:**

- Removed conflicting tailwind.config.js file completely
- Retained comprehensive tailwind.config.ts with full theme customization
- Verified postcss.config.cjs uses correct @tailwindcss/postcss plugin for v4 compatibility
- Cleared build cache (node_modules/.vite, dist) and npm cache
- Development server now starts cleanly without configuration errors

[2025-06-16 22:51:02] - Critical Tailwind configuration conflict resolved

## Decision: Tailwind CSS v4 PostCSS Plugin Configuration Fix

**Rationale:** The critical issue preventing Tailwind CSS compilation was identified as an incorrect PostCSS plugin configuration. Tailwind CSS v4 requires the `@tailwindcss/postcss` package and plugin name, not the direct `tailwindcss` plugin which was causing PostCSS errors.

**Implementation Details:**

- Installed `@tailwindcss/postcss` package using `--legacy-peer-deps` to resolve Firebase dependency conflicts
- Updated [`postcss.config.cjs`](postcss.config.cjs:3) to use `'@tailwindcss/postcss': {}` instead of `'tailwindcss': {}`
- Cleared Vite build cache (`node_modules/.vite`) to ensure clean compilation
- Restarted development server successfully on port 5175
- Verified Tailwind CSS utilities are now being generated and applied correctly
- Visual confirmation shows proper styling is working as expected

[2025-06-16 23:53:00] - Critical PostCSS configuration fix for Tailwind CSS v4 resolved compilation issues

## Decision: MainLayout Component Architecture Implementation

**Rationale:** Fixed critical layout implementation inconsistency where App.tsx was implementing layout directly instead of using the centralized MainLayout component. This inconsistency created styling conflicts and prevented proper responsive grid functionality.

**Implementation Details:**

- Refactored App.tsx to use MainLayout component consistently
- Removed duplicate layout implementation (direct Navbar/Footer in App.tsx)
- Implemented proper layout structure: `<MainLayout><Routes>...</Routes></MainLayout>`
- Maintained network status indicator, gamification integration, and notification container outside of MainLayout
- Layout now provides consistent styling and behavior across all application routes
- Enables proper BentoGrid responsive system functionality

[2025-06-17 00:37:41] - Critical layout architecture fix completed for consistent MainLayout component usage

## Decision: Card Component Glassmorphism Variant Implementation

**Rationale:** HomePage component was using `variant="glass"` and `hover` props that didn't exist in the Card component, causing TypeScript errors and preventing proper glassmorphism styling from being applied.

**Implementation Details:**

- Added `variant` prop with support for 'default' and 'glass' variants
- Implemented `hover` prop for enhanced interactive effects
- Added glassmorphism styling: `backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60 border border-white/20 dark:border-neutral-700/30`
- Integrated with existing `cn` utility function for proper class merging
- Maintained backward compatibility with existing Card usage

[2025-06-17 07:54:15] - Card component enhanced with glassmorphism variants to support HomePage layout requirements

## Decision: MainLayout Component Architecture Improvement

**Rationale:** MainLayout component needed better TypeScript definitions, flexible containerization options, and consistent background styling to eliminate duplication between App.tsx and MainLayout.

**Implementation Details:**

- Added optional `className` and `containerized` props with proper TypeScript definitions
- Moved background styling (`bg-gray-50 dark:bg-gray-900`) from App.tsx to MainLayout for centralized control
- Implemented flexible containerization with responsive padding (`container mx-auto px-4 sm:px-6 lg:px-8`)
- Added comprehensive JSDoc documentation
- Maintained backward compatibility while providing enhanced flexibility

[2025-06-17 07:54:15] - MainLayout component enhanced with better TypeScript definitions and centralized styling control

## Decision: App.tsx Layout Architecture Standardization

**Rationale:** App.tsx had duplicate background styling that should be handled by MainLayout, and needed to use the enhanced MainLayout component consistently.

**Implementation Details:**

- Removed duplicate `bg-gray-50 dark:bg-gray-900` styling from App.tsx wrapper div
- Ensured MainLayout handles all layout-related styling and structure
- Maintained proper provider hierarchy and error boundary structure
- Preserved existing component functionality while eliminating duplication

[2025-06-17 07:54:15] - App.tsx layout architecture standardized to use centralized MainLayout component

## Decision: Dynamic Background Implementation - Typography Preservation Strategy

**Rationale:** User clarified they ONLY want the dynamic background from inspiration example, NOT the Geist fonts. Must preserve TradeYa's existing Inter font system completely and focus exclusively on WebGL fluid gradient background using exact brand colors (#f97316, #0ea5e9, #8b5cf6).

**Implementation Details:**

- Scope limited to WebGL background implementation only
- Zero changes to existing Inter font family in src/index.css (line 26)
- Preserve all typography custom properties and font configurations
- Focus on WebGL shaders for fluid gradient animation with TradeYa brand colors
- Background layer implementation with -z-10 to stay behind content
- Performance optimization with 60fps target and adaptive quality controls
- Full accessibility compliance with reduced motion support
- Progressive enhancement with CSS gradient fallbacks

[2025-06-17 16:44:39] - Created focused TRADEYA_DYNAMIC_BACKGROUND_PHASE_1_PLAN.md removing all typography modernization and concentrating solely on background visual effects

## Decision: Conditional Husky Installation for Vercel Deployment Compatibility

**Rationale:** Vercel build environment excludes .git directory via .vercelignore, causing "fatal: not in a git directory" error when prepare script runs "husky install". This blocks deployment despite security work being complete. Need to maintain husky functionality for local development while allowing Vercel builds to succeed.

**Implementation Details:**

- Modified package.json prepare script to conditionally run husky install only when in git repository
- Used `git rev-parse --git-dir > /dev/null 2>&1 && husky install || echo 'Skipping husky install - not in git repo'`
- Preserves security:init script execution in all environments
- Maintains husky pre-commit hooks for local development
- Allows clean Vercel builds without git repository access
- No breaking changes to existing functionality

[2025-09-07 05:04:06] - Conditional husky installation implemented for Vercel deployment compatibility
