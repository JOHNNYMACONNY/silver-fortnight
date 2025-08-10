import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CommandPalette } from '../components/ui/CommandPalette';
import { 
  Search, 
  Command, 
  ArrowRight, 
  Hash, 
  User, 
  FileText, 
  Zap, 
  Users,
  Home,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

/**
 * Navigation System Demo Page
 * 
 * Demonstrates the advanced navigation features from Phase 4:
 * - Command palette integration
 * - Breadcrumb navigation
 * - Advanced navigation patterns
 * - Mobile navigation
 * - Keyboard shortcuts
 */
const NavigationSystemDemoPage: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Phase 4.1: Breadcrumb navigation
  const breadcrumbs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Navigation Demo', href: '/navigation-demo', icon: FileText },
    { label: activeSection.charAt(0).toUpperCase() + activeSection.slice(1), href: `#${activeSection}`, icon: Hash }
  ];

  // Phase 4.2: Navigation sections
  const sections = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'command-palette', label: 'Command Palette', icon: Command },
    { id: 'breadcrumbs', label: 'Breadcrumbs', icon: ArrowRight },
    { id: 'mobile-nav', label: 'Mobile Navigation', icon: Menu },
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: Zap }
  ];

  // Phase 4.3: Keyboard shortcuts
  const shortcuts = [
    { key: '⌘ + K', description: 'Open Command Palette' },
    { key: '⌘ + /', description: 'Toggle Navigation Help' },
    { key: '⌘ + B', description: 'Toggle Breadcrumbs' },
    { key: '⌘ + M', description: 'Toggle Mobile Menu' },
    { key: '⌘ + S', description: 'Quick Search' }
  ];

  // Phase 4.4: Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
          case '/':
            e.preventDefault();
            // Toggle help
            break;
          case 'b':
            e.preventDefault();
            // Toggle breadcrumbs
            break;
          case 'm':
            e.preventDefault();
            setIsMobileMenuOpen(!isMobileMenuOpen);
            break;
          case 's':
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header with breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              <motion.button
                className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection(crumb.id)}
              >
                <crumb.icon className="w-4 h-4" />
                <span>{crumb.label}</span>
              </motion.button>
            </React.Fragment>
          ))}
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Navigation System Phase 4 Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Advanced navigation system with command palette, breadcrumbs, and mobile navigation
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeSection === section.id 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <section.icon className="w-4 h-4" />
              <span>{section.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Navigation System Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="glass" className="p-6">
                  <div className="text-3xl mb-4">⌘K</div>
                  <h3 className="text-lg font-semibold mb-2">Command Palette</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Powerful command palette for quick navigation and actions
                  </p>
                  <Button 
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="w-full"
                  >
                    Try Command Palette
                  </Button>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="text-3xl mb-4">🧭</div>
                  <h3 className="text-lg font-semibold mb-2">Breadcrumb Navigation</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Contextual breadcrumbs for easy navigation hierarchy
                  </p>
                  <Button variant="outline" className="w-full">
                    View Breadcrumbs
                  </Button>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="text-3xl mb-4">📱</div>
                  <h3 className="text-lg font-semibold mb-2">Mobile Navigation</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Responsive mobile navigation with touch-friendly interactions
                  </p>
                  <Button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    variant="outline" 
                    className="w-full"
                  >
                    Open Mobile Menu
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'command-palette' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Command Palette Features</h2>
              
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Command Palette Demo</h3>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">⌘ + K</kbd> or click the button below to open the command palette.
                  </p>
                  <div className="flex space-x-4">
                    <Button 
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="flex items-center space-x-2"
                    >
                      <Command className="w-4 h-4" />
                      <span>Open Command Palette</span>
                    </Button>
                    <Button variant="outline">
                      View All Commands
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Available Commands</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Navigation</span>
                      <Badge variant="outline">5 commands</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actions</span>
                      <Badge variant="outline">3 commands</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Search</span>
                      <Badge variant="outline">2 commands</Badge>
                    </div>
                  </div>
                </Card>

                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Search Trades
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Find Collaborations
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Zap className="w-4 h-4 mr-2" />
                      View Challenges
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'breadcrumbs' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Breadcrumb Navigation</h2>
              
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Interactive Breadcrumbs</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={crumb.label}>
                        {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <motion.button
                          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <crumb.icon className="w-4 h-4" />
                          <span>{crumb.label}</span>
                        </motion.button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Breadcrumb Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Interactive navigation</li>
                    <li>• Context-aware highlighting</li>
                    <li>• Responsive design</li>
                    <li>• Keyboard accessible</li>
                  </ul>
                </Card>

                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Usage Examples</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      Home / Trades / Electronics / iPhone
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      Home / Collaborations / Web Development
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      Home / Profile / Settings / Security
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'mobile-nav' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Mobile Navigation</h2>
              
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Mobile Menu Demo</h3>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Menu className="w-4 h-4" />
                    <span>Open Mobile Menu</span>
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Mobile Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Touch-friendly interactions</li>
                    <li>• Swipe gestures</li>
                    <li>• Responsive design</li>
                    <li>• Offline support</li>
                  </ul>
                </Card>

                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Navigation Items</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <ArrowRight className="w-4 h-4" />
                      <span>Trades</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <Users className="w-4 h-4" />
                      <span>Collaborations</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'keyboard-shortcuts' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Keyboard Shortcuts</h2>
              
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Available Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">
                        {shortcut.key}
                      </kbd>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Accessibility</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Screen reader support</li>
                    <li>• Keyboard navigation</li>
                    <li>• Focus management</li>
                    <li>• ARIA labels</li>
                  </ul>
                </Card>

                <Card variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Customization</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Custom shortcuts</li>
                    <li>• User preferences</li>
                    <li>• Context-aware</li>
                    <li>• Platform detection</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-80 h-full bg-white dark:bg-gray-900 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Navigation</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <section.icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
};

export default NavigationSystemDemoPage; 