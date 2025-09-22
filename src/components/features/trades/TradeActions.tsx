import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { GlassmorphicForm } from '../../forms/GlassmorphicForm';
import { GlassmorphicTextarea } from '../../forms/GlassmorphicTextarea';
import { Trade } from '../../../services/firestore-exports';
import { User } from '../../../services/firestore-exports';
import { getTradeActions } from '../../../utils/tradeActionUtils';

interface TradeActionsProps {
  trade: Trade;
  tradeCreator: User | null;
  currentUser: any;
  isOwner: boolean;
  showContactForm: boolean;
  message: string;
  messageSent: boolean;
  sendingMessage: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onShowContactForm: () => void;
  onHideContactForm: () => void;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onRequestCompletion: () => void;
  onConfirmCompletion: () => void;
  onRequestChanges: () => void;
  onCancelTrade: () => void;
  onShowProposalForm: () => void;
  onShowReviewForm: () => void;
  actions: ReturnType<typeof getTradeActions>;
}

export const TradeActions: React.FC<TradeActionsProps> = React.memo(({
  trade,
  tradeCreator,
  currentUser,
  isOwner,
  showContactForm,
  message,
  messageSent,
  sendingMessage,
  onMessageChange,
  onSendMessage,
  onShowContactForm,
  onHideContactForm,
  onPrimaryAction,
  onSecondaryAction,
  onRequestCompletion,
  onConfirmCompletion,
  onRequestChanges,
  onCancelTrade,
  onShowProposalForm,
  onShowReviewForm,
  actions
}) => {
  const handlePrimaryAction = useCallback(() => {
    switch (actions.primaryAction) {
      case 'Submit Evidence':
      case 'Mark Complete':
        onRequestCompletion();
        break;
      case 'Confirm Completion':
        onConfirmCompletion();
        break;
      case 'Submit Proposal':
        onShowProposalForm();
        break;
      case 'View Proposals':
        document.getElementById('proposals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'Leave Review':
        onShowReviewForm();
        break;
      case 'Waiting for Other User':
        document.getElementById('evidence-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      default:
        onShowContactForm();
    }
  }, [actions.primaryAction, onRequestCompletion, onConfirmCompletion, onShowProposalForm, onShowReviewForm, onShowContactForm]);

  const handleSecondaryAction = useCallback(() => {
    if (actions.secondaryAction === 'Cancel Trade') {
      if (window.confirm('Are you sure you want to cancel this trade?')) {
        onCancelTrade();
      }
    } else if (actions.secondaryAction === 'Request Changes') {
      onRequestChanges();
    }
  }, [actions.secondaryAction, onCancelTrade, onRequestChanges]);

  if (isOwner) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This is your trade listing.</p>
        <div className="mt-4 flex space-x-4">
          <Button variant="primary" onClick={onPrimaryAction}>
            Edit Trade
          </Button>
          <Button variant="destructive" onClick={onSecondaryAction}>
            Delete Trade
          </Button>
          {trade.status === 'in-progress' && (
            <Button variant="success" onClick={onRequestCompletion}>
              Mark Complete
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            You need to be logged in to contact the trade owner.{' '}
            <Link to="/login" className="text-primary hover:text-primary/90 font-medium transition-colors duration-200">
              Log In
            </Link>
            {' '}or{' '}
            <Link to="/signup" className="text-primary hover:text-primary/90 font-medium transition-colors duration-200">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (trade.status === 'pending_confirmation' && trade.completionRequestedBy !== currentUser.uid) {
    return (
      <div className="p-6">
        <div className="w-full mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
          <h3 className="text-lg font-medium text-success-foreground mb-2">Trade Ready for Confirmation</h3>
          <p className="text-sm text-success-foreground mb-4">
            The other user has requested completion. You can now confirm the trade is complete.
          </p>
          <Button className="w-full" variant="success" onClick={onConfirmCompletion}>
            Confirm Trade Completion
          </Button>
        </div>

        <Button className="w-full" variant="primary" onClick={handlePrimaryAction} disabled={actions.primaryDisabled}>
          {actions.primaryAction}
        </Button>

        {actions.secondaryAction && (
          <Button className="w-full" variant="secondary" onClick={handleSecondaryAction} disabled={actions.secondaryDisabled}>
            {actions.secondaryAction}
          </Button>
        )}

        <button
          onClick={onShowContactForm}
          className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 mt-4"
        >
          Contact {tradeCreator?.displayName || 'User'}
        </button>
      </div>
    );
  }

  if (showContactForm) {
    return (
      <div className="p-6">
        <GlassmorphicForm 
          variant="modal" 
          brandAccent="gradient"
          className="p-6 transition-colors duration-200"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">Send a Message</h3>
            <button
              onClick={onHideContactForm}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {messageSent ? (
            <div className="glassmorphic p-4 mb-6 border border-success/20 bg-success/10">
              <p className="text-success-foreground">
                Message sent successfully! {tradeCreator?.displayName || 'The user'} will be notified.
              </p>
            </div>
          ) : (
            <form onSubmit={onSendMessage}>
              <GlassmorphicTextarea
                variant="glass"
                brandAccent="adaptive"
                label="Your Message"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={`Hi ${tradeCreator?.displayName || 'there'}, I'm interested in your trade...`}
                minRows={4}
                required
              />
              <div className="flex justify-end mt-6">
                <Button type="submit" variant="primary" disabled={sendingMessage}>
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </GlassmorphicForm>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-r from-background/10 to-transparent">
      <div className="flex flex-col space-y-3 sm:space-y-4" role="group" aria-label="Available trade actions">
        <Button 
          className="w-full min-h-[44px] transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]" 
          variant="primary" 
          onClick={handlePrimaryAction} 
          disabled={actions.primaryDisabled}
          aria-label={`${actions.primaryAction} for trade: ${trade.title}`}
          aria-describedby="primary-action-description"
        >
          {actions.primaryAction}
        </Button>

        {actions.secondaryAction && (
          <Button 
            className="w-full min-h-[44px] transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" 
            variant="secondary" 
            onClick={handleSecondaryAction} 
            disabled={actions.secondaryDisabled}
            aria-label={`${actions.secondaryAction} for trade: ${trade.title}`}
            aria-describedby="secondary-action-description"
          >
            {actions.secondaryAction}
          </Button>
        )}

        <button
          onClick={onShowContactForm}
          className="w-full min-h-[44px] bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          aria-label={`Contact ${tradeCreator?.displayName || 'trade creator'}`}
          aria-describedby="contact-description"
        >
          Contact {tradeCreator?.displayName || 'User'}
        </button>
      </div>

      {/* Hidden descriptions for screen readers */}
      <div className="sr-only">
        <div id="primary-action-description">
          {actions.primaryAction === 'Submit Evidence' && 'Submit evidence of completed work for this trade'}
          {actions.primaryAction === 'Mark Complete' && 'Mark this trade as completed'}
          {actions.primaryAction === 'Confirm Completion' && 'Confirm that the trade has been completed'}
          {actions.primaryAction === 'Submit Proposal' && 'Submit a proposal for this trade'}
          {actions.primaryAction === 'View Proposals' && 'View all proposals submitted for this trade'}
          {actions.primaryAction === 'Leave Review' && 'Leave a review for this trade'}
          {actions.primaryAction === 'Waiting for Other User' && 'Waiting for the other user to take action'}
        </div>
        <div id="secondary-action-description">
          {actions.secondaryAction === 'Cancel Trade' && 'Cancel this trade permanently'}
          {actions.secondaryAction === 'Request Changes' && 'Request changes to the trade terms'}
        </div>
        <div id="contact-description">
          Send a message to the trade creator to discuss this trade
        </div>
      </div>
    </div>
  );
});

TradeActions.displayName = 'TradeActions';
