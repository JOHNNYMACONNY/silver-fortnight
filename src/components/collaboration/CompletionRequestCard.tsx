import React, { useState } from 'react';
import { CompletionRequest } from '../../types/collaboration';
import ProfileImageWithUser from '../ui/ProfileImageWithUser';
import { EvidenceGallery } from '../features/evidence/EvidenceGallery';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import Box from '../layout/primitives/Box';

interface CompletionRequestCardProps {
  request: CompletionRequest;
  onConfirm: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export const CompletionRequestCard: React.FC<CompletionRequestCardProps> = ({
  request,
  onConfirm,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm completion');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onReject(rejectReason);
      setShowRejectForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject completion');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box className="@container mb-4" style={{ containerType: 'inline-size' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <ProfileImageWithUser
                  userId={request.requesterId}
                  size="small"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(request.createdAt.toDate()).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4">
              <h4 className="text-sm font-medium">Completion Notes</h4>
              <p className="mt-1 text-sm">{request.notes}</p>
            </div>

            {request.evidence && request.evidence.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Completion Evidence</h4>
                <div className="mt-2">
                  <EvidenceGallery
                    evidence={request.evidence}
                    title="Submitted Evidence"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showRejectForm ? (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Rejection Reason</h4>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="Please provide a reason for rejecting this completion request..."
                />
                <div className="mt-2 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    disabled={isProcessing}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isProcessing}
                    size="sm"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                  size="sm"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  size="sm"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Confirm Completion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default CompletionRequestCard;
