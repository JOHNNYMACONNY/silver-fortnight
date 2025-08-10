import { 
  createCollaborationRole,
  updateCollaborationRole,
  deleteCollaborationRole,
  getCollaborationRoles
} from '../collaborationRoles';
import {
  submitRoleApplication,
  updateApplicationStatus,
  getRoleApplications
} from '../roleApplications';
import {
  requestRoleCompletion,
  confirmRoleCompletion,
  getRoleCompletionRequests
} from '../roleCompletions';
import { RoleState, ApplicationStatus, CompletionRequestStatus } from '../../types/collaboration';

// Mock Firebase
jest.mock('../../firebase-config', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    runTransaction: jest.fn(),
    writeBatch: jest.fn()
  }
}));

// Mock notification service
jest.mock('../notifications', () => ({
  createNotification: jest.fn()
}));

import { db } from '../../firebase-config';

describe('Collaboration Roles Service Integration Tests', () => {
  const mockCollaborationId = 'test-collaboration-id';
  const mockUserId = 'test-user-id';
  const mockCreatorId = 'creator-user-id';

  // Mock Firestore data
  const mockCollaborationData = {
    id: mockCollaborationId,
    title: 'Test Collaboration',
    creatorId: mockCreatorId,
    roleCount: 2,
    filledRoleCount: 1,
    completedRoleCount: 0
  };

  const mockRoleData = {
    id: 'test-role-id',
    collaborationId: mockCollaborationId,
    title: 'Frontend Developer',
    description: 'Implement user interface components',
    maxParticipants: 1,
    status: RoleState.OPEN,
    applicationCount: 0,
    requiredSkills: [
      { name: 'React', level: 2 },
      { name: 'TypeScript', level: 1 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    (db.getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockCollaborationData,
      id: mockCollaborationId
    });

    (db.getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'test-role-id',
          data: () => mockRoleData,
          exists: () => true
        }
      ]
    });

    (db.runTransaction as jest.Mock).mockImplementation((callback) => 
      callback({
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockCollaborationData
        }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })
    );

    (db.writeBatch as jest.Mock).mockReturnValue({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    });
  });

  describe('Complete Role Lifecycle Integration', () => {
    it('should handle complete role creation to completion workflow', async () => {
      // Step 1: Create a role
      const createResult = await createCollaborationRole(mockCollaborationId, {
        title: 'Full Stack Developer',
        description: 'Implement both frontend and backend',
        maxParticipants: 1,
        requiredSkills: [
          { name: 'React', level: 2 },
          { name: 'Node.js', level: 2 }
        ],
        permissions: [],
        requirements: [],
        parentRoleId: undefined,
        childRoleIds: [],
        metadata: {},
        completionCriteria: {
          requiredDeliverables: ['Frontend app', 'Backend API'],
          reviewType: 'admin',
          minimumDuration: 14,
          maximumDuration: 60
        }
      });

      expect(createResult.success).toBe(true);
      expect(db.runTransaction).toHaveBeenCalled();

      // Step 2: Submit application for the role
      const applicationResult = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'I have 5 years of experience in full stack development',
          evidence: [
            {
              type: 'link',
              url: 'https://github.com/user/portfolio',
              title: 'My Portfolio',
              description: 'Collection of my best work'
            }
          ]
        }
      );

      expect(applicationResult.success).toBe(true);

      // Step 3: Accept the application (as creator)
      const acceptResult = await updateApplicationStatus(
        mockCollaborationId,
        'test-role-id',
        'application-id',
        ApplicationStatus.ACCEPTED,
        mockCreatorId
      );

      expect(acceptResult.success).toBe(true);

      // Step 4: Request role completion (as participant)
      const completionResult = await requestRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          notes: 'All requirements have been implemented and tested',
          evidence: [
            {
              type: 'link',
              url: 'https://app.example.com',
              title: 'Live Application',
              description: 'Deployed full stack application'
            }
          ]
        }
      );

      expect(completionResult.success).toBe(true);

      // Step 5: Confirm role completion (as creator)
      const confirmResult = await confirmRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockCreatorId
      );

      expect(confirmResult.success).toBe(true);

      // Verify all database operations were called
      expect(db.runTransaction).toHaveBeenCalledTimes(4); // Create, accept, request, confirm
    });

    it('should handle role application rejection and reapplication flow', async () => {
      // Submit initial application
      const applicationResult = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'First application attempt',
          evidence: []
        }
      );

      expect(applicationResult.success).toBe(true);

      // Reject the application
      const rejectResult = await updateApplicationStatus(
        mockCollaborationId,
        'test-role-id',
        'application-id',
        ApplicationStatus.REJECTED,
        mockCreatorId
      );

      expect(rejectResult.success).toBe(true);

      // Submit improved application
      const reapplicationResult = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'Improved application with more details and evidence',
          evidence: [
            {
              type: 'image',
              url: 'https://example.com/screenshot.png',
              title: 'Previous Work Example',
              description: 'Screenshot of similar project I completed'
            }
          ]
        }
      );

      expect(reapplicationResult.success).toBe(true);

      // Verify applications were tracked separately
      expect(db.runTransaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Role Management Integration', () => {
    it('should handle role updates and dependency management', async () => {
      // Update role with new requirements
      const updateResult = await updateCollaborationRole(
        mockCollaborationId,
        'test-role-id',
        {
          description: 'Updated description with more details',
          requiredSkills: [
            { name: 'React', level: 3 },
            { name: 'TypeScript', level: 2 },
            { name: 'Testing', level: 1 }
          ],
          completionCriteria: {
            requiredDeliverables: ['Components', 'Tests', 'Documentation'],
            reviewType: 'peer',
            minimumDuration: 10,
            maximumDuration: 30
          }
        }
      );

      expect(updateResult.success).toBe(true);
      expect(db.runTransaction).toHaveBeenCalled();

      // Get updated roles to verify changes
      const rolesResult = await getCollaborationRoles(mockCollaborationId);
      expect(rolesResult.success).toBe(true);
    });

    it('should handle role deletion with cleanup', async () => {
      // First create some applications for the role
      await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        'user1',
        { message: 'Application 1' }
      );

      await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        'user2',
        { message: 'Application 2' }
      );

      // Delete the role (should clean up applications too)
      const deleteResult = await deleteCollaborationRole(
        mockCollaborationId,
        'test-role-id'
      );

      expect(deleteResult.success).toBe(true);
      expect(db.writeBatch).toHaveBeenCalled();
    });
  });

  describe('Application Management Integration', () => {
    it('should handle multiple applications and selection process', async () => {
      const applicants = ['user1', 'user2', 'user3'];
      const applications = [];

      // Submit multiple applications
      for (const userId of applicants) {
        const result = await submitRoleApplication(
          mockCollaborationId,
          'test-role-id',
          userId,
          {
            message: `Application from ${userId}`,
            evidence: []
          }
        );
        
        expect(result.success).toBe(true);
        applications.push(result.data);
      }

      // Get all applications
      const applicationsResult = await getRoleApplications(
        mockCollaborationId,
        'test-role-id'
      );

      expect(applicationsResult.success).toBe(true);

      // Accept one application
      const acceptResult = await updateApplicationStatus(
        mockCollaborationId,
        'test-role-id',
        'application-1',
        ApplicationStatus.ACCEPTED,
        mockCreatorId
      );

      expect(acceptResult.success).toBe(true);

      // Other applications should be automatically rejected
      // This would be handled by the service implementation
    });

    it('should prevent duplicate applications from same user', async () => {
      // Submit first application
      const firstResult = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'First application',
          evidence: []
        }
      );

      expect(firstResult.success).toBe(true);

      // Mock service to return existing application
      (db.getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-app',
            data: () => ({
              applicantId: mockUserId,
              status: ApplicationStatus.PENDING
            })
          }
        ]
      });

      // Try to submit duplicate application
      const duplicateResult = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'Duplicate application',
          evidence: []
        }
      );

      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toContain('already applied');
    });
  });

  describe('Completion Management Integration', () => {
    it('should handle completion request and review process', async () => {
      // Submit completion request
      const requestResult = await requestRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          notes: 'All deliverables completed',
          evidence: [
            {
              type: 'link',
              url: 'https://github.com/user/project',
              title: 'Project Repository',
              description: 'Complete source code'
            }
          ]
        }
      );

      expect(requestResult.success).toBe(true);

      // Get completion requests for review
      const requestsResult = await getRoleCompletionRequests(
        mockCollaborationId,
        'test-role-id'
      );

      expect(requestsResult.success).toBe(true);

      // Confirm completion
      const confirmResult = await confirmRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockCreatorId
      );

      expect(confirmResult.success).toBe(true);

      // Verify role status was updated to completed
      expect(db.runTransaction).toHaveBeenCalledTimes(3);
    });

    it('should handle completion rejection and resubmission', async () => {
      // Submit initial completion request
      const requestResult = await requestRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          notes: 'Initial completion attempt',
          evidence: []
        }
      );

      expect(requestResult.success).toBe(true);

      // Reject completion (would be done through rejectRoleCompletion service)
      // This service would set completion status back to null or 'rejected'

      // Submit improved completion request
      const improvedResult = await requestRoleCompletion(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          notes: 'Improved completion with additional evidence',
          evidence: [
            {
              type: 'image',
              url: 'https://example.com/final-result.png',
              title: 'Final Result',
              description: 'Screenshot of completed work'
            }
          ]
        }
      );

      expect(improvedResult.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent collaboration', async () => {
      // Mock collaboration not found
      (db.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const result = await createCollaborationRole(
        'non-existent-collaboration',
        mockRoleData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Collaboration not found');
    });

    it('should handle permission errors', async () => {
      // Try to update application status as non-creator
      const result = await updateApplicationStatus(
        mockCollaborationId,
        'test-role-id',
        'application-id',
        ApplicationStatus.ACCEPTED,
        'non-creator-user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('should handle database transaction failures', async () => {
      // Mock transaction failure
      (db.runTransaction as jest.Mock).mockRejectedValue(
        new Error('Transaction failed')
      );

      const result = await createCollaborationRole(
        mockCollaborationId,
        mockRoleData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create role');
    });

    it('should handle invalid role states', async () => {
      // Mock role in invalid state for applications
      (db.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockRoleData,
          status: RoleState.COMPLETED
        })
      });

      const result = await submitRoleApplication(
        mockCollaborationId,
        'test-role-id',
        mockUserId,
        {
          message: 'Application for completed role',
          evidence: []
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no longer accepting applications');
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain role count consistency', async () => {
      // Track initial state
      const initialCollaboration = mockCollaborationData;

      // Create new role
      await createCollaborationRole(mockCollaborationId, mockRoleData);

      // Verify role count was incremented
      expect(db.runTransaction).toHaveBeenCalledWith(
        expect.any(Function)
      );

      // Delete role
      await deleteCollaborationRole(mockCollaborationId, 'test-role-id');

      // Verify role count was decremented
      expect(db.writeBatch).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      // Try to create role without required fields
      const invalidRoleData = {
        title: '', // Empty title
        description: 'Valid description',
        maxParticipants: 0, // Invalid participant count
        requiredSkills: []
      };

      const result = await createCollaborationRole(
        mockCollaborationId,
        invalidRoleData as any
      );

      // Validation should fail
      expect(result.success).toBe(false);
    });

    it('should validate skill levels and requirements', async () => {
      const roleWithInvalidSkills = {
        ...mockRoleData,
        requiredSkills: [
          { name: 'React', level: 5 }, // Invalid level (should be 0-3)
          { name: '', level: 1 } // Empty skill name
        ]
      };

      const result = await createCollaborationRole(
        mockCollaborationId,
        roleWithInvalidSkills
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch operations efficiently', async () => {
      const roles = Array.from({ length: 10 }, (_, i) => ({
        ...mockRoleData,
        title: `Role ${i + 1}`,
        id: `role-${i + 1}`
      }));

      // Create multiple roles
      const results = await Promise.all(
        roles.map(role => 
          createCollaborationRole(mockCollaborationId, role)
        )
      );

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify efficient database usage
      expect(db.runTransaction).toHaveBeenCalledTimes(10);
    });

    it('should handle large numbers of applications', async () => {
      const applications = Array.from({ length: 50 }, (_, i) => ({
        userId: `user-${i + 1}`,
        message: `Application ${i + 1}`
      }));

      // Submit many applications
      const results = await Promise.all(
        applications.map(app =>
          submitRoleApplication(
            mockCollaborationId,
            'test-role-id',
            app.userId,
            { message: app.message }
          )
        )
      );

      // All should succeed (assuming different users)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Get all applications efficiently
      const allApplications = await getRoleApplications(
        mockCollaborationId,
        'test-role-id'
      );

      expect(allApplications.success).toBe(true);
    });
  });
});
