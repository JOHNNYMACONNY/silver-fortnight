import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { requestTradeCompletion } from '../../../services/firestore-exports';
import EvidenceSubmitter from '../../evidence/EvidenceSubmitter';
import { EmbeddedEvidence } from '../../../types/evidence';
import { EvidenceGallery } from '../evidence/EvidenceGallery';

interface TradeCompletionFormProps {
  tradeId: string;
  tradeName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradeCompletionForm: React.FC<TradeCompletionFormProps> = ({
  tradeId,
  tradeName,
  onSuccess,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<EmbeddedEvidence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // This function was removed as it's no longer used
  // We now directly update the evidence state in the onChange handler

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to request completion');
      }

      if (!notes.trim()) {
        throw new Error('Please provide completion notes');
      }

      if (evidence.length === 0) {
        throw new Error('Please provide at least one piece of evidence');
      }

      // Request trade completion
      const { error } = await requestTradeCompletion(
        tradeId,
        currentUser.uid,
        notes,
        evidence
      );

      if (error) {
        throw new Error(error.message || 'Failed to request completion');
      }

      // Success! Call the onSuccess callback
      onSuccess();

    } catch (err: any) {
      setError(err.message || 'Failed to request completion');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border-2 border-primary p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Request Trade Completion</h2>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <div className="bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-3 rounded-lg">
          <p className="font-medium">Important:</p>
          <p>Both participants must submit evidence before the trade can be completed. After you submit your evidence, the other participant will be notified to submit their evidence as well.</p>
          <p className="mt-2">Once both participants have submitted evidence, the trade will move to the "Pending Confirmation" status, and either participant can confirm the trade as completed.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Completion Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
              Completion Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder={`Describe what you've completed for the trade: "${tradeName}"`}
              required
            />
          </div>

          {/* Completion Evidence */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Completion Evidence
            </label>
            <p className="text-sm text-muted-foreground mb-4">
              Add links to your completed work as evidence.
            </p>

            {/* Display added evidence */}
            {evidence.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Added Evidence ({evidence.length}/5)</h4>
                <EvidenceGallery evidence={evidence} />
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="mb-4 p-2 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-success-foreground">{successMessage}</p>
              </div>
            )}

            {/* Evidence form or add button */}
            {showEvidenceForm ? (
              <div className="mb-4">
                <EvidenceSubmitter
                  onChange={(newEvidence) => {
                    // Add the new evidence to the existing array
                    setEvidence([...evidence, ...newEvidence]);

                    // Hide the form after successful submission
                    setShowEvidenceForm(false);

                    // Show success message
                    setSuccessMessage('Evidence added successfully');

                    // Clear the success message after 3 seconds
                    setTimeout(() => {
                      setSuccessMessage(null);
                    }, 3000);
                  }}
                  evidence={[]}
                  maxItems={5 - evidence.length}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEvidenceForm(true)}
                className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Evidence
              </button>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Completion'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TradeCompletionForm;
