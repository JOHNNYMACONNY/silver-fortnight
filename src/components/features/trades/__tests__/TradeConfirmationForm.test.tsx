import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradeConfirmationForm from '../TradeConfirmationForm';
import { useAuth } from '../../../../AuthContext';
import { confirmTradeCompletion } from '../../../../services/firestore-exports';
import { generateTradePortfolioItem } from '../../../../services/portfolio';

// Mock the dependencies
jest.mock('../../../../AuthContext');
jest.mock('../../../../services/firestore');
jest.mock('../../../../services/portfolio');
jest.mock('../../../features/evidence/EvidenceGallery', () => ({
  EvidenceGallery: ({ title, emptyMessage }: { title: string; emptyMessage: string }) => (
    <div data-testid="evidence-gallery">
      <div>{title}</div>
      <div>{emptyMessage}</div>
    </div>
  ),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockConfirmTradeCompletion = jest.mocked(confirmTradeCompletion);
const mockGenerateTradePortfolioItem = jest.mocked(generateTradePortfolioItem);

const mockTrade = {
  id: 'trade-123',
  title: 'Web Development Trade',
  description: 'Learn React in exchange for Python tutoring',
  offering: 'React tutoring',
  seeking: 'Python tutoring',
  category: 'Programming',
  creatorId: 'creator-123',
  participantId: 'participant-456',
  offeredSkills: [{ name: 'React', level: 'intermediate' as const }],
  requestedSkills: [{ name: 'Python', level: 'beginner' as const }],
  skillsOffered: ['React'],
  skillsWanted: ['Python'],
  status: 'pending_confirmation' as const,
  createdAt: { toDate: () => new Date() } as any,
  updatedAt: { toDate: () => new Date() } as any,
  completionNotes: 'Trade completed successfully',
  creatorName: 'John Creator',
  creatorEvidence: [],
  participantEvidence: [],
  completionEvidence: [],
};

const mockCurrentUser = {
  uid: 'participant-456',
  displayName: 'Test Participant',
  email: 'test@example.com',
  emailVerified: true,
  isAnonymous: false,
  metadata: {} as any,
  providerData: [],
  refreshToken: 'token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
};

describe('TradeConfirmationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockCurrentUser,
      currentUser: mockCurrentUser,
      loading: false,
      error: null,
      isAdmin: false,
      signIn: jest.fn(),
      signInWithEmail: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Portfolio Integration', () => {
    it('should generate portfolio items for both participants when trade is confirmed', async () => {
      // Mock successful trade confirmation
      mockConfirmTradeCompletion.mockResolvedValue({ data: undefined, error: null });
      
      // Mock successful portfolio generation
      mockGenerateTradePortfolioItem.mockResolvedValue({ success: true, error: null });

      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();
      const mockOnRequestChanges = jest.fn();

      render(
        <TradeConfirmationForm
          trade={mockTrade}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onRequestChanges={mockOnRequestChanges}
        />
      );

      // Find and click the confirm button
      const confirmButton = screen.getByRole('button', { name: /confirm completion/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockConfirmTradeCompletion).toHaveBeenCalledWith('trade-123', 'participant-456');
      });

      // Verify portfolio generation was called for both participants
      await waitFor(() => {
        expect(mockGenerateTradePortfolioItem).toHaveBeenCalledTimes(2);
      });

      // Check creator portfolio generation
      expect(mockGenerateTradePortfolioItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'trade-123',
          title: 'Web Development Trade',
          description: 'Learn React in exchange for Python tutoring',
          offeredSkills: ['React'],
          requestedSkills: ['Python'],
          creatorId: 'creator-123',
          participantId: 'participant-456',
        }),
        'creator-123',
        true, // isCreator
        true  // defaultVisibility
      );

      // Check participant portfolio generation
      expect(mockGenerateTradePortfolioItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'trade-123',
          title: 'Web Development Trade',
          description: 'Learn React in exchange for Python tutoring',
          offeredSkills: ['React'],
          requestedSkills: ['Python'],
          creatorId: 'creator-123',
          participantId: 'participant-456',
        }),
        'participant-456',
        false, // isCreator
        true   // defaultVisibility
      );

      // Verify success callback was called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should continue with trade confirmation even if portfolio generation fails', async () => {
      // Mock successful trade confirmation
      mockConfirmTradeCompletion.mockResolvedValue({ data: undefined, error: null });
      
      // Mock portfolio generation failure
      mockGenerateTradePortfolioItem.mockRejectedValue(new Error('Portfolio generation failed'));

      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();
      const mockOnRequestChanges = jest.fn();

      // Spy on console.warn to verify error logging
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <TradeConfirmationForm
          trade={mockTrade}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onRequestChanges={mockOnRequestChanges}
        />
      );

      // Find and click the confirm button
      const confirmButton = screen.getByRole('button', { name: /confirm completion/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockConfirmTradeCompletion).toHaveBeenCalledWith('trade-123', 'participant-456');
      });

      // Verify portfolio generation was attempted
      await waitFor(() => {
        expect(mockGenerateTradePortfolioItem).toHaveBeenCalled();
      });

      // Verify error was logged but success callback was still called
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Portfolio generation failed:', 'Portfolio generation failed');
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should not generate portfolio items if trade ID is missing', async () => {
      const tradeWithoutId = { ...mockTrade, id: undefined };
      
      // Mock successful trade confirmation
      mockConfirmTradeCompletion.mockResolvedValue({ data: undefined, error: null });

      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();
      const mockOnRequestChanges = jest.fn();

      render(
        <TradeConfirmationForm
          trade={tradeWithoutId}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onRequestChanges={mockOnRequestChanges}
        />
      );

      // This should fail because trade.id is missing for the trade confirmation call
      const confirmButton = screen.getByRole('button', { name: /confirm completion/i });
      fireEvent.click(confirmButton);

      // The component should show an error and not call portfolio generation
      await waitFor(() => {
        expect(screen.getByText(/trade id is missing/i)).toBeInTheDocument();
        expect(mockGenerateTradePortfolioItem).not.toHaveBeenCalled();
      });
    });
  });
});
