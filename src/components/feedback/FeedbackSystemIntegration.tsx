/**
 * Feedback System Integration
 * Comprehensive integration of all user feedback components
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare, Zap, Target, BookOpen } from 'lucide-react';
import { EnhancedFeedbackSystem } from './EnhancedFeedbackSystem';
import { ContextualLoading, SkeletonLoading, ProgressiveLoading } from '../ui/EnhancedLoadingStates';
import { SmartTooltip, InteractiveTour, HelpCenter, useGuidanceSystem } from '../guidance/UserGuidanceSystem';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { classPatterns } from '../../utils/designSystem';

// Sample data for demonstration
const SAMPLE_TOURS = [
  {
    id: 'getting-started',
    name: 'Getting Started with TradeYa',
    description: 'Learn the basics of skill trading',
    autoStart: true,
    showProgress: true,
    steps: [
      {
        id: 'welcome',
        target: 'body',
        title: 'Welcome to TradeYa!',
        content: 'Let\'s take a quick tour to get you started with skill trading.',
        position: 'center' as const,
        highlight: false,
      },
      {
        id: 'navigation',
        target: '[data-tour="navigation"]',
        title: 'Navigation',
        content: 'Use the navigation menu to explore different sections of the platform.',
        position: 'bottom' as const,
        highlight: true,
      },
      {
        id: 'profile',
        target: '[data-tour="profile"]',
        title: 'Your Profile',
        content: 'Complete your profile to start trading skills with others.',
        position: 'left' as const,
        highlight: true,
        action: {
          label: 'Go to Profile',
          onClick: () => console.log('Navigate to profile'),
        },
      },
      {
        id: 'search',
        target: '[data-tour="search"]',
        title: 'Find Skills',
        content: 'Search for skills you want to learn or people to trade with.',
        position: 'bottom' as const,
        highlight: true,
      },
    ],
  },
  {
    id: 'advanced-features',
    name: 'Advanced Features',
    description: 'Discover powerful features for experienced users',
    showProgress: true,
    steps: [
      {
        id: 'collaboration',
        target: '[data-tour="collaboration"]',
        title: 'Collaboration Tools',
        content: 'Use our collaboration features to work on projects together.',
        position: 'right' as const,
        highlight: true,
      },
      {
        id: 'analytics',
        target: '[data-tour="analytics"]',
        title: 'Analytics Dashboard',
        content: 'Track your trading progress and skill development.',
        position: 'top' as const,
        highlight: true,
      },
    ],
  },
];

const SAMPLE_HELP_CONTENT = [
  {
    id: 'getting-started-guide',
    title: 'Getting Started with Skill Trading',
    content: `Welcome to TradeYa! This guide will help you get started with skill trading.

First, complete your profile by adding your skills and interests. Be specific about what you can teach and what you want to learn.

Next, browse the community to find potential trading partners. Use our advanced search to filter by skill category, experience level, and availability.

When you find someone interesting, send them a trade proposal. Be clear about what you're offering and what you're looking for in return.

Once a trade is accepted, use our collaboration tools to schedule sessions and track your progress.`,
    category: 'getting-started' as const,
    tags: ['basics', 'profile', 'trading'],
    difficulty: 'beginner' as const,
  },
  {
    id: 'collaboration-features',
    title: 'Using Collaboration Features',
    content: `TradeYa offers powerful collaboration tools to enhance your skill trading experience.

Project Workspaces: Create shared spaces for collaborative projects with file sharing, task management, and progress tracking.

Video Sessions: Schedule and conduct video calls directly within the platform with screen sharing and recording capabilities.

Progress Tracking: Monitor your learning journey with milestone tracking, skill assessments, and achievement badges.

Communication Tools: Stay connected with your trading partners through integrated messaging, forums, and notification systems.`,
    category: 'features' as const,
    tags: ['collaboration', 'projects', 'video', 'tracking'],
    difficulty: 'intermediate' as const,
  },
  {
    id: 'troubleshooting-common-issues',
    title: 'Troubleshooting Common Issues',
    content: `Having trouble with TradeYa? Here are solutions to common issues:

Connection Problems: Check your internet connection and try refreshing the page. Clear your browser cache if issues persist.

Video Call Issues: Ensure your browser has camera and microphone permissions. Try using a different browser or updating your current one.

Profile Not Showing: Make sure your profile is set to public and all required fields are completed.

Trade Requests Not Working: Verify that you have a complete profile and haven't reached your active trade limit.

Performance Issues: Close unnecessary browser tabs and disable browser extensions that might interfere with the platform.`,
    category: 'troubleshooting' as const,
    tags: ['connection', 'video', 'profile', 'performance'],
    difficulty: 'beginner' as const,
  },
  {
    id: 'advanced-tips',
    title: 'Advanced Tips for Power Users',
    content: `Take your TradeYa experience to the next level with these advanced tips:

Skill Portfolio Optimization: Regularly update your skill portfolio with new competencies and remove outdated ones. Use skill assessments to validate your expertise.

Network Building: Actively participate in community discussions and events. Build relationships beyond individual trades.

Analytics Insights: Use the analytics dashboard to identify patterns in your trading behavior and optimize your approach.

Automation Features: Set up automated matching preferences and notification rules to streamline your trading process.

API Integration: For developers, explore our API to integrate TradeYa with your existing tools and workflows.`,
    category: 'tips' as const,
    tags: ['optimization', 'networking', 'analytics', 'automation', 'api'],
    difficulty: 'advanced' as const,
  },
];

interface FeedbackSystemIntegrationProps {
  showDemoMode?: boolean;
  autoStartTour?: boolean;
}

export const FeedbackSystemIntegration: React.FC<FeedbackSystemIntegrationProps> = ({
  showDemoMode = false,
  autoStartTour = false,
}) => {
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [showProgressiveLoading, setShowProgressiveLoading] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useLocalStorage('feedback-system-intro', false);

  const { showToast } = useToast();
  const {
    activeTour,
    showHelp,
    setShowHelp,
    startTour,
    completeTour,
    skipTour,
    completedTours,
  } = useGuidanceSystem();

  // Auto-start tour for new users
  useEffect(() => {
    if (autoStartTour && !hasSeenIntro && !completedTours.includes('getting-started')) {
      setTimeout(() => {
        startTour(SAMPLE_TOURS[0]);
        setHasSeenIntro(true);
      }, 1000);
    }
  }, [autoStartTour, hasSeenIntro, completedTours, startTour, setHasSeenIntro]);

  // Demo functions
  const handleDemoLoading = (context: string) => {
    setDemoLoading(context);
    setDemoProgress(0);
    
    const interval = setInterval(() => {
      setDemoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDemoLoading(null);
          showToast('Demo loading completed!', 'success');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    console.log('Feedback submitted:', feedback);
    showToast('Thank you for your feedback!', 'success');
  };

  const progressiveStages = [
    { name: 'Initializing', description: 'Setting up the environment', completed: demoProgress > 25 },
    { name: 'Loading Data', description: 'Fetching user information', completed: demoProgress > 50 },
    { name: 'Rendering UI', description: 'Building the interface', completed: demoProgress > 75 },
    { name: 'Complete', description: 'Ready to use', completed: demoProgress >= 100 },
  ];

  return (
    <div className="space-y-8">
      {/* Demo Mode Controls */}
      {showDemoMode && (
        <Card variant="glass" className={classPatterns.glassCard}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Feedback System Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SmartTooltip content="Demonstrates contextual loading with progress tracking">
                <Button
                  onClick={() => handleDemoLoading('search')}
                  disabled={!!demoLoading}
                  className="w-full"
                >
                  Demo Search Loading
                </Button>
              </SmartTooltip>

              <SmartTooltip content="Shows skeleton loading states for better perceived performance">
                <Button
                  onClick={() => setShowSkeletons(!showSkeletons)}
                  variant="secondary"
                  className="w-full"
                >
                  Toggle Skeletons
                </Button>
              </SmartTooltip>

              <SmartTooltip content="Displays progressive loading with multiple stages">
                <Button
                  onClick={() => {
                    setShowProgressiveLoading(true);
                    setDemoProgress(0);
                    const interval = setInterval(() => {
                      setDemoProgress(prev => {
                        if (prev >= 100) {
                          clearInterval(interval);
                          setTimeout(() => setShowProgressiveLoading(false), 1000);
                          return 100;
                        }
                        return prev + 25;
                      });
                    }, 1000);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Progressive Loading
                </Button>
              </SmartTooltip>

              <SmartTooltip content="Opens the comprehensive help center">
                <Button
                  onClick={() => setShowHelp(true)}
                  variant="secondary"
                  className="w-full"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help Center
                </Button>
              </SmartTooltip>
            </div>

            <div className="flex gap-4">
              <SmartTooltip content="Start the getting started tour">
                <Button
                  onClick={() => startTour(SAMPLE_TOURS[0])}
                  disabled={completedTours.includes('getting-started')}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Start Basic Tour
                  {completedTours.includes('getting-started') && (
                    <Badge variant="success" className="ml-2">Completed</Badge>
                  )}
                </Button>
              </SmartTooltip>

              <SmartTooltip content="Start the advanced features tour">
                <Button
                  onClick={() => startTour(SAMPLE_TOURS[1])}
                  disabled={completedTours.includes('advanced-features')}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Advanced Tour
                  {completedTours.includes('advanced-features') && (
                    <Badge variant="success" className="ml-2">Completed</Badge>
                  )}
                </Button>
              </SmartTooltip>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Loading States */}
      {demoLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <ContextualLoading
            context={demoLoading as any}
            progress={demoProgress}
            variant="glass"
            onTimeout={() => {
              setDemoLoading(null);
              showToast('Loading timed out', 'error');
            }}
            retryAction={() => handleDemoLoading(demoLoading)}
          />
        </motion.div>
      )}

      {/* Demo Skeleton Loading */}
      {showSkeletons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <SkeletonLoading type="card" count={2} />
          <SkeletonLoading type="list" />
        </motion.div>
      )}

      {/* Demo Progressive Loading */}
      {showProgressiveLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <ProgressiveLoading
            stages={progressiveStages}
            currentStage={Math.floor(demoProgress / 25)}
          />
        </motion.div>
      )}

      {/* Tour Elements (for demo) */}
      {showDemoMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-tour="navigation" className={classPatterns.glassCard + ' p-4 text-center'}>
            <h3 className={classPatterns.heading4}>Navigation</h3>
            <p className={classPatterns.bodySmall}>Main navigation menu</p>
          </div>
          <div data-tour="profile" className={classPatterns.glassCard + ' p-4 text-center'}>
            <h3 className={classPatterns.heading4}>Profile</h3>
            <p className={classPatterns.bodySmall}>User profile section</p>
          </div>
          <div data-tour="search" className={classPatterns.glassCard + ' p-4 text-center'}>
            <h3 className={classPatterns.heading4}>Search</h3>
            <p className={classPatterns.bodySmall}>Skill search functionality</p>
          </div>
          <div data-tour="collaboration" className={classPatterns.glassCard + ' p-4 text-center'}>
            <h3 className={classPatterns.heading4}>Collaboration</h3>
            <p className={classPatterns.bodySmall}>Team collaboration tools</p>
          </div>
        </div>
      )}

      {/* Enhanced Feedback System */}
      <EnhancedFeedbackSystem
        onSubmitFeedback={handleFeedbackSubmit}
        showQuickActions={true}
        position="bottom-right"
      />

      {/* Interactive Tour */}
      {activeTour && (
        <InteractiveTour
          tour={activeTour}
          isActive={true}
          onComplete={() => {
            completeTour(activeTour.id);
            showToast(`${activeTour.name} completed!`, 'success');
          }}
          onSkip={skipTour}
        />
      )}

      {/* Help Center */}
      <HelpCenter
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        helpContent={SAMPLE_HELP_CONTENT}
      />
    </div>
  );
};
