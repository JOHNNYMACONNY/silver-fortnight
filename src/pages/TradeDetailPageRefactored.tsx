import React, { useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
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
  TradeSkill
} from '../services/firestore-exports';
import { TradeCompatibilityService } from '../services/migration/tradeCompatibility';
import { useToast } from '../contexts/ToastContext';
import { getTradeActions } from '../utils/tradeActionUtils';
import { useTradeDetailState } from '../hooks/useTradeDetailState';
import { parseSkillsString } from '../utils/skillUtils';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Components
import { TradeDetailHeader } from '../components/features/trades/TradeDetailHeader';
import { TradeCreatorProfile } from '../components/features/trades/TradeCreatorProfile';
import { TradeDetailsSection } from '../components/features/trades/TradeDetailsSection';
import { TradeActions } from '../components/features/trades/TradeActions';
import TradeProposalDashboard from '../components/features/trades/TradeProposalDashboard';
import TradeStatusTimeline from '../components/features/trades/TradeStatusTimeline';
import TradeCompletionForm from '../components/features/trades/TradeCompletionForm';
import TradeConfirmationForm from '../components/features/trades/TradeConfirmationForm';
import ChangeRequestHistory from '../components/features/trades/ChangeRequestHistory';
// Lazy load heavy components
const EvidenceGallery = lazy(() => import('../components/features/evidence/EvidenceGallery').then(m => ({ default: m.EvidenceGallery })));
import { ConfirmationCountdown } from '../components/features/trades/ConfirmationCountdown';
import TradeProposalForm from '../components/features/trades/TradeProposalForm';
import { ReviewForm } from '../components/features/reviews/ReviewForm';
import { MultipleImageUploader } from '../components/features/uploads/MultipleImageUploader';
import { GlassmorphicForm } from '../components/forms/GlassmorphicForm';
import { GlassmorphicInput } from '../components/forms/GlassmorphicInput';
import { GlassmorphicTextarea } from '../components/forms/GlassmorphicTextarea';
import { GlassmorphicDropdown } from '../components/forms/GlassmorphicDropdown';

// Extend the Trade interface
interface Trade extends BaseTrade {
  images?: string[];
}

// Error boundary fallback component
const TradeErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm">{error.message}</p>
    </div>
    <div className="mt-6">
      <Link to="/trades" className="font-medium text-primary hover:text-primary/90">
        ← Back to Trades
      </Link>
    </div>
  </div>
);

export const TradeDetailPageRefactored: React.FC = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { isEditing?: boolean } | null;

  const { state, actions } = useTradeDetailState();

  // Normalize skill level to Firestore TradeSkill type ('beginner' | 'intermediate' | 'expert')
  const mapLevelToFs = useCallback((lvl: string): 'beginner' | 'intermediate' | 'expert' => {
    const lower = String(lvl || '').toLowerCase();
    if (lower === 'advanced') return 'expert';
    return (['beginner', 'intermediate', 'expert'] as const).includes(lower as any)
      ? (lower as 'beginner' | 'intermediate' | 'expert')
      : 'intermediate';
  }, []);

  // Memoized computed values
  const isOwner = useMemo(() => {
    return Boolean(currentUser && state.trade && currentUser.uid === state.trade.creatorId);
  }, [currentUser, state.trade]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          if (state.isEditing) {
            actions.setIsEditing(false);
            event.preventDefault();
          }
          if (state.showContactForm) {
            actions.setShowContactForm(false);
            event.preventDefault();
          }
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Enter to save if editing
            if (state.isEditing && isOwner) {
              handleSaveTrade(event as any);
              event.preventDefault();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isEditing, state.showContactForm, isOwner, actions]);

  // Convert various skill item shapes to Firestore TradeSkill shape
  const toFsSkills = useCallback((skills: any[]): TradeSkill[] => {
    return (Array.isArray(skills) ? skills : []).map((s: any) => ({
      name: s?.name || String(s || ''),
      level: mapLevelToFs(s?.level || 'intermediate'),
    } as TradeSkill));
  }, [mapLevelToFs]);

  const tradeActions = useMemo(() => 
    state.trade && currentUser ? getTradeActions(state.trade, currentUser.uid) : null,
    [state.trade, currentUser]
  );

  // Format date utility
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useCallback(() => {
    actions.setIsEditing(true);
  }, [actions]);

  const handleShowContactForm = useCallback(() => {
    actions.setShowContactForm(true);
  }, [actions]);

  const handleHideContactForm = useCallback(() => {
    actions.setShowContactForm(false);
  }, [actions]);

  const handleShowProposalForm = useCallback(() => {
    actions.setShowProposalForm(true);
  }, [actions]);

  const handleShowReviewForm = useCallback(() => {
    actions.setShowReviewForm(true);
  }, [actions]);

  // Fetch trade details
  const fetchTradeDetails = useCallback(async () => {
    if (!tradeId) return;
    
    actions.setLoading(true);
    actions.clearError();

    try {
      const { data, error } = await getTrade(tradeId);

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Trade not found');

      // Normalize skills using the same logic as TradeCard (migration compatibility layer)
      const normalized = TradeCompatibilityService.normalizeTradeData({ ...(data as any) });
      const tradeData = {
        ...(data as any),
        skillsOffered: toFsSkills(normalized.skillsOffered),
        skillsWanted: toFsSkills(normalized.skillsWanted),
        // keep legacy aliases populated too
        offeredSkills: toFsSkills((normalized as any).offeredSkills || normalized.skillsOffered),
        requestedSkills: toFsSkills((normalized as any).requestedSkills || normalized.skillsWanted),
      } as Trade;

      actions.setTrade(tradeData);

      // Set images if available
      if (tradeData.images && Array.isArray(tradeData.images)) {
        actions.setImages(tradeData.images);
      }

      // Initialize edit form
      actions.initializeEditForm(tradeData);

      // Check if we should enter edit mode from location state
      if (locationState?.isEditing) {
        actions.setIsEditing(true);
      }

      // Fetch the trade creator's profile
      if (tradeData.creatorId) {
        fetchTradeCreator(tradeData.creatorId);
      }
    } catch (err: any) {
      actions.setError(err.message || 'Failed to fetch trade details');
    } finally {
      actions.setLoading(false);
    }
  }, [tradeId, locationState]);

  // Fetch trade creator's profile
  const fetchTradeCreator = useCallback(async (userId: string) => {
    actions.setLoadingCreator(true);
    try {
      const { data, error } = await getUserProfile(userId);

      if (error) throw new Error(error.message);
      if (data) {
        actions.setTradeCreator(data as User);
      }
    } catch (err: any) {
      console.error('Error fetching trade creator:', err);
    } finally {
      actions.setLoadingCreator(false);
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    actions.setSendingMessage(true);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to send a message');
      }

      if (!state.trade) {
        throw new Error('Trade not found');
      }

      if (!state.message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (!state.trade.creatorId) {
        throw new Error('Trade has no associated user ID');
      }

      const tradeOwnerId = state.trade.creatorId;

      // Create a new conversation
      const { data: conversationData, error: conversationError } = await createConversation(
        [
          { id: currentUser.uid, name: currentUser.displayName || 'You' },
          { id: tradeOwnerId, name: state.trade.creatorName || state.tradeCreator?.displayName || 'User' }
        ],
        {
          tradeId: state.trade.id,
          tradeName: state.trade.title,
          conversationType: 'direct',
        }
      );

      if (conversationError) throw new Error(conversationError.message);
      if (!conversationData) throw new Error('Failed to create conversation');

      // Send the message
      const { error: messageError } = await createMessage(
        conversationData,
        {
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'You',
          senderAvatar: currentUser.photoURL || undefined,
          content: state.message,
          read: false,
        } as any
      );

      if (messageError) throw new Error(messageError.message);

      actions.setMessageSent(true);
      actions.setMessage('');

      // Hide the form after a delay
      setTimeout(() => {
        actions.setShowContactForm(false);
        actions.setMessageSent(false);
      }, 3000);

    } catch (err: any) {
      actions.setError(err.message || 'Failed to send message');
    } finally {
      actions.setSendingMessage(false);
    }
  }, [currentUser, state.trade, state.tradeCreator, state.message]);

  // Handle saving edited trade
  const handleSaveTrade = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    actions.setSaving(true);
    actions.clearError();

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to edit a trade');
      }

      if (!state.trade) {
        throw new Error('Trade not found');
      }

      if (!state.editTitle || !state.editDescription || !state.editOffering || !state.editSeeking || !state.editCategory) {
        throw new Error('All fields are required');
      }

      const updatedTradeData = {
        title: state.editTitle,
        description: state.editDescription,
        skillsOffered: toFsSkills(parseSkillsString(state.editOffering) as any),
        skillsWanted: toFsSkills(parseSkillsString(state.editSeeking) as any),
        // Persist legacy aliases for maximum compatibility with existing readers
        offeredSkills: toFsSkills(parseSkillsString(state.editOffering) as any),
        requestedSkills: toFsSkills(parseSkillsString(state.editSeeking) as any),
        category: state.editCategory,
        status: state.editStatus as 'open' | 'in-progress' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed',
        images: state.images
      };

      await updateTrade(state.trade.id!, updatedTradeData);

      // Update the local trade object
      if (state.trade) {
        const newTrade: Trade = {
          ...state.trade,
          ...updatedTradeData,
          // Ensure both field names are available for backward compatibility
          offeredSkills: toFsSkills(parseSkillsString(state.editOffering) as any),
          requestedSkills: toFsSkills(parseSkillsString(state.editSeeking) as any)
        };
        actions.setTrade(newTrade);
      }

      actions.setIsEditing(false);
      addToast('success', 'Trade updated successfully!');
    } catch (err: any) {
      actions.setError(err.message || 'Failed to update trade');
    } finally {
      actions.setSaving(false);
    }
  }, [currentUser, state.trade, state.editTitle, state.editDescription, state.editOffering, state.editSeeking, state.editCategory, state.editStatus, state.images, addToast]);

  // Handle deleting trade
  const handleDeleteTrade = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      return;
    }

    actions.setDeleting(true);
    actions.clearError();

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to delete a trade');
      }

      if (!state.trade) {
        throw new Error('Trade not found');
      }

      await deleteTrade(state.trade.id!);
      addToast('success', 'Trade deleted successfully!');
      navigate('/trades');
    } catch (err: any) {
      actions.setError(err.message || 'Failed to delete trade');
    } finally {
      actions.setDeleting(false);
    }
  }, [currentUser, state.trade, addToast, navigate]);

  // Action handlers
  const handleRequestCompletion = useCallback(() => {
    actions.resetForms();
    actions.setShowCompletionForm(true);
    setTimeout(() => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  }, []);

  const handleConfirmCompletion = useCallback(() => {
    actions.resetForms();
    actions.setConfirmationMode('confirm');
    actions.setShowConfirmationForm(true);
    setTimeout(() => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  }, []);

  const handleRequestChanges = useCallback(() => {
    actions.resetForms();
    actions.setConfirmationMode('requestChanges');
    actions.setShowConfirmationForm(true);
    setTimeout(() => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, 100);
  }, []);

  const handleCancelTrade = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel this trade?')) {
      updateTrade(state.trade!.id!, { status: 'cancelled' })
        .then(() => fetchTradeDetails())
        .catch(err => console.error('Error cancelling trade:', err));
    }
  }, [state.trade, fetchTradeDetails]);

  // Initialize trade data
  useEffect(() => {
    const startTime = performance.now();
    fetchTradeDetails().then(() => {
      const endTime = performance.now();
      console.log(`Trade details loaded in ${endTime - startTime} milliseconds`);
    });
  }, [fetchTradeDetails]);

  // Performance optimization: Debounce form changes
  const debouncedSave = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (fn: () => void, delay: number = 300) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fn, delay);
    };
  }, []);

  // Loading state
  if (state.loading) {
    return (
      <main 
        role="main" 
        aria-label="Trade details page"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div 
          className="flex justify-center items-center py-12" 
          role="status" 
          aria-live="polite"
          aria-label="Loading trade details"
        >
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"
            aria-hidden="true"
          ></div>
        </div>
      </main>
    );
  }

  // Error state
  if (state.error) {
    return (
      <main 
        role="main" 
        aria-label="Trade details page"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div 
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          {state.error}
        </div>
        <div className="mt-6">
          <Link 
            to="/trades" 
            className="font-medium text-primary hover:text-primary/90"
            aria-label="Go back to trades list"
          >
            ← Back to Trades
          </Link>
        </div>
      </main>
    );
  }

  // Not found state
  if (!state.trade) {
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
    <ErrorBoundary FallbackComponent={TradeErrorFallback}>
      {/* Performance monitoring */}
      <PerformanceMonitor pageName={`TradeDetailPage-${tradeId}`} />

      <main 
        role="main" 
        aria-label="Trade details page"
        className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
      >
        {/* Skip links for accessibility */}
        <div className="sr-only focus-within:not-sr-only">
          <a 
            href="#trade-content-heading" 
            className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-primary text-primary-foreground px-3 py-2 sm:px-4 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
          >
            Skip to main content
          </a>
          <a 
            href="#trade-actions-section" 
            className="absolute top-2 left-32 sm:top-4 sm:left-48 bg-primary text-primary-foreground px-3 py-2 sm:px-4 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
          >
            Skip to actions
          </a>
        </div>
        {/* Header */}
        <TradeDetailHeader
          trade={state.trade}
          tradeCreator={state.tradeCreator}
          loading={state.loading}
          isOwner={isOwner || false}
          onEdit={handleEdit}
          onDelete={handleDeleteTrade}
          formatDate={formatDate}
        />

        {/* Main content */}
        <section 
          aria-labelledby="trade-content-heading"
          className="glassmorphic overflow-hidden transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.005] group/main border border-border/50 backdrop-blur-sm"
        >
          <h1 id="trade-content-heading" className="sr-only">
            {state.trade.title} - Trade Details
          </h1>
          {/* Creator profile */}
          <TradeCreatorProfile
            trade={state.trade}
            tradeCreator={state.tradeCreator}
            loadingCreator={state.loadingCreator}
          />

          {/* Status timeline */}
          <section 
            id="trade-status-section"
            aria-labelledby="trade-status-heading"
            className="p-4 sm:p-6 border-b border-border/60 bg-gradient-to-r from-background/50 to-transparent"
          >
            <h2 id="trade-status-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Trade Status</h2>
            <TradeStatusTimeline status={state.trade.status} />
          </section>

          {/* Change request history */}
          {Array.isArray(state.trade.changeRequests) && state.trade.changeRequests.length > 0 && (
            <section 
              id="change-requests-section"
              aria-labelledby="change-requests-heading"
              className="p-4 sm:p-6 border-b border-border/60 bg-gradient-to-r from-background/30 to-transparent"
            >
              <h2 id="change-requests-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Change Request History</h2>
              <ChangeRequestHistory changeRequests={state.trade.changeRequests} />
            </section>
          )}

          {/* Evidence section */}
          {(state.trade.status === 'completed' || state.trade.status === 'pending_confirmation' || state.trade.status === 'pending_evidence') && (
            <section 
              id="evidence-section" 
              aria-labelledby="evidence-heading"
              className="p-4 sm:p-6 border-b border-border/60 bg-gradient-to-r from-background/40 to-transparent"
            >
              <h2 id="evidence-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Trade Evidence</h2>
              <Suspense fallback={<div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <EvidenceGallery
                  evidence={state.trade.completionEvidence || []}
                  title=""
                  emptyMessage="No evidence has been provided."
                />
              </Suspense>
            </section>
          )}

          {/* Trade details */}
          <TradeDetailsSection trade={state.trade} />

          {/* Actions */}
          <section 
            id="trade-actions-section"
            aria-labelledby="trade-actions-heading"
            className="p-4 sm:p-6"
          >
            <h2 id="trade-actions-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Trade Actions</h2>
          <TradeActions
            trade={state.trade}
            tradeCreator={state.tradeCreator}
            currentUser={currentUser}
            isOwner={isOwner}
            showContactForm={state.showContactForm}
            message={state.message}
            messageSent={state.messageSent}
            sendingMessage={state.sendingMessage}
            onMessageChange={actions.setMessage}
            onSendMessage={handleSendMessage}
              onShowContactForm={handleShowContactForm}
              onHideContactForm={handleHideContactForm}
            onPrimaryAction={() => {}} // Will be handled by TradeActions
            onSecondaryAction={() => {}} // Will be handled by TradeActions
            onRequestCompletion={handleRequestCompletion}
            onConfirmCompletion={handleConfirmCompletion}
            onRequestChanges={handleRequestChanges}
            onCancelTrade={handleCancelTrade}
              onShowProposalForm={handleShowProposalForm}
              onShowReviewForm={handleShowReviewForm}
            actions={tradeActions!}
          />
          </section>
        </section>

        {/* Edit form */}
        {state.isEditing && isOwner && (
          <section 
            id="edit-trade-section"
            aria-labelledby="edit-trade-heading"
            className="mt-4 sm:mt-6"
          >
            <GlassmorphicForm 
              variant="standard" 
              brandAccent="orange"
              onSubmit={handleSaveTrade}
              className="p-4 sm:p-6"
            >
              <h3 id="edit-trade-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">Edit Trade</h3>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Images
                  </label>
                  <MultipleImageUploader
                    onImagesChange={actions.setImages}
                    folder={`tradeya/trades/${state.trade.id}`}
                    initialImageUrls={state.images}
                    maxImages={5}
                  />
                </div>

                <GlassmorphicInput
                  label="Title"
                  value={state.editTitle}
                  onChange={(e) => actions.setEditTitle(e.target.value)}
                  variant="glass"
                  brandAccent="orange"
                  required
                />

                <GlassmorphicTextarea
                  label="Description"
                  value={state.editDescription}
                  onChange={(e) => actions.setEditDescription(e.target.value)}
                  variant="glass"
                  brandAccent="blue"
                  minRows={4}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassmorphicInput
                    label="What You're Offering"
                    value={state.editOffering}
                    onChange={(e) => actions.setEditOffering(e.target.value)}
                    placeholder="e.g. Web development, React, Next.js"
                    variant="glass"
                    brandAccent="orange"
                    required
                  />

                  <GlassmorphicInput
                    label="What You're Seeking"
                    value={state.editSeeking}
                    onChange={(e) => actions.setEditSeeking(e.target.value)}
                    placeholder="e.g. Graphic design, Logo design"
                    variant="glass"
                    brandAccent="purple"
                    required
                  />
                </div>

                <GlassmorphicDropdown
                  label="Category"
                  options={[
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
                  ].map(cat => ({ value: cat, label: cat }))}
                  value={state.editCategory}
                  onChange={(value) => actions.setEditCategory(String(value))}
                  variant="glass"
                  brandAccent="blue"
                  required
                />

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button type="submit" className="bg-primary text-primary-foreground px-4 py-3 sm:py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 min-h-[44px] text-sm sm:text-base" disabled={state.isSaving}>
                    {state.isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => actions.setIsEditing(false)} className="bg-secondary text-secondary-foreground px-4 py-3 sm:py-2 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 min-h-[44px] text-sm sm:text-base" disabled={state.isSaving}>
                    Cancel
                  </button>
                </div>
              </div>
            </GlassmorphicForm>
          </section>
        )}

        {/* Completion form */}
        {state.showCompletionForm && currentUser && (state.trade.status === 'in-progress' || state.trade.status === 'pending_evidence') &&
          (state.trade.creatorId === currentUser.uid || state.trade.participantId === currentUser.uid) && (
          <div className="mt-6">
            <TradeCompletionForm
              tradeId={state.trade.id!}
              tradeName={state.trade.title}
              onSuccess={() => {
                actions.setShowCompletionForm(false);
                fetchTradeDetails();
              }}
              onCancel={() => actions.setShowCompletionForm(false)}
            />
          </div>
        )}

        {/* Confirmation form */}
        {state.showConfirmationForm && currentUser && state.trade.status === 'pending_confirmation' &&
          state.trade.completionRequestedBy !== currentUser.uid &&
          (state.trade.creatorId === currentUser.uid || state.trade.participantId === currentUser.uid) && (
          <div className="mt-6">
            <TradeConfirmationForm
              trade={state.trade}
              initialMode={state.confirmationInitialMode}
              onSuccess={() => {
                actions.setShowConfirmationForm(false);
                fetchTradeDetails();
              }}
              onCancel={() => actions.setShowConfirmationForm(false)}
              onRequestChanges={() => {
                actions.setShowConfirmationForm(false);
                fetchTradeDetails();
              }}
            />
          </div>
        )}

        {/* Proposal section for trade creators */}
        {currentUser && state.trade && state.trade.creatorId === currentUser.uid && state.trade.status === 'open' && (
          <div id="proposals-section" className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Trade Proposals</h2>
            <TradeProposalDashboard
              tradeId={state.trade.id!}
              onProposalAccepted={() => {
                if (tradeId) {
                  getTrade(tradeId).then(({ data }) => {
                    if (data) {
                      actions.setTrade(data as Trade);
                    }
                  });
                }
              }}
            />
          </div>
        )}

        {/* Proposal form for other users */}
        {currentUser && state.trade && state.trade.status === 'open' && state.trade.creatorId !== currentUser.uid && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Submit a Proposal</h2>
            {!state.showProposalForm ? (
              <div className="glassmorphic rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] group">
                <h3 className="text-lg font-medium text-foreground mb-2 transition-colors duration-300 group-hover:text-primary">
                  Interested in this trade?
                </h3>
                <p className="text-muted-foreground mb-4 transition-colors duration-300 group-hover:text-foreground">
                  Submit a proposal to let the trade creator know you're interested.
                </p>
                <button 
                  onClick={() => actions.setShowProposalForm(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
                >
                  Submit Proposal
                </button>
              </div>
            ) : (
              <TradeProposalForm
                trade={state.trade as any}
                onSuccess={() => {
                  actions.setShowProposalForm(false);
                  addToast('success', 'Proposal submitted successfully!');
                }}
                onCancel={() => actions.setShowProposalForm(false)}
              />
            )}
          </div>
        )}

        {/* Review section */}
        {currentUser && state.trade && state.trade.id && currentUser.uid !== state.trade.creatorId && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Leave a Review</h2>
            {state.showReviewForm ? (
              <ReviewForm
                tradeId={state.trade.id!}
                tradeName={state.trade.title}
                receiverId={state.trade.creatorId || state.trade.participantId || ''}
                receiverName={state.tradeCreator?.displayName || 'User'}
                onSuccess={() => actions.setShowReviewForm(false)}
                onCancel={() => actions.setShowReviewForm(false)}
              />
            ) : (
              <div className="glassmorphic rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-secondary/10 hover:scale-[1.02] group">
                <h3 className="text-lg font-medium text-foreground mb-2 transition-colors duration-300 group-hover:text-secondary">
                  Have you completed a trade with this user?
                </h3>
                <p className="text-muted-foreground mb-4 transition-colors duration-300 group-hover:text-foreground">
                  Share your experience and help others in the community.
                </p>
                <button 
                  onClick={() => actions.setShowReviewForm(true)}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary/30 active:scale-95"
                >
                  Write a Review
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
};

export default TradeDetailPageRefactored;
