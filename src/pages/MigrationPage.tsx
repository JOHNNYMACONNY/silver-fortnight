/**
 * Migration Management Page
 * 
 * Admin page for managing Firestore database migration
 */

import React, { useState } from 'react';
import { MigrationStatusComponent } from '../components/migration/MigrationStatus';
import { useMigration } from '../hooks/useMigration';
import { logger } from '@utils/logging/logger';

export const MigrationPage: React.FC = () => {
  const { status, results, isRunning, startMigration, rollbackMigration, resetMigration } = useMigration();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [migrationConfig, setMigrationConfig] = useState({
    batchSize: 50,
    maxRetries: 3,
    retryDelay: 1000,
    enableValidation: true,
    enableRollback: true,
    dryRun: false
  });

  const handleMigrationComplete = (results: any[]) => {
    logger.debug('Migration completed:', 'PAGE', results);
    // Show success notification
  };

  const handleMigrationError = (error: string) => {
    logger.error('Migration error:', 'PAGE', {}, error as Error);
    // Show error notification
  };

  const handleStartMigration = async () => {
    try {
      await startMigration(migrationConfig);
    } catch (error) {
      logger.error('Failed to start migration:', 'PAGE', {}, error as Error);
    }
  };

  const handleRollback = async () => {
    if (window.confirm('Are you sure you want to rollback the migration? This action cannot be undone.')) {
      const success = await rollbackMigration();
      if (success) {
        logger.debug('Rollback completed successfully', 'PAGE');
      } else {
        logger.error('Rollback failed', 'PAGE');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the migration status?')) {
      resetMigration();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Migration</h1>
          <p className="mt-2 text-gray-600">
            Manage Firestore database schema migration from legacy to optimized format
          </p>
        </div>

        {/* Migration Status */}
        <div className="mb-8">
          <MigrationStatusComponent
            onMigrationComplete={handleMigrationComplete}
            onMigrationError={handleMigrationError}
          />
        </div>

        {/* Migration Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Migration Controls</h2>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleStartMigration}
              disabled={isRunning || status.phase === 'migrating'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Migration in Progress...' : 'Start Migration'}
            </button>
            
            <button
              onClick={handleRollback}
              disabled={status.phase === 'idle' || status.phase === 'migrating'}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rollback Migration
            </button>
            
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Status
            </button>
          </div>

          {/* Advanced Configuration */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Configuration
            </button>
            
            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={migrationConfig.batchSize}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      batchSize: parseInt(e.target.value) || 50
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    value={migrationConfig.maxRetries}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      maxRetries: parseInt(e.target.value) || 3
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={migrationConfig.retryDelay}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      retryDelay: parseInt(e.target.value) || 1000
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={migrationConfig.enableValidation}
                      onChange={(e) => setMigrationConfig(prev => ({
                        ...prev,
                        enableValidation: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Enable Validation</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={migrationConfig.enableRollback}
                      onChange={(e) => setMigrationConfig(prev => ({
                        ...prev,
                        enableRollback: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Enable Rollback</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={migrationConfig.dryRun}
                      onChange={(e) => setMigrationConfig(prev => ({
                        ...prev,
                        dryRun: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Dry Run</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Migration Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Migration Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">What This Migration Does</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Updates trades collection with optimized schema</li>
                <li>• Migrates conversations to new participant format</li>
                <li>• Normalizes user profiles for better performance</li>
                <li>• Adds search optimization fields</li>
                <li>• Implements new indexing strategy</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Safety Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Zero-downtime migration process</li>
                <li>• Automatic rollback on failure</li>
                <li>• Data validation at each step</li>
                <li>• Progress monitoring and logging</li>
                <li>• Backup verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Migration Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {index === 0 ? 'Trades Collection' : 
                     index === 1 ? 'Conversations Collection' : 
                     'Users Collection'}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Documents:</span>
                      <span className="font-medium">{result.totalDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Migrated:</span>
                      <span className="font-medium text-green-600">{result.migratedDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">{result.failedDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skipped:</span>
                      <span className="font-medium text-yellow-600">{result.skippedDocuments}</span>
                    </div>
                    {result.durationMs && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{Math.round(result.durationMs / 1000)}s</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationPage;