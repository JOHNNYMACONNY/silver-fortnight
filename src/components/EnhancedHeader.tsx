import { Link } from 'react-router-dom';
import { 
  Briefcase, LogOut, Trophy, Menu, X, Shield, Users, Plus, 
  ToggleLeft, ToggleRight, User, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useState, useEffect, useRef } from 'react';

export function EnhancedHeader() {
  const { user, logout } = useAuth();
  const { isAdmin, adminModeEnabled, toggleAdminMode } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`enhanced-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-backdrop"></div>
      <div className="header-gradient"></div>
      <div className="absolute inset-0 bg-mesh opacity-5"></div>
      <div className="absolute inset-0 border-b border-earth-700/30"></div>
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-4 py-3 sm:py-4 w-full">
        <div className="flex justify-between items-center relative gap-2 w-full">
          <Link to="/" className="header-logo group">
            <Briefcase className="h-8 w-8 text-accent-clay animate-float" />
            <h1 className="logo-text">
              TradeYa
            </h1>
          </Link>

          {/* Mobile menu button */}
          <button
            className="header-mobile-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-accent-clay" />
            ) : (
              <Menu className="h-6 w-6 text-accent-clay" />
            )}
          </button>

          {/* Desktop Navigation */}
          {/* Desktop Navigation */}
          <nav className="header-nav">
            <div className="nav-main-items">
              <Link to="/discover" className="nav-link">Discover</Link>
              <Link to="/projects" className="nav-link">Projects</Link>
              <Link to="/directory" className="nav-link">Directory</Link>
              <Link to="/messages" className="nav-link">Messages</Link>
              <Link to="/connections" className="nav-link">
                <Users className="h-4 w-4" />
                Network
              </Link>
              {user && (
                <Link to="/challenges" className="nav-link">
                  <Trophy className="h-4 w-4" />
                  Challenges
                </Link>
              )}
            </div>

            {user ? (
              <div className="user-menu">
                {/* Post Trade Button */}
                <Link to="/trades/new" className="header-trade-button">
                  <Plus className="h-5 w-5" />
                  Post a Trade
                </Link>
                
                {/* User Menu Button */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="user-menu-button"
                  >
                    <User className="h-5 w-5" />
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`user-menu-dropdown ${userMenuOpen ? 'open' : ''}`}>
                    <Link to="/profile" className="user-menu-item">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="user-menu-admin-toggle">
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdminMode();
                              setUserMenuOpen(false);
                            }}
                            className={adminModeEnabled ? 'text-neon-blue' : ''}
                          >
                            {adminModeEnabled ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                    <div className="user-menu-divider" />
                    <button 
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }} 
                      className="user-menu-item"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="nav-main-items ml-auto">
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </div>
            )}
          </nav>

          {/* Mobile FAB */}
          {user && (
            <Link to="/trades/new" className="header-mobile-fab">
              <Plus className="h-6 w-6 text-white" />
            </Link>
          )}

        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="mobile-menu-content">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                <Briefcase className="h-8 w-8 text-neon-blue" />
                <h1 className="text-2xl font-display font-bold gradient-text">TradeYa</h1>
              </Link>
              <button
                className="p-2 rounded-lg hover:bg-accent-clay/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-accent-clay" />
              </button>
            </div>
            
            <nav className="mobile-menu-nav">
              <div className="flex flex-col space-y-4">
                <Link to="/discover" className="nav-link" onClick={closeMobileMenu}>
                  Discover
                </Link>
                <Link to="/projects" className="nav-link" onClick={closeMobileMenu}>
                  Projects
                </Link>
                <Link to="/directory" className="nav-link" onClick={closeMobileMenu}>
                  Directory
                </Link>
                <Link to="/messages" className="nav-link" onClick={closeMobileMenu}>
                  Messages
                </Link>
                <Link to="/connections" className="nav-link flex items-center gap-1" onClick={closeMobileMenu}>
                  <Users className="h-4 w-4" />
                  Network
                </Link>
                {user && (
                  <Link to="/challenges" className="nav-link flex items-center gap-1" onClick={closeMobileMenu}>
                    <Trophy className="h-4 w-4" />
                    Challenges
                  </Link>
                )}
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAdminMode();
                    }} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      adminModeEnabled 
                        ? 'bg-neon-blue/20 text-neon-blue' 
                        : 'bg-earth-700/50 text-gray-400'
                    }`}
                  >
                    {adminModeEnabled ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                    Admin Mode
                  </button>
                )}
              </div>
            </nav>

            <div className="mobile-menu-footer">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <Link to="/profile" className="nav-link" onClick={closeMobileMenu}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="nav-link flex items-center">
                    <LogOut className="h-5 w-5 mr-1" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                    Login
                  </Link>
                  <Link to="/register" className="nav-link" onClick={closeMobileMenu}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
