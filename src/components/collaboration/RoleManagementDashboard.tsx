import React, { useState, useEffect } from 'react';
import {
  CollaborationRoleData,
  RoleApplication,
  RoleState,
  ApplicationStatus,
} from '../../types/collaboration';
import { AnimatePresence } from 'framer-motion';
import { getRoleApplications } from '../../services/roleApplications';
import { Button } from '../ui/Button';
import { ApplicationCard } from './ApplicationCard';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import Box from '../layout/primitives/Box';

interface RoleManagementDashboardProps {
  collaboration: {
    id: string;
    title: string;
  };
  roles: CollaborationRoleData[];
  onAcceptApplication: (roleId: string, applicationId: string) => Promise<void>;
  onRejectApplication: (roleId: string, applicationId: string) => Promise<void>;
  onUpdateHierarchy?: (roleId: string, updates: {
    newParentId?: string;
    addChildIds?: string[];
    removeChildIds?: string[];
  }) => Promise<void>;
}

interface RoleManagementCardProps {
  role: CollaborationRoleData;
  collaborationId: string;
  onAcceptApplication: (roleId: string, applicationId: string) => Promise<void>;
  onRejectApplication: (roleId: string, applicationId: string) => Promise<void>;
  onUpdateHierarchy?: (roleId: string, updates: {
    newParentId?: string;
    addChildIds?: string[];
    removeChildIds?: string[];
  }) => Promise<void>;
}

const RoleManagementCard: React.FC<RoleManagementCardProps> = ({
  role,
  collaborationId,
  onAcceptApplication,
  onRejectApplication,
  onUpdateHierarchy,
}) => {
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [isUpdatingHierarchy, setIsUpdatingHierarchy] = useState(false);
  const [hierarchyUpdateSuccess, setHierarchyUpdateSuccess] = useState(false);

  // Fetch applications for this role
  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const result = await getRoleApplications(collaborationId, role.id);
        if (result.success) {
          setApplications(result.data || []);
        } else {
          setError(result.error || 'Failed to load applications');
        }
      } catch (err) {
        setError('An error occurred while loading applications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [collaborationId, role.id]);

  return (
    <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-xl">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
          <Badge variant={role.status === RoleState.OPEN ? 'default' : 'secondary'}>
            {role.status === RoleState.OPEN ? 'Open' : 'Filled'}
          </Badge>
        </div>
        <div>
        <p className="mt-2 text-sm">{role.description}</p>

        {/* Role Hierarchy Section */}
        {onUpdateHierarchy && (
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium">Role Hierarchy</h4>
              <Button
                onClick={async () => {
                  setIsUpdatingHierarchy(true);
                  setHierarchyError(null);
                  try {
                    await onUpdateHierarchy(role.id, { newParentId: undefined });
                    setHierarchyUpdateSuccess(true);
                    setTimeout(() => setHierarchyUpdateSuccess(false), 3000);
                  } catch (err) {
                    setHierarchyError(err instanceof Error ? err.message : 'Failed to update role hierarchy');
                  } finally {
                    setIsUpdatingHierarchy(false);
                  }
                }}
                isLoading={isUpdatingHierarchy}
                disabled={isUpdatingHierarchy}
                variant="secondary"
                size="sm"
              >
                Edit Hierarchy
              </Button>
            </div>
            <div className="mt-4">
              {/* ... hierarchy content ... */}
            </div>
            {hierarchyError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{hierarchyError}</AlertDescription>
              </Alert>
            )}
            {hierarchyUpdateSuccess && (
              <Alert className="mt-2">
                <AlertDescription>Role hierarchy updated successfully</AlertDescription>
              </Alert>
            )}
            {isUpdatingHierarchy && (
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating role hierarchy...
              </div>
            )}
          </div>
        )}

        {/* Applications Section */}
        {role.status === RoleState.OPEN && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-md font-medium">
              Applications ({applications.filter(app => app.status === ApplicationStatus.PENDING).length})
            </h4>

            {isLoading ? (
              <div className="py-4 text-center">Loading...</div>
            ) : error ? (
              <Alert variant="destructive" className="py-4 text-center">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : applications.length === 0 ? (
              <div className="py-4 text-center text-gray-500">No pending applications</div>
            ) : (
              <div className="mt-4 space-y-4">
                <AnimatePresence>
                  {applications
                    .filter((app: RoleApplication) => app.status === ApplicationStatus.PENDING)
                    .map((application: RoleApplication) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onAccept={async () => onAcceptApplication(role.id, application.id)}
                        onReject={async () => onRejectApplication(role.id, application.id)}
                      />
                    ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const RoleManagementDashboard: React.FC<RoleManagementDashboardProps> = ({
  collaboration,
  roles,
  onAcceptApplication,
  onRejectApplication,
  onUpdateHierarchy
}) => {
  const filteredRoles = roles;

  return (
    <Box className="@container" style={{ containerType: 'inline-size' }}>
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-xl p-6">
        <div className="space-y-6">
          {filteredRoles.map((role: CollaborationRoleData) => (
            <RoleManagementCard
              key={role.id}
              role={role}
              collaborationId={collaboration.id}
              onAcceptApplication={onAcceptApplication}
              onRejectApplication={onRejectApplication}
              onUpdateHierarchy={onUpdateHierarchy}
            />
          ))}
        </div>
      </div>
    </Box>
  );
};

export default RoleManagementDashboard;
