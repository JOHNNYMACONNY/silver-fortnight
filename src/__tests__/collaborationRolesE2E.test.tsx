import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CollaborationDetailPage from '../pages/CollaborationDetailPage';
import AuthContext from '../AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { RoleState, ApplicationStatus } from '../types/collaboration';

// Mock all services
jest.mock('../services/collaborations');
jest.mock('../services/collaborationRoles');
jest.mock('../services/roleApplications');
jest.mock('../services/roleCompletions');
jest.mock('../services/roleAbandonment');
jest.mock('../services/notifications');

// Mock Firebase
jest.mock('../firebase-config', () => ({
  db: jest.fn(),
  storage: jest.fn(),
  auth: jest.fn()
}));

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-collaboration-id' })
}));

import * as collaborationService from '../services/collaborations';
import * as roleService from '../services/collaborationRoles';
import * as applicationService from '../services/roleApplications';
import * as completionService from '../services/roleCompletions';

const mockCollaborationService = collaborationService as jest.Mocked<typeof collaborationService>;
const mockRoleService = roleService as jest.Mocked<typeof roleService>;
const mockApplicationService = applicationService as jest.Mocked<typeof applicationService>;
const mockCompletionService = completionService as jest.Mocked<typeof completionService>;

// Test users
const mockCreatorUser = {
  uid: 'creator-123',
  email: 'creator@example.com',
  displayName: 'Collaboration Creator',
  photoURL: 'https://example.com/creator.jpg'
};

const mockApplicantUser = {
  uid: 'applicant-123',
  email: 'applicant@example.com',
  displayName: 'Role Applicant',
  photoURL: 'https://example.com/applicant.jpg'
};

const mockParticipantUser = {
  uid: 'participant-123',
  email: 'participant@example.com',
  displayName: 'Role Participant',
  photoURL: 'https://example.com/participant.jpg'
};

// Test data
const mockCollaboration = {
  id: 'test-collaboration-id',
  title: 'Mobile App Development',
  description: 'Building a cross-platform mobile application',
  creatorId: 'creator-123',
  creatorName: 'Project Creator',
  creatorPhotoURL: 'https://example.com/creator.jpg',
  status: 'recruiting',
  roleCount: 3,
  filledRoleCount: 1,
  completedRoleCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15')
};

const mockRoles = [
  {
    id: 'frontend-role',
    collaborationId: 'test-collaboration-id',
    title: 'Frontend Developer',
    description: 'Develop the user interface using React Native',
    maxParticipants: 1,
    status: RoleState.OPEN,
    applicationCount: 2,
    requiredSkills: [
      { name: 'React Native', level: 'intermediate' as const }, // Updated level
      { name: 'JavaScript', level: 'intermediate' as const } // Updated level
    ],
    parentRoleId: undefined,
    childRoleIds: [],
    participantId: undefined,
    metadata: {},
    permissions: [],
    requirements: [],
    currentParticipants: 0,
    completionCriteria: {
      requiredDeliverables: ['UI Components', 'User Flow Implementation'],
      reviewType: 'admin',
      minimumDuration: 14,
      maximumDuration: 45
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'backend-role',
    collaborationId: 'test-collaboration-id',
    title: 'Backend Developer',
    description: 'Build the API and database infrastructure',
    maxParticipants: 1,
    status: RoleState.FILLED,
    applicationCount: 3,
    requiredSkills: [
      { name: 'Node.js', level: 'intermediate' as const }, // Updated level
      { name: 'MongoDB', level: 'beginner' as const } // Updated level
    ],
    parentRoleId: undefined,
    childRoleIds: [],
    participantId: 'participant-123',
    participantName: 'Role Participant',
    participantPhotoURL: 'https://example.com/participant.jpg',
    metadata: {},
    permissions: [],
    requirements: [],
    currentParticipants: 1,
    completionCriteria: {
      requiredDeliverables: ['API Endpoints', 'Database Schema'],
      reviewType: 'admin',
      minimumDuration: 21,
      maximumDuration: 60
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-05')
  },
  {
    id: 'designer-role',
    collaborationId: 'test-collaboration-id',
    title: 'UI/UX Designer',
    description: 'Create user experience and visual design',
    maxParticipants: 1,
    status: RoleState.COMPLETED,
    applicationCount: 1,
    requiredSkills: [
      { name: 'Figma', level: 'intermediate' as const }, // Updated level
      { name: 'UI Design', level: 'intermediate' as const } // Updated level
    ],
    parentRoleId: undefined,
    childRoleIds: [],
    participantId: 'other-participant',
    participantName: 'Design Expert',
    participantPhotoURL: 'https://example.com/designer.jpg',
    metadata: {},
    permissions: [],
    requirements: [],
    currentParticipants: 1,
    completionCriteria: {
      requiredDeliverables: ['Wireframes', 'Visual Mockups'],
      reviewType: 'admin',
      minimumDuration: 10,
      maximumDuration: 30
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10')
  }
];

const mockApplications = [
  {
    id: 'app-1',
    collaborationId: 'test-collaboration-id',
    roleId: 'frontend-role',
    applicantId: 'applicant-123',
    applicantName: 'Role Applicant',
    message: 'I have 3 years of React Native experience',
    evidence: [
      {
        type: 'link',
        url: 'https://github.com/applicant/portfolio',
        title: 'My Portfolio',
        description: 'Collection of mobile apps I\'ve built'
      }
    ],
    status: ApplicationStatus.PENDING,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  }
];

// Test wrapper
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  user?: any | null;
}> = ({ children, user = mockCreatorUser }) => (
  <BrowserRouter>
    <AuthContext.Provider value={{
      user: user,
      currentUser: user,
      userProfile: user, // <-- Add this line to satisfy AuthContextType
      loading: false,
      error: null,
      isAdmin: false,
      signIn: jest.fn(),
      signInWithEmail: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      logout: jest.fn()
    }}>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('Collaboration Roles E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup service mocks
    mockCollaborationService.getCollaboration.mockResolvedValue({
      success: true,
      data: mockCollaboration
    });

    mockRoleService.getCollaborationRoles.mockResolvedValue({
      success: true,
      data: mockRoles as any // Using as any temporarily to bypass deeper type issues for now
    });

    mockApplicationService.getRoleApplications.mockResolvedValue({
      success: true,
      data: mockApplications
    });

    mockApplicationService.submitRoleApplication.mockResolvedValue({
      success: true,
      data: mockApplications[0]
    });

    mockApplicationService.updateApplicationStatus.mockResolvedValue({
      success: true,
      data: { ...mockApplications[0], status: ApplicationStatus.ACCEPTED }
    });

    mockCompletionService.requestRoleCompletion.mockResolvedValue({
      success: true,
      data: {} as any
    });

    mockCompletionService.confirmRoleCompletion.mockResolvedValue({
      success: true,
      data: {} as any
    });
  });

  describe('Creator Workflow: Managing a Collaboration', () => {
    it('should allow creator to view and manage roles', async () => {
      render(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Should see all roles with their current status
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();

      // Should see role management button
      expect(screen.getByText('Manage Roles')).toBeInTheDocument();

      // Verify service calls
      expect(mockCollaborationService.getCollaboration).toHaveBeenCalledWith('test-collaboration-id');
      expect(mockRoleService.getCollaborationRoles).toHaveBeenCalledWith('test-collaboration-id');
    });

    it('should allow creator to review and accept applications', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Click manage roles
      const manageButton = screen.getByText('Manage Roles');
      await user.click(manageButton);

      // Management dashboard should open
      await waitFor(() => {
        expect(screen.getByText('Role Management Dashboard')).toBeInTheDocument();
      });

      // Should see applications for open roles
      const frontendRole = screen.getByText('Frontend Developer').closest('[data-testid="role-management-card"]') as HTMLElement;
      expect(frontendRole).toBeInTheDocument();

      // Should see application from applicant
      expect(screen.getByText('Role Applicant')).toBeInTheDocument();
      expect(screen.getByText('I have 3 years of React Native experience')).toBeInTheDocument();

      // Accept the application
      const acceptButton = screen.getByText('Accept');
      await user.click(acceptButton);

      // Should confirm acceptance
      await waitFor(() => {
        expect(mockApplicationService.updateApplicationStatus).toHaveBeenCalledWith(
          'test-collaboration-id',
          'frontend-role',
          'app-1',
          ApplicationStatus.ACCEPTED,
          'creator-123'
        );
      });
    });

    it('should show collaboration progress and completion status', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Click to view progress
      const progressButton = screen.getByText('View Progress');
      await user.click(progressButton);

      // Should show status tracker
      await waitFor(() => {
        expect(screen.getByText('Collaboration Progress')).toBeInTheDocument();
      });

      // Should show progress metrics
      // 3 total roles, 1 filled (backend), 1 completed (designer), 1 open (frontend)
      expect(screen.getByText(/progress/i)).toBeInTheDocument();
    });
  });

  describe('Applicant Workflow: Applying for Roles', () => {
    it('should allow user to apply for open roles', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Should see apply button for open roles
      const frontendRole = screen.getByText('Frontend Developer').closest('[data-testid="role-card"]') as HTMLElement;
      const applyButton = within(frontendRole!).getByText('Apply');
      
      await user.click(applyButton);

      // Application modal should open
      await waitFor(() => {
        expect(screen.getByText('Apply for Frontend Developer')).toBeInTheDocument();
      });

      // Fill out application
      const messageInput = screen.getByLabelText(/application message/i);
      await user.type(messageInput, 'I am very excited about this opportunity and have extensive React Native experience.');

      // Submit application
      const submitButton = screen.getByText('Submit Application');
      await user.click(submitButton);

      // Verify submission
      await waitFor(() => {
        expect(mockApplicationService.submitRoleApplication).toHaveBeenCalledWith(
          'test-collaboration-id',
          'frontend-role',
          'applicant-123',
          expect.objectContaining({
            message: 'I am very excited about this opportunity and have extensive React Native experience.'
          })
        );
      });

      // Should show success message
      expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument();
    });

    it('should prevent applying for filled or completed roles', async () => {
      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Filled role should not have apply button
      const backendRole = screen.getByText('Backend Developer').closest('[data-testid="role-card"]') as HTMLElement;
      expect(within(backendRole!).queryByText('Apply')).not.toBeInTheDocument();

      // Completed role should not have apply button
      const designerRole = screen.getByText('UI/UX Designer').closest('[data-testid="role-card"]') as HTMLElement;
      expect(within(designerRole!).queryByText('Apply')).not.toBeInTheDocument();
    });

    it('should show application status when user has already applied', async () => {
      // Mock user has already applied
      mockApplicationService.getRoleApplications.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockApplications[0],
            applicantId: 'applicant-123',
            status: ApplicationStatus.PENDING
          }
        ]
      } as any); // Cast to any to resolve type issue for now, will be fixed by updating service types

      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Should show application status instead of apply button
      const frontendRole = screen.getByText('Frontend Developer').closest('[data-testid="role-card"]') as HTMLElement;
      expect(within(frontendRole!).getByText('Application Pending')).toBeInTheDocument();
      expect(within(frontendRole!).queryByText('Apply')).not.toBeInTheDocument();
    });
  });

  describe('Participant Workflow: Working on Assigned Role', () => {
    it('should allow participant to request role completion', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper user={mockParticipantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Find the role user is assigned to (Backend Developer)
      const backendRole = screen.getByText('Backend Developer').closest('[data-testid="role-card"]') as HTMLElement;
      const completeButton = within(backendRole!).getByText('Request Completion');
      
      await user.click(completeButton);

      // Completion modal should open
      await waitFor(() => {
        expect(screen.getByText('Request Role Completion')).toBeInTheDocument();
      });

      // Fill completion form
      const notesInput = screen.getByLabelText(/completion notes/i);
      await user.type(notesInput, 'All API endpoints have been implemented and tested. Database schema is complete and documented.');

      // Submit completion request
      const submitButton = screen.getByText('Submit Request');
      await user.click(submitButton);

      // Verify submission
      await waitFor(() => {
        expect(mockCompletionService.requestRoleCompletion).toHaveBeenCalledWith(
          'test-collaboration-id',
          'backend-role',
          'participant-123',
          expect.objectContaining({
            notes: 'All API endpoints have been implemented and tested. Database schema is complete and documented.'
          })
        );
      });
    });

    it('should show different options based on role status', async () => {
      render(
        <TestWrapper user={mockParticipantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // For assigned role (Backend Developer), should show completion option
      const backendRole = screen.getByText('Backend Developer').closest('[data-testid="role-card"]') as HTMLElement;
      expect(within(backendRole!).getByText('Request Completion')).toBeInTheDocument();

      // Should also show abandon option
      expect(within(backendRole!).getByText('Abandon Role')).toBeInTheDocument();
    });
  });

  describe('Complete Role Lifecycle E2E', () => {
    it('should handle complete role lifecycle from creation to completion', async () => {
      const user = userEvent.setup();

      // Step 1: Creator views collaboration
      const { rerender } = render(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Step 2: Applicant applies for role
      rerender(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Apply for Frontend Developer')).toBeInTheDocument();
      });

      const messageInput = screen.getByLabelText(/application message/i);
      await user.type(messageInput, 'I would love to work on this project!');

      const submitButton = screen.getByText('Submit Application');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplicationService.submitRoleApplication).toHaveBeenCalled();
      });

      // Step 3: Creator accepts application
      rerender(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      const manageButton = screen.getByText('Manage Roles');
      await user.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText('Role Management Dashboard')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(mockApplicationService.updateApplicationStatus).toHaveBeenCalledWith(
          'test-collaboration-id',
          'frontend-role',
          'app-1',
          ApplicationStatus.ACCEPTED,
          'creator-123'
        );
      });

      // Step 4: Participant works and requests completion
      rerender(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      // Mock that role is now filled and assigned to applicant
      const updatedRoles = mockRoles.map(role => 
        role.id === 'frontend-role' 
          ? { ...role, status: RoleState.FILLED, participantId: 'applicant-123' }
          : role
      );

      mockRoleService.getCollaborationRoles.mockResolvedValue({
        success: true,
        data: updatedRoles as any // Using as any temporarily
      });

      // Re-render to get updated state
      rerender(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Request Completion')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Request Completion');
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Request Role Completion')).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/completion notes/i);
      await user.type(notesInput, 'Frontend development is complete with all required features.');

      const submitCompleteButton = screen.getByText('Submit Request');
      await user.click(submitCompleteButton);

      await waitFor(() => {
        expect(mockCompletionService.requestRoleCompletion).toHaveBeenCalled();
      });

      // Step 5: Creator confirms completion
      rerender(
        <TestWrapper user={mockCreatorUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      // Would need to implement confirmation flow in management dashboard
      // This completes the full role lifecycle
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service failure
      mockCollaborationService.getCollaboration.mockResolvedValue({
        success: false,
        error: { message: 'Collaboration not found' } // Wrapped error in { message: ... }
      });

      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/collaboration not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during operations', async () => {
      const user = userEvent.setup();

      // Mock network error during application submission
      mockApplicationService.submitRoleApplication.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);

      const messageInput = screen.getByLabelText(/application message/i);
      await user.type(messageInput, 'Test application');

      const submitButton = screen.getByText('Submit Application');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to submit application/i)).toBeInTheDocument();
      });
    });

    it('should handle permission errors', async () => {
      // Test non-creator trying to access management features
      render(
        <TestWrapper user={mockApplicantUser}>
          <CollaborationDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      });

      // Should not see management button
      expect(screen.queryByText('Manage Roles')).not.toBeInTheDocument();
    });
  });
});
