/**
 * Firebase Emergency Reset Component
 * 
 * Provides emergency reset functionality when Firebase internal assertion failures occur
 */

import React, { useState } from 'react';
// import { resetFirebaseConnections, wasResetRequested, clearResetFlags } from '../../utils/firebaseConnectionReset';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export const FirebaseEmergencyReset: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleEmergencyReset = async () => {
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      console.log('🚨 Initiating Firebase emergency reset...');
      const result = await resetFirebaseConnections();
      setResetResult(result);
      
      if (result.success) {
        console.log('✅ Firebase emergency reset completed');
      } else {
        console.error('❌ Firebase emergency reset failed:', result.error);
      }
    } catch (error: any) {
      console.error('❌ Emergency reset error:', error);
      setResetResult({
        success: false,
        error: error.message,
        actions: ['Emergency reset failed']
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearFlags = () => {
    clearResetFlags();
    setResetResult(null);
    setShowWarning(false);
    console.log('🧹 Cleared Firebase reset flags');
  };

  const wasReset = wasResetRequested();

  return (
    <Card className="p-6 space-y-4 border-red-200 bg-red-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">Firebase Emergency Reset</h3>
        </div>
        <Badge variant={wasReset ? 'destructive' : 'secondary'}>
          {wasReset ? 'Reset Requested' : 'Normal'}
        </Badge>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Critical Firebase Error Detected</AlertTitle>
        <AlertDescription>
          Firebase SDK is experiencing internal assertion failures. This emergency reset will:
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Terminate all Firebase connections</li>
            <li>Clear cached Firebase state</li>
            <li>Reload the page to reset everything</li>
            <li>Switch to offline message loading</li>
          </ul>
        </AlertDescription>
      </Alert>

      {resetResult && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {resetResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${resetResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {resetResult.success ? 'Reset Successful' : 'Reset Failed'}
            </span>
          </div>
          
          {resetResult.error && (
            <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
              <strong>Error:</strong> {resetResult.error}
            </div>
          )}
          
          {resetResult.actions && resetResult.actions.length > 0 && (
            <div className="text-sm">
              <strong>Actions taken:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {resetResult.actions.map((action: string, index: number) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!showWarning ? (
          <Button 
            onClick={handleEmergencyReset}
            disabled={isResetting}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Emergency Reset</span>
          </Button>
        ) : (
          <Button 
            onClick={handleEmergencyReset}
            disabled={isResetting}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            {isResetting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{isResetting ? 'Resetting...' : 'Confirm Reset'}</span>
          </Button>
        )}
        
        <Button 
          onClick={handleClearFlags}
          variant="outline"
          disabled={isResetting}
        >
          Clear Flags
        </Button>
      </div>

      {showWarning && !resetResult && (
        <div className="text-sm text-amber-700 bg-amber-100 p-3 rounded">
          <strong>⚠️ Warning:</strong> This will reload the page and may cause temporary data loss. 
          Make sure to save any important work before proceeding.
        </div>
      )}

      <div className="text-xs text-gray-600">
        <strong>Status:</strong> {wasReset ? 'Reset was recently requested' : 'No reset pending'}
        <br />
        <strong>Note:</strong> This component helps recover from Firebase SDK internal assertion failures.
      </div>
    </Card>
  );
};
