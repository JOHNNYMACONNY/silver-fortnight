import React, { useState } from 'react';
import { CompletionRequest, CollaborationRoleData } from '../../types/collaboration';
import ProfileImageWithUser from '../ui/ProfileImageWithUser';
import { EvidenceGallery } from '../features/evidence/EvidenceGallery';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, FileTextIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";

interface CompletionReviewModalProps {
  request: CompletionRequest;
  role: CollaborationRoleData;
  collaborationTitle: string;
  onConfirm: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onClose: () => void;
}

/**
 * A modal component for reviewing role completion requests in detail
 */
export const CompletionReviewModal: React.FC<CompletionReviewModalProps> = ({
  request,
  role,
  collaborationTitle,
  onConfirm,
  onReject,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm();
      // Close modal is handled by parent component
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
      // Close modal is handled by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject completion');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-h-[80vh] overflow-y-auto border-none shadow-none">
      <CardHeader>
        <CardTitle>{role.title}</CardTitle>
        <CardDescription>
          Part of collaboration: {collaborationTitle}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex items-center">
          <ProfileImageWithUser
            userId={request.requesterId}
            size="medium"
          />
          <div className="ml-4">
            <p className="text-sm text-muted-foreground">
              Requested completion on {new Date(request.createdAt.toDate()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence
              {request.evidence && request.evidence.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {request.evidence.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <AnimatePresence mode="wait">
            <TabsContent value="details" className="mt-4">
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Completion Notes</h4>
                  <Card>
                    <CardContent className="p-4">
                      <p>{request.notes}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills?.map(skill => (
                      <Badge key={skill.name} variant="default">
                        {skill.name} ({skill.level})
                      </Badge>
                    ))}
                  </div>
                </div>

                {!showRejectForm && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">Feedback (Optional)</h4>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      placeholder="Provide feedback on the completed work..."
                    />
                  </div>
                )}
              </motion.div>
            </TabsContent>
            <TabsContent value="evidence" className="mt-4">
              <motion.div
                key="evidence"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {request.evidence && request.evidence.length > 0 ? (
                  <div className="mb-6">
                    <EvidenceGallery
                      evidence={request.evidence}
                      title="Completion Evidence"
                      expanded={true}
                    />
                  </div>
                ) : (
                  <Card className="text-center p-8">
                    <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No evidence was submitted with this completion request.</p>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {showRejectForm ? (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Rejection Reason</h4>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g., Evidence is insufficient, work does not meet quality standards..."
              required
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRejectForm(false)} disabled={isProcessing}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectForm(true)} disabled={isProcessing}>
              <XCircleIcon className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              <CheckCircleIcon className="mr-2 h-4 w-4" />
              {isProcessing ? 'Confirming...' : 'Confirm Completion'}
            </Button>
          </div>
        )}
        <div className="mt-2">
          <Button variant="ghost" onClick={onClose} className="w-full">Close</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionReviewModal;
