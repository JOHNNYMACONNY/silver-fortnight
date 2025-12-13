/**
 * useUndo Hook
 * 
 * Provides undo/redo functionality for user actions.
 * Follows UX Principle 5: User Control & Flexibility.
 * 
 * Allows users to reverse actions with a simple undo mechanism.
 * Typically used with toast notifications to provide undo actions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UndoAction {
  /**
   * Function to execute the action
   */
  execute: () => void | Promise<void>;
  
  /**
   * Function to undo the action
   */
  undo: () => void | Promise<void>;
  
  /**
   * Optional label for the action (for display purposes)
   */
  label?: string;
  
  /**
   * Internal: Action ID for tracking timeouts
   */
  _actionId?: number;
}

export interface UseUndoOptions {
  /**
   * Time in milliseconds before the undo action expires
   * Default: 5000 (5 seconds)
   */
  timeout?: number;
  
  /**
   * Maximum number of undo actions to keep in history
   * Default: 10
   */
  maxHistory?: number;
  
  /**
   * Whether to automatically execute the action when execute() is called
   * Default: true
   */
  autoExecute?: boolean;
}

export interface UseUndoReturn {
  /**
   * Execute an action with undo capability
   */
  execute: (action: UndoAction) => void;
  
  /**
   * Undo the last action
   */
  undo: () => void;
  
  /**
   * Redo the last undone action
   */
  redo: () => void;
  
  /**
   * Check if undo is available
   */
  canUndo: boolean;
  
  /**
   * Check if redo is available
   */
  canRedo: boolean;
  
  /**
   * Get the label of the last action (for display)
   */
  lastActionLabel: string | undefined;
  
  /**
   * Clear all undo history
   */
  clear: () => void;
  
  /**
   * Get the current undo history length
   */
  historyLength: number;
}

/**
 * useUndo Hook
 * 
 * Provides undo/redo functionality with automatic timeout.
 * 
 * @example
 * const { execute, undo, canUndo, lastActionLabel } = useUndo({ timeout: 10000 });
 * 
 * const handleDelete = () => {
 *   execute({
 *     execute: () => deleteItem(itemId),
 *     undo: () => restoreItem(itemId),
 *     label: 'Delete item'
 *   });
 *   showToast({
 *     message: 'Item deleted',
 *     action: canUndo ? { label: 'Undo', onClick: undo } : undefined
 *   });
 * };
 */
export const useUndo = (options: UseUndoOptions = {}): UseUndoReturn => {
  const {
    timeout = 5000,
    maxHistory = 10,
    autoExecute = true,
  } = options;

  // Undo history (stack of actions)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  
  // Redo history (stack of undone actions)
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  
  // Timeout refs for each action
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // Action ID counter
  const actionIdRef = useRef(0);

  // Clear timeout for an action
  const clearTimeoutForAction = useCallback((actionId: number) => {
    const timeoutId = timeoutRefs.current.get(actionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(actionId);
    }
  }, []);

  // Remove expired action from undo stack
  const removeExpiredAction = useCallback((actionId: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:141',message:'removeExpiredAction called',data:{actionId,timeoutRefsSize:timeoutRefs.current.size},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    setUndoStack(prev => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:145',message:'Finding action in stack by actionId',data:{actionId,stackLength:prev.length,actionIds:prev.map(a=>a._actionId)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // FIX: Find by actionId stored in the action, not by array index
      const index = prev.findIndex((action) => action._actionId === actionId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:149',message:'Action found result',data:{actionId,foundIndex:index,willRemove:index!==-1},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (index === -1) return prev;
      
      const newStack = [...prev];
      newStack.splice(index, 1);
      return newStack;
    });
    
    clearTimeoutForAction(actionId);
  }, [clearTimeoutForAction]);

  // Execute an action with undo capability
  const execute = useCallback((action: UndoAction) => {
    const actionId = actionIdRef.current++;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:169',message:'execute called',data:{actionId,actionLabel:action.label,timeout},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    
    // FIX: Store actionId in the action object for proper tracking
    const actionWithId: UndoAction = { ...action, _actionId: actionId };
    
    // Clear redo stack when new action is executed
    setRedoStack([]);
    
    // Execute the action if autoExecute is enabled
    if (autoExecute) {
      Promise.resolve(action.execute()).catch(error => {
        console.error('Error executing action:', error);
      });
    }
    
    // Add to undo stack
    setUndoStack(prev => {
      const newStack = [actionWithId, ...prev].slice(0, maxHistory);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:187',message:'Action added to stack',data:{actionId,newStackLength:newStack.length,newStackIndex:0,storedActionId:newStack[0]._actionId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return newStack;
    });
    
    // Set timeout to remove action from undo stack
    if (timeout > 0) {
      const timeoutId = setTimeout(() => {
        removeExpiredAction(actionId);
      }, timeout);
      
      timeoutRefs.current.set(actionId, timeoutId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:200',message:'Timeout set',data:{actionId,timeout,timeoutRefsSize:timeoutRefs.current.size},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
  }, [autoExecute, maxHistory, timeout, removeExpiredAction]);

  // Undo the last action
  const undo = useCallback(() => {
    setUndoStack(prev => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:208',message:'undo called',data:{stackLength:prev.length,timeoutRefsSize:timeoutRefs.current.size,timeoutRefsKeys:Array.from(timeoutRefs.current.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (prev.length === 0) return prev;
      
      const [lastAction, ...rest] = prev;
      
      // Execute undo
      Promise.resolve(lastAction.undo()).catch(error => {
        console.error('Error undoing action:', error);
      });
      
      // Move to redo stack
      setRedoStack(prevRedo => [lastAction, ...prevRedo].slice(0, maxHistory));
      
      // FIX: Use the actual actionId stored in the action, not array length
      const actionId = lastAction._actionId;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:222',message:'Clearing timeout with correct actionId',data:{actionId,stackLength:prev.length,timeoutRefsHasKey:actionId!==undefined&&timeoutRefs.current.has(actionId)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (actionId !== undefined) {
        clearTimeoutForAction(actionId);
      }
      
      return rest;
    });
  }, [maxHistory, clearTimeoutForAction]);

  // Redo the last undone action
  const redo = useCallback(() => {
    setRedoStack(prev => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:244',message:'redo called',data:{redoStackLength:prev.length,timeout},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      if (prev.length === 0) return prev;
      
      const [lastAction, ...rest] = prev;
      
      // Execute the action again
      Promise.resolve(lastAction.execute()).catch(error => {
        console.error('Error redoing action:', error);
      });
      
      // FIX: When redoing, we need a new actionId and timeout
      const newActionId = actionIdRef.current++;
      const actionWithNewId: UndoAction = { ...lastAction, _actionId: newActionId };
      
      // Move back to undo stack (with new actionId)
      setUndoStack(prevUndo => {
        const newStack = [actionWithNewId, ...prevUndo].slice(0, maxHistory);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:256',message:'Action redone and added to stack',data:{newActionId,oldActionId:lastAction._actionId,timeout},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        return newStack;
      });
      
      // Set new timeout for redone action
      if (timeout > 0) {
        const timeoutId = setTimeout(() => {
          removeExpiredAction(newActionId);
        }, timeout);
        
        timeoutRefs.current.set(newActionId, timeoutId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUndo.ts:266',message:'Timeout set for redone action',data:{newActionId,timeout,timeoutRefsSize:timeoutRefs.current.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      }
      
      return rest;
    });
  }, [maxHistory, timeout, removeExpiredAction]);

  // Clear all history
  const clear = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    execute,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    lastActionLabel: undoStack[0]?.label,
    clear,
    historyLength: undoStack.length,
  };
};

/**
 * useUndoWithToast Hook
 * 
 * Convenience hook that combines useUndo with toast notifications.
 * Automatically shows a toast with an undo button when an action is executed.
 * 
 * @example
 * const { executeWithToast } = useUndoWithToast({ timeout: 10000 });
 * 
 * const handleDelete = () => {
 *   executeWithToast({
 *     execute: () => deleteItem(itemId),
 *     undo: () => restoreItem(itemId),
 *     label: 'Delete item',
 *     successMessage: 'Item deleted',
 *     undoLabel: 'Undo'
 *   });
 * };
 */
export interface UseUndoWithToastOptions extends UseUndoOptions {
  /**
   * Toast notification function
   * Should accept (message: string, type?: string, action?: { label: string, onClick: () => void })
   */
  showToast?: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    action?: { label: string; onClick: () => void }
  ) => void;
}

export interface ExecuteWithToastOptions extends UndoAction {
  /**
   * Success message to show in toast
   */
  successMessage: string;
  
  /**
   * Label for the undo button in toast
   */
  undoLabel?: string;
  
  /**
   * Toast type
   */
  toastType?: 'success' | 'error' | 'info' | 'warning';
}

export const useUndoWithToast = (
  options: UseUndoWithToastOptions = {}
): {
  executeWithToast: (options: ExecuteWithToastOptions) => void;
  undo: () => void;
  canUndo: boolean;
  lastActionLabel: string | undefined;
} => {
  const { showToast, ...undoOptions } = options;
  const { execute, undo, canUndo, lastActionLabel } = useUndo(undoOptions);

  const executeWithToast = useCallback(
    (actionOptions: ExecuteWithToastOptions) => {
      const { successMessage, undoLabel = 'Undo', toastType = 'success', ...action } = actionOptions;

      execute(action);

      // Show toast with undo action if available
      if (showToast && canUndo) {
        showToast(successMessage, toastType, {
          label: undoLabel,
          onClick: undo,
        });
      } else if (showToast) {
        showToast(successMessage, toastType);
      }
    },
    [execute, undo, canUndo, showToast]
  );

  return {
    executeWithToast,
    undo,
    canUndo,
    lastActionLabel,
  };
};

