import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../contexts/ToastContext';
import { runMigration } from '../scripts/migrateCollaborations';

const MigrationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only allow admin users to run migrations
  const isAdmin = currentUser?.uid === 'TozfQg0dAHe4ToLyiSnkDqe3ECj2'; // Replace with your admin user ID

  const handleRunMigration = async () => {
    if (!isAdmin) {
      addToast('error', 'Only administrators can run migrations');
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      // Create a proxy for console.log to capture output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const logs: string[] = [];

      console.log = (...args) => {
        logs.push(args.join(' '));
        originalConsoleLog(...args);
      };

      console.error = (...args) => {
        logs.push(`ERROR: ${args.join(' ')}`);
        originalConsoleError(...args);
      };

      // Run the migration
      await runMigration();

      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;

      // Set the result
      setResult(logs.join('\n'));
      addToast('success', 'Migration completed');
    } catch (err) {
      console.error('Error running migration:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      addToast('error', 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          Access denied. Only administrators can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Database Migrations</h1>

      <div className="bg-card p-6 mb-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">Collaboration Roles Migration</h2>
        <p className="mb-4 text-foreground">
          This migration will update existing collaborations to use the new roles subcollection structure.
          It will create role documents for each role in the collaboration and update the collaboration document.
        </p>
        <p className="mb-6 text-muted-foreground">
          <strong>Warning:</strong> Make sure you have a backup of your data before running this migration.
        </p>

        <button
          onClick={handleRunMigration}
          disabled={isRunning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Migration...
            </span>
          ) : (
            'Run Migration'
          )}
        </button>

        {error && (
          <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Result</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationPage;
