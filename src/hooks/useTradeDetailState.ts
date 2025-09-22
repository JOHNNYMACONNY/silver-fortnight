import { useReducer, useCallback, useMemo } from 'react';
import { Trade } from '../services/firestore-exports';
import { User } from '../services/firestore-exports';

export interface TradeDetailState {
  // Trade data
  trade: Trade | null;
  tradeCreator: User | null;
  
  // Loading states
  loading: boolean;
  loadingCreator: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  sendingMessage: boolean;
  
  // Error state
  error: string | null;
  
  // UI states
  showContactForm: boolean;
  showReviewForm: boolean;
  showProposalForm: boolean;
  showCompletionForm: boolean;
  showConfirmationForm: boolean;
  isEditing: boolean;
  
  // Form states
  message: string;
  messageSent: boolean;
  editTitle: string;
  editDescription: string;
  editOffering: string;
  editSeeking: string;
  editCategory: string;
  editStatus: string;
  images: string[];
  confirmationInitialMode: 'confirm' | 'requestChanges';
}

export type TradeDetailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_CREATOR'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'SET_SENDING_MESSAGE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRADE'; payload: Trade | null }
  | { type: 'SET_TRADE_CREATOR'; payload: User | null }
  | { type: 'SET_SHOW_CONTACT_FORM'; payload: boolean }
  | { type: 'SET_SHOW_REVIEW_FORM'; payload: boolean }
  | { type: 'SET_SHOW_PROPOSAL_FORM'; payload: boolean }
  | { type: 'SET_SHOW_COMPLETION_FORM'; payload: boolean }
  | { type: 'SET_SHOW_CONFIRMATION_FORM'; payload: boolean }
  | { type: 'SET_IS_EDITING'; payload: boolean }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_MESSAGE_SENT'; payload: boolean }
  | { type: 'SET_EDIT_TITLE'; payload: string }
  | { type: 'SET_EDIT_DESCRIPTION'; payload: string }
  | { type: 'SET_EDIT_OFFERING'; payload: string }
  | { type: 'SET_EDIT_SEEKING'; payload: string }
  | { type: 'SET_EDIT_CATEGORY'; payload: string }
  | { type: 'SET_EDIT_STATUS'; payload: string }
  | { type: 'SET_IMAGES'; payload: string[] }
  | { type: 'SET_CONFIRMATION_MODE'; payload: 'confirm' | 'requestChanges' }
  | { type: 'INITIALIZE_EDIT_FORM'; payload: Trade }
  | { type: 'RESET_FORMS' }
  | { type: 'CLEAR_ERROR' };

const initialState: TradeDetailState = {
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
};

function tradeDetailReducer(state: TradeDetailState, action: TradeDetailAction): TradeDetailState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOADING_CREATOR':
      return { ...state, loadingCreator: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload };
    case 'SET_SENDING_MESSAGE':
      return { ...state, sendingMessage: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TRADE':
      return { ...state, trade: action.payload };
    case 'SET_TRADE_CREATOR':
      return { ...state, tradeCreator: action.payload };
    case 'SET_SHOW_CONTACT_FORM':
      return { ...state, showContactForm: action.payload };
    case 'SET_SHOW_REVIEW_FORM':
      return { ...state, showReviewForm: action.payload };
    case 'SET_SHOW_PROPOSAL_FORM':
      return { ...state, showProposalForm: action.payload };
    case 'SET_SHOW_COMPLETION_FORM':
      return { ...state, showCompletionForm: action.payload };
    case 'SET_SHOW_CONFIRMATION_FORM':
      return { ...state, showConfirmationForm: action.payload };
    case 'SET_IS_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'SET_MESSAGE_SENT':
      return { ...state, messageSent: action.payload };
    case 'SET_EDIT_TITLE':
      return { ...state, editTitle: action.payload };
    case 'SET_EDIT_DESCRIPTION':
      return { ...state, editDescription: action.payload };
    case 'SET_EDIT_OFFERING':
      return { ...state, editOffering: action.payload };
    case 'SET_EDIT_SEEKING':
      return { ...state, editSeeking: action.payload };
    case 'SET_EDIT_CATEGORY':
      return { ...state, editCategory: action.payload };
    case 'SET_EDIT_STATUS':
      return { ...state, editStatus: action.payload };
    case 'SET_IMAGES':
      return { ...state, images: action.payload };
    case 'SET_CONFIRMATION_MODE':
      return { ...state, confirmationInitialMode: action.payload };
    case 'INITIALIZE_EDIT_FORM':
      return {
        ...state,
        editTitle: action.payload.title,
        editDescription: action.payload.description,
        editOffering: action.payload.skillsOffered ? action.payload.skillsOffered.map(s => `${s.name} (${s.level})`).join(', ') : '',
        editSeeking: action.payload.skillsWanted ? action.payload.skillsWanted.map(s => `${s.name} (${s.level})`).join(', ') : '',
        editCategory: action.payload.category || '',
        editStatus: (action.payload.status as string) === 'active' ? 'open' : (action.payload.status || 'open'),
        images: action.payload.images || [],
      };
    case 'RESET_FORMS':
      return {
        ...state,
        showContactForm: false,
        showReviewForm: false,
        showProposalForm: false,
        showCompletionForm: false,
        showConfirmationForm: false,
        isEditing: false,
        message: '',
        messageSent: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export const useTradeDetailState = () => {
  const [state, dispatch] = useReducer(tradeDetailReducer, initialState);

  const actions = useMemo(() => ({
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setLoadingCreator: (loading: boolean) => dispatch({ type: 'SET_LOADING_CREATOR', payload: loading }),
    setSaving: (saving: boolean) => dispatch({ type: 'SET_SAVING', payload: saving }),
    setDeleting: (deleting: boolean) => dispatch({ type: 'SET_DELETING', payload: deleting }),
    setSendingMessage: (sending: boolean) => dispatch({ type: 'SET_SENDING_MESSAGE', payload: sending }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setTrade: (trade: Trade | null) => dispatch({ type: 'SET_TRADE', payload: trade }),
    setTradeCreator: (creator: User | null) => dispatch({ type: 'SET_TRADE_CREATOR', payload: creator }),
    setShowContactForm: (show: boolean) => dispatch({ type: 'SET_SHOW_CONTACT_FORM', payload: show }),
    setShowReviewForm: (show: boolean) => dispatch({ type: 'SET_SHOW_REVIEW_FORM', payload: show }),
    setShowProposalForm: (show: boolean) => dispatch({ type: 'SET_SHOW_PROPOSAL_FORM', payload: show }),
    setShowCompletionForm: (show: boolean) => dispatch({ type: 'SET_SHOW_COMPLETION_FORM', payload: show }),
    setShowConfirmationForm: (show: boolean) => dispatch({ type: 'SET_SHOW_CONFIRMATION_FORM', payload: show }),
    setIsEditing: (editing: boolean) => dispatch({ type: 'SET_IS_EDITING', payload: editing }),
    setMessage: (message: string) => dispatch({ type: 'SET_MESSAGE', payload: message }),
    setMessageSent: (sent: boolean) => dispatch({ type: 'SET_MESSAGE_SENT', payload: sent }),
    setEditTitle: (title: string) => dispatch({ type: 'SET_EDIT_TITLE', payload: title }),
    setEditDescription: (description: string) => dispatch({ type: 'SET_EDIT_DESCRIPTION', payload: description }),
    setEditOffering: (offering: string) => dispatch({ type: 'SET_EDIT_OFFERING', payload: offering }),
    setEditSeeking: (seeking: string) => dispatch({ type: 'SET_EDIT_SEEKING', payload: seeking }),
    setEditCategory: (category: string) => dispatch({ type: 'SET_EDIT_CATEGORY', payload: category }),
    setEditStatus: (status: string) => dispatch({ type: 'SET_EDIT_STATUS', payload: status }),
    setImages: (images: string[]) => dispatch({ type: 'SET_IMAGES', payload: images }),
    setConfirmationMode: (mode: 'confirm' | 'requestChanges') => dispatch({ type: 'SET_CONFIRMATION_MODE', payload: mode }),
    initializeEditForm: (trade: Trade) => dispatch({ type: 'INITIALIZE_EDIT_FORM', payload: trade }),
    resetForms: () => dispatch({ type: 'RESET_FORMS' }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  }), []);

  return { state, actions };
};
