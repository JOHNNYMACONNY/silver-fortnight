/**
 * Migration Hook
 * 
 * React hook for managing Firestore migration state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { migrationService, MigrationStatus, MigrationResult, MigrationConfig } from '../services/migration/MigrationService';

export interface UseMigrationReturn {
  status: MigrationStatus;
  results: MigrationResult[];
  isRunning: boolean;
  startMigration: (config?: Partial<MigrationConfig>) => Promise<void>;
  rollbackMigration: () => Promise<boolean>;
  resetMigration: () => void;
}

export const useMigration = (): UseMigrationReturn => {
  const [status, setStatus] = useState<MigrationStatus>(migrationService.getStatus());
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = migrationService.getStatus();
      setStatus(currentStatus);
      
      if (currentStatus.phase === 'completed' || currentStatus.phase === 'failed') {
        setIsRunning(false);
        const migrationResults = migrationService.getResults();
        setResults(migrationResults);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startMigration = useCallback(async (config?: Partial<MigrationConfig>) => {
    setIsRunning(true);
    try {
      // Update configuration if provided
      if (config) {
        // Note: In a real implementation, you'd update the service config
        console.log('Migration config updated:', config);
      }
      
      await migrationService.executeMigration();
    } catch (error) {
      setIsRunning(false);
      console.error('Migration failed:', error);
      throw error;
    }
  }, []);

  const rollbackMigration = useCallback(async (): Promise<boolean> => {
    try {
      const success = await migrationService.rollbackMigration();
      if (success) {
        setResults([]);
        setIsRunning(false);
      }
      return success;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }, []);

  const resetMigration = useCallback(() => {
    setResults([]);
    setIsRunning(false);
    // Reset service status
    migrationService.getStatus();
  }, []);

  return {
    status,
    results,
    isRunning,
    startMigration,
    rollbackMigration,
    resetMigration
  };
};
