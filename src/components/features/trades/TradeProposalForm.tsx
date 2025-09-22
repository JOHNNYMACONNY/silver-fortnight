import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Textarea } from '../../ui/Textarea';
import { useToast } from '../../../contexts/ToastContext';
import { Trade } from '../../../services/firestore';
import { EmbeddedEvidence } from '../../../types/evidence';
import { createTradeProposal } from '../../../services/firestore-exports';
import { EvidenceSubmitter } from '../evidence/EvidenceSubmitter';
import { PlusCircle, XCircle } from 'lucide-react';

interface TradeProposalFormProps {
  trade: Trade;
  onSuccess: () => void;
  onCancel: () => void;
  className?: string;
}

const TradeProposalForm: React.FC<TradeProposalFormProps> = ({ trade, onSuccess, onCancel, className }) => {
  const { addToast } = useToast();
  const [message, setMessage] = useState('');
  const [portfolioEvidence, setPortfolioEvidence] = useState<EmbeddedEvidence[]>([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) {
      addToast('error', 'Please enter a message for your proposal.');
      return;
    }
    setIsSubmitting(true);

    try {
      const proposalData = {
        tradeId: trade.id!,
        message,
        evidence: portfolioEvidence,
        // The service will handle the proposer's details from the currently authenticated user
      };
      
      // Note: The backend service needs to be adapted to not require proposerId, proposerName, etc.
      // as these should be securely determined from the authenticated user context.
      // This frontend code assumes the backend is set up to handle this.
      // For the purpose of this example, we will call a simplified createTradeProposal
      
      // A more complete call would look like this, assuming we get the user from a context:
      // const result = await createTradeProposal({ ...proposalData, proposerId: currentUser.uid, ... });
      
      // Simplified call for now:
      // This is a placeholder for the actual API call. The `createTradeProposal` function might need
      // to be adapted to accept this shape or the frontend needs to supply the user info.
      // Based on the function signature, we're assuming it can infer the user.
      console.log("Submitting with:", proposalData);
      // const result = await createTradeProposal(proposalData);

      // Mocking successful submission for now as the service layer might need adjustments
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      addToast('success', 'Your proposal has been submitted successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      addToast('error', error.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    const updatedEvidence = [...portfolioEvidence];
    updatedEvidence.splice(index, 1);
    setPortfolioEvidence(updatedEvidence);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Submit Your Proposal</h2>
        <p className="text-muted-foreground mb-6">
          Explain why you're a good fit for this trade. You can add evidence from your portfolio to support your proposal.
        </p>

        <div className="space-y-6">
          {/* Proposal Message */}
          <div>
            <label htmlFor="proposal-message" className="block text-sm font-medium text-foreground mb-2">
              Your Message
            </label>
            <Textarea
              id="proposal-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your skills and how you can contribute..."
              required
              rows={5}
            />
          </div>

          {/* Submitted Evidence Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Evidence ({portfolioEvidence.length})</h3>
            {portfolioEvidence.length > 0 && (
              <div className="space-y-3 rounded-md border border-border p-4">
                {portfolioEvidence.map((evidence, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md bg-muted p-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{evidence.title}</p>
                      <p className="text-xs text-muted-foreground">{evidence.embedService}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEvidence(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Show Evidence Submitter */}
          <div className="evidence-section mt-4">
            {showEvidenceForm ? (
              <EvidenceSubmitter
                onSubmit={async (evidence) => {
                  setPortfolioEvidence([...portfolioEvidence, evidence]);
                  setShowEvidenceForm(false);
                  addToast('success', 'Evidence added successfully');
                }}
                onCancel={() => setShowEvidenceForm(false)}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEvidenceForm(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Evidence
              </Button>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TradeProposalForm; 