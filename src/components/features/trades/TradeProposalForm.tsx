import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassmorphicTextarea } from '@/components/forms/GlassmorphicTextarea';
import { AccessibleFormField } from '@/components/ui/AccessibleFormField';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/AuthContext';
import { Trade } from '@/services/firestore';
import { EmbeddedEvidence } from '@/types/evidence';
import { createTradeProposal } from '@/services/firestore-exports';
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
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [portfolioEvidence, setPortfolioEvidence] = useState<EmbeddedEvidence[]>([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ message?: string }>({});

  const validateForm = () => {
    const newErrors: { message?: string } = {};
    
    if (!message.trim()) {
      newErrors.message = 'Please enter a message for your proposal.';
    } else if (message.length < 50) {
      newErrors.message = 'Message must be at least 50 characters.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Authentication check
    if (!currentUser) {
      addToast('error', 'You must be logged in to submit a proposal');
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const proposalData = {
        tradeId: trade.id!,
        proposerId: currentUser.uid,
        proposerName: currentUser.displayName || undefined,
        proposerPhotoURL: currentUser.photoURL || undefined,
        message,
        skillsOffered: trade.skillsWanted, // What proposer can provide
        skillsRequested: trade.skillsOffered, // What proposer wants
        evidence: portfolioEvidence,
        status: 'pending' as const,
      };
      
      const result = await createTradeProposal(proposalData);

      if (result.data) {
        addToast('success', 'Your proposal has been submitted successfully!');
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Failed to submit proposal');
      }
    } catch (error: any) {
      // In production, we should use a proper logging service instead of console.error
      
      // Better error messages
      if (error?.code === 'permission-denied') {
        addToast('error', 'You do not have permission to submit proposals.');
      } else if (error?.code === 'already-exists') {
        addToast('error', 'You have already submitted a proposal for this trade.');
      } else if (error?.code === 'unauthenticated') {
        addToast('error', 'Please log in to submit a proposal.');
      } else if (error?.message) {
        addToast('error', error.message);
      } else {
        addToast('error', 'Failed to submit proposal. Please try again.');
      }
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
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <p className="text-muted-foreground text-sm">
        Explain why you're a good fit for this trade. You can add evidence from your portfolio to support your proposal.
      </p>

      <div className="space-y-6">
        {/* Proposal Message */}
        <AccessibleFormField
          label="Your Message"
          id="proposal-message"
          required
          helpText="Minimum 50 characters. Describe your skills and how you can contribute."
          error={errors.message}
        >
          <GlassmorphicTextarea
            id="proposal-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your skills and how you can contribute..."
            required
            variant="glass"
            brandAccent="adaptive"
            minRows={4}
            maxRows={10}
            showCharacterCount={false}
            error={errors.message}
            className={`${errors.message ? 'border-destructive' : ''}`}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {message.length} characters {message.length < 50 ? `(${50 - message.length} more needed)` : '✓'}
          </div>
        </AccessibleFormField>

        {/* Submitted Evidence Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Evidence ({portfolioEvidence.length})</h3>
          {portfolioEvidence.length > 0 && (
            <div className="space-y-3 rounded-lg glassmorphic border-glass backdrop-blur-xl bg-white/5 p-4">
              {portfolioEvidence.map((evidence, index) => (
                <div 
                  key={`evidence-${evidence.id || `${evidence.title}-${index}`}`}
                  className="flex items-center justify-between rounded-lg glassmorphic border-glass backdrop-blur-sm bg-white/5 p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{evidence.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{evidence.embedService}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Remove "${evidence.title}" from your proposal?`)) {
                        handleRemoveEvidence(index);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${evidence.title}`}
                  >
                    <XCircle className="h-4 w-4" />
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
              variant="glassmorphic"
              topic="trades"
              onClick={() => setShowEvidenceForm(true)}
              className="hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Evidence
            </Button>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto glassmorphic min-h-[44px]"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || message.length < 50}
          variant="glassmorphic"
          topic="trades"
          className="w-full sm:w-auto hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
          aria-label={`Submit Proposal${message.length < 50 ? ` (need ${50 - message.length} more characters)` : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
        </Button>
      </div>
    </form>
  );
};

export default TradeProposalForm; 