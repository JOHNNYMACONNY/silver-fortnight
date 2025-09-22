/**
 * Mobile Navigation Component
 * 
 * Advanced mobile navigation with gesture support, haptic feedback,
 * and optimized touch interactions for TradeYa.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  TrophyIcon, 
  UserIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAdvancedTouchInteractions, type TouchGesture } from '../../hooks/useAdvancedTouchInteractions';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  isActive?: boolean;
}

interface MobileNavigationProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: HomeIcon,
    path: '/dashboard',
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: UserGroupIcon,
    path: '/trades',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    path: '/messages',
    badge: 3,
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: TrophyIcon,
    path: '/challenges',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon,
    path: '/profile',
  },
];

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  className = '',
  onNavigate 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTouchDevice, touchTarget } = useMobileOptimization();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Update active item based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeNavItem = navigationItems.find(item => 
      currentPath.startsWith(item.path)
    );
    setActiveItem(activeNavItem?.id || '');
  }, [location.pathname]);

  // Touch interaction handlers
  const handleTouchGesture = useCallback((gesture: TouchGesture, event: any) => {
    switch (gesture) {
      case 'swipe-left':
        setSwipeDirection('left');
        setTimeout(() => setSwipeDirection(null), 300);
        break;
      case 'swipe-right':
        setSwipeDirection('right');
        setTimeout(() => setSwipeDirection(null), 300);
        break;
      case 'long-press':
        // Long press on navigation item could show context menu
        break;
    }
  }, []);

  const touchInteractions = useAdvancedTouchInteractions(
    {
      hapticEnabled: true,
      hapticIntensity: 'light',
      swipeThreshold: 30,
      longPressDelay: 800,
    },
    {
      onSwipe: (event) => handleTouchGesture(event.type as TouchGesture, event),
      onLongPress: (event) => handleTouchGesture('long-press', event),
    }
  );

  const handleNavigation = useCallback((item: NavigationItem) => {
    setActiveItem(item.id);
    navigate(item.path);
    onNavigate?.(item.path);
    setIsMenuOpen(false);
    
    // Haptic feedback
    touchInteractions.triggerHaptic('light');
  }, [navigate, onNavigate, touchInteractions]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    touchInteractions.triggerHaptic('medium');
  }, [touchInteractions]);

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <motion.nav
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 dark:bg-gray-900/90 dark:border-gray-700 ${className}`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <motion.button
                key={item.id}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-lg
                  transition-all duration-200 touch-manipulation
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
                style={{
                  minHeight: `${touchTarget.minSize}px`,
                  minWidth: `${touchTarget.minSize}px`,
                }}
                onClick={() => handleNavigation(item)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                {...touchInteractions.handlers}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative z-10">
                  <Icon className="h-6 w-6" />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.div>
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs mt-1 font-medium
                  ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
                `}>
                  {item.label}
                </span>
                
                {/* Swipe indicator */}
                {swipeDirection && (
                  <motion.div
                    className={`
                      absolute inset-0 rounded-lg border-2
                      ${swipeDirection === 'left' ? 'border-green-500' : 'border-blue-500'}
                    `}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Mobile Top Bar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/90 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <motion.button
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleMenu}
            whileTap={{ scale: 0.95 }}
            style={{
              minHeight: `${touchTarget.minSize}px`,
              minWidth: `${touchTarget.minSize}px`,
            }}
          >
            <Bars3Icon className="h-6 w-6" />
          </motion.button>

          {/* Logo/Title */}
          <motion.h1 
            className="text-lg font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            TradeYa
          </motion.h1>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              whileTap={{ scale: 0.95 }}
              style={{
                minHeight: `${touchTarget.minSize}px`,
                minWidth: `${touchTarget.minSize}px`,
              }}
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </motion.button>
            
            <motion.button
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              whileTap={{ scale: 0.95 }}
              style={{
                minHeight: `${touchTarget.minSize}px`,
                minWidth: `${touchTarget.minSize}px`,
              }}
            >
              <BellIcon className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 shadow-xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Menu
                </h2>
                <motion.button
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={{ scale: 0.95 }}
                >
                  <XMarkIcon className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      className={`
                        w-full flex items-center space-x-3 p-3 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      onClick={() => handleNavigation(item)}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
                
                {/* Additional Menu Items */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                    <span className="font-medium">Settings</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navigation */}
      <div className="h-16" /> {/* Top bar spacer */}
      <div className="h-20" /> {/* Bottom nav spacer */}
    </>
  );
};

export default MobileNavigation;

