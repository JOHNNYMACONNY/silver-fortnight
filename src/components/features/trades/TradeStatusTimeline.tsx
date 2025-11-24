import React from 'react';
import { Circle, Clock, CheckCircle2, AlertCircle, FileText, Handshake } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TradeStatusTimelineProps {
  status: 'open' | 'in-progress' | 'pending_evidence' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed';
  showProgress?: boolean;
  showNextStep?: boolean;
}

/**
 * A component that displays the current status of a trade in a timeline format.
 * Shows progression through Open → In Progress → Pending Confirmation → Completed
 * Enhanced with icons, progress percentage, and next step callouts
 */
export const TradeStatusTimeline: React.FC<TradeStatusTimelineProps> = ({ 
  status, 
  showProgress = true,
  showNextStep = true 
}) => {
  // Define the statuses in order with their display names, icons, and next steps
  const statusSteps = [
    { 
      id: 'open', 
      label: 'Open',
      icon: Circle,
      description: 'Accepting proposals',
      nextAction: 'Wait for trade proposals',
      estimatedTime: '1-3 days'
    },
    { 
      id: 'in-progress', 
      label: 'In Progress',
      icon: Clock,
      description: 'Trade is active',
      nextAction: 'Complete your part and request completion',
      estimatedTime: 'Varies by trade'
    },
    { 
      id: 'pending_evidence', 
      label: 'Evidence Pending',
      icon: FileText,
      description: 'Awaiting proof',
      nextAction: 'Submit evidence of completion',
      estimatedTime: '1-2 days'
    },
    { 
      id: 'pending_confirmation', 
      label: 'Pending Confirmation',
      icon: Handshake,
      description: 'Final approval',
      nextAction: 'Confirm or request changes',
      estimatedTime: '1 day'
    },
    { 
      id: 'completed', 
      label: 'Completed',
      icon: CheckCircle2,
      description: 'Trade finished',
      nextAction: 'Leave a review',
      estimatedTime: 'Complete'
    }
  ];

  // Get the index of the current status
  let currentIndex = statusSteps.findIndex(step => step.id === status);

  // If status is cancelled or disputed, show as a special case
  const isSpecialStatus = status === 'cancelled' || status === 'disputed';

  // If the status is not in our timeline (cancelled or disputed), set to -1
  if (currentIndex === -1 && !isSpecialStatus) {
    currentIndex = -1;
  }

  if (isSpecialStatus) {
    const SpecialIcon = status === 'cancelled' ? AlertCircle : AlertCircle;
    return (
      <div className="w-full">
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-md text-primary-foreground font-medium flex items-center gap-2",
            status === 'cancelled' ? 'bg-muted' : 'bg-destructive'
          )}>
            <SpecialIcon className="h-4 w-4" />
            {status === 'cancelled' ? 'Cancelled' : 'Disputed'}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {status === 'cancelled'
              ? 'This trade has been cancelled and is no longer active.'
              : 'This trade is currently disputed and requires resolution.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = currentIndex >= 0
    ? Math.min(100, Math.round((currentIndex / (statusSteps.length - 1)) * 100))
    : 0;

  // Get current step info for next step callout
  const currentStep = currentIndex >= 0 ? statusSteps[currentIndex] : null;

  return (
    <div className="w-full space-y-4">
      {/* Progress Percentage */}
      {showProgress && (
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm text-muted-foreground">Progress:</div>
          <div className="text-lg font-semibold text-foreground">{progressPercentage}%</div>
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-4 py-2">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 w-full h-1 bg-muted rounded-full"></div>

        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-sm transition-all duration-500 ease-in-out"
          style={{
            width: `${progressPercentage}%`
          }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step circle with icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ease-in-out",
                    isActive
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground border-2 border-border',
                    isCurrent && 'ring-4 ring-primary/20 scale-110'
                  )}
                >
                  {isActive ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step label and description */}
                <div className="mt-3 text-center max-w-[100px]">
                  <span className={cn(
                    "text-xs font-medium transition-all duration-300 block",
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                    isCurrent && 'font-semibold'
                  )}>
                    {step.id === 'pending_confirmation' ? (
                      <>
                        <span className="hidden sm:inline">Pending Confirmation</span>
                        <span className="sm:hidden">Pending</span>
                      </>
                    ) : step.id === 'pending_evidence' ? (
                      <>
                        <span className="hidden sm:inline">Evidence Pending</span>
                        <span className="sm:hidden">Evidence</span>
                      </>
                    ) : (
                      step.label
                    )}
                  </span>
                  {isCurrent && (
                    <div className="h-0.5 w-12 bg-primary mx-auto mt-1 rounded-full"></div>
                  )}
                  {isCurrent && step.description && (
                    <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Step Callout */}
      {showNextStep && currentStep && status !== 'completed' && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Next Step</p>
              <p className="text-sm text-muted-foreground">{currentStep.nextAction}</p>
              {currentStep.estimatedTime && (
                <p className="text-xs text-muted-foreground mt-2">
                  Estimated time: {currentStep.estimatedTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeStatusTimeline;
