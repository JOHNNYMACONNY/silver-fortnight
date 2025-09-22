import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag, Briefcase, Users, Award, Trophy, MessageSquare, Bell, User, Settings, Shield, LogOut } from '../../utils/icons';
import { useAuth } from '../../AuthContext';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './Sheet';
import { Button } from './Button';
import { Avatar } from './Avatar';
import Logo from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { isThemeToggleEnabled } from '../../utils/featureFlags';
import { cn } from '../../utils/cn';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  showThemeToggle?: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, showThemeToggle }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const displayThemeToggle = showThemeToggle ?? isThemeToggleEnabled();
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mainNavItems = [
    { to: '/', label: 'Home', icon: <Home className="mr-2 h-5 w-5" /> },
    { to: '/trades', label: 'Trades', icon: <ShoppingBag className="mr-2 h-5 w-5" /> },
    { to: '/collaborations', label: 'Collaborations', icon: <Users className="mr-2 h-5 w-5" /> },
    { to: '/directory', label: 'Directory', icon: <Users className="mr-2 h-5 w-5" /> },
    { to: '/challenges', label: 'Challenges', icon: <Award className="mr-2 h-5 w-5" /> },
    { to: '/portfolio', label: 'Portfolio', icon: <Briefcase className="mr-2 h-5 w-5" /> },
    { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="mr-2 h-5 w-5" /> }
  ];

  const userNavItems = currentUser ? [
    { to: '/profile', label: 'Profile', icon: <User className="mr-2 h-5 w-5" /> },
    { to: '/dashboard', label: 'Dashboard', icon: <Settings className="mr-2 h-5 w-5" /> },
    { to: '/connections', label: 'Connections', icon: <Users className="mr-2 h-5 w-5" /> },
    { to: '/messages', label: 'Messages', icon: <MessageSquare className="mr-2 h-5 w-5" /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell className="mr-2 h-5 w-5" /> }
  ] : [];

  if (currentUser && isAdmin) {
    userNavItems.push({ to: '/admin', label: 'Admin', icon: <Shield className="mr-2 h-5 w-5" /> });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMainNavItems = useMemo(() => (
    normalizedQuery ? mainNavItems.filter(i => i.label.toLowerCase().includes(normalizedQuery)) : mainNavItems
  ), [normalizedQuery]);

  const filteredUserNavItems = useMemo(() => (
    normalizedQuery ? userNavItems.filter(i => i.label.toLowerCase().includes(normalizedQuery)) : userNavItems
  ), [normalizedQuery, userNavItems]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className={cn(
          "w-full max-w-xs p-0",
          // Phase 4.1: Enhanced glassmorphism for mobile menu
          "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-xl",
          "border-r border-navbar-glass-border dark:border-navbar-glass-border-dark",
          // Phase 4.1: Enhanced shadow
          "shadow-glass-lg"
        )}
        hideOverlay={false}
      >
        <SheetHeader className={cn(
          "sticky top-0 z-navigation p-4 navbar-gradient-border",
          // Glassmorphic sticky header
          "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md"
        )}>
          <SheetTitle className="flex items-center justify-between">
            <Logo size="medium" showText={true} />
            {displayThemeToggle && (
              <div className="ml-2">
                <ThemeToggle />
              </div>
            )}
          </SheetTitle>
          <div className="mt-3">
            {isSearchOpen ? (
              <div className="relative flex items-center gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search menu..."
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-sm",
                    "bg-navbar-glass/90 dark:bg-navbar-glass-dark/90",
                    "backdrop-blur-md",
                    "border border-navbar-glass-border dark:border-navbar-glass-border-dark",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setQuery('');
                  }}
                  className="whitespace-nowrap"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-muted-foreground",
                  "bg-navbar-glass/80 dark:bg-navbar-glass-dark/80",
                  "border border-navbar-glass-border dark:border-navbar-glass-border-dark"
                )}
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              >
                Search
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="p-4 overflow-y-auto mobile-safe-area">
          {/* Main Navigation Section */}
          <div className="space-y-1">
            <h3 className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            {filteredMainNavItems.map((item, index) => (
              <NavItem
                key={index}
                to={item.to}
                label={item.label}
                icon={item.icon}
                variant="mobile"
                onClick={onClose}
                className={cn(
                  // Phase 4.1: Enhanced mobile nav item styling
                  "transition-all duration-200 hover:scale-[1.02]",
                  "hover:bg-gray-50/80 dark:hover:bg-gray-800/80",
                  "active:scale-[0.98] rounded-lg"
                )}
              />
            ))}
          </div>

          {/* User Account Section */}
          {currentUser ? (
            <div className="mt-6 pt-4 border-t border-divider space-y-1">
              <button
                type="button"
                onClick={() => setIsAccountOpen((v) => !v)}
                className={cn(
                  "w-full px-2 py-2 rounded-lg flex items-center gap-3",
                  "hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors"
                )}
              >
                <Avatar
                  alt={currentUser.displayName ?? 'User'}
                  fallback={currentUser.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
                  className="h-7 w-7"
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">Account</div>
                  {currentUser.email && (
                    <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{isAccountOpen ? 'Hide' : 'Show'}</span>
              </button>

              {isAccountOpen && (
                <div className="space-y-1">
                  {filteredUserNavItems.map((item, index) => (
                    <NavItem
                      key={index}
                      to={item.to}
                      label={item.label}
                      icon={item.icon}
                      variant="mobile"
                      onClick={onClose}
                      className={cn(
                        "transition-all duration-200 hover:scale-[1.02]",
                        "hover:bg-gray-50/80 dark:hover:bg-gray-800/80",
                        "active:scale-[0.98] rounded-lg"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Authentication Section */
            <div className="mt-6 pt-4 border-t border-divider">
              <div className="flex flex-col space-y-2">
                <Button 
                  asChild 
                  onClick={onClose}
                  className={cn(
                    // Phase 4.1: Enhanced auth button styling
                    "transition-all duration-200 hover:scale-[1.02]",
                    "active:scale-[0.98]"
                  )}
                >
                  <Link to="/login">Log In</Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  onClick={onClose}
                  className={cn(
                    // Phase 4.1: Enhanced auth button styling
                    "transition-all duration-200 hover:scale-[1.02]",
                    "active:scale-[0.98]",
                    "border-gray-200/50 dark:border-gray-700/50",
                    "hover:bg-gray-50/80 dark:hover:bg-gray-800/80"
                  )}
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer logout row */}
        {currentUser && (
          <div className={cn(
            "sticky bottom-0 p-4 border-t",
            "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md",
            "border-navbar-glass-border dark:border-navbar-glass-border-dark",
            "mobile-safe-area"
          )}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                "transition-all duration-200 hover:scale-[1.02]",
                "hover:bg-red-50/80 dark:hover:bg-red-900/20",
                "hover:text-red-600 dark:hover:text-red-400",
                "active:scale-[0.98] rounded-lg"
              )}
              onClick={() => {
                logout();
                onClose();
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
