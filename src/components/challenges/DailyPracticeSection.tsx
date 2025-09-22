import React, { useState, useCallback, useMemo } from 'react';
import { Dumbbell, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { markSkillPracticeDay, hasPracticedToday } from '../../services/streaks';
import { cn } from '../../utils/cn';

export interface DailyPracticeSectionProps {
  userId: string;
  className?: string;
  onPracticeLogged?: () => void;
  showStreakInfo?: boolean;
  enableAnimations?: boolean;
}

export const DailyPracticeSection: React.FC<DailyPracticeSectionProps> = ({
  userId,
  className = '',
  onPracticeLogged,
  showStreakInfo = true,
  enableAnimations = true
}) => {
  const { addToast } = useToast();
  const { isMobile, getTouchTargetClass } = useMobileOptimization();
  
  const [practicedToday, setPracticedToday] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Check practice status on mount
  React.useEffect(() => {
    const checkPracticeStatus = async () => {
      try {
        setIsInitialLoading(true);
        const hasPracticed = await hasPracticedToday(userId);
        setPracticedToday(hasPracticed);
      } catch (err) {
        console.warn('Failed to check practice status:', err);
        // Don't show error to user for status check failure
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (userId) {
      checkPracticeStatus();
    }
  }, [userId]);

  // Memoized status message for better performance
  const statusMessage = useMemo(() => {
    if (isInitialLoading) {
      return 'Checking practice status...';
    }
    if (practicedToday) {
      return 'Practiced today';
    }
    return 'Log a quick practice session to progress your skill streak.';
  }, [isInitialLoading, practicedToday]);

  const handleLogPractice = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await markSkillPracticeDay(userId);
      setPracticedToday(true);
      setRetryCount(0);
      addToast('success', "Logged today's practice");
      onPracticeLogged?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log practice';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      addToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoading, addToast, onPracticeLogged]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleLogPractice();
  }, [handleLogPractice]);

  // Memoized button content for better performance
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Logging...
        </>
      );
    }
    if (practicedToday) {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Completed
        </>
      );
    }
    return 'Log practice';
  }, [isLoading, practicedToday]);

  return (
    <div className={cn('mb-6', className)}>
      {/* Main Practice Section */}
      <div className={cn(
        "glassmorphic flex items-center justify-between p-4 md:p-6 rounded-lg",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/10",
        enableAnimations && "animate-in fade-in-0 slide-in-from-bottom-2",
        isInitialLoading && "opacity-75"
      )}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className={cn(
            "relative",
            enableAnimations && "transition-transform duration-200 hover:scale-110"
          )}>
            <Dumbbell 
              className={cn(
                "h-5 w-5 md:h-6 md:w-6 text-primary",
                enableAnimations && "transition-colors duration-200",
                practicedToday && "text-success"
              )} 
              aria-hidden="true"
            />
            {practicedToday && enableAnimations && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-base font-medium text-foreground mb-1">
              Daily Practice
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">
              {isInitialLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
              ) : practicedToday ? (
                <span 
                  className="inline-flex items-center gap-2"
                  aria-label="Practice completed today"
                >
                  <CheckCircle 
                    className={cn(
                      "h-3 w-3 text-success",
                      enableAnimations && "animate-in zoom-in-50 duration-300"
                    )} 
                    aria-hidden="true"
                  />
                  <span className="font-medium text-success">Practiced today</span>
                </span>
              ) : (
                <span className="leading-relaxed">{statusMessage}</span>
              )}
            </div>
            {error && (
              <div className={cn(
                "text-xs text-destructive mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20",
                enableAnimations && "animate-in slide-in-from-top-1 duration-200"
              )}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-medium">Error logging practice</p>
                    <p className="text-xs opacity-90 mt-1">{error}</p>
                    {retryCount > 0 && (
                      <p className="text-xs opacity-75 mt-1">
                        Retry attempt: {retryCount}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors duration-200"
                  aria-label="Retry logging practice"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <Button
            size={isMobile ? "default" : "sm"}
            onClick={handleLogPractice}
            disabled={isLoading || practicedToday || isInitialLoading}
            className={cn(
              getTouchTargetClass(isMobile ? "large" : "standard"),
              "transition-all duration-200 ease-in-out",
              "hover:scale-105 active:scale-95",
              isLoading && "opacity-75 cursor-not-allowed",
              practicedToday && "bg-success hover:bg-success/90 text-success-foreground",
              enableAnimations && "animate-in fade-in-0 slide-in-from-right-2"
            )}
            aria-label={practicedToday ? "Practice already logged today" : "Log today's practice session"}
            aria-describedby={practicedToday ? "practice-completed" : "practice-pending"}
          >
            {buttonContent}
          </Button>
        </div>
      </div>
      
      {/* Screen reader announcements */}
      <div id="practice-completed" className="sr-only">
        You have already logged practice for today.
      </div>
      <div id="practice-pending" className="sr-only">
        Click to log your practice session for today.
      </div>
    </div>
  );
};

export default DailyPracticeSection;
