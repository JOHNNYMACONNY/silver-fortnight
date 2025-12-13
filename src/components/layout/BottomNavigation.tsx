import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Users,
  MessageSquare,
  Bell,
  User,
} from '../../utils/icons';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { useAuth } from '../../AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  showWhen?: 'always' | 'authenticated' | 'unauthenticated';
}

/**
 * BottomNavigation Component
 * 
 * Implements best practices for mobile bottom navigation:
 * - 3-5 essential tabs (max 6)
 * - Thumb-friendly tap areas (44x44px minimum)
 * - Icon size ~24px, labels 10-12px
 * - Active/inactive state differentiation
 * - Simple, familiar icons
 * - Short labels
 * - Clean, minimalist design
 * - Consistent icon style (outline, filled when active)
 * - Neutral colors
 * - Notification badges
 * - Safe area support
 * - Micro-interactions
 * - Good contrast for accessibility
 */
export const BottomNavigation: React.FC = () => {
  // All hooks must be called before any conditional returns (Rules of Hooks)
  const location = useLocation();
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    isMobile,
    shouldUseReducedAnimations,
  } = useMobileOptimization();
  const navRef = useRef<HTMLElement>(null);
  const activeIndicatorRef = useRef<HTMLDivElement>(null);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:44', message: 'Component render start', data: { pathname: location.pathname, hasUser: !!currentUser, unreadCount, isMobile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C' }) }).catch(() => { });
  // #endregion

  // Define navigation items - prioritize most essential (3-5 items)
  // Must be called before early return to follow Rules of Hooks
  const navItems: BottomNavItem[] = useMemo(() => {
    const items: BottomNavItem[] = [
      {
        to: '/',
        label: 'Home',
        icon: Home,
        showWhen: 'always',
      },
      {
        to: '/trades',
        label: 'Trades',
        icon: ShoppingBag,
        showWhen: 'always',
      },
      {
        to: '/collaborations',
        label: 'Collab',
        icon: Users,
        showWhen: 'always',
      },
      {
        to: '/messages',
        label: 'Messages',
        icon: MessageSquare,
        badge: null, // Could add unread message count here
        showWhen: 'authenticated',
      },
      // Alerts moved to top bar on mobile
      {
        to: currentUser ? '/profile' : '/login',
        label: 'Profile',
        icon: User,
        showWhen: 'always',
      },
    ];

    // Filter items based on authentication state
    const filtered = items.filter((item) => {
      if (item.showWhen === 'always') return true;
      if (item.showWhen === 'authenticated') return !!currentUser;
      if (item.showWhen === 'unauthenticated') return !currentUser;
      return true;
    }).slice(0, 5); // Limit to 5 items max

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:105', message: 'navItems computed', data: { totalItems: items.length, filteredCount: filtered.length, items: filtered.map(i => ({ to: i.to, label: i.label, showWhen: i.showWhen })), hasUser: !!currentUser, unreadCount }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,D' }) }).catch(() => { });
    // #endregion

    return filtered;
  }, [currentUser, unreadCount]);

  // Check if a route is active - memoized with useCallback to prevent recreation on every render
  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    const matches = location.pathname.startsWith(path);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:118', message: 'isActive check', data: { path, pathname: location.pathname, matches, isNestedRoute: location.pathname.includes('/new') || location.pathname.includes('/:') }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'G' }) }).catch(() => { });
    // #endregion

    return matches;
  }, [location.pathname]);

  // Find active item index - must be called before early return
  const activeIndex = useMemo(() => {
    const index = navItems.findIndex((item) => {
      if (item.to === '/') {
        return location.pathname === '/';
      }
      // Handle Profile/Login special case
      if (item.label === 'Profile') {
        return location.pathname === '/profile' || location.pathname === '/login';
      }
      return location.pathname.startsWith(item.to);
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:123', message: 'activeIndex calculated', data: { activeIndex: index, pathname: location.pathname, navItemsCount: navItems.length, matchedItems: navItems.map((item, i) => ({ index: i, to: item.to, label: item.label, matches: item.to === '/' ? location.pathname === '/' : item.label === 'Profile' ? (location.pathname === '/profile' || location.pathname === '/login') : location.pathname.startsWith(item.to) })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B,C' }) }).catch(() => { });
    // #endregion

    return index;
  }, [navItems, location.pathname]);

  // Animate active indicator position - must be called before early return
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:126', message: 'useEffect triggered', data: { activeIndex, hasIndicatorRef: !!activeIndicatorRef.current, hasNavRef: !!navRef.current, reducedAnimations: shouldUseReducedAnimations(), navItemsLength: navItems.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'E,F' }) }).catch(() => { });
    // #endregion

    if (!activeIndicatorRef.current || !navRef.current || activeIndex === -1) return;
    if (shouldUseReducedAnimations()) return;

    let rafId: number | null = null;
    let isMounted = true;

    // Use requestAnimationFrame to ensure DOM is ready
    const updateIndicator = () => {
      if (!isMounted || !activeIndicatorRef.current || !navRef.current) return;

      const domNavLinks = navRef.current.querySelectorAll('a');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:135', message: 'updateIndicator executing', data: { domNavLinksCount: domNavLinks.length, activeIndex, isValidIndex: activeIndex < domNavLinks.length, navItemsLength: navItems.length, isMounted }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'E,F' }) }).catch(() => { });
      // #endregion

      if (domNavLinks.length === 0 || activeIndex >= domNavLinks.length || activeIndex < 0) return;

      const activeItem = domNavLinks[activeIndex] as HTMLElement;
      if (!activeItem) return;

      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Guard against invalid dimensions
      if (itemRect.width === 0 || navRect.width === 0) return;

      const left = itemRect.left - navRect.left;
      const width = itemRect.width;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:150', message: 'indicator positioned', data: { left, width, itemWidth: itemRect.width, navWidth: navRect.width }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'E,F' }) }).catch(() => { });
      // #endregion

      if (isMounted && activeIndicatorRef.current) {
        activeIndicatorRef.current.style.transform = `translateX(${left}px)`;
        activeIndicatorRef.current.style.width = `${width}px`;
      }
    };

    // Use requestAnimationFrame to ensure layout is complete
    rafId = requestAnimationFrame(updateIndicator);

    // Cleanup function
    return () => {
      isMounted = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeIndex, shouldUseReducedAnimations, navItems.length]);

  // Only show on mobile devices (after all hooks are called)
  if (!isMobile) {
    return null;
  }

  // Guard against empty navItems (should never happen, but safety check)
  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav
      ref={navRef}
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 left-0 right-0 z-[55]',
        // Enhanced glassmorphism matching navbar style exactly
        'bg-navbar-glass dark:bg-navbar-glass-dark',
        'backdrop-blur-xl backdrop-saturate-150 bg-clip-padding',
        // Border matching navbar gradient border style (top border with gradient)
        'navbar-gradient-border-top',
        // Smooth transitions matching navbar
        shouldUseReducedAnimations()
          ? 'transition-none'
          : 'transition-all duration-300',
        // Mobile-specific optimizations
        'touch-manipulation',
      )}
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Bottom navigation"
    >
      <div
        className={cn(
          'relative flex items-center justify-around',
          // Padding with safe area support
          'px-2 py-2',
          // Minimum height for touch targets
          'min-h-[64px]',
        )}
      >
        {/* Active indicator - sliding underline matching navbar style */}
        {!shouldUseReducedAnimations() && activeIndex >= 0 && (
          <div
            ref={activeIndicatorRef}
            className={cn(
              'absolute top-0 left-0 h-0.5',
              'bg-primary dark:bg-primary-400',
              'transition-all duration-300 ease-out',
            )}
            style={{
              transform: `translateX(0px)`,
              width: '0px',
            }}
            aria-hidden="true"
          />
        )}
        {navItems.map((item, index) => {
          // Handle Profile/Login special case: Profile item should be active on both /profile and /login
          let active = isActive(item.to);
          if (item.label === 'Profile') {
            // Profile item is active if we're on /profile OR /login
            active = location.pathname === '/profile' || location.pathname === '/login';
          }

          const Icon = item.icon;

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'BottomNavigation.tsx:213', message: 'rendering nav item', data: { to: item.to, label: item.label, isActive: active, pathname: location.pathname, badge: item.badge, badgeValue: item.badge, unreadCount }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'H' }) }).catch(() => { });
          // #endregion

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                // Flex container for icon and label
                'flex flex-col items-center justify-center',
                // Thumb-friendly tap area (minimum 44x44px)
                'min-w-[44px] min-h-[44px]',
                // Padding for larger touch target
                'px-3 py-2',
                // Rounded corners for better touch feedback
                'rounded-lg',
                // Smooth transitions
                shouldUseReducedAnimations()
                  ? 'transition-none'
                  : 'transition-all duration-200 ease-out',
                // Active state styling - matching navbar
                active
                  ? 'text-primary dark:text-primary-400'
                  : 'text-muted-foreground',
                // Hover states - matching navbar
                !active && 'hover:text-foreground',
                // Hover/active feedback
                'active:scale-95',
                !shouldUseReducedAnimations() && !active && 'hover:bg-muted/50',
                // Focus styles for accessibility
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900',
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon container with badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    // Icon size ~24px
                    'h-6 w-6',
                    // Smooth icon transitions
                    shouldUseReducedAnimations()
                      ? 'transition-none'
                      : 'transition-all duration-200',
                    // Active state: thicker stroke for emphasis
                    active && 'stroke-[2.5]',
                    // Active state: filled icon using CSS
                    active && '[&>path]:fill-current',
                  )}
                />
                {/* Notification badge */}
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1',
                      'flex items-center justify-center',
                      'min-w-[18px] h-[18px]',
                      'px-1',
                      'rounded-full',
                      'bg-primary-500 dark:bg-primary-400',
                      'text-white text-[10px] font-bold',
                      // Badge outline for better visibility
                      'ring-2 ring-white dark:ring-neutral-900',
                      // Smooth badge animation
                      shouldUseReducedAnimations()
                        ? 'transition-none'
                        : 'transition-all duration-200',
                    )}
                    aria-label={`${item.badge} unread ${item.label === 'Alerts' ? 'notifications' : 'messages'}`}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  // Label size 10-12px (text-xs = 12px)
                  'text-[10px] leading-tight mt-0.5',
                  // Font weight changes for active state
                  active
                    ? 'font-semibold'
                    : 'font-normal',
                  // Smooth text transitions
                  shouldUseReducedAnimations()
                    ? 'transition-none'
                    : 'transition-all duration-200',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

