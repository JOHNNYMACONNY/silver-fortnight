import React from 'react';

interface TradeStatusTimelineProps {
  status: 'open' | 'in-progress' | 'pending_evidence' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed';
}

/**
 * A component that displays the current status of a trade in a timeline format.
 * Shows progression through Open → In Progress → Pending Confirmation → Completed
 */
export const TradeStatusTimeline: React.FC<TradeStatusTimelineProps> = ({ status }) => {
  // Define the statuses in order with their display names
  const statusSteps = [
    { id: 'open', label: 'Open' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'pending_evidence', label: 'Evidence Pending' },
    { id: 'pending_confirmation', label: 'Pending Confirmation' },
    { id: 'completed', label: 'Completed' }
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
    return (
      <div className="w-full">
        <div className="flex flex-col items-center">
          <div className={`px-4 py-2 rounded-md text-primary-foreground font-medium ${
            status === 'cancelled' ? 'bg-muted' : 'bg-destructive'
          }`}>
            {status === 'cancelled' ? 'Cancelled' : 'Disputed'}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === 'cancelled'
              ? 'This trade has been cancelled and is no longer active.'
              : 'This trade is currently disputed and requires resolution.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative max-w-3xl mx-auto px-4 py-2">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 w-full h-1 bg-muted rounded-full"></div>

        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-sm transition-all duration-500 ease-in-out"
          style={{
            width: currentIndex >= 0
              ? `${Math.min(100, (currentIndex / (statusSteps.length - 1)) * 100)}%`
              : '0%'
          }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center z-10
                    ${isActive
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground border-2 border-border'
                    }
                    ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                    transition-all duration-300 ease-in-out
                  `}
                >
                  {isActive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-3 text-center">
                  <span className={`
                    text-xs font-medium transition-all duration-300
                    ${isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                    }
                    ${isCurrent ? 'font-semibold' : ''}
                  `}>
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TradeStatusTimeline;
