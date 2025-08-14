import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { confirmTradeCompletion, requestTradeChanges, Trade } from '../../../services/firestore-exports';
import { generateTradePortfolioItem } from '../../../services/portfolio';
import { EvidenceGallery } from '../../features/evidence/EvidenceGallery';
import { ConfirmationButton, NegotiationResponseButton, AnimatedButton } from '../../animations';

interface TradeConfirmationFormProps {
  trade: Trade;
  initialMode?: 'confirm' | 'requestChanges'; // Add initialMode prop
  onSuccess: () => void;
  onCancel: () => void;
  onRequestChanges: () => void;
}

const TradeConfirmationForm: React.FC<TradeConfirmationFormProps> = ({
  trade,
  initialMode = 'confirm', // Apply default value for initialMode
  onSuccess,
  onCancel,
  onRequestChanges
}) => {
  const { currentUser } = useAuth();
  const [showChangeRequestForm, setShowChangeRequestForm] = useState(initialMode === 'requestChanges');
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setShowChangeRequestForm(initialMode === 'requestChanges');
  }, [initialMode]);

  // Handle confirmation
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to confirm completion');
      }

      if (!trade.id) {
        throw new Error('Trade ID is missing');
      }

      // Confirm trade completion
      const { error } = await confirmTradeCompletion(
        trade.id,
        currentUser.uid
      );

      if (error) {
        throw new Error(error.message || 'Failed to confirm completion');
      }

      // Generate portfolio items for both participants
      // Note: We continue even if portfolio generation fails to avoid blocking trade completion
      try {
        // Generate portfolio item for the trade creator
        if (trade.creatorId) {
          await generateTradePortfolioItem(
            {
              id: trade.id,
              title: trade.title,
              description: trade.description,
              offeredSkills: trade.offeredSkills.map(skill => typeof skill === 'string' ? skill : skill.name),
              requestedSkills: trade.requestedSkills.map(skill => typeof skill === 'string' ? skill : skill.name),
              completionConfirmedAt: trade.completionConfirmedAt,
              updatedAt: trade.updatedAt,
              completionEvidence: trade.completionEvidence,
              creatorId: trade.creatorId,
              participantId: trade.participantId || '',
              creatorName: trade.creatorName,
              participantPhotoURL: undefined,
              creatorPhotoURL: undefined,
            },
            trade.creatorId,
            true, // isCreator
            true  // defaultVisibility
          );
        }

        // Generate portfolio item for the trade participant
        if (trade.participantId) {
          await generateTradePortfolioItem(
            {
              id: trade.id,
              title: trade.title,
              description: trade.description,
              offeredSkills: trade.offeredSkills.map(skill => typeof skill === 'string' ? skill : skill.name),
              requestedSkills: trade.requestedSkills.map(skill => typeof skill === 'string' ? skill : skill.name),
              completionConfirmedAt: trade.completionConfirmedAt,
              updatedAt: trade.updatedAt,
              completionEvidence: trade.completionEvidence,
              creatorId: trade.creatorId,
              participantId: trade.participantId,
              creatorName: trade.creatorName,
              participantPhotoURL: undefined,
              creatorPhotoURL: undefined,
            },
            trade.participantId,
            false, // isCreator
            true   // defaultVisibility
          );
        }
      } catch (portfolioError: any) {
        // Log portfolio generation error but don't fail the trade confirmation
        console.warn('Portfolio generation failed:', portfolioError.message);
      }

      // Success! Call the onSuccess callback
      onSuccess();

    } catch (err: any) {
      console.error('Error confirming trade completion:', err);
      setError(err.message || 'Failed to confirm completion');
      setIsSubmitting(false);
    }
  };

  // Handle change request
  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to request changes');
      }

      if (!trade.id) {
        throw new Error('Trade ID is missing');
      }

      if (!changeReason.trim()) {
        throw new Error('Please provide a reason for the requested changes');
      }

      // Request changes
      const { error } = await requestTradeChanges(
        trade.id,
        currentUser.uid,
        changeReason
      );

      if (error) {
        throw new Error(error.message || 'Failed to request changes');
      }

      // Success! Call the onRequestChanges callback
      onRequestChanges();

    } catch (err: any) {
      setError(err.message || 'Failed to request changes');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {showChangeRequestForm ? 'Request Changes' : 'Confirm Trade Completion'}
        </h2>
        <AnimatedButton
          onClick={onCancel}
          variant="ghost"
          size="sm"
          tradingContext="general"
          className="text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </AnimatedButton>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!showChangeRequestForm ? (
        <>
          <div className="mb-6">
            <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg">
              <p className="font-medium">Completion Request</p>
              <p>The other participant has requested to mark this trade as complete. Please review their work and confirm if the trade is complete.</p>
            </div>
          </div>

          {/* Completion Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">Completion Notes</h3>
            <div className="bg-muted/50 border border-border p-4 rounded-lg">
              <p className="text-muted-foreground whitespace-pre-line">{trade.completionNotes || 'No notes provided.'}</p>
            </div>
          </div>

          {/* Completion Evidence */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">Completion Evidence</h3>

            {((trade.completionEvidence && trade.completionEvidence.length > 0) || (trade.evidence && trade.evidence.length > 0)) ? (
              <EvidenceGallery
                evidence={trade.completionEvidence && trade.completionEvidence.length > 0 ? trade.completionEvidence : (trade.evidence || [])}
                title=""
                emptyMessage="No evidence has been provided."
              />
            ) : (
              <div className="bg-muted/50 border border-border p-4 rounded-lg">
                <p className="text-muted-foreground italic">No evidence has been provided.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <NegotiationResponseButton
              type="button"
              onClick={() => setShowChangeRequestForm(true)}
              disabled={isSubmitting}
            >
              Request Changes
            </NegotiationResponseButton>
            <ConfirmationButton
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Completion'}
            </ConfirmationButton>
          </div>
        </>
      ) : (
        <form onSubmit={handleRequestChanges} className="space-y-4">
          <div>
            <label htmlFor="changeReason" className="block text-sm font-medium text-foreground mb-1">
              Reason for Requesting Changes
            </label>
            <textarea
              id="changeReason"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="e.g., 'The final asset was not delivered in the agreed-upon format. Please provide a high-resolution PNG.'"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-4">
            <AnimatedButton
              type="button"
              onClick={() => setShowChangeRequestForm(false)}
              variant="secondary"
              tradingContext="general"
              disabled={isSubmitting}
            >
              Back
            </AnimatedButton>
            <NegotiationResponseButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Change Request'}
            </NegotiationResponseButton>
          </div>
        </form>
      )}
    </div>
  );
};

export default TradeConfirmationForm;
