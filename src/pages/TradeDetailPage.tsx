import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getTrade,
  updateTrade,
  deleteTrade,
  Trade as BaseTrade,
  createMessage,
  createConversation,
  getUserProfile,
  User,
  TradeSkill // Changed from Skill to TradeSkill if it's defined in firestore.ts, or remove if not used directly here
} from '../services/firestore-exports';

// Extend the Trade interface to include the images property
interface Trade extends BaseTrade {
  images?: string[];
  // Ensure offeredSkills and requestedSkills are of type TradeSkill[] if that's the canonical type
  offeredSkills: TradeSkill[]; // Changed from optional to non-optional
  requestedSkills: TradeSkill[]; // Changed from optional to non-optional
}
import { TradeSkillDisplay } from '../components/features/trades/TradeSkillDisplay';
import ProfileImageWithUser from '../components/ui/ProfileImageWithUser';
import { getTradeStatusClasses, formatStatus } from '../utils/statusUtils';
// Make sure we're using the correct getTradeActions function
import { getTradeActions } from '../utils/tradeActionUtils';
import { ReviewForm } from '../components/features/reviews/ReviewForm';
import { MultipleImageUploader } from '../components/features/uploads/MultipleImageUploader';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';

import TradeProposalDashboard from '../components/features/trades/TradeProposalDashboard';
import TradeStatusTimeline from '../components/features/trades/TradeStatusTimeline';
import TradeCompletionForm from '../components/features/trades/TradeCompletionForm';
import TradeConfirmationForm from '../components/features/trades/TradeConfirmationForm';
import ChangeRequestHistory from '../components/features/trades/ChangeRequestHistory';
import { EvidenceGallery } from '../components/features/evidence/EvidenceGallery';
import { ConfirmationCountdown } from '../components/features/trades/ConfirmationCountdown';
import TradeProposalForm from '../components/features/trades/TradeProposalForm';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Edit, Trash2, MapPin, Clock, DollarSign, Users } from 'lucide-react';

// Additional interface for local state
// interface LocalState {
//   // Any additional properties needed for UI state
// }

export const TradeDetailPage: React.FC = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [tradeCreator, setTradeCreator] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOffering, setEditOffering] = useState('');
  const [editSeeking, setEditSeeking] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState('open');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Images state
  const [images, setImages] = useState<string[]>([]);

  // Proposal state
  const [showProposalForm, setShowProposalForm] = useState(false);

  // Completion and confirmation state
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);

  // Navigation and location
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { isEditing?: boolean } | null;

  const [confirmationInitialMode, setConfirmationInitialMode] = useState<'confirm' | 'requestChanges'>('confirm');

  // Fetch trade details
  useEffect(() => {
    const fetchTradeDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!tradeId) {
          throw new Error('Trade ID is required');
        }

        const { data, error } = await getTrade(tradeId);

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Trade not found');

        const tradeData = data as Trade;
        setTrade(tradeData);

        // Set images if available
        if (tradeData.images && Array.isArray(tradeData.images)) {
          setImages(tradeData.images);
        }

        // Fetch the trade creator's profile
        if (tradeData.creatorId) {
          fetchTradeCreator(tradeData.creatorId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch trade details');
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [tradeId]);

  // Fetch trade creator's profile
  const fetchTradeCreator = async (userId: string) => {
    setLoadingCreator(true);
    try {
      const { data, error } = await getUserProfile(userId);

      if (error) throw new Error(error.message);
      if (data) {
        setTradeCreator(data as User);
      }
    } catch (err: any) {
      console.error('Error fetching trade creator:', err);
      // We don't set the main error state here to avoid disrupting the page
    } finally {
      setLoadingCreator(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to send a message');
      }

      if (!trade) {
        throw new Error('Trade not found');
      }

      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      // Make sure we have a valid trade user ID
      if (!trade.creatorId) {
        throw new Error('Trade has no associated user ID');
      }

      // Use creatorId as fallback for userId
      const tradeOwnerId = trade.creatorId;

      // Create a new conversation
      const { data: conversationData, error: conversationError } = await createConversation(
        [ // Participants array
          { id: currentUser.uid, name: currentUser.displayName || 'You' },
          { id: tradeOwnerId, name: trade.creatorName || tradeCreator?.displayName || 'User' }
        ],
        { // Metadata object
          tradeId: trade.id,
          tradeName: trade.title,
          conversationType: 'direct',
        }
      );


      if (conversationError) throw new Error(conversationError.message);
      if (!conversationData) throw new Error('Failed to create conversation'); // conversationData is the ID string

      // Send the message
      const { error: messageError } = await createMessage(
        conversationData, // Pass conversationId string directly
        { // This is the messageData object
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'You',
          senderAvatar: currentUser.photoURL || undefined,
          content: message,
          read: false,
          // status: 'sent', // Assuming Message type includes status and type
          // type: 'text'
        } as any // Type assertion to allow senderName
      );

      if (messageError) throw new Error(messageError.message);

      setMessageSent(true);
      setMessage('');

      // Hide the form after a delay
      setTimeout(() => {
        setShowContactForm(false);
        setMessageSent(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Check if the current user is the owner of this trade
  const isOwner = currentUser && trade &&
    (currentUser.uid === trade.creatorId);

  // Sample categories (same as in TradesPage)
  const categories = [
    'Web Development',
    'Graphic Design',
    'Writing & Translation',
    'Photography & Video',
    'Marketing',
    'Business',
    'Music & Audio',
    'Programming & Tech',
    'Education & Tutoring',
    'Other'
  ];

  // Initialize edit form when trade data is loaded
  useEffect(() => {
    if (trade) {
      setEditTitle(trade.title);
      setEditDescription(trade.description);
      setEditOffering(trade.offeredSkills ? trade.offeredSkills.map(s => s.name).join(', ') : '');
      setEditSeeking(trade.requestedSkills ? trade.requestedSkills.map(s => s.name).join(', ') : '');
      setEditCategory(trade.category || '');
      // Map 'active' status to 'open' for backward compatibility
      // Using type assertion to handle potential 'active' status from older data
      setEditStatus((trade.status as string) === 'active' ? 'open' : (trade.status || 'open'));

      // Check if we should enter edit mode from location state
      if (locationState?.isEditing) {
        setIsEditing(true);
      }
    }
  }, [trade, locationState]);

  // Handle saving edited trade
  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to edit a trade');
      }

      if (!trade) {
        throw new Error('Trade not found');
      }

      if (!editTitle || !editDescription || !editOffering || !editSeeking || !editCategory) {
        throw new Error('All fields are required');
      }

      const updatedTradeData = {
        title: editTitle,
        description: editDescription,
        // offering: editOffering, // Keep if your backend still uses this string form
        // seeking: editSeeking,   // Keep if your backend still uses this string form
        offeredSkills: editOffering.split(',').map(skill => ({ name: skill.trim(), level: 'intermediate' }) as TradeSkill), // Map to TradeSkill[]
        requestedSkills: editSeeking.split(',').map(skill => ({ name: skill.trim(), level: 'intermediate' }) as TradeSkill), // Map to TradeSkill[]
        category: editCategory,
        status: editStatus as 'open' | 'in-progress' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed',
        images: images
      };

      try {
        await updateTrade(trade.id!, updatedTradeData);
      } catch (err: any) {
        setError(err.message || 'Failed to update trade');
        setIsSaving(false);
        return;
      }

      // Update the local trade object to reflect changes
      if (trade) {
        const newTrade: Trade = {
          ...trade,
          ...updatedTradeData // Use the mapped data
        };
        setTrade(newTrade);
      }

      setIsEditing(false);
      setIsSaving(false);

    } catch (err: any) {
      setError(err.message || 'Failed to update trade');
      setIsSaving(false);
    }
  };

  // Handle deleting trade
  const handleDeleteTrade = async () => {
    if (!window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to delete a trade');
      }

      if (!trade) {
        throw new Error('Trade not found');
      }

      try {
        await deleteTrade(trade.id!);
      } catch (err: any) {
        setError(err.message || 'Failed to delete trade');
        setIsDeleting(false);
        return;
      }

      navigate('/trades');

    } catch (err: any) {
      setError(err.message || 'Failed to delete trade');
      setIsDeleting(false);
    }
  };

  // Handle requesting trade completion
  const handleRequestCompletion = () => {
    // Clear other forms first
    setShowContactForm(false);
    setShowConfirmationForm(false);
    setShowProposalForm(false);

    // Show the completion form
    setShowCompletionForm(true);

    // Scroll to the form
    setTimeout(() => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  };

  // Handle confirming trade completion
  const handleConfirmCompletion = () => {
    // Clear other forms first
    setShowContactForm(false);
    setShowCompletionForm(false);
    setShowProposalForm(false);
    setConfirmationInitialMode('confirm'); // Set mode to confirm
    setShowConfirmationForm(true);

    // Force a re-render and scroll to the form
    setTimeout(() => {
      // Scroll to the form
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  };

  // Handle requesting changes (when user clicks "Request Changes" button on detail page)
  // This function needs to be wired to the UI element for "Request Changes"
  // that is typically determined by getTradeActions.
  const handleRequestChangesAction = () => {
    setShowContactForm(false);
    setShowCompletionForm(false);
    setShowProposalForm(false);
    setConfirmationInitialMode('requestChanges'); // Set mode to request changes
    setShowConfirmationForm(true); // Show the same confirmation form, but it will open in the correct mode
    setTimeout(() => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  };

  // Refresh trade data
  const fetchTrade = async () => {
    if (!tradeId) return;

    try {
      const { data, error } = await getTrade(tradeId);

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Trade not found');

      const tradeData = data as Trade;
      setTrade(tradeData);
    } catch (err: any) {
      console.error('Error refreshing trade data:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="mt-6">
          <Link to="/trades" className="text-primary hover:text-primary/90 font-medium">
            ← Back to Trades
          </Link>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card p-12 rounded-lg text-center">
          <p className="text-muted-foreground">Trade not found.</p>
        </div>
        <div className="mt-6">
          <Link to="/trades" className="text-primary hover:text-primary/90 font-medium">
            ← Back to Trades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Performance monitoring (invisible) */}
      <PerformanceMonitor pageName={`TradeDetailPage-${tradeId}`} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/trades" className="text-primary hover:text-primary/90 font-medium">
            ← Back to Trades
          </Link>
        </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Trade header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{trade.title}</h1>
              <div className="flex items-center text-muted-foreground text-sm">
                <span>Posted by {tradeCreator?.displayName || 'Unknown User'}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(trade.createdAt.toDate())}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className="bg-primary/10 text-primary-foreground text-sm font-medium px-2.5 py-0.5 rounded">
                {trade.category}
              </span>
              <span className={`${getTradeStatusClasses(trade.status)} text-sm font-medium px-2.5 py-0.5 rounded`}>
                {formatStatus(trade.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Trade creator profile */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Posted By</h2>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {loadingCreator ? (
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse"></div>
              ) : (
                <ProfileImageWithUser
                  userId={trade.creatorId || ''}
                  profileUrl={tradeCreator?.profilePicture || tradeCreator?.photoURL}
                  size="medium"
                  className="w-16 h-16 rounded-full"
                />
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-foreground">{tradeCreator?.displayName || 'Unknown User'}</h3>
              {tradeCreator && (
                <p className="text-muted-foreground text-sm">
                  {tradeCreator.location || 'No location provided'}
                </p>
              )}
              <div className="mt-2">
                <Link
                  to={`/profile/${trade.creatorId}`}
                  className="text-primary hover:text-primary/90 text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Status Timeline */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Trade Status</h2>
          <TradeStatusTimeline status={trade.status} />

          {/* Status explanation based on current status */}
          {trade.status === 'open' && (
            <div className="mt-4 bg-info/10 border border-info/20 text-info-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Open for Proposals</p>
              <p>This trade is open and accepting proposals from interested users.</p>
            </div>
          )}

          {trade.status === 'in-progress' && (
            <div className="mt-4 bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">In Progress</p>
              <p>This trade is currently in progress. When work is completed, either participant can request completion.</p>
            </div>
          )}

          {trade.status === 'pending_evidence' && (
            <div className="mt-4 bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Waiting for Evidence</p>
              <p>One user has submitted evidence. Waiting for the other user to submit their evidence.</p>
            </div>
          )}

          {trade.status === 'pending_confirmation' && (
            <div className="mt-4 bg-primary/10 border border-primary/20 text-primary-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Pending Confirmation</p>
              <p>Evidence has been submitted and the trade is awaiting final confirmation.</p>

              {/* Direct confirmation button */}
              {currentUser && trade.completionRequestedBy !== currentUser.uid && (
                <div className="mt-4">
                  <button
                    onClick={handleConfirmCompletion}
                    className="w-full bg-success text-success-foreground px-4 py-2 rounded-md hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                  >
                    Confirm Trade Completion
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auto-completion countdown for pending confirmation trades */}
          {trade.status === 'pending_confirmation' && trade.completionRequestedAt && (
            <ConfirmationCountdown
              completionRequestedAt={trade.completionRequestedAt}
              className="mt-4"
            />
          )}

          {trade.status === 'completed' && (
            <div className="mt-4 bg-success/10 border border-success/20 text-success-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Completed</p>
              <p>This trade has been successfully completed by both parties.</p>
              {trade.autoCompleted && (
                <div className="mt-2 p-2 bg-info/10 border border-info/20 rounded text-info-foreground">
                  <p className="text-sm font-medium">Auto-Completed</p>
                  <p className="text-xs">{trade.autoCompletionReason}</p>
                </div>
              )}
            </div>
          )}

          {trade.status === 'cancelled' && (
            <div className="mt-4 bg-muted border border-border text-muted-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Cancelled</p>
              <p>This trade has been cancelled and is no longer active.</p>
            </div>
          )}

          {trade.status === 'disputed' && (
            <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-lg">
              <p className="font-medium">Disputed</p>
              <p>This trade is currently disputed and requires resolution.</p>
            </div>
          )}

          {/* Completion Form - Only show when explicitly triggered */}
          {showCompletionForm && currentUser && (trade.status === 'in-progress' || trade.status === 'pending_evidence') &&
            (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Request Trade Completion</h3>
              <TradeCompletionForm
                tradeId={trade.id!}
                tradeName={trade.title}
                onSuccess={() => {
                  setShowCompletionForm(false);
                  fetchTrade();
                }}
                onCancel={() => setShowCompletionForm(false)}
              />
            </div>
          )}

          {/* Confirmation Form */}
          {(() => {
            // Always show the confirmation form if the conditions are met
            if (currentUser &&
                trade.status === 'pending_confirmation' &&
                trade.completionRequestedBy !== currentUser.uid &&
                (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid)) {
              return (
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Confirm Trade Completion</h3>
                  <TradeConfirmationForm
                    trade={trade}
                    initialMode={confirmationInitialMode} // Pass the initial mode
                    onSuccess={() => {
                      setShowConfirmationForm(false);
                      fetchTrade();
                    }}
                    onCancel={() => setShowConfirmationForm(false)}
                    onRequestChanges={() => {
                      setShowConfirmationForm(false);
                      fetchTrade();
                    }}
                  />
                </div>
              );
            }

            // Otherwise, only show if showConfirmationForm is true
            return showConfirmationForm && currentUser && trade.status === 'pending_confirmation' &&
              trade.completionRequestedBy !== currentUser.uid &&
              (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Confirm Trade Completion</h3>
                <TradeConfirmationForm
                  trade={trade}
                  initialMode={confirmationInitialMode} // Pass the initial mode
                  onSuccess={() => {
                    setShowConfirmationForm(false);
                    fetchTrade();
                  }}
                  onCancel={() => setShowConfirmationForm(false)}
                  onRequestChanges={() => {
                    setShowConfirmationForm(false);
                    fetchTrade();
                  }}
                />
              </div>
            );
          })()}
        </div>

        {/* Change Request History */}
        {trade.changeRequests && trade.changeRequests.length > 0 && (
          <div className="p-6 border-b border-border">
            <ChangeRequestHistory changeRequests={trade.changeRequests} />
          </div>
        )}

        {/* Completion Evidence Section - Visible for completed, pending_confirmation, and pending_evidence trades */}
        {(trade.status === 'completed' || trade.status === 'pending_confirmation' || trade.status === 'pending_evidence') && (
          <div id="evidence-section" className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Trade Evidence</h2>

            {/* Status explanation */}
            {trade.status === 'pending_evidence' && (
              <div className="mb-6 bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-3 rounded-lg">
                <p className="font-medium">Waiting for Evidence</p>
                <p>One user has submitted evidence. Waiting for the other user to submit their evidence.</p>
              </div>
            )}

            {trade.status === 'pending_confirmation' && (
              <div className="mb-6 bg-info/10 border border-info/20 text-info-foreground px-4 py-3 rounded-lg">
                <p className="font-medium">Pending Confirmation</p>
                <p>Both users have submitted evidence. The trade can now be confirmed as completed.</p>
              </div>
            )}

            {trade.status === 'completed' && (
              <div className="mb-6 bg-success/10 border border-success/20 text-success-foreground px-4 py-3 rounded-lg">
                <p className="font-medium">Trade Completed</p>
                <p>This trade has been successfully completed by both parties.</p>
              </div>
            )}

            {/* Creator's Evidence Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Creator's Evidence
                {trade.creatorName && ` (${trade.creatorName})`}
              </h3>

              {trade.completionEvidence && trade.completionEvidence.length > 0 ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  {/* Display creator's completion notes if available */}
                  {trade.completionNotes && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-foreground mb-2">Notes</h4>
                      <div className="bg-background p-3 rounded-lg border border-border">
                        <p className="text-muted-foreground whitespace-pre-line">{trade.completionNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Display creator's evidence */}
                  <div>
                    <h4 className="text-md font-medium text-foreground mb-2">Evidence</h4>
                    <EvidenceGallery
                      evidence={trade.completionEvidence}
                      title=""
                      emptyMessage="No evidence was provided."
                    />
                  </div>

                  {/* Display timestamp */}
                  {trade.completionRequestedAt && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Submitted at:</strong> {new Date(trade.completionRequestedAt.toDate()).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-muted-foreground italic">The creator has not submitted evidence yet.</p>
                </div>
              )}
            </div>

            {/* Participant's Evidence Section */}
            {trade.participantId && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Participant's Evidence
                  {trade.participantId && ` (${trade.participantId})`}
                </h3>

                {trade.completionEvidence && trade.completionEvidence.length > 0 ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    {/* Display participant's completion notes if available */}
                    {trade.completionNotes && (
                      <div className="mb-4">
                        <h4 className="text-md font-medium text-foreground mb-2">Notes</h4>
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <p className="text-muted-foreground whitespace-pre-line">{trade.completionNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Display participant's evidence */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-2">Evidence</h4>
                      <EvidenceGallery
                        evidence={trade.completionEvidence}
                        title=""
                        emptyMessage="No evidence was provided."
                      />
                    </div>

                    {/* Display timestamp */}
                    {trade.completionRequestedAt && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Submitted at:</strong> {new Date(trade.completionRequestedAt.toDate()).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-muted-foreground italic">The participant has not submitted evidence yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Legacy Evidence Display (for backward compatibility) */}
            {!trade.completionEvidence && trade.completionEvidence && trade.completionEvidence.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-2">Legacy Evidence</h3>

                {/* Display completion notes if available */}
                {trade.completionNotes && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-foreground mb-2">Notes</h4>
                    <div className="bg-background p-3 rounded-lg border border-border">
                      <p className="text-muted-foreground whitespace-pre-line">{trade.completionNotes}</p>
                    </div>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <EvidenceGallery
                    evidence={trade.completionEvidence}
                    title=""
                    emptyMessage="No evidence was provided."
                  />
                </div>

                {/* Display completion timestamps */}
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Requested by:</strong> {trade.completionRequestedBy === trade.creatorId ? 'Trade Creator' : 'Trade Participant'}
                  </p>
                  {trade.completionRequestedAt && (
                    <p>
                      <strong>Requested at:</strong> {new Date(trade.completionRequestedAt.toDate()).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Display completion confirmation timestamp */}
            {trade.status === 'completed' && trade.completionConfirmedAt && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Confirmed at:</strong> {new Date(trade.completionConfirmedAt.toDate()).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trade details */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Description</h2>
          <p className="text-muted-foreground mb-6 whitespace-pre-line">{trade.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Offering</h3>
              <div className="flex flex-wrap gap-2">
                {trade.offeredSkills && trade.offeredSkills.length > 0 ? (
                  trade.offeredSkills.map((skill, index) => ( // skill is TradeSkill object
                    <TradeSkillDisplay
                      key={index}
                      skill={skill} // Pass TradeSkill object directly
                      className="bg-success/10 text-success-foreground"
                    />
                  ))
                ) : trade.offering ? ( // Fallback for string-based offering
                  trade.offering.split(',').map((skillName, index) => (
                    <TradeSkillDisplay
                      key={index}
                      skill={{ name: skillName.trim(), level: 'intermediate' }} // Create a TradeSkill object
                      className="bg-success/10 text-success-foreground"
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">No skills offered</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Seeking</h3>
              <div className="flex flex-wrap gap-2">
                {trade.requestedSkills && trade.requestedSkills.length > 0 ? (
                  trade.requestedSkills.map((skill, index) => ( // skill is TradeSkill object
                    <TradeSkillDisplay
                      key={index}
                      skill={skill} // Pass TradeSkill object directly
                      className="bg-info/10 text-info-foreground"
                    />
                  ))
                ) : trade.seeking ? ( // Fallback for string-based seeking
                  trade.seeking.split(',').map((skillName, index) => (
                    <TradeSkillDisplay
                      key={index}
                      skill={{ name: skillName.trim(), level: 'intermediate' }} // Create a TradeSkill object
                      className="bg-info/10 text-info-foreground"
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">No skills requested</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div className="p-6">
          {isOwner ? (
            <div className="bg-muted/50 p-4 rounded-lg">
              {isEditing ? (
                <form onSubmit={handleSaveTrade}>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Edit Trade</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Images
                      </label>
                      <MultipleImageUploader
                        onImagesChange={setImages}
                        folder={`tradeya/trades/${trade.id}`}
                        initialImageUrls={images}
                        maxImages={5}
                      />
                    </div>

                    <div>
                      <label htmlFor="editTitle" className="block text-sm font-medium text-foreground mb-1">
                        Title
                      </label>
                      <input
                        id="editTitle"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="editDescription" className="block text-sm font-medium text-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        id="editDescription"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="editOffering" className="block text-sm font-medium text-foreground mb-1">
                          What You're Offering
                        </label>
                        <input
                          id="editOffering"
                          type="text"
                          value={editOffering}
                          onChange={(e) => setEditOffering(e.target.value)}
                          className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Web development, React, Next.js"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="editSeeking" className="block text-sm font-medium text-foreground mb-1">
                          What You're Seeking
                        </label>
                        <input
                          id="editSeeking"
                          type="text"
                          value={editSeeking}
                          onChange={(e) => setEditSeeking(e.target.value)}
                          className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Graphic design, Logo design"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="editCategory" className="block text-sm font-medium text-foreground mb-1">
                        Category
                      </label>
                      <select
                        id="editCategory"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-md border border-input px-3 py-2 bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="editStatus" className="block text-sm font-medium text-foreground mb-1">
                        Status
                      </label>
                      <select
                        id="editStatus"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-md border border-input px-3 py-2 bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending_confirmation">Pending Confirmation</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="disputed">Disputed</option>
                      </select>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-muted-foreground">This is your trade listing.</p>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                    >
                      Edit Trade
                    </button>
                    <button
                      onClick={handleDeleteTrade}
                      className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Trade'}
                    </button>

                    {/* Mark Complete button for trade creator */}
                    {trade.status === 'in-progress' && (
                      <button
                        onClick={handleRequestCompletion}
                        className="bg-success text-success-foreground px-4 py-2 rounded-md hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>

              {/* Dynamic action buttons based on trade status and user role */}
              {!showContactForm && !showCompletionForm && !showConfirmationForm ? (
                  <div className="flex flex-col space-y-4">
                    {/* Primary action button */}
                    {currentUser && trade && (
                      <>
                        {(() => {
                          const actions = getTradeActions(trade, currentUser.uid);

                        // Handle primary action click
                        const handlePrimaryAction = () => {

                          switch (actions.primaryAction) {
                            case 'Submit Evidence':
                            case 'Mark Complete':
                              handleRequestCompletion();
                              break;
                            case 'Confirm Completion':
                              handleConfirmCompletion();
                              break;
                            case 'Submit Proposal':
                              setShowProposalForm(true);
                              break;
                            case 'View Proposals':
                              // Scroll to proposals section
                              document.getElementById('proposals-section')?.scrollIntoView({ behavior: 'smooth' });
                              break;
                            case 'Leave Review':
                              setShowReviewForm(true);
                              break;
                            case 'Waiting for Other User':
                              // Scroll to evidence section
                              document.getElementById('evidence-section')?.scrollIntoView({ behavior: 'smooth' });
                              break;
                            default:
                              // Default action is to contact
                              setShowContactForm(true);
                          }
                        };

                        // Handle secondary action click
                        const handleSecondaryAction = () => {
                          if (actions.secondaryAction === 'Cancel Trade') {
                            if (window.confirm('Are you sure you want to cancel this trade?')) {
                              updateTrade(trade.id!, { status: 'cancelled' })
                                .then(() => fetchTrade())
                                .catch(err => console.error('Error cancelling trade:', err));
                            }
                          } else if (actions.secondaryAction === 'Request Changes') {
                            // Show confirmation form with change request option
                            handleRequestChangesAction();
                          }
                        };

                        // Add special handling for pending confirmation
                        if (trade.status === 'pending_confirmation' && trade.completionRequestedBy !== currentUser.uid) {
                          return (
                            <>
                              {/* Prominent confirmation button */}
                              <div className="w-full mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                                <h3 className="text-lg font-medium text-success-foreground mb-2">Trade Ready for Confirmation</h3>
                                <p className="text-sm text-success-foreground mb-4">
                                  The other user has requested completion. You can now confirm the trade is complete.
                                </p>
                                <button
                                  onClick={handleConfirmCompletion}
                                  className="w-full bg-success text-success-foreground px-4 py-2 rounded-md hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                                >
                                  Confirm Trade Completion
                                </button>
                              </div>

                              {/* Regular action buttons */}
                              <button
                                onClick={handlePrimaryAction}
                                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                                disabled={actions.primaryDisabled}
                              >
                                {actions.primaryAction}
                              </button>

                              {actions.secondaryAction && (
                                <button
                                  onClick={handleSecondaryAction}
                                  className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                                  disabled={actions.secondaryDisabled}
                                >
                                  {actions.secondaryAction}
                                </button>
                              )}
                            </>
                          );
                        }

                        // Default return for other statuses
                        return (
                          <>
                            <button
                              onClick={handlePrimaryAction}
                              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                              disabled={actions.primaryDisabled}
                            >
                              {actions.primaryAction}
                            </button>

                            {actions.secondaryAction && (
                              <button
                                onClick={handleSecondaryAction}
                                className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                                disabled={actions.secondaryDisabled}
                              >
                                {actions.secondaryAction}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}

                  {/* Contact button always available */}
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                  >
                    Contact {tradeCreator?.displayName || 'User'}
                  </button>
                </div>
              ) : showCompletionForm ? (
                <TradeCompletionForm
                  tradeId={trade.id!}
                  tradeName={trade.title}
                  onSuccess={() => {
                    setShowCompletionForm(false);
                    fetchTrade();
                  }}
                  onCancel={() => setShowCompletionForm(false)}
                />
              ) : showConfirmationForm ? (
                <TradeConfirmationForm
                  trade={trade}
                  initialMode={confirmationInitialMode} // Pass the initial mode
                  onSuccess={() => {
                    setShowConfirmationForm(false);
                    fetchTrade();
                  }}
                  onCancel={() => setShowConfirmationForm(false)}
                  onRequestChanges={() => {
                    setShowConfirmationForm(false);
                    fetchTrade();
                  }}
                />
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg transition-colors duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Send a Message</h3>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {messageSent ? (
                    <div className="bg-success/10 border border-success/20 text-success-foreground px-4 py-3 rounded-lg mb-4 transition-colors duration-200">
                      Message sent successfully! {tradeCreator?.displayName || 'The user'} will be notified.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage}>
                      <div className="mb-4">
                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                          Your Message
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-input px-3 py-2 bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
                          placeholder={`Hi ${tradeCreator?.displayName || 'there'}, I'm interested in your trade...`}
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                          disabled={sendingMessage}
                        >
                          {sendingMessage ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {!currentUser && (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proposal section for trade creators */}
      {currentUser && trade && trade.creatorId === currentUser.uid && trade.status === 'open' && (
        <div id="proposals-section" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Trade Proposals</h2>

          <TradeProposalDashboard
            tradeId={trade.id!}
            onProposalAccepted={() => {
              // Refresh trade data to get updated status
              if (tradeId) {
                getTrade(tradeId).then(({ data }) => {
                  if (data) {
                    setTrade(data as Trade);
                  }
                });
              }
            }}
          />
        </div>
      )}

      {/* Proposal form for other users */}
      {currentUser && trade && trade.status === 'open' && trade.creatorId !== currentUser.uid && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Submit a Proposal</h2>

          {!showProposalForm ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center transition-colors duration-200">
              <h3 className="text-lg font-medium text-foreground mb-2">Interested in this trade?</h3>
              <p className="text-muted-foreground mb-4">Submit a proposal to let the trade creator know you're interested.</p>
              <button
                onClick={() => setShowProposalForm(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
              >
                Submit Proposal
              </button>
            </div>
          ) : (
            <TradeProposalForm
              tradeId={trade.id!}
              tradeName={trade.title}
              offeredSkills={trade.offeredSkills ? trade.offeredSkills.map(s => s.name) : []}
              requestedSkills={trade.requestedSkills ? trade.requestedSkills.map(s => s.name) : []}
              onSuccess={() => {
                setShowProposalForm(false);
                addToast('success', 'Proposal submitted successfully!');
              }}
              onCancel={() => setShowProposalForm(false)}
            />
          )}
        </div>
      )}

      {/* Review section */}
      {currentUser && trade && trade.id && currentUser.uid !== (trade.creatorId) && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Leave a Review</h2>

          {showReviewForm ? (
            <ReviewForm
              tradeId={trade.id!}
              tradeName={trade.title}
              receiverId={trade.creatorId || trade.participantId || ''}
              receiverName={tradeCreator?.displayName || 'User'}
              onSuccess={() => setShowReviewForm(false)}
              onCancel={() => setShowReviewForm(false)}
            />
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center transition-colors duration-200">
              <h3 className="text-lg font-medium text-foreground mb-2">Have you completed a trade with this user?</h3>
              <p className="text-muted-foreground mb-4">Share your experience and help others in the community.</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
              >
                Write a Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* Related trades section (could be added in the future) */}
      {/* <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Similar Trades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Related trades would go here */}
      {/* </div>
      </div> */}
    </div>
    </>
  );
};

export default TradeDetailPage;
