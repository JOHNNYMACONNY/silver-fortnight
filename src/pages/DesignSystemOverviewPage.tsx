import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  CheckCircle, 
  Clock, 
  Zap, 
  Palette, 
  Layout, 
  Navigation, 
  MousePointer, 
  FileText,
  ArrowRight,
  Star,
  TrendingUp,
  Code
} from 'lucide-react';

/**
 * Design System Overview Page
 * 
 * Comprehensive overview of all design system phases (1-6):
 * - Phase 1: Dynamic Background (✅ Complete)
 * - Phase 2: 3D Card Components (✅ Complete)
 * - Phase 3: Advanced Layout Systems (🚧 In Progress)
 * - Phase 4: Advanced Navigation Systems (🚧 In Progress)
 * - Phase 5: Interactive Elements & Micro-animations (🚧 In Progress)
 * - Phase 6: Form Systems & Input Design (🚧 In Progress)
 */
const DesignSystemOverviewPage: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number | null>(null);

  const phases = [
    {
      id: 1,
      title: 'Dynamic Background',
      subtitle: 'WebGL-powered corner glow effects',
      status: 'complete',
      icon: Palette,
      color: 'green',
      description: 'Advanced WebGL-powered dynamic background with theme-aware corner glow effects and performance optimizations.',
      features: [
        'WebGL corner glow effects',
        'Theme-aware color system',
        'Performance optimizations',
        'Responsive design',
        'Smooth transitions'
      ],
      demoPath: '/',
      progress: 100
    },
    {
      id: 2,
      title: '3D Card Components',
      subtitle: 'Premium card variants with 3D effects',
      status: 'complete',
      icon: Star,
      color: 'green',
      description: 'Comprehensive 3D card component system with premium variants, tilt effects, and brand integration.',
      features: [
        '7 major card components',
        'Premium variants',
        '3D tilt effects',
        'Brand glows',
        'Glassmorphism'
      ],
      demoPath: '/card-test',
      progress: 100
    },
    {
      id: 3,
      title: 'Advanced Layout Systems',
      subtitle: 'Container queries and auto-fit grids',
      status: 'in-progress',
      icon: Layout,
      color: 'orange',
      description: 'Advanced layout system with container queries, auto-fit grids, and masonry layouts.',
      features: [
        'Container queries',
        'Auto-fit grids',
        'Masonry layouts',
        'Content-aware layouts',
        'Responsive breakpoints'
      ],
      demoPath: '/bentogrid-demo',
      progress: 75
    },
    {
      id: 4,
      title: 'Advanced Navigation Systems',
      subtitle: 'Command palette and breadcrumbs',
      status: 'in-progress',
      icon: Navigation,
      color: 'orange',
      description: 'Advanced navigation system with command palette, breadcrumbs, and mobile navigation.',
      features: [
        'Command palette',
        'Breadcrumb navigation',
        'Mobile navigation',
        'Keyboard shortcuts',
        'Accessibility support'
      ],
      demoPath: '/navigation-demo',
      progress: 80
    },
    {
      id: 5,
      title: 'Interactive Elements & Micro-animations',
      subtitle: 'Hover effects and micro-interactions',
      status: 'in-progress',
      icon: MousePointer,
      color: 'orange',
      description: 'Advanced micro-animations with hover effects, interactive feedback, and performance optimizations.',
      features: [
        'Hover effects',
        'Micro-interactions',
        'Performance optimizations',
        'Staggered animations',
        'Brand-aware animations'
      ],
      demoPath: '/micro-animations-demo',
      progress: 70
    },
    {
      id: 6,
      title: 'Form Systems & Input Design',
      subtitle: 'Multi-step forms and advanced inputs',
      status: 'in-progress',
      icon: FileText,
      color: 'orange',
      description: 'Advanced form system with multi-step forms, sophisticated glassmorphism, and brand integration.',
      features: [
        'Multi-step forms',
        'Advanced variants',
        'Brand integration',
        'Sophisticated glassmorphism',
        'Enhanced validation'
      ],
      demoPath: '/form-system-demo',
      progress: 85
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-primary" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            TradeYa Design System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A comprehensive design system built with modern web technologies, featuring advanced layouts, 
            micro-animations, and sophisticated UI components.
          </p>
          
          {/* Progress Overview */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
              </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">6</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Phases</div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">67%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "67%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {phases.map((phase, index) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card 
              variant="glass" 
              className="p-6 h-full cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${phase.color}-100 dark:bg-${phase.color}-900`}>
                    <phase.icon className={`w-6 h-6 text-${phase.color}-600 dark:text-${phase.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Phase {phase.id}: {phase.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{phase.subtitle}</p>
                  </div>
                </div>
                {getStatusIcon(phase.status)}
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">{phase.description}</p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{phase.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <motion.div
                    className={`bg-${phase.color}-500 h-1.5 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <Badge className={getStatusColor(phase.status)}>
                  {phase.status === 'complete' ? 'Complete' : 'In Progress'}
                </Badge>
                <Link to={phase.demoPath}>
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <span>Demo</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {/* Features List */}
              <AnimatePresence>
                {activePhase === phase.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-4"
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {phase.features.map((feature, featureIndex) => (
                        <motion.li
                          key={featureIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: featureIndex * 0.05 }}
                          className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12"
      >
        <Card variant="glass" className="p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/bentogrid-demo">
              <Button className="w-full flex items-center justify-center space-x-2">
                <Layout className="w-4 h-4" />
                <span>Layout Demo</span>
              </Button>
            </Link>
            <Link to="/micro-animations-demo">
              <Button className="w-full flex items-center justify-center space-x-2">
                <MousePointer className="w-4 h-4" />
                <span>Animations Demo</span>
              </Button>
            </Link>
            <Link to="/form-system-demo">
              <Button className="w-full flex items-center justify-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Form Demo</span>
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Technology Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-12"
      >
        <Card variant="glass" className="p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚛️</div>
              <div className="font-medium">React 18</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">UI Framework</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-medium">Tailwind CSS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Styling</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎭</div>
              <div className="font-medium">Framer Motion</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Animations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔧</div>
              <div className="font-medium">TypeScript</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Type Safety</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DesignSystemOverviewPage; 