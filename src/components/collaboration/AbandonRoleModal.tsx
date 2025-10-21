import React, { useState } from 'react';
import { CollaborationRoleData } from '../../types/collaboration';
import { AlertTriangle } from 'lucide-react';
import Box from '../layout/primitives/Box';

interface AbandonRoleModalProps {
  role: CollaborationRoleData;
  onAbandon: (reason: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal component for abandoning a role
 */
export const AbandonRoleModal: React.FC<AbandonRoleModalProps> = ({
  role,
  onAbandon,
  onClose
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAbandon = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for abandoning this role');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onAbandon(reason);
      // Close modal is handled by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abandon role');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box className="max-h-[80vh] overflow-y-auto @container" style={{ containerType: 'inline-size' }}>
      <div className="flex items-start mb-6">
        <div className="mr-4 text-amber-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            Abandon Role: {role.title}
          </h3>
          <p className="mt-2 text-foreground">
            This will mark the role as abandoned and remove the current participant. The role can be reopened later if needed.
          </p>
        </div>
      </div>

      {role.participantId && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <p className="font-medium text-foreground">
            Warning: This will remove the current participant from this role.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The participant will be notified that they have been removed from the role.
          </p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-foreground">
          Reason for Abandonment (Required)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
          placeholder="Please provide a reason for abandoning this role..."
        />
        <p className="mt-1 text-sm text-muted-foreground">
          This reason will be shared with the participant and will be visible in the role history.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className={`px-4 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Cancel
        </button>
        <button
          onClick={handleAbandon}
          disabled={isProcessing}
          className={`px-4 py-2 text-sm bg-amber-600 text-white hover:bg-amber-700 rounded-md ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Abandon Role
        </button>
      </div>
    </Box>
  );
};

export default AbandonRoleModal;
