import { useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { processAutoResolution, shouldRunAutoResolution, markAutoResolutionRun } from '../services/autoResolution';

/**
 * Hook to automatically run auto-resolution when users visit the app
 * This replaces the need for Firebase Cloud Functions
 * 
 * RE-ENABLED: Firebase configuration has been fixed to prevent hook.js:608 errors
 */
export const useAutoResolution = () => {
  const { currentUser } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run if user is authenticated and we haven't run yet in this session
    if (!currentUser || hasRun.current) {
      return;
    }

    // Check if we should run based on last run time
    if (!shouldRunAutoResolution()) {
      return;
    }

    const runAutoResolution = async () => {
      try {
        console.log('AutoResolution: Running auto-resolution check...');
        const result = await processAutoResolution();
        
        if (result.remindersProcessed > 0 || result.tradesAutoCompleted > 0) {
          console.log('AutoResolution: Completed successfully:', {
            remindersProcessed: result.remindersProcessed,
            tradesAutoCompleted: result.tradesAutoCompleted
          });
        }

        if (result.errors.length > 0) {
          console.warn('AutoResolution: Errors encountered:', result.errors);
        }

        // Mark as run to prevent running again too soon
        markAutoResolutionRun();
        hasRun.current = true;

      } catch (error) {
        // Enhanced error handling to prevent ErrorBoundary crashes
        console.error('AutoResolution: Failed with error:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          currentUser: currentUser?.uid,
          timestamp: new Date().toISOString()
        });
        
        // Don't throw the error - just log it to prevent crashes
        // The robust Firebase configuration should prevent hook.js:608 errors
      }
    };

    // Run after a delay to ensure Firebase is fully initialized
    const timeoutId = setTimeout(runAutoResolution, 3000);

    return () => clearTimeout(timeoutId);
  }, [currentUser]);
};

export default useAutoResolution;