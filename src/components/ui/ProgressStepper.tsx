/**
 * Enhanced ProgressStepper Component
 * 
 * Multi-step progress indicator with clickable steps, visual feedback,
 * and accessibility support. Follows UX Principle 4: User Guidance.
 * 
 * Enhanced version of StepProgress with additional features:
 * - Clickable steps for navigation
 * - Better visual hierarchy
 * - Progress percentage display
 * - Optional step descriptions
 * - Keyboard navigation support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { semanticClasses, type Topic } from '../../utils/semanticColors';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface Step {
  /**
   * Step label (required)
   */
  label: string;
  
  /**
   * Optional step description
   */
  description?: string;
  
  /**
   * Whether this step is completed
   */
  completed?: boolean;
  
  /**
   * Whether this is the current active step
   */
  current?: boolean;
  
  /**
   * Whether this step has an error
   */
  error?: boolean;
  
  /**
   * Whether this step is clickable/navigable
   */
  clickable?: boolean;
  
  /**
   * Optional step number (auto-generated if not provided)
   */
  stepNumber?: number;
}

export interface ProgressStepperProps {
  /**
   * Array of steps to display
   */
  steps: Step[];
  
  /**
   * Current step index (0-based)
   */
  currentStep?: number;
  
  /**
   * Callback when a step is clicked
   */
  onStepClick?: (stepIndex: number) => void;
  
  /**
   * Orientation of the stepper
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Show progress percentage
   */
  showProgress?: boolean;
  
  /**
   * Show step numbers
   */
  showStepNumbers?: boolean;
  
  /**
   * Semantic topic for styling
   */
  topic?: Topic;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  showProgress = true,
  showStepNumbers = true,
  topic,
  className,
  size = 'md',
}) => {
  // Mobile optimization
  const { isMobile, isTablet } = useMobileOptimization();
  
  // FIX: Handle empty steps array
  if (!steps || steps.length === 0) {
    return (
      <div className={cn('text-center p-8 text-neutral-500 dark:text-neutral-400', className)}>
        <p>No steps available</p>
      </div>
    );
  }

  // Calculate progress percentage
  const completedSteps = steps.filter(step => step.completed).length;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:127',message:'Progress calculation',data:{completedSteps,stepsLength:steps.length,willDivideByZero:steps.length===0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  
  // Determine current step index
  const activeStepIndex = currentStep !== undefined 
    ? currentStep 
    : steps.findIndex(step => step.current);
  // FIX: Ensure activeStepIndex is valid (not -1, not out of bounds)
  const validActiveStepIndex = (activeStepIndex >= 0 && activeStepIndex < steps.length)
    ? activeStepIndex 
    : 0;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:133',message:'activeStepIndex calculated',data:{currentStep,activeStepIndex,validActiveStepIndex,stepsLength:steps.length,stepsWithCurrent:steps.filter(s=>s.current).length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Get semantic classes if topic is provided
  const semanticClassesForTopic = topic ? semanticClasses(topic) : null;

  // Size configurations with mobile optimization
  const sizeConfig = {
    sm: {
      stepSize: 'w-6 h-6',
      stepSizeMobile: 'w-7 h-7', // Larger on mobile for better touch targets
      iconSize: 12,
      iconSizeMobile: 14,
      textSize: 'text-xs',
      descriptionSize: 'text-xs',
      spacing: 'gap-2',
      gapRem: 0.5, // gap-2 = 0.5rem
    },
    md: {
      stepSize: 'w-8 h-8',
      stepSizeMobile: 'w-9 h-9', // Larger on mobile for better touch targets
      iconSize: 16,
      iconSizeMobile: 18,
      textSize: 'text-sm',
      descriptionSize: 'text-xs',
      spacing: 'gap-4',
      gapRem: 1, // gap-4 = 1rem
    },
    lg: {
      stepSize: 'w-10 h-10',
      stepSizeMobile: 'w-11 h-11', // Larger on mobile for better touch targets
      iconSize: 20,
      iconSizeMobile: 22,
      textSize: 'text-base',
      descriptionSize: 'text-sm',
      spacing: 'gap-6',
      gapRem: 1.5, // gap-6 = 1.5rem
    },
  };

  const config = sizeConfig[size];

  // Step indicator styles
  const getStepStyles = (step: Step, index: number) => {
    const isActive = index === validActiveStepIndex;
    const isCompleted = step.completed;
    const hasError = step.error;
    const isClickable = step.clickable !== false && onStepClick;

    if (hasError) {
      return cn(
        'bg-error-500 border-error-400 text-white',
        isClickable && 'hover:bg-error-600 cursor-pointer'
      );
    }

    if (isCompleted) {
      // FIX: More robust border color generation
      let completedColor = 'bg-success-500 border-success-400';
      if (semanticClassesForTopic?.bgSolid) {
        const bgSolid = semanticClassesForTopic.bgSolid;
        // Extract color name from bg-{color}-{shade} format (e.g., 'bg-primary-500' -> 'primary')
        const colorMatch = bgSolid.match(/bg-([a-z]+)-(\d+)/);
        if (colorMatch) {
          const [, colorName] = colorMatch;
          completedColor = `${bgSolid} border-${colorName}-400`;
        } else {
          // Fallback to original logic if format doesn't match
          completedColor = `${bgSolid} border-${bgSolid.replace('bg-', '').replace('-500', '-400')}`;
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:198',message:'Completed color generated',data:{hasTopic:!!semanticClassesForTopic,bgSolid:semanticClassesForTopic?.bgSolid,completedColor},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      return cn(
        completedColor,
        'text-white',
        isClickable && 'hover:opacity-90 cursor-pointer'
      );
    }

    if (isActive) {
      // FIX: More robust border color generation
      let activeColor = 'bg-primary-500 border-primary-400';
      if (semanticClassesForTopic?.bgSolid) {
        const bgSolid = semanticClassesForTopic.bgSolid;
        // Extract color name from bg-{color}-{shade} format (e.g., 'bg-primary-500' -> 'primary')
        const colorMatch = bgSolid.match(/bg-([a-z]+)-(\d+)/);
        if (colorMatch) {
          const [, colorName] = colorMatch;
          activeColor = `${bgSolid} border-${colorName}-400`;
        } else {
          // Fallback to original logic if format doesn't match
          activeColor = `${bgSolid} border-${bgSolid.replace('bg-', '').replace('-500', '-400')}`;
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:220',message:'Active color generated',data:{hasTopic:!!semanticClassesForTopic,bgSolid:semanticClassesForTopic?.bgSolid,activeColor},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      return cn(
        activeColor,
        'text-white',
        isClickable && 'hover:opacity-90 cursor-pointer'
      );
    }

    return cn(
      'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-300 dark:border-neutral-600',
      'text-neutral-700 dark:text-neutral-300',
      isClickable && 'hover:bg-neutral-200 dark:hover:bg-neutral-700/60 cursor-pointer'
    );
  };

  // Handle step click
  const handleStepClick = (index: number, step: Step) => {
    if (step.clickable !== false && onStepClick) {
      onStepClick(index);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number, step: Step) => {
    if ((e.key === 'Enter' || e.key === ' ') && step.clickable !== false && onStepClick) {
      e.preventDefault();
      onStepClick(index);
    }
  };

  // Render step indicator
  const renderStepIndicator = (step: Step, index: number) => {
    const isActive = index === validActiveStepIndex;
    const isCompleted = step.completed;
    const hasError = step.error;
    const isClickable = step.clickable !== false && onStepClick;
    // Mobile: use larger size for better touch targets
    const stepSizeClass = isMobile ? config.stepSizeMobile : config.stepSize;
    const iconSize = isMobile ? config.iconSizeMobile : config.iconSize;
    
    const stepStyles = getStepStyles(step, index);
    const mergedClasses = cn(
      'flex items-center justify-center rounded-full border-2 transition-all duration-300',
      'relative backdrop-blur-sm shadow-xs z-10 shrink-0',
      stepSizeClass,
      stepStyles
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:274',message:'Rendering step indicator',data:{index,isActive,isCompleted,hasError,stepSizeClass,iconSize,stepStyles,mergedClasses,showStepNumbers},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Get explicit size values for inline styles as fallback
    const sizeValue = isMobile 
      ? (size === 'sm' ? '28px' : size === 'md' ? '36px' : '44px')
      : (size === 'sm' ? '24px' : size === 'md' ? '32px' : '40px');
    
    // Force visibility for debugging - ensure background is always visible
    const forceVisibleStyle: React.CSSProperties = {
      minWidth: sizeValue,
      minHeight: sizeValue,
      width: sizeValue,
      height: sizeValue,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Force visibility - if background classes aren't working, this will show
      backgroundColor: isActive 
        ? 'rgb(249, 115, 22)' // primary-500 orange
        : isCompleted 
        ? 'rgb(34, 197, 94)' // success-500 green
        : 'rgb(229, 231, 235)', // neutral-200 gray
      border: `2px solid ${isActive ? 'rgb(234, 88, 12)' : isCompleted ? 'rgb(22, 163, 74)' : 'rgb(209, 213, 219)'}`,
      borderRadius: '9999px',
    };
    
    return (
      <div
        className={mergedClasses}
        style={forceVisibleStyle}
        data-step-index={index}
        data-step-active={isActive}
        data-step-completed={isCompleted}
        onClick={() => handleStepClick(index, step)}
        onKeyDown={(e) => handleKeyDown(e, index, step)}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={`Step ${index + 1}: ${step.label || 'Unnamed step'}${isCompleted ? ' - Completed' : isActive ? ' - Current' : ''}`}
        aria-current={isActive ? 'step' : undefined}
      >
        {hasError ? (
          <X size={iconSize} className="text-white" />
        ) : isCompleted ? (
          <Check size={iconSize} className="text-white" />
        ) : showStepNumbers ? (
          <span className={cn('font-medium', config.textSize)}>
            {step.stepNumber !== undefined ? step.stepNumber : index + 1}
          </span>
        ) : (
          <Circle size={iconSize} />
        )}
      </div>
    );
  };

  // Horizontal orientation
  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full mx-auto', className)}>
        {/* Progress bar */}
        {showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={cn('font-medium', config.textSize, 'text-neutral-700 dark:text-neutral-300')}>
                Progress
              </span>
              <span className={cn('font-medium', config.textSize, 'text-neutral-600 dark:text-neutral-400')}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  semanticClassesForTopic 
                    ? semanticClassesForTopic.bgSolid 
                    : 'bg-primary-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className={cn(
          'flex w-full',
          // Align items to start so connector lines can be positioned at circle height
          'items-start',
          // Mobile: allow horizontal scroll if needed, or stack vertically
          isMobile && 'overflow-x-auto scrollbar-hide pb-2',
          !isMobile && 'flex-nowrap',
          // Allow connector lines to extend beyond container boundaries
          'overflow-visible',
          'relative'
        )}>
          {steps.map((step, index) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProgressStepper.tsx:351',message:'Mapping step',data:{index,stepLabel:step.label,hasDescription:!!step.description,completed:step.completed,current:step.current,stepsLength:steps.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            return (
              <React.Fragment key={index}>
              {/* Step container */}
              <div className={cn(
                'flex flex-col items-center relative',
                // Mobile: minimum width to prevent cramping, desktop: flex-1
                isMobile ? 'min-w-[80px] shrink-0' : 'flex-1',
                // Allow connector lines to overflow
                'overflow-visible'
              )}>
                {renderStepIndicator(step, index)}
                
                {/* Connector line - extends from right edge of circle to next circle */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute rounded-full h-1',
                      step.completed
                        ? semanticClassesForTopic
                          ? semanticClassesForTopic.bgSolid
                          : 'bg-success-500'
                        : 'bg-neutral-300 dark:bg-neutral-600',
                      'transition-colors duration-300',
                      'z-0'
                    )}
                    style={{
                      // Position at center height of step indicator
                      top: isMobile
                        ? (size === 'sm' ? '14px' : size === 'md' ? '16px' : '22px')
                        : (size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'),
                      // Start from right edge of circle (50% + 16px for circle radius)
                      left: 'calc(50% + 16px)',
                      // Extend to reach next circle's left edge
                      // Since containers are flex-1 (equal width), each container is 100% / steps.length wide
                      // From circle right edge to container right edge = 50% - 16px
                      // Then span full next container = 100% (of next, which equals current container width)
                      // Then to next circle left edge = 50% - 16px (of next container)
                      // Total width needed = (50% - 16px) + 100% + (50% - 16px) = 200% - 32px
                      // But since we're starting at 50% + 16px, the width should be:
                      // From (50% + 16px) to (150% - 16px) = 100% - 32px
                      width: 'calc(100% - 32px)',
                    }}
                  />
                )}
                
                {/* Step label and description */}
                <div className={cn('text-center w-full', isMobile ? 'mt-2' : 'mt-3')}>
                  <div
                    className={cn(
                      'font-medium',
                      config.textSize,
                      // Mobile: slightly larger text for readability
                      isMobile && 'text-xs sm:text-sm',
                      index === validActiveStepIndex
                        ? 'text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-600 dark:text-neutral-400'
                    )}
                  >
                    {step.label || 'Unnamed step'}
                  </div>
                  {/* Mobile: hide descriptions to save space, show on tablet+ */}
                  {step.description && !isMobile && (
                    <div className={cn(
                      'mt-1', 
                      config.descriptionSize, 
                      'text-neutral-500 dark:text-neutral-500'
                    )}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('flex flex-col', config.spacing, 'overflow-visible', className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={cn('font-medium', config.textSize, 'text-neutral-700 dark:text-neutral-300')}>
              Progress
            </span>
            <span className={cn('font-medium', config.textSize, 'text-neutral-600 dark:text-neutral-400')}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                semanticClassesForTopic 
                  ? semanticClassesForTopic.bgSolid 
                  : 'bg-primary-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.map((step, index) => (
        <div key={index} className="flex items-start relative overflow-visible">
          {renderStepIndicator(step, index)}
          
          {/* Step content */}
          <div className={cn('ml-3 flex-1', index < steps.length - 1 && 'pb-8')}>
            <div
              className={cn(
                'font-medium',
                config.textSize,
                index === validActiveStepIndex
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              {step.label || 'Unnamed step'}
            </div>
            {step.description && (
              <div className={cn('mt-1', config.descriptionSize, 'text-neutral-500 dark:text-neutral-500')}>
                {step.description}
              </div>
            )}
          </div>

          {/* Connector line - extends from bottom of current circle to top of next circle */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'absolute w-0.5 rounded-full',
                step.completed
                  ? semanticClassesForTopic
                    ? semanticClassesForTopic.bgSolid
                    : 'bg-success-500'
                  : 'bg-neutral-300 dark:bg-neutral-600',
                'transition-colors duration-300',
                'z-0'
              )}
              style={{
                // Position at center X of step indicator circle
                // Circle sizes: sm=24px (w-6), md=32px (w-8), lg=40px (w-10)
                // Center X = half of circle width
                // For sm: 12px, md: 16px, lg: 20px
                // But we need to account for border (border-2 = 2px on each side)
                // So actual center: sm: 12px, md: 16px, lg: 20px
                left: (() => {
                  // Circle center X position - same for mobile and desktop
                  if (size === 'sm') return '12px';
                  if (size === 'md') return '16px';
                  if (size === 'lg') return '20px';
                  return '16px'; // default to md
                })(),
                // Start from bottom edge of current circle
                // Circle sizes: sm=24px, md=32px, lg=40px
                // Bottom edge = full circle height
                top: (() => {
                  // Circle bottom edge position - same for mobile and desktop
                  if (size === 'sm') return '24px';
                  if (size === 'md') return '32px';
                  if (size === 'lg') return '40px';
                  return '32px'; // default to md
                })(),
                // FIX: Extend from bottom of current circle through container and gap to reach next circle top
                // The parent container uses config.spacing (gap-2/gap-4/gap-6) which creates spacing between steps
                // Each step container has relative positioning, and the line is absolutely positioned within it
                // Strategy: Use top + bottom together to make the line stretch from circle bottom to gap end
                // - top: positions line start at circle bottom
                // - bottom: extends line below container into the gap (negative value)
                // The gap size matches the negative bottom, so line extends fully through the gap
                bottom: `-${config.gapRem * 16}px`, // Negative bottom extends line into gap (gapRem in rem, 16px per rem)
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

