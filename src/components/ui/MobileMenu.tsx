import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag, Briefcase, Users, Award, Trophy, MessageSquare, Bell, User, Settings, Shield, LogOut } from '../../utils/icons';
import { useAuth } from '../../AuthContext';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './Sheet';
import { Button } from './Button';
import Logo from './Logo';
import { cn } from '../../utils/cn';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout, isAdmin } = useAuth();

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className={cn(
          "w-full max-w-xs p-0",
          // Phase 4.1: Enhanced glassmorphism for mobile menu
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
          "border-r border-gray-200/50 dark:border-gray-700/50",
          // Phase 4.1: Enhanced shadow
          "shadow-glass-lg"
        )}
      >
        <SheetHeader className={cn(
          "p-4 border-b border-gray-200/50 dark:border-gray-700/50",
          // Phase 4.1: Subtle glassmorphism for header
          "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        )}>
          <SheetTitle className="flex items-center">
            <Logo size="medium" showText={true} />
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4 overflow-y-auto">
          {/* Main Navigation Section */}
          <div className="space-y-1">
            <h3 className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            {mainNavItems.map((item, index) => (
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
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-1">
              <h3 className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account
              </h3>
              {userNavItems.map((item, index) => (
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
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mt-2",
                  // Phase 4.1: Enhanced logout button styling
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
          ) : (
            /* Authentication Section */
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
