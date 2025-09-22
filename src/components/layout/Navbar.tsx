import React from 'react';
import { cn } from '../../utils/cn';
import { MobileMenu } from '../ui/MobileMenu';
import Logo from '../ui/Logo';
import { NavItem } from '../ui/NavItem';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { useAuth } from '../../AuthContext';
import { UserMenu } from '../ui/UserMenu';
import { Button } from '../ui/Button';
import { Menu, Command } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { CommandPalette } from '../ui/CommandPalette';
import { isThemeToggleEnabled } from '../../utils/featureFlags';

const mainNavItems = [
  { to: '/trades', label: 'Trades' },
  { to: '/collaborations', label: 'Collaborations' },
  { to: '/directory', label: 'Directory' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/portfolio', label: 'Portfolio' },
];

type NavbarProps = { showThemeToggle?: boolean };
const Navbar: React.FC<NavbarProps> = ({ showThemeToggle }) => {
  const displayThemeToggle = showThemeToggle ?? isThemeToggleEnabled();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Phase 4.1: Use centralized navigation state
  const {
    isScrolled,
    isMobileMenuOpen,
    activePath,
    isCommandPaletteOpen,
    toggleMobileMenu,
    closeMobileMenu,
    toggleCommandPalette,
    closeCommandPalette,
  } = useNavigation();

  // Mobile optimization
  const {
    isMobile,
    isTablet,
    getTouchTargetClass,
    shouldUseReducedAnimations,
    handleTouchFeedback,
  } = useMobileOptimization();

  return (
    <>
      <nav
        className={cn(
          // Ensure navbar sits above stray z-50 content but below overlays
          'sticky top-0 z-[55]',

          // Mobile-optimized transitions
          shouldUseReducedAnimations() ? 'transition-none' : 'transition-all duration-300',

          // Enhanced glassmorphism based on scroll state
          isScrolled ? (
            'bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-xl backdrop-saturate-150 bg-clip-padding navbar-gradient-border'
          ) : (
            'bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md backdrop-saturate-150 bg-clip-padding border-b border-transparent'
          ),

          // Mobile-specific optimizations
          isMobile && 'touch-manipulation'
        )}
      >
        <div className={cn(
          'max-w-7xl mx-auto',
          // Responsive padding with mobile optimization
          isMobile ? 'px-3' : 'px-4 sm:px-6 lg:px-8'
        )}>
          <div className={cn(
            'flex justify-between items-center',
            // Responsive height
            isMobile ? 'h-14' : 'h-16'
          )}>
            
            {/* Left side: Logo and main navigation */}
            <div className="flex items-center">
              <Logo size="medium" showText={true} />
              
              {/* Desktop navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {mainNavItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    isActive={activePath.startsWith(item.to)}
                  />
                ))}
              </div>
            </div>

            {/* Right side: Actions and user menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Command Palette trigger button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCommandPalette}
                className={cn(
                  "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground",
                  "transition-colors duration-200"
                )}
              >
                <Command className="h-4 w-4 mr-2" />
                <span className="text-sm">Search</span>
                <kbd className="hidden lg:inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-xs font-mono bg-muted dark:bg-muted rounded border border-border">
                  ⌘K
                </kbd>
              </Button>
<div className="border-l border-border h-6" />

{displayThemeToggle && <ThemeToggle />}
<NotificationBell />

              
              <div className="border-l border-border h-6" />
              
              {currentUser ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                  <Button onClick={() => navigate('/signup')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-1">
              {/* Mobile command palette button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCommandPalette}
                className={cn(
                  'text-muted-foreground dark:text-muted-foreground',
                  getTouchTargetClass('large'),
                  'hover:bg-gray-100/80 dark:hover:bg-gray-800/80',
                  'active:scale-95 transition-transform duration-100'
                )}
                onTouchStart={(e) => handleTouchFeedback(e.currentTarget)}
                aria-label="Open command palette"
              >
                <Command className="h-5 w-5" />
                <span className="sr-only">Open command palette</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className={cn(
                  'text-muted-foreground dark:text-muted-foreground',
                  getTouchTargetClass('large'),
                  'hover:bg-gray-100/80 dark:hover:bg-gray-800/80',
                  'active:scale-95 transition-transform duration-100'
                )}
                onTouchStart={(e) => handleTouchFeedback(e.currentTarget)}
                aria-label="Open main menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open main menu</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu with enhanced animations */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        showThemeToggle={displayThemeToggle}
      />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={closeCommandPalette} 
      />
    </>
  );
};

export default Navbar;
