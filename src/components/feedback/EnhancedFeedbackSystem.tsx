/**
 * Enhanced Feedback System
 * Comprehensive user feedback with loading states, notifications, and progress indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Loader2, 
  Clock, 
  TrendingUp,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { useToast } from '../../contexts/ToastContext';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { useAccessibility } from '../../hooks/useAccessibility';
import { classPatterns } from '../../utils/designSystem';

// Types
export interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'compliment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'performance' | 'functionality' | 'accessibility';
  rating: number;
  description: string;
  email?: string;
  screenshot?: string;
  metadata: {
    url: string;
    userAgent: string;
    timestamp: number;
    sessionId: string;
  };
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  estimatedTime?: number;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface EnhancedFeedbackSystemProps {
  onSubmitFeedback?: (feedback: FeedbackData) => Promise<void>;
  showQuickActions?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
}

export const EnhancedFeedbackSystem: React.FC<EnhancedFeedbackSystemProps> = ({
  onSubmitFeedback,
  showQuickActions = true,
  position = 'bottom-right',
  theme = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedback, setFeedback] = useState<Partial<FeedbackData>>({
    type: 'improvement',
    severity: 'medium',
    category: 'ui',
    rating: 5,
    description: '',
  });
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: '',
  });
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const { showToast } = useToast();
  const { isMobile, isTablet } = useMobileOptimization();
  const { announceToScreenReader } = useAccessibility();

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Handle feedback submission with progress tracking
  const handleSubmitFeedback = useCallback(async () => {
    if (!feedback.description?.trim()) {
      showToast('Please provide a description', 'error');
      return;
    }

    setLoadingState({
      isLoading: true,
      progress: 0,
      stage: 'Preparing feedback...',
    });

    try {
      // Simulate progress stages
      const stages = [
        { progress: 20, stage: 'Validating input...', delay: 300 },
        { progress: 40, stage: 'Capturing context...', delay: 500 },
        { progress: 60, stage: 'Processing feedback...', delay: 400 },
        { progress: 80, stage: 'Submitting to server...', delay: 600 },
        { progress: 100, stage: 'Complete!', delay: 200 },
      ];

      for (const { progress, stage, delay } of stages) {
        setLoadingState(prev => ({ ...prev, progress, stage }));
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Prepare complete feedback data
      const completeFeedback: FeedbackData = {
        ...feedback as FeedbackData,
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          sessionId: Math.random().toString(36).substr(2, 9),
        },
      };

      // Submit feedback
      if (onSubmitFeedback) {
        await onSubmitFeedback(completeFeedback);
      }

      // Success notification
      addNotification({
        type: 'success',
        title: 'Feedback Submitted!',
        message: 'Thank you for helping us improve TradeYa.',
        duration: 5000,
        actions: [
          {
            label: 'Submit Another',
            onClick: () => {
              resetForm();
              setIsOpen(true);
            },
            variant: 'secondary',
          },
        ],
      });

      announceToScreenReader('Feedback submitted successfully');
      resetForm();
      setIsOpen(false);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: 'Please try again or contact support.',
        actions: [
          {
            label: 'Retry',
            onClick: handleSubmitFeedback,
            variant: 'primary',
          },
        ],
      });
    } finally {
      setLoadingState({
        isLoading: false,
        progress: 0,
        stage: '',
      });
    }
  }, [feedback, onSubmitFeedback, showToast, announceToScreenReader]);

  // Add notification
  const addNotification = useCallback((notification: Omit<NotificationState, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFeedback({
      type: 'improvement',
      severity: 'medium',
      category: 'ui',
      rating: 5,
      description: '',
    });
    setCurrentStep(1);
  }, []);

  // Quick action handlers
  const handleQuickAction = useCallback((action: 'like' | 'dislike' | 'bug' | 'idea') => {
    const actionMap = {
      like: { type: 'compliment' as const, rating: 5, description: 'Great experience!' },
      dislike: { type: 'improvement' as const, rating: 2, description: 'Could be better' },
      bug: { type: 'bug' as const, severity: 'medium' as const, description: 'Found an issue' },
      idea: { type: 'feature' as const, description: 'I have a suggestion' },
    };

    setFeedback(prev => ({ ...prev, ...actionMap[action] }));
    setIsOpen(true);
    setCurrentStep(2); // Skip to description step
  }, []);

  // Render feedback form
  const renderFeedbackForm = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${classPatterns.glassCard} w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Feedback
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1">
            <Progress value={(currentStep / 3) * 100} className="h-2" />
          </div>
          <span className={classPatterns.caption}>
            Step {currentStep} of 3
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Loading state */}
        {loadingState.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className={classPatterns.bodyMedium + ' mb-2'}>{loadingState.stage}</p>
            <Progress value={loadingState.progress} className="w-full" />
          </motion.div>
        )}

        {/* Step 1: Type and Category */}
        {!loadingState.isLoading && currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className={classPatterns.bodyMedium + ' mb-2 block'}>
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'bug', label: 'Bug Report', icon: AlertTriangle },
                  { value: 'feature', label: 'Feature Request', icon: Zap },
                  { value: 'improvement', label: 'Improvement', icon: TrendingUp },
                  { value: 'compliment', label: 'Compliment', icon: ThumbsUp },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={feedback.type === value ? 'primary' : 'secondary'}
                    onClick={() => setFeedback(prev => ({ ...prev, type: value as any }))}
                    className="flex items-center gap-2 h-12"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={classPatterns.bodyMedium + ' mb-2 block'}>
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'ui', label: 'User Interface' },
                  { value: 'performance', label: 'Performance' },
                  { value: 'functionality', label: 'Functionality' },
                  { value: 'accessibility', label: 'Accessibility' },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={feedback.category === value ? 'primary' : 'secondary'}
                    onClick={() => setFeedback(prev => ({ ...prev, category: value as any }))}
                    className="h-10"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              className="w-full"
            >
              Next
            </Button>
          </motion.div>
        )}

        {/* Step 2: Rating and Description */}
        {!loadingState.isLoading && currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className={classPatterns.bodyMedium + ' mb-2 block'}>
                How would you rate your experience?
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (feedback.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={classPatterns.bodyMedium + ' mb-2 block'}>
                Tell us more
              </label>
              <textarea
                value={feedback.description || ''}
                onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your feedback in detail..."
                className={classPatterns.textInput + ' min-h-[100px] resize-none'}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!feedback.description?.trim()}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review and Submit */}
        {!loadingState.isLoading && currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className={classPatterns.heading4 + ' mb-3'}>Review Your Feedback</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{feedback.type}</Badge>
                  <Badge variant="secondary">{feedback.category}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (feedback.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className={classPatterns.bodySmall + ' bg-white/5 p-3 rounded-lg'}>
                  {feedback.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                className="flex-1 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </motion.div>
  );

  return (
    <>
      {/* Main feedback trigger */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col gap-2"
          >
            {/* Quick actions */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mb-2"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickAction('like')}
                  className="h-10 w-10 p-0"
                  title="Quick like"
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickAction('dislike')}
                  className="h-10 w-10 p-0"
                  title="Quick dislike"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Main feedback button */}
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 px-4 flex items-center gap-2 shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              {!isMobile && 'Feedback'}
            </Button>
          </motion.div>
        )}

        {/* Feedback form modal */}
        <AnimatePresence>
          {isOpen && renderFeedbackForm()}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`${classPatterns.glassCard} p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                  {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                  {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={classPatterns.bodyMedium + ' font-medium mb-1'}>
                    {notification.title}
                  </h4>
                  <p className={classPatterns.bodySmall + ' text-muted-foreground'}>
                    {notification.message}
                  </p>
                  {notification.actions && (
                    <div className="flex gap-2 mt-3">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={action.variant || 'secondary'}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotification(notification.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
