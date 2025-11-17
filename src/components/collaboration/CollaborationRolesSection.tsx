import React, { useState } from 'react';
import { CollaborationRoleData, RoleState, ApplicationStatus } from '../../types/collaboration';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RoleCard } from './RoleCard';
import { RoleApplicationForm } from './RoleApplicationForm';
import { RoleCompletionForm } from './RoleCompletionForm';
import RoleManagementDashboard from './RoleManagementDashboard';
import { CollaborationStatusTracker } from './CollaborationStatusTracker';
import { Modal } from '../ui/Modal';
import { submitRoleApplication } from '../../services/roleApplications';
import { updateApplicationStatus } from '../../services/roleApplications';
import { requestRoleCompletion } from '../../services/roleCompletions';
import { abandonRole } from '../../services/roleAbandonment';
import AbandonRoleModal from './AbandonRoleModal';
import Box from '../layout/primitives/Box';
import Grid from '../layout/primitives/Grid';
import { logger } from '@utils/logging/logger';


interface CollaborationRolesSectionProps {
  collaborationId: string;
  collaborationTitle: string;
  roles: CollaborationRoleData[];
  isCreator: boolean;
  onRolesUpdated: () => void;
}

export const CollaborationRolesSection: React.FC<CollaborationRolesSectionProps> = ({
  collaborationId,
  collaborationTitle,
  roles,
  isCreator,
  onRolesUpdated
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<CollaborationRoleData | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showManagementDashboard, setShowManagementDashboard] = useState(false);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);


  // Filter roles by status
  const openRoles = roles.filter(role => role.status === RoleState.OPEN);
  const filledRoles = roles.filter(role => role.status === RoleState.FILLED || role.status === RoleState.COMPLETED);

  const handleApply = (role: CollaborationRoleData) => {
    if (!currentUser) {
      addToast('error', 'You must be logged in to apply for a role');
      return;
    }

    setSelectedRole(role);
    setShowApplicationModal(true);
  };

  const handleManage = (role: CollaborationRoleData) => {
    setSelectedRole(role);
    setShowManagementDashboard(true);
  };

  const handleRequestCompletion = (role: CollaborationRoleData) => {
    if (!currentUser) {
      addToast('error', 'You must be logged in to request completion');
      return;
    }

    // Only the assigned participant can request completion
    if (role.participantId !== currentUser.uid) {
      addToast('error', 'Only the assigned participant can request completion');
      return;
    }

    setSelectedRole(role);
    setShowCompletionModal(true);
  };

  const handleShowStatusTracker = () => {
    setShowStatusTracker(true);
  };

  const handleSubmitApplication = async (applicationData: {
    message: string;
    evidence?: any[];
  }) => {
    if (!currentUser || !selectedRole) return;

    try {
      const result = await submitRoleApplication(
        collaborationId,
        selectedRole.id,
        currentUser.uid,
        applicationData
      );

      if (result.success) {
        addToast('success', 'Application submitted successfully');
        setShowApplicationModal(false);
        onRolesUpdated(); // Refresh roles data
      } else {
        throw new Error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      logger.error('Error submitting application:', 'COMPONENT', {}, error as Error);
      addToast('error', error instanceof Error ? error.message : 'Failed to submit application');
    }
  };

  const handleAcceptApplication = async (roleId: string, applicationId: string) => {
    if (!currentUser) return;

    try {
      const result = await updateApplicationStatus(
        collaborationId,
        roleId,
        applicationId,
        ApplicationStatus.ACCEPTED,
        currentUser.uid
      );

      if (result.success) {
        addToast('success', 'Application accepted successfully');
        onRolesUpdated(); // Refresh roles data
      } else {
        throw new Error(result.error || 'Failed to accept application');
      }
    } catch (error) {
      logger.error('Error accepting application:', 'COMPONENT', {}, error as Error);
      addToast('error', error instanceof Error ? error.message : 'Failed to accept application');
    }
  };

  const handleRejectApplication = async (roleId: string, applicationId: string) => {
    if (!currentUser) return;

    try {
      const result = await updateApplicationStatus(
        collaborationId,
        roleId,
        applicationId,
        ApplicationStatus.REJECTED,
        currentUser.uid
      );

      if (result.success) {
        addToast('success', 'Application rejected');
        onRolesUpdated(); // Refresh roles data
      } else {
        throw new Error(result.error || 'Failed to reject application');
      }
    } catch (error) {
      logger.error('Error rejecting application:', 'COMPONENT', {}, error as Error);
      addToast('error', error instanceof Error ? error.message : 'Failed to reject application');
    }
  };

  const handleSubmitCompletion = async (completionData: {
    notes: string;
    evidence?: any[];
  }) => {
    if (!currentUser || !selectedRole) return;

    try {
      const result = await requestRoleCompletion(
        collaborationId,
        selectedRole.id,
        currentUser.uid,
        completionData
      );

      if (result.success) {
        addToast('success', 'Completion request submitted successfully');
        setShowCompletionModal(false);
        onRolesUpdated(); // Refresh roles data
      } else {
        throw new Error(result.error || 'Failed to submit completion request');
      }
    } catch (error) {
      logger.error('Error submitting completion request:', 'COMPONENT', {}, error as Error);
      addToast('error', error instanceof Error ? error.message : 'Failed to submit completion request');
    }
  };

  const handleShowAbandonModal = (role: CollaborationRoleData) => {
    setSelectedRole(role);
    setShowAbandonModal(true);
  };

  const handleSubmitAbandon = async (reason: string) => {
    if (!currentUser || !selectedRole) return;

    try {
      await abandonRole(selectedRole.id, reason);
      addToast('success', 'Role abandoned successfully');
      setShowAbandonModal(false);
      onRolesUpdated(); // Refresh roles data
    } catch (error) {
      logger.error('Error abandoning role:', 'COMPONENT', {}, error as Error);
      addToast('error', error instanceof Error ? error.message : 'Failed to abandon role');
    }
  };

  return (
    <Box className="mt-8 @container" style={{ containerType: 'inline-size' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">Roles</h2>
        <button
          onClick={handleShowStatusTracker}
          className="text-sm px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
        >
          View Status
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="bg-card p-8 text-center">
          <p className="text-muted-foreground">No roles have been defined for this collaboration yet.</p>
        </div>
      ) : (
        <div>
          {/* Open Roles Section */}
          {openRoles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-card-foreground">Open Roles</h3>
              {/* Use Grid primitive with container query classes */}
              <Grid columns={1} className="@container @md:grid-cols-2 gap-6">
                {openRoles.map(role => (
                  <RoleCard
                    key={`open-${collaborationId}-${role.id}`}
                    role={role}
                    collaborationId={collaborationId}
                    isCreator={isCreator}
                    onApply={() => handleApply(role)}
                    onManage={() => handleManage(role)}
                  />
                ))}
              </Grid>
            </div>
          )}

          {/* Filled Roles Section */}
          {filledRoles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4 text-card-foreground">Filled Roles</h3>
              {/* Use Grid primitive with container query classes */}
              <Grid columns={1} className="@container @md:grid-cols-2 gap-6">
                {filledRoles.map(role => (
                  <RoleCard
                    key={`filled-${collaborationId}-${role.id}`}
                    role={role}
                    collaborationId={collaborationId}
                    isCreator={isCreator}
                    onManage={() => handleManage(role)}
                    onRequestCompletion={
                      !isCreator &&
                      role.status === RoleState.FILLED &&
                      role.participantId === currentUser?.uid &&
                      !role.completionStatus
                        ? () => handleRequestCompletion(role)
                        : undefined
                    }
                    onAbandon={
                      isCreator && role.status === RoleState.FILLED
                        ? () => handleShowAbandonModal(role)
                        : undefined
                    }
                  />
                ))}
              </Grid>
            </div>
          )}
        </div>
      )}

      {/* Role Application Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        title={`Apply for Role: ${selectedRole?.title}`}
      >
        {selectedRole && (
          <RoleApplicationForm
            role={selectedRole}
            collaborationTitle={collaborationTitle}
            onSubmit={handleSubmitApplication}
            onCancel={() => setShowApplicationModal(false)}
          />
        )}
      </Modal>

      {/* Role Management Dashboard Modal */}
      <Modal
        isOpen={showManagementDashboard}
        onClose={() => setShowManagementDashboard(false)}
        title="Role Management"
        size="lg"
      >
        <RoleManagementDashboard
          collaboration={{
            id: collaborationId,
            title: collaborationTitle
          }}
          roles={roles}

          onAcceptApplication={handleAcceptApplication}
          onRejectApplication={handleRejectApplication}
        />
      </Modal>

      {/* Role Completion Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title={`Request Completion for: ${selectedRole?.title}`}
      >
        {selectedRole && (
          <RoleCompletionForm
            role={selectedRole}
            collaborationTitle={collaborationTitle}
            onSubmit={handleSubmitCompletion}
            onCancel={() => setShowCompletionModal(false)}
          />
        )}
      </Modal>

      {/* Status Tracker Modal */}
      <Modal
        isOpen={showStatusTracker}
        onClose={() => setShowStatusTracker(false)}
        title="Collaboration Status"
      >
        <CollaborationStatusTracker roles={roles} />
      </Modal>

      {/* Abandon Role Modal */}
      <Modal
        isOpen={showAbandonModal}
        onClose={() => setShowAbandonModal(false)}
        title="Abandon Role"
      >
        {selectedRole && (
          <AbandonRoleModal
            role={selectedRole}
            onAbandon={handleSubmitAbandon}
            onClose={() => setShowAbandonModal(false)}
          />
        )}
      </Modal>
    </Box>
  );
};

export default CollaborationRolesSection;
