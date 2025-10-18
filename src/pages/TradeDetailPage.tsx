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
import PerformanceMonitor from '../components/ui/PerformanceMonitor';

// Import home page design components
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StepProgress } from '../components/ui/Progress';
import { semanticClasses } from '../utils/semanticColors';

import TradeProposalDashboard from '../components/features/trades/TradeProposalDashboard';
import TradeCompletionForm from '../components/features/trades/TradeCompletionForm';
import TradeConfirmationForm from '../components/features/trades/TradeConfirmationForm';
import ChangeRequestHistory from '../components/features/trades/ChangeRequestHistory';
import { EvidenceGallery } from '../components/features/evidence/EvidenceGallery';
import { ConfirmationCountdown } from '../components/features/trades/ConfirmationCountdown';
import TradeProposalForm from '../components/features/trades/TradeProposalForm';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
  
  // New state for collapsible sections
  const [showStatusTimeline, setShowStatusTimeline] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showChangeHistory, setShowChangeHistory] = useState(false);

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

  // Helper function to convert trade status to step progress format
  const getTradeSteps = (currentStatus: string) => {
    const statusOrder = [
      { id: 'open', label: 'Open', description: 'Accepting proposals' },
      { id: 'in-progress', label: 'In Progress', description: 'Trade is active' },
      { id: 'pending_evidence', label: 'Evidence Pending', description: 'Awaiting proof' },
      { id: 'pending_confirmation', label: 'Confirmation', description: 'Final approval' },
      { id: 'completed', label: 'Completed', description: 'Trade finished' }
    ];

    // Handle special statuses
    if (currentStatus === 'cancelled') {
      return [
        { label: 'Cancelled', description: 'Trade was cancelled', current: true, error: true }
      ];
    }
    
    if (currentStatus === 'disputed') {
      return [
        { label: 'Disputed', description: 'Requires resolution', current: true, error: true }
      ];
    }

    const currentIndex = statusOrder.findIndex(s => s.id === currentStatus);
    
    return statusOrder.map((step, index) => ({
      label: step.label,
      description: step.description,
      completed: index < currentIndex,
      current: index === currentIndex,
      error: false
    }));
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
          <Link to="/trades" className="font-medium text-primary hover:text-primary/90">
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
          <Link to="/trades" className="font-medium text-primary hover:text-primary/90">
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

      <main className="min-h-screen">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link to="/trades" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Trades
                </Link>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{trade.title}</h1>
                <div className="flex items-center text-muted-foreground text-sm mb-4">
                <span>Posted by {tradeCreator?.displayName || 'Unknown User'}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(trade.createdAt.toDate())}</span>
              </div>
                
                {/* Inline Status and Category */}
                <div className="flex items-center gap-3">
                <Badge variant="default" topic="trades" className="text-sm">
                  {trade.category}
                </Badge>
                <span className={`${getTradeStatusClasses(trade.status)} text-sm font-medium px-3 py-1 rounded-full`}>
                  {formatStatus(trade.status)}
                </span>
                </div>
          </div>

              {/* Creator Profile - Compact */}
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <ProfileImageWithUser
                      userId={trade.creatorId || ''}
                      profileUrl={tradeCreator?.profilePicture || tradeCreator?.photoURL}
                  size="small"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium">{tradeCreator?.displayName || 'Unknown User'}</p>
                    <Link
                      to={`/profile/${trade.creatorId}`}
                    className="text-xs text-primary hover:text-primary/90"
                    >
                      View Profile →
                    </Link>
                  </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trade Description */}
              <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Description</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-foreground leading-relaxed">{trade.description}</p>
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Skills & Services</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Offering</h4>
                      {trade.offeredSkills && trade.offeredSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {trade.offeredSkills.map((skill: any, index: number) => (
                            <TradeSkillDisplay
                              key={index}
                              skill={skill}
                              className="bg-success/10 text-success-foreground text-sm"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific offerings listed</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Seeking</h4>
                      {trade.requestedSkills && trade.requestedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {trade.requestedSkills.map((skill: any, index: number) => (
                            <TradeSkillDisplay
                              key={index}
                              skill={skill}
                              className="bg-info/10 text-info-foreground text-sm"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Open to various proposals</p>
                      )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Confirmation Form Card */}
          {(() => {
            // Always show the confirmation form if the conditions are met
            if (currentUser &&
                trade.status === 'pending_confirmation' &&
                trade.completionRequestedBy !== currentUser.uid &&
                (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid)) {
              return (
                <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold">Confirm Trade Completion</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>
              );
            }

            // Otherwise, only show if showConfirmationForm is true
            return showConfirmationForm && currentUser && trade.status === 'pending_confirmation' &&
              trade.completionRequestedBy !== currentUser.uid &&
              (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
              <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold">Confirm Trade Completion</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            );
          })()}

          {/* Completion Form Card */}
          {showCompletionForm && currentUser && trade.status === 'in-progress' &&
            (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
            <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 mb-6" data-completion-form>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold">Request Trade Completion</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TradeCompletionForm
                  tradeId={trade.id!}
                  tradeName={trade.title}
                  onSuccess={() => {
                    setShowCompletionForm(false);
                    fetchTrade();
                    addToast('Completion request submitted successfully!', 'success');
                  }}
                  onCancel={() => setShowCompletionForm(false)}
                />
              </CardContent>
            </Card>
          )}

            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Trade Status - Collapsible */}
              <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                <CardHeader className="pb-2">
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowStatusTimeline(!showStatusTimeline)}
                  >
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      Trade Status
                      {showStatusTimeline ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`${getTradeStatusClasses(trade.status)} text-sm font-medium px-3 py-1 rounded-full`}>
                      {formatStatus(trade.status)}
                    </span>
                  </div>
                  {showStatusTimeline && (
                    <StepProgress
                      steps={getTradeSteps(trade.status)}
                      orientation="vertical"
                      topic="trades"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Next Steps - Request Completion */}
              {trade.status === 'in-progress' && currentUser &&
                (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
                <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      When you've completed your part of the trade, request completion to move forward.
                    </p>
                    <Button
                      variant="glassmorphic"
                      topic="trades"
                      onClick={handleRequestCompletion}
                      className="w-full hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Request Completion
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {isOwner ? 'Manage Trade' : 'Get in Touch'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {isOwner ? (
                      <>
                        <Button
                          variant="glassmorphic" 
                          topic="trades"
                          onClick={() => setIsEditing(true)}
                          className="w-full hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Trade
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteTrade}
                          disabled={isDeleting}
                          className="w-full min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete Trade'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="glassmorphic"
                          topic="trades"
                          onClick={() => setShowProposalForm(true)}
                          className="w-full hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
                        >
                          Submit Proposal
                        </Button>
                        <Button
                          variant="glassmorphic"
                          topic="trades"
                          onClick={() => setShowProposalForm(true)}
                          className="w-full min-h-[44px]"
                        >
                          Contact {tradeCreator?.displayName || 'User'}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Leave Review - Only for completed trades */}
              {trade.status === 'completed' && currentUser && !isOwner && (
                <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Leave a Review</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      Share your experience with this trade
                    </p>
                    <Button 
                      variant="glassmorphic" 
                      topic="trades"
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                      className="w-full min-h-[44px]"
                    >
                      Write Review
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Evidence - Collapsible */}
              {(trade.status === 'pending_evidence' || 
                trade.status === 'pending_confirmation' || 
                trade.status === 'completed') && (
                <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                  <CardHeader className="pb-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => setShowEvidence(!showEvidence)}
                    >
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        Trade Evidence
                        {showEvidence ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {showEvidence && (
                    <CardContent className="p-4 max-h-96 overflow-y-auto">
                      {/* Status explanation */}
                      {trade.status === 'pending_evidence' && (
                        <div className="mb-4 bg-warning/10 border border-warning/20 text-warning-foreground px-3 py-2 rounded-lg text-xs">
                          <p className="font-medium">Waiting for Evidence</p>
                        </div>
                      )}
                      
                      {trade.status === 'completed' && (
                        <div className="mb-4 bg-success/10 border border-success/20 text-success-foreground px-3 py-2 rounded-lg text-xs">
                          <p className="font-medium">Trade Completed</p>
                        </div>
                      )}

                      {/* Compact evidence display */}
                      {trade.completionEvidence && trade.completionEvidence.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-xs">
                            <p className="font-medium text-foreground mb-1">Evidence Submitted</p>
                            <EvidenceGallery
                              evidence={trade.completionEvidence}
                              title=""
                              emptyMessage="No evidence provided"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No evidence submitted yet</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Change History - Collapsible */}
              {trade.changeRequests && trade.changeRequests.length > 0 && (
                <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                  <CardHeader className="pb-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => setShowChangeHistory(!showChangeHistory)}
                    >
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        Change Requests ({trade.changeRequests.length})
                        {showChangeHistory ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {showChangeHistory && (
                    <CardContent className="p-4 max-h-64 overflow-y-auto">
                      <ChangeRequestHistory changeRequests={trade.changeRequests} />
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          </div>




                  </div>
      </main>

      {/* Proposal section for trade creators */}
      {currentUser && trade && trade.creatorId === currentUser.uid && trade.status === 'open' && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
              Trade Proposals
            </h2>

            <TradeProposalDashboard
              tradeId={trade.id!}
              onProposalAccepted={() => {
                // Refresh trade data when proposal is accepted
                fetchTrade();
              }}
            />
          </div>
        </div>
      )}



      {/* Related trades section (could be added in the future) */}
      {/* <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Similar Trades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Related trades would go here */}
      {/* </div>
      </div> */}

      {/* Proposal Form Modal */}
      {showProposalForm && !isOwner && trade.status === 'open' && (
        <Modal
          isOpen={showProposalForm}
          onClose={() => setShowProposalForm(false)}
          title="Submit a Proposal"
          size="xl"
          closeOnClickOutside={false}
        >
          <TradeProposalForm
            trade={trade}
            onSuccess={() => {
              setShowProposalForm(false);
              addToast('success', 'Proposal submitted successfully!');
            }}
            onCancel={() => setShowProposalForm(false)}
          />
        </Modal>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <Modal isOpen={showReviewForm} onClose={() => setShowReviewForm(false)}>
          <ReviewForm
            tradeId={trade.id!}
            tradeName={trade.title}
            receiverId={trade.creatorId || trade.participantId || ''}
            receiverName={tradeCreator?.displayName || 'Unknown User'}
            onSuccess={() => setShowReviewForm(false)}
            onCancel={() => setShowReviewForm(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default TradeDetailPage;
