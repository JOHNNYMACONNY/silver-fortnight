import React from "react";
import { cn } from "../../utils/cn";
import { MobileMenu } from "../ui/MobileMenu";
import Logo from "../ui/Logo";
import { NavItem } from "../ui/NavItem";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { useAuth } from "../../AuthContext";
import { UserMenu } from "../ui/UserMenu";
import { Button } from "../ui/Button";
import { Menu, Search } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";
import { CommandPalette } from "../ui/CommandPalette";
import { isThemeToggleEnabled } from "../../utils/featureFlags";
import { ResponsiveDebug } from "../debug/ResponsiveDebug";

const mainNavItems = [
  { to: "/trades", label: "Trades" },
  { to: "/collaborations", label: "Collaborations" },
  { to: "/directory", label: "Directory" },
  { to: "/challenges", label: "Challenges" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/leaderboard", label: "Leaderboard" },
];

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { ChevronDown } from "lucide-react";

// Define which items to hide on smaller screens
// Define which items to hide on smaller screens
const getNavItemsLayout = (viewportWidth: number) => {
  if (viewportWidth >= 1440) {
    return { visible: mainNavItems, more: [] }; // Show all items on extra large screens (1440px+)
  } else if (viewportWidth >= 1024) {
    return { visible: mainNavItems.slice(0, 4), more: mainNavItems.slice(4) }; // Show 4 items + More on large screens (1024-1439px)
  } else {
    return { visible: [], more: [] }; // Handled by mobile menu on smaller screens
  }
};

type NavbarProps = { showThemeToggle?: boolean };
const Navbar: React.FC<NavbarProps> = ({ showThemeToggle }) => {
  const displayThemeToggle = showThemeToggle ?? isThemeToggleEnabled();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Track viewport width for responsive navigation
  const [viewportWidth, setViewportWidth] = React.useState(1200);

  React.useEffect(() => {
    // Set initial viewport width
    setViewportWidth(window.innerWidth);

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { visible: visibleNavItems, more: moreNavItems } = getNavItemsLayout(viewportWidth);

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
        data-testid="navbar"
        className={cn(
          // Ensure navbar sits above stray z-50 content but below overlays
          "sticky top-0 z-[55]",

          // Mobile-optimized transitions
          shouldUseReducedAnimations()
            ? "transition-none"
            : "transition-all duration-300",

          // Enhanced glassmorphism based on scroll state
          isScrolled
            ? "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-xl backdrop-saturate-150 bg-clip-padding navbar-gradient-border"
            : "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md backdrop-saturate-150 bg-clip-padding border-b border-transparent",

          // Mobile-specific optimizations
          isMobile && "touch-manipulation"
        )}
      >
        <div
          className={cn(
            "max-w-7xl mx-auto",
            // Responsive padding with mobile optimization
            isMobile ? "px-3" : "px-4 sm:px-6 lg:px-8"
          )}
        >
          <div
            className={cn(
              "flex justify-between items-center gap-4 sm:gap-6",
              // Responsive height with safe area support
              isMobile ? "h-14" : "h-16"
            )}
            style={{
              paddingTop: isMobile ? 'max(0.5rem, var(--safe-area-inset-top, 0px))' : undefined
            }}
          >
            {/* Left side: Logo and main navigation */}
            <div className="flex items-center min-w-0 flex-1 gap-4 md:gap-8">
              <Logo data-testid="navbar-logo" size="medium" showText={true} />

              {/* Desktop navigation */}
              <div
                data-testid="nav-links"
                className="hidden lg:ml-8 lg:flex lg:space-x-4 xl:space-x-6 min-w-0 overflow-hidden flex-1"
              >
                {visibleNavItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    isActive={activePath.startsWith(item.to)}
                  />
                ))}

                {/* More Menu Dropdown */}
                {moreNavItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className={cn(
                        "group inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent transition-colors duration-200",
                        "text-muted-foreground hover:text-foreground hover:border-border"
                      )}>
                        <span>More</span>
                        <ChevronDown className="ml-1 h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md navbar-gradient-border shadow-glass-lg">
                      {moreNavItems.map((item) => (
                        <DropdownMenuItem key={item.to} asChild>
                          <a
                            href={item.to}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(item.to);
                            }}
                            className={cn(
                              "w-full cursor-pointer",
                              activePath.startsWith(item.to) && "bg-accent text-accent-foreground"
                            )}
                          >
                            {item.label}
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Right side: Actions and user menu */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0 ml-6">
              {/* Command Palette trigger button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCommandPalette}
                className={cn(
                  "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground",
                  "transition-colors duration-200"
                )}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              <div className="border-l border-border h-6" />

              {displayThemeToggle && <ThemeToggle />}
              <NotificationBell />

              <div className="border-l border-border h-6" />

              {currentUser ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => navigate("/login")}>
                    Log In
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className={cn(
                      "bg-white/10 dark:bg-white/10 backdrop-blur-md",
                      "border border-white/20 dark:border-white/20",
                      "text-white dark:text-white",
                      "hover:bg-white/20 dark:hover:bg-white/15",
                      "hover:border-orange-500/30 dark:hover:border-orange-400/30",
                      "hover:shadow-lg hover:shadow-orange-500/20",
                      "transition-all duration-300",
                      "font-medium"
                    )}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-1">
              {/* Mobile command palette button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCommandPalette}
                className={cn(
                  "text-muted-foreground dark:text-muted-foreground",
                  getTouchTargetClass("large"),
                  "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                  "active:scale-95 transition-transform duration-100"
                )}
                onTouchStart={(e) => handleTouchFeedback(e.currentTarget)}
                aria-label="Open command palette"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Open command palette</span>
              </Button>

              <Button
                data-testid="mobile-menu-button"
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className={cn(
                  "text-muted-foreground dark:text-muted-foreground",
                  getTouchTargetClass("large"),
                  "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                  "active:scale-95 transition-transform duration-100"
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

      {/* Debug component - only in development */}
      <ResponsiveDebug />
    </>
  );
};

export default Navbar;
