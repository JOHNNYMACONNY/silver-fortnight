/**
 * Migration Status Component
 * 
 * Displays real-time migration progress and status
 */

import React, { useState, useEffect } from 'react';
import { migrationService, MigrationStatus, MigrationResult } from '../../services/migration/MigrationService';

interface MigrationStatusProps {
  onMigrationComplete?: (results: MigrationResult[]) => void;
  onMigrationError?: (error: string) => void;
}

export const MigrationStatusComponent: React.FC<MigrationStatusProps> = ({
  onMigrationComplete,
  onMigrationError
}) => {
  const [status, setStatus] = useState<MigrationStatus>(migrationService.getStatus());
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = migrationService.getStatus();
      setStatus(currentStatus);
      
      if (currentStatus.phase === 'completed') {
        setIsRunning(false);
        const migrationResults = migrationService.getResults();
        setResults(migrationResults);
        onMigrationComplete?.(migrationResults);
      } else if (currentStatus.phase === 'failed') {
        setIsRunning(false);
        onMigrationError?.(currentStatus.message);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onMigrationComplete, onMigrationError]);

  const startMigration = async () => {
    setIsRunning(true);
    try {
      await migrationService.executeMigration();
    } catch (error) {
      setIsRunning(false);
      onMigrationError?.(error as string);
    }
  };

  const getStatusColor = (phase: MigrationStatus['phase']) => {
    switch (phase) {
      case 'idle': return 'text-gray-500';
      case 'preparing': return 'text-blue-500';
      case 'migrating': return 'text-yellow-500';
      case 'validating': return 'text-purple-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'rollback': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (phase: MigrationStatus['phase']) => {
    switch (phase) {
      case 'idle': return '⏸️';
      case 'preparing': return '🔄';
      case 'migrating': return '⚡';
      case 'validating': return '🔍';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'rollback': return '↩️';
      default: return '⏸️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Database Migration Status
        </h2>
        <div className={`flex items-center space-x-2 ${getStatusColor(status.phase)}`}>
          <span className="text-2xl">{getStatusIcon(status.phase)}</span>
          <span className="font-semibold capitalize">{status.phase}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(status.progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-6">
        <p className="text-gray-700">{status.message}</p>
        {status.currentBatch > 0 && status.totalBatches > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Batch {status.currentBatch} of {status.totalBatches}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={startMigration}
          disabled={isRunning || status.phase === 'migrating'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Migrating...' : 'Start Migration'}
        </button>
        
        <button
          onClick={() => migrationService.rollbackMigration()}
          disabled={status.phase === 'idle' || status.phase === 'migrating'}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Rollback
        </button>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Migration Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {index === 0 ? 'Trades' : index === 1 ? 'Conversations' : 'Users'}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span> {result.totalDocuments}
                  </div>
                  <div>
                    <span className="text-gray-600">Migrated:</span> {result.migratedDocuments}
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span> {result.failedDocuments}
                  </div>
                  <div>
                    <span className="text-gray-600">Skipped:</span> {result.skippedDocuments}
                  </div>
                </div>
                {result.durationMs && (
                  <div className="text-sm text-gray-600 mt-2">
                    Duration: {Math.round(result.durationMs / 1000)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {status.errors.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Errors</h3>
          <div className="space-y-2">
            {status.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationStatusComponent;
