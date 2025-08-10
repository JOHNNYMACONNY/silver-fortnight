import React, { useState } from 'react';
import { CollaborationRoleData, RoleState } from '../../types/collaboration';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileImageWithUser from '../ui/ProfileImageWithUser';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface RoleReplacementSectionProps {
  role: CollaborationRoleData;
  onReopen: (reason: string) => Promise<void>;
  onMarkAsUnneeded: (reason: string) => Promise<void>;
}

/**
 * Component for managing abandoned roles, allowing reopening or marking as no longer needed
 */
export const RoleReplacementSection: React.FC<RoleReplacementSectionProps> = ({
  role,
  onReopen,
  onMarkAsUnneeded
}) => {
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [showUnneededForm, setShowUnneededForm] = useState(false);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for abandoned roles
  if (role.status !== RoleState.ABANDONED) {
    return null;
  }

  const handleReopen = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for reopening this role');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onReopen(reason);
      setShowReopenForm(false);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen role');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsUnneeded = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for marking this role as no longer needed');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onMarkAsUnneeded(reason);
      setShowUnneededForm(false);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark role as no longer needed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-4 mb-4 border-l-4 border-amber-500"
    >
      <div className="flex items-start">
        <div className="mr-4 text-amber-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground">
            This role has been abandoned
          </h3>

          {role.status === RoleState.ABANDONED && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-foreground">Reason:</h4>
              <p className="mt-1 text-sm text-foreground">{role.status === RoleState.ABANDONED ? 'Role abandoned.' : ''}</p>
            </div>
          )}

          {role.participantId && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground">Previous Participant:</h4>
              <div className="mt-1">
                <ProfileImageWithUser
                  userId={role.participantId}
                  profileUrl={role.participantPhotoURL}
                  size="medium"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <AnimatePresence>
            {showReopenForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <h4 className="text-sm font-medium text-foreground">Reopen Role</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will make the role available for new applications.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Please provide a reason for reopening this role..."
                />
                <div className="mt-3 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowReopenForm(false);
                      setReason('');
                      setError(null);
                    }}
                    disabled={isProcessing}
                    aria-label="Cancel reopen"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleReopen}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    aria-label="Reopen role"
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reopen Role
                  </Button>
                </div>
              </motion.div>
            ) : showUnneededForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <h4 className="text-sm font-medium text-foreground">Mark as No Longer Needed</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will permanently remove this role from the collaboration.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Please provide a reason for marking this role as no longer needed..."
                />
                <div className="mt-3 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowUnneededForm(false);
                      setReason('');
                      setError(null);
                    }}
                    disabled={isProcessing}
                    aria-label="Cancel mark as unneeded"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleMarkAsUnneeded}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    aria-label="Mark as unneeded"
                    className="flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Mark as Unneeded
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setShowUnneededForm(true);
                    setShowReopenForm(false);
                    setReason('');
                    setError(null);
                  }}
                  className="flex items-center"
                  aria-label="Show mark as unneeded"
                >
                  <X className="h-4 w-4 mr-1" />
                  Mark as Unneeded
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setShowReopenForm(true);
                    setShowUnneededForm(false);
                    setReason('');
                    setError(null);
                  }}
                  className="flex items-center"
                  aria-label="Show reopen role"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reopen Role
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default RoleReplacementSection;
