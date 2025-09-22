import { renderHook, act } from '@testing-library/react';
import { useTradeDetailState } from '../useTradeDetailState';
import { Trade } from '../../services/firestore-exports';
import { User } from '../../services/firestore-exports';

const mockTrade: Trade = {
  id: 'trade-1',
  title: 'Test Trade',
  description: 'Test Description',
  category: 'Web Development',
  status: 'open',
  creatorId: 'user-1',
  createdAt: { toDate: () => new Date('2024-01-01') } as any,
  skillsOffered: [{ name: 'React', level: 'intermediate' }],
  skillsWanted: [{ name: 'Design', level: 'beginner' }],
} as Trade;

const mockUser: User = {
  uid: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
} as User;

describe('useTradeDetailState', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    expect(result.current.state).toEqual({
      trade: null,
      tradeCreator: null,
      loading: true,
      loadingCreator: false,
      isSaving: false,
      isDeleting: false,
      sendingMessage: false,
      error: null,
      showContactForm: false,
      showReviewForm: false,
      showProposalForm: false,
      showCompletionForm: false,
      showConfirmationForm: false,
      isEditing: false,
      message: '',
      messageSent: false,
      editTitle: '',
      editDescription: '',
      editOffering: '',
      editSeeking: '',
      editCategory: '',
      editStatus: 'open',
      images: [],
      confirmationInitialMode: 'confirm',
    });
  });

  it('sets trade correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setTrade(mockTrade);
    });
    
    expect(result.current.state.trade).toBe(mockTrade);
  });

  it('sets trade creator correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setTradeCreator(mockUser);
    });
    
    expect(result.current.state.tradeCreator).toBe(mockUser);
  });

  it('sets loading states correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setLoading(false);
      result.current.actions.setLoadingCreator(true);
      result.current.actions.setSaving(true);
      result.current.actions.setDeleting(true);
      result.current.actions.setSendingMessage(true);
    });
    
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.loadingCreator).toBe(true);
    expect(result.current.state.isSaving).toBe(true);
    expect(result.current.state.isDeleting).toBe(true);
    expect(result.current.state.sendingMessage).toBe(true);
  });

  it('sets error correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setError('Test error');
    });
    
    expect(result.current.state.error).toBe('Test error');
  });

  it('clears error correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setError('Test error');
      result.current.actions.clearError();
    });
    
    expect(result.current.state.error).toBe(null);
  });

  it('sets form visibility states correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setShowContactForm(true);
      result.current.actions.setShowReviewForm(true);
      result.current.actions.setShowProposalForm(true);
      result.current.actions.setShowCompletionForm(true);
      result.current.actions.setShowConfirmationForm(true);
      result.current.actions.setIsEditing(true);
    });
    
    expect(result.current.state.showContactForm).toBe(true);
    expect(result.current.state.showReviewForm).toBe(true);
    expect(result.current.state.showProposalForm).toBe(true);
    expect(result.current.state.showCompletionForm).toBe(true);
    expect(result.current.state.showConfirmationForm).toBe(true);
    expect(result.current.state.isEditing).toBe(true);
  });

  it('sets message state correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setMessage('Test message');
      result.current.actions.setMessageSent(true);
    });
    
    expect(result.current.state.message).toBe('Test message');
    expect(result.current.state.messageSent).toBe(true);
  });

  it('sets edit form fields correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setEditTitle('New Title');
      result.current.actions.setEditDescription('New Description');
      result.current.actions.setEditOffering('React, TypeScript');
      result.current.actions.setEditSeeking('Design, UX');
      result.current.actions.setEditCategory('Design');
      result.current.actions.setEditStatus('in-progress');
    });
    
    expect(result.current.state.editTitle).toBe('New Title');
    expect(result.current.state.editDescription).toBe('New Description');
    expect(result.current.state.editOffering).toBe('React, TypeScript');
    expect(result.current.state.editSeeking).toBe('Design, UX');
    expect(result.current.state.editCategory).toBe('Design');
    expect(result.current.state.editStatus).toBe('in-progress');
  });

  it('sets images correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    const testImages = ['image1.jpg', 'image2.jpg'];
    
    act(() => {
      result.current.actions.setImages(testImages);
    });
    
    expect(result.current.state.images).toEqual(testImages);
  });

  it('sets confirmation mode correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setConfirmationMode('requestChanges');
    });
    
    expect(result.current.state.confirmationInitialMode).toBe('requestChanges');
  });

  it('initializes edit form with trade data', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.initializeEditForm(mockTrade);
    });
    
    expect(result.current.state.editTitle).toBe('Test Trade');
    expect(result.current.state.editDescription).toBe('Test Description');
    expect(result.current.state.editOffering).toBe('React (intermediate)');
    expect(result.current.state.editSeeking).toBe('Design (beginner)');
    expect(result.current.state.editCategory).toBe('Web Development');
    expect(result.current.state.editStatus).toBe('open');
  });

  it('resets forms correctly', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    // Set some form states
    act(() => {
      result.current.actions.setShowContactForm(true);
      result.current.actions.setShowReviewForm(true);
      result.current.actions.setShowProposalForm(true);
      result.current.actions.setShowCompletionForm(true);
      result.current.actions.setShowConfirmationForm(true);
      result.current.actions.setIsEditing(true);
      result.current.actions.setMessage('Test message');
      result.current.actions.setMessageSent(true);
    });
    
    // Reset forms
    act(() => {
      result.current.actions.resetForms();
    });
    
    expect(result.current.state.showContactForm).toBe(false);
    expect(result.current.state.showReviewForm).toBe(false);
    expect(result.current.state.showProposalForm).toBe(false);
    expect(result.current.state.showCompletionForm).toBe(false);
    expect(result.current.state.showConfirmationForm).toBe(false);
    expect(result.current.state.isEditing).toBe(false);
    expect(result.current.state.message).toBe('');
    expect(result.current.state.messageSent).toBe(false);
  });

  it('handles multiple state updates in sequence', () => {
    const { result } = renderHook(() => useTradeDetailState());
    
    act(() => {
      result.current.actions.setTrade(mockTrade);
      result.current.actions.setTradeCreator(mockUser);
      result.current.actions.setLoading(false);
      result.current.actions.setError(null);
    });
    
    expect(result.current.state.trade).toBe(mockTrade);
    expect(result.current.state.tradeCreator).toBe(mockUser);
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBe(null);
  });
});
