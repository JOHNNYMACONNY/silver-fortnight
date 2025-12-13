/**
 * PageLayout Component System
 * 
 * Standardized page layout components following UX Principle 3: Structure.
 * Provides consistent page structure with clear sections for header, content, and sidebar.
 * 
 * Components:
 * - PageLayout: Main container
 * - PageHeader: Page title, description, and actions
 * - PageContent: Main content area
 * - PageSidebar: Optional sidebar for secondary content
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface PageLayoutProps {
  /**
   * Page content
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Maximum width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  
  /**
   * Whether to use container padding
   */
  containerized?: boolean;
}

/**
 * PageLayout - Main page container
 * 
 * Provides consistent page structure with proper spacing and max-width constraints.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  maxWidth = 'xl',
  containerized = true,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full',
        containerized && 'mx-auto px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface PageHeaderProps {
  /**
   * Header content
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Spacing variant
   */
  spacing?: 'sm' | 'md' | 'lg';
}

/**
 * PageHeader - Page header section
 * 
 * Contains page title, description, and primary actions.
 * Should be placed above the fold for maximum visibility.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  children,
  className,
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: 'mb-4',
    md: 'mb-6',
    lg: 'mb-8',
  };

  return (
    <header
      className={cn(
        'flex flex-col gap-4',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </header>
  );
};

export interface PageTitleProps {
  /**
   * Title text
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Title size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PageTitle - Page title component
 * 
 * Large, prominent title for the page. Uses Typography component for consistency.
 */
export const PageTitle: React.FC<PageTitleProps> = ({
  children,
  className,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'text-2xl font-semibold',
    md: 'text-3xl font-semibold',
    lg: 'text-4xl font-bold',
  };

  return (
    <h1
      className={cn(
        'text-neutral-900 dark:text-neutral-100',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </h1>
  );
};

export interface PageDescriptionProps {
  /**
   * Description text
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
}

/**
 * PageDescription - Page description component
 * 
 * Secondary text that provides context about the page.
 */
export const PageDescription: React.FC<PageDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p
      className={cn(
        'text-base text-neutral-600 dark:text-neutral-400',
        'max-w-2xl',
        className
      )}
    >
      {children}
    </p>
  );
};

export interface PageActionsProps {
  /**
   * Action buttons/content
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Alignment
   */
  align?: 'left' | 'right' | 'center';
}

/**
 * PageActions - Page action buttons container
 * 
 * Container for primary action buttons (CTAs).
 */
export const PageActions: React.FC<PageActionsProps> = ({
  children,
  className,
  align = 'right',
}) => {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 flex-wrap',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface PageContentProps {
  /**
   * Content
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Spacing variant
   */
  spacing?: 'sm' | 'md' | 'lg' | 'none';
}

/**
 * PageContent - Main content area
 * 
 * Container for the main page content. Supports consistent spacing.
 */
export const PageContent: React.FC<PageContentProps> = ({
  children,
  className,
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
    none: '',
  };

  return (
    <main
      className={cn(
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </main>
  );
};

export interface PageSidebarProps {
  /**
   * Sidebar content
   */
  children: React.ReactNode;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Sidebar position
   */
  position?: 'left' | 'right';
  
  /**
   * Sidebar width
   */
  width?: 'sm' | 'md' | 'lg';
}

/**
 * PageSidebar - Optional sidebar component
 * 
 * Sidebar for secondary content, filters, or navigation.
 * Use with PageContent in a flex container.
 */
export const PageSidebar: React.FC<PageSidebarProps> = ({
  children,
  className,
  position = 'right',
  width = 'md',
}) => {
  const widthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
  };

  return (
    <aside
      className={cn(
        widthClasses[width],
        'shrink-0',
        className
      )}
    >
      {children}
    </aside>
  );
};

/**
 * PageLayoutWithSidebar - Layout with sidebar
 * 
 * Convenience component that combines PageContent and PageSidebar
 * in a responsive flex layout.
 */
export interface PageLayoutWithSidebarProps extends PageLayoutProps {
  /**
   * Main content
   */
  content: React.ReactNode;
  
  /**
   * Sidebar content
   */
  sidebar: React.ReactNode;
  
  /**
   * Sidebar position
   */
  sidebarPosition?: 'left' | 'right';
  
  /**
   * Sidebar width
   */
  sidebarWidth?: 'sm' | 'md' | 'lg';
  
  /**
   * Gap between content and sidebar
   */
  gap?: 'sm' | 'md' | 'lg';
}

export const PageLayoutWithSidebar: React.FC<PageLayoutWithSidebarProps> = ({
  content,
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 'md',
  gap = 'lg',
  className,
  ...layoutProps
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <PageLayout className={className} {...layoutProps}>
      <div
        className={cn(
          'flex flex-col lg:flex-row',
          gapClasses[gap],
          sidebarPosition === 'left' && 'lg:flex-row-reverse'
        )}
      >
        <PageContent className="flex-1 min-w-0">
          {content}
        </PageContent>
        <PageSidebar position={sidebarPosition} width={sidebarWidth}>
          {sidebar}
        </PageSidebar>
      </div>
    </PageLayout>
  );
};

