import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  TRANSITION_DURATION, 
  TRANSITION_TIMING, 
  KEYFRAMES,
  animateElement,
  createStaggeredAnimation 
} from '../utils/animations';

/**
 * Micro-Animations Demo Page
 * 
 * Demonstrates the advanced micro-animation features from Phase 5:
 * - Hover effects and micro-interactions
 * - Performance-optimized animations
 * - Staggered animations
 * - Interactive feedback systems
 * - Brand-aware animations
 */
const MicroAnimationsDemoPage: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const containerRef = useRef<HTMLDivElement>(null);

  // Phase 5.1: Advanced hover effects
  const handleMouseMove = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX.set(event.clientX - centerX);
      mouseY.set(event.clientY - centerY);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Phase 5.2: Interactive feedback
  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2000);
  };

  // Phase 5.3: Staggered animations
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.stagger-card');
      createStaggeredAnimation(
        containerRef.current,
        '.stagger-card',
        KEYFRAMES.POP_IN,
        {
          duration: TRANSITION_DURATION.MEDIUM,
          easing: TRANSITION_TIMING.SMOOTH,
          fill: 'forwards'
        },
        100
      );
    }
  }, []);

  const tabs = [
    { id: 0, label: 'Hover Effects', icon: '🎯' },
    { id: 1, label: 'Micro-Interactions', icon: '⚡' },
    { id: 2, label: 'Performance', icon: '🚀' },
    { id: 3, label: 'Brand Animations', icon: '🎨' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Micro-Animations Phase 5 Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Advanced micro-animations with hover effects, interactive feedback, and performance optimizations
        </p>
      </div>

      {/* Tab Navigation with Micro-Interactions */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 0 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Advanced Hover Effects</h2>
              
              {/* 3D Tilt Card */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-4">3D Tilt Effect</h3>
                <motion.div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    perspective: 1000,
                    transformStyle: 'preserve-3d'
                  }}
                  className="w-full max-w-md mx-auto"
                >
                  <motion.div
                    style={{
                      rotateX: springRotateX,
                      rotateY: springRotateY,
                      transformStyle: 'preserve-3d'
                    }}
                    className="bg-gradient-to-br from-orange-500 to-purple-600 p-8 rounded-2xl text-white text-center"
                  >
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-xl font-semibold mb-2">Interactive Card</h4>
                    <p className="text-primary/20">Move your mouse to see the 3D effect</p>
                  </motion.div>
                </motion.div>
              </Card>

              {/* Hover Effect Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="stagger-card"
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: 5,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="glass" className="p-6 h-full">
                    <div className="text-3xl mb-4">🚀</div>
                    <h4 className="text-lg font-semibold mb-2">Scale & Rotate</h4>
                    <p className="text-gray-600 dark:text-gray-300">Hover to see scale and rotation effects</p>
                  </Card>
                </motion.div>

                <motion.div
                  className="stagger-card"
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="glass" className="p-6 h-full">
                    <div className="text-3xl mb-4">✨</div>
                    <h4 className="text-lg font-semibold mb-2">Float Effect</h4>
                    <p className="text-gray-600 dark:text-gray-300">Hover to see the floating animation</p>
                  </Card>
                </motion.div>

                <motion.div
                  className="stagger-card"
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: "rgba(249, 115, 22, 0.1)",
                    borderColor: "rgba(249, 115, 22, 0.3)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="glass" className="p-6 h-full">
                    <div className="text-3xl mb-4">🎨</div>
                    <h4 className="text-lg font-semibold mb-2">Color Shift</h4>
                    <p className="text-gray-600 dark:text-gray-300">Hover to see brand color integration</p>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Micro-Interactions</h2>
              
              {/* Interactive Buttons */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Interactive Feedback</h3>
                <div className="flex flex-wrap gap-4">
                  <motion.button
                    onClick={handleButtonClick}
                    disabled={loading}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      'Click Me'
                    )}
                  </motion.button>

                  <motion.button
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Ripple Effect
                  </motion.button>

                  <motion.button
                    className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Pulse Effect
                  </motion.button>
                </div>
              </Card>

              {/* Notification System */}
              <AnimatePresence>
                {showNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-toast"
                  >
                    <div className="flex items-center space-x-2">
                      <span>✅</span>
                      <span>Action completed successfully!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Indicators */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Progress Indicators</h3>
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                   <motion.div
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading progress...</div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Performance Optimizations</h2>
              
              {/* GPU Accelerated Animations */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">GPU Accelerated Animations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Transform-based (Optimized)</h4>
                   <motion.div
                      className="w-20 h-20 bg-primary rounded-lg"
                      animate={{ 
                        x: [0, 100, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Layout-based (Non-optimized)</h4>
                    <motion.div
                      className="w-20 h-20 bg-blue-500 rounded-lg"
                      animate={{ 
                        left: [0, 100, 0],
                        top: [0, 50, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Reduced Motion Support */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Accessibility: Reduced Motion</h3>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Animations respect user preferences for reduced motion
                  </p>
                  <motion.div
                    className="w-32 h-32 bg-purple-500 rounded-lg motion-reduce:animate-none"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Brand-Aware Animations</h2>
              
              {/* Brand Color Animations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(249, 115, 22, 0.3)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-3xl mb-4">🟠</div>
                  <h4 className="text-lg font-semibold mb-2">Orange Brand</h4>
                  <p>Primary brand color animations</p>
                </motion.div>

                <motion.div
                  className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-3xl mb-4">🔵</div>
                  <h4 className="text-lg font-semibold mb-2">Blue Brand</h4>
                  <p>Secondary brand color animations</p>
                </motion.div>

                <motion.div
                  className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-3xl mb-4">🟣</div>
                  <h4 className="text-lg font-semibold mb-2">Purple Brand</h4>
                  <p>Accent brand color animations</p>
                </motion.div>
              </div>

              {/* Staggered Brand Animation */}
              <Card variant="glass" className="p-8">
                <h3 className="text-xl font-semibold mb-6">Staggered Brand Elements</h3>
                <div className="flex justify-center space-x-4">
                  {['T', 'R', 'A', 'D', 'E', 'Y', 'A'].map((letter, index) => (
                    <motion.div
                      key={letter}
                      className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 360,
                        transition: { duration: 0.3 }
                      }}
                    >
                      {letter}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MicroAnimationsDemoPage; 