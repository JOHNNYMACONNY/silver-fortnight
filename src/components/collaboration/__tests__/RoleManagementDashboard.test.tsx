import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleManagementDashboard from '../RoleManagementDashboard';
import { RoleState, Skill } from '../../../types/collaboration';
import { act } from 'react-dom/test-utils';

// Handler types for role operations
interface RoleHandlers {
  onAcceptApplication: (roleId: string, applicationId: string) => Promise<void>;
  onRejectApplication: (roleId: string, applicationId: string) => Promise<void>;
  onConfirmCompletion: (roleId: string) => Promise<void>;
  onRejectCompletion: (roleId: string) => Promise<void>;
  onUpdateHierarchy: (roleId: string, params: any) => Promise<void>;
  onAbandonRole: (roleId: string) => Promise<void>;
  onReopenRole: (roleId: string) => Promise<void>;
  onMarkRoleAsUnneeded: (roleId: string) => Promise<void>;
}

const createMockHandler = <T extends (...args: any[]) => Promise<void>>(): jest.Mock<ReturnType<T>, Parameters<T>> => {
  return jest.fn().mockImplementation(async (..._args) => Promise.resolve());
};

const createHandlers = (): RoleHandlers => ({
  onAcceptApplication: createMockHandler(),
  onRejectApplication: createMockHandler(),
  onConfirmCompletion: createMockHandler(),
  onRejectCompletion: createMockHandler(),
  onUpdateHierarchy: createMockHandler(),
  onAbandonRole: createMockHandler(),
  onReopenRole: createMockHandler(),
  onMarkRoleAsUnneeded: createMockHandler()
});

// Mock child components
jest.mock('../../ui/ProfileImageWithUser', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-profile-image">Profile Image</div>
}));

jest.mock('../ApplicationCard', () => ({
  ApplicationCard: ({ application }: any) => (
    <div data-testid={`mock-application-card-${application.id}`}>
      Application Card for {application.applicantId}
    </div>
  )
}));

const mockSkills: Skill[] = [
  { name: 'React', level: 'intermediate' },
  { name: 'TypeScript', level: 'beginner' }
];

const mockRole = {
  id: '1',
  title: 'Test Role',
  description: 'Test Description',
  collaborationId: 'collab1',
  status: RoleState.OPEN,
  requiredSkills: [mockSkills[0]],
  preferredSkills: [mockSkills[1]],
  childRoleIds: [],
  parentRoleId: undefined,
  maxParticipants: 1,
  currentParticipants: 0,
  completionCriteria: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {},
  requirements: [],
  permissions: [{
    resource: 'collaboration',
    actions: ['read', 'write'],
    conditions: {
      timeRestricted: false,
      requireApproval: false
    }
  }],
  applications: [],
  assignedUsers: [],
  estimatedDuration: undefined,
  priority: 1,
  tags: [],
  applicationCount: 0
};

const mockCollaboration = {
  id: 'collab1',
  title: 'Test Collaboration'
};

describe('RoleManagementDashboard', () => {
  const handlers = createHandlers();
  const mockProps: Parameters<typeof RoleManagementDashboard>[0] = {
    collaboration: mockCollaboration,
    roles: [mockRole],
    ...handlers
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RoleManagementDashboard {...mockProps} />);
    expect(screen.getByText('Test Role')).toBeInTheDocument();
  });

  it('displays role status correctly', () => {
    render(<RoleManagementDashboard {...mockProps} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('handles hierarchy updates', async () => {
    render(<RoleManagementDashboard {...mockProps} />);
    const editButton = screen.queryByText('Edit Hierarchy');

    if (editButton) {
      await act(async () => {
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(mockProps.onUpdateHierarchy).toHaveBeenCalledWith(
          mockRole.id,
          expect.objectContaining({ newParentId: undefined })
        );
      });
    }
  });

  it('filters roles based on search input', () => {
    const rolesWithSearch = [
      { ...mockRole, id: '1', title: 'Developer Role' },
      { ...mockRole, id: '2', title: 'Designer Role' }
    ];

    render(
      <RoleManagementDashboard
        {...mockProps}
        roles={rolesWithSearch}
      />
    );

    expect(screen.getByText('Developer Role')).toBeInTheDocument();
    expect(screen.getByText('Designer Role')).toBeInTheDocument();
  });

  it('shows loading state while fetching applications', async () => {
    render(<RoleManagementDashboard {...mockProps} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles errors when fetching applications', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorRole = {
      ...mockRole,
      id: 'error-role'
    };

    render(
      <RoleManagementDashboard
        {...mockProps}
        roles={[errorRole]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument();
    });
  });

  it('updates UI after successful application actions', async () => {
    const applicationRole = {
      ...mockRole,
      applications: [
        { id: 'app1', status: 'pending', applicantId: 'user1' }
      ]
    };

    render(
      <RoleManagementDashboard
        {...mockProps}
        roles={[applicationRole]}
      />
    );

    // Wait for application card to be rendered
    const applicationCard = await screen.findByTestId('mock-application-card-app1');
    expect(applicationCard).toBeInTheDocument();
  });
});
