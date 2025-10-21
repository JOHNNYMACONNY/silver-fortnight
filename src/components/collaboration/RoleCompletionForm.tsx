import React, { useState } from 'react';
import { CollaborationRoleData } from '../../types/collaboration';
import { EmbeddedEvidence } from '../../types/evidence';
import EvidenceSubmitter from '../evidence/EvidenceSubmitter';
import { EvidenceGallery } from '../features/evidence/EvidenceGallery';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';

interface RoleCompletionFormProps {
  role: CollaborationRoleData;
  collaborationTitle: string;
  onSubmit: (completionData: {
    notes: string;
    evidence?: EmbeddedEvidence[];
  }) => Promise<void>;
  onCancel: () => void;
}

export const RoleCompletionForm: React.FC<RoleCompletionFormProps> = ({
  role,
  collaborationTitle,
  onSubmit,
  onCancel
}) => {
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<EmbeddedEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!notes.trim()) {
      setError('Please provide completion notes');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        notes,
        evidence: evidence.length > 0 ? evidence : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your completion request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvidenceChange = (updatedEvidence: EmbeddedEvidence[]) => {
    setEvidence(updatedEvidence);
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    setEvidence(evidence.filter(item => item.id !== evidenceId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Request Completion for: {role.title}</CardTitle>
          <CardDescription>
            Part of collaboration: {collaborationTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="completion-notes">Completion Notes</Label>
              <Textarea
                id="completion-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1"
                placeholder="Describe what you've accomplished and how you've fulfilled the role requirements..."
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Be specific about what you've completed and how it meets the requirements of the role.
              </p>
            </div>

            <div>
              <Label className="mb-2">Evidence of Completion</Label>

              {evidence.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">
                    Added Evidence
                  </h4>
                  <EvidenceGallery
                    evidence={evidence}
                    onRemove={handleRemoveEvidence}
                    isEditable={true}
                  />
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  Add New Evidence
                </h4>
                <EvidenceSubmitter
                  evidence={evidence}
                  onChange={handleEvidenceChange}
                  maxItems={5}
                />
              </div>
            </div>

            <CardFooter className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Request Completion
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoleCompletionForm;
