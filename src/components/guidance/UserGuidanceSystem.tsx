/**
 * User Guidance System
 * Comprehensive onboarding, tooltips, tours, and contextual help
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  Lightbulb,
  Target,
  CheckCircle,
  ArrowRight,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { classPatterns } from '../../utils/designSystem';
import { cn } from '../../utils/cn';

// Types
export interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skippable?: boolean;
  highlight?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  autoStart?: boolean;
  showProgress?: boolean;
  onComplete?: () => void;
}

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'features' | 'troubleshooting' | 'tips';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Smart Tooltip Component
export const SmartTooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  trigger = 'hover',
  delay = 500,
  className = '',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate optimal position
  const calculatePosition = useCallback(() => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const trigger = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newPosition = position;

    // Check if tooltip would overflow and adjust position
    if (position === 'top' && trigger.top - tooltip.height < 0) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && trigger.bottom + tooltip.height > viewport.height) {
      newPosition = 'top';
    } else if (position === 'left' && trigger.left - tooltip.width < 0) {
      newPosition = 'right';
    } else if (position === 'right' && trigger.right + tooltip.width > viewport.width) {
      newPosition = 'left';
    }

    setActualPosition(newPosition);
  }, [position]);

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  }, [delay, calculatePosition]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const handleTrigger = useCallback(() => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  }, [trigger, isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        ref={triggerRef}
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onFocus={trigger === 'focus' ? showTooltip : undefined}
        onBlur={trigger === 'focus' ? hideTooltip : undefined}
        onClick={trigger === 'click' ? handleTrigger : undefined}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none',
              classPatterns.glassCard,
              positionClasses[actualPosition]
            )}
          >
            {content}
            
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-2 h-2 bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 transform rotate-45',
                actualPosition === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
                actualPosition === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
                actualPosition === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
                actualPosition === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Interactive Tour Component
export const InteractiveTour: React.FC<{
  tour: Tour;
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}> = ({ tour, isActive, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const currentStepData = tour.steps[currentStep];

  // Highlight target element
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      if (currentStepData.highlight) {
        element.style.outline = '2px solid #f97316';
        element.style.outlineOffset = '4px';
        element.style.borderRadius = '8px';
      }
    }

    return () => {
      if (element && currentStepData.highlight) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.borderRadius = '';
      }
    };
  }, [isActive, currentStep, currentStepData]);

  const nextStep = useCallback(() => {
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, tour.steps.length, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleAction = useCallback(() => {
    if (currentStepData.action) {
      currentStepData.action.onClick();
    }
    nextStep();
  }, [currentStepData, nextStep]);

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={currentStepData.skippable ? onSkip : undefined}
      />

      {/* Tour Step Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'fixed z-50 max-w-sm',
          currentStepData.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
          'top-4 right-4'
        )}
      >
        <Card variant="glass" className={classPatterns.glassCard}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {currentStepData.title}
              </CardTitle>
              {currentStepData.skippable && (
                <Button variant="ghost" size="sm" onClick={onSkip} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {tour.showProgress && (
              <div className="flex items-center gap-2 mt-2">
                <Progress value={((currentStep + 1) / tour.steps.length) * 100} className="flex-1" />
                <span className={classPatterns.caption}>
                  {currentStep + 1} of {tour.steps.length}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <p className={classPatterns.bodyMedium}>{currentStepData.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                
                {currentStepData.action ? (
                  <Button size="sm" onClick={handleAction}>
                    {currentStepData.action.label}
                  </Button>
                ) : (
                  <Button size="sm" onClick={nextStep}>
                    {currentStep === tour.steps.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {currentStepData.skippable && (
                <Button variant="ghost" size="sm" onClick={onSkip}>
                  Skip Tour
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// Help Center Component
export const HelpCenter: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  helpContent: HelpContent[];
}> = ({ isOpen, onClose, helpContent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);

  const categories = [
    { value: 'all', label: 'All Topics' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'features', label: 'Features' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
    { value: 'tips', label: 'Tips & Tricks' },
  ];

  const filteredContent = helpContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(classPatterns.glassCard, 'w-full max-w-4xl max-h-[80vh] overflow-hidden')}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Help Center
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={classPatterns.textInput}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={classPatterns.textInput + ' w-48'}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          {selectedContent ? (
            // Show selected content
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedContent(null)}
                className="mb-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to topics
              </Button>
              
              <div className="space-y-4">
                <div>
                  <h2 className={classPatterns.heading2}>{selectedContent.title}</h2>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{selectedContent.category}</Badge>
                    <Badge variant={
                      selectedContent.difficulty === 'beginner' ? 'success' :
                      selectedContent.difficulty === 'intermediate' ? 'warning' : 'error'
                    }>
                      {selectedContent.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <div className={classPatterns.bodyMedium + ' prose prose-sm max-w-none'}>
                  {selectedContent.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Show content list
            <div className="grid gap-4">
              {filteredContent.map(content => (
                <motion.div
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={classPatterns.heading4 + ' mb-2'}>{content.title}</h3>
                      <p className={classPatterns.bodySmall + ' text-muted-foreground mb-2'}>
                        {content.content.substring(0, 150)}...
                      </p>
                      <div className="flex gap-2">
                        {content.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground ml-4" />
                  </div>
                </motion.div>
              ))}
              
              {filteredContent.length === 0 && (
                <div className="text-center py-8">
                  <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className={classPatterns.bodyMedium + ' text-muted-foreground'}>
                    No help topics found matching your search.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </motion.div>
    </motion.div>
  );
};

// Main Guidance System Hook
export const useGuidanceSystem = () => {
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('completed-tours', []);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const startTour = useCallback((tour: Tour) => {
    if (!completedTours.includes(tour.id)) {
      setActiveTour(tour);
    }
  }, [completedTours]);

  const completeTour = useCallback((tourId: string) => {
    setCompletedTours(prev => [...prev, tourId]);
    setActiveTour(null);
  }, [setCompletedTours]);

  const skipTour = useCallback(() => {
    setActiveTour(null);
  }, []);

  return {
    activeTour,
    showHelp,
    setShowHelp,
    startTour,
    completeTour,
    skipTour,
    completedTours,
  };
};

export { SmartTooltip as Tooltip };
