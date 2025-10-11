import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { Collaboration, COLLECTIONS, User } from '../../../services/firestore-exports';
import { collaborationRoleService } from '../../../services/collaborationRoles';
import { getSyncFirebaseDb, Timestamp } from '../../../firebase-config';
import { CollaborationRoleData, RoleState } from '../../../types/collaboration';
import { doc, collection, runTransaction, getDocs } from 'firebase/firestore';
import { logTransaction } from '../../../utils/transactionLogging';
import { useToast } from '../../../contexts/ToastContext';
import { Plus, Trash2, Edit } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { RoleDefinitionForm } from '../../collaboration/RoleDefinitionForm';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { GlassmorphicInput } from '../../ui/GlassmorphicInput';
import { Textarea } from '../../ui/Textarea';
import { Label } from '../../ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../ui/Card';
import { Alert, AlertDescription } from '../../ui/Alert';

type CollaborationFormProps = {
  collaboration?: Collaboration;
  onSuccess: (collaborationId: string) => void;
  onCancel: () => void;
  isCreating?: boolean;
};

const CollaborationForm: React.FC<CollaborationFormProps> = ({
  collaboration,
  onSuccess,
  onCancel,
  isCreating = false
}) => {
  // Add this log to debug the incoming collaboration object
  useEffect(() => {
    console.log('Collaboration prop:', collaboration);
  }, [collaboration]);

  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const [title, setTitle] = useState(collaboration?.title || '');
  const [description, setDescription] = useState(collaboration?.description || '');
  const [roles, setRoles] = useState<CollaborationRoleData[]>([]);
  const [roleUpdateCounter, setRoleUpdateCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const { getUserProfile } = await import('../../../services/firestore');
          const { data, error } = await getUserProfile(currentUser.uid);
          if (error) {
            console.error('Error fetching user profile:', error);
            addToast('error', 'Failed to load user profile');
          } else if (data) {
            setUserProfile(data);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          addToast('error', 'Failed to load user profile');
        }
      }
    };

    fetchUserProfile();
  }, [currentUser, addToast]);

  useEffect(() => {
    const loadRoles = async () => {
      if (collaboration && collaboration.id) {
        try {
          const { getRoles } = await import('../../../services/collaborations');
          const currentRoles = await getRoles(collaboration.id);
          if (Array.isArray(currentRoles)) {
            setRoles(currentRoles);
          } else {
            console.warn('Received invalid roles data:', currentRoles);
            setRoles([]);
          }
        } catch (err) {
          console.error('Error loading roles:', err);
          addToast('error', 'Failed to load roles');
          setRoles([]);
        }
      }
    };

    loadRoles();
  }, [collaboration, addToast]);

  // Monitor roles updates
  useEffect(() => {
    if (roleUpdateCounter > 0) {
      console.log('Roles updated:', roles);
    }
  }, [roles, roleUpdateCounter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation (unchanged)
    if (!currentUser || !userProfile) {
      addToast('error', 'You must be logged in to create or update a collaboration');
      return;
    }

    if (!roles.length) {
      addToast('error', 'Please add at least one role to the collaboration');
      return;
    }

    // Enhance validation of collaboration ID
    if (!isCreating) {
      if (!collaboration) {
        addToast('error', 'Cannot update collaboration: missing collaboration object');
        setError('Collaboration data is missing. Please try again or reload the page.');
        return;
      }
      
      if (!collaboration.id) {
        addToast('error', 'Cannot update collaboration: missing collaboration ID');
        console.error('Collaboration object has no ID:', collaboration);
        setError('Collaboration ID is missing. Please try again or reload the page.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isCreating) {
        const now = Timestamp.now();

        const collaborationData = {
          title,
          description,
          creatorId: currentUser.uid,
          creatorName: userProfile.displayName || 'Anonymous',
          creatorPhotoURL: userProfile.photoURL || userProfile.profilePicture,
          status: 'recruiting',
          createdAt: now,
          updatedAt: now,
          roleCount: roles.length,
          filledRoleCount: 0,
          completedRoleCount: 0,
          participants: [currentUser.uid]
        };

        const { id } = await runTransaction(getSyncFirebaseDb(), async (transaction) => {
          logTransaction({
            operation: 'createCollaboration',
            timestamp: Date.now(),
            details: { title, description, roleCount: roles.length },
            status: 'started'
          });

          // Create collaboration document
          const collabRef = doc(collection(getSyncFirebaseDb(), COLLECTIONS.COLLABORATIONS));
          transaction.set(collabRef, collaborationData);

          // Log collaboration creation
          logTransaction({
            operation: 'createCollaboration',
            timestamp: Date.now(),
            details: { collaborationId: collabRef.id, data: collaborationData },
            status: 'completed'
          });
          
          // Create roles subcollection and documents
          const rolesCollection = collection(collabRef, 'roles');
          for (const role of roles) {
            logTransaction({
              operation: 'createRole',
              timestamp: Date.now(),
              details: { roleTitle: role.title },
              status: 'started'
            });

            const roleRef = doc(rolesCollection);
            // Ensure the role is created with valid data
            transaction.set(roleRef, {
              title: role.title || 'Untitled Role',
              description: role.description || '',
              requiredSkills: Array.isArray(role.requiredSkills) ? role.requiredSkills : [],
              preferredSkills: Array.isArray(role.preferredSkills) ? role.preferredSkills : [],
              collaborationId: collabRef.id, // This is safe now due to our enhanced validation
              status: 'open',
              applicationCount: 0,
              createdAt: now,
              updatedAt: now
            });

            logTransaction({
              operation: 'createRole',
              timestamp: Date.now(),
              details: { roleId: roleRef.id, roleTitle: role.title },
              status: 'completed'
            });
          }
          
          // Update role count in collaboration
          transaction.update(collabRef, {
            roleCount: roles.length,
            updatedAt: now
          });

          return { id: collabRef.id };
        });

        addToast('success', 'Collaboration created successfully');
        onSuccess(id);
      } else if (collaboration && collaboration.id) {
        // Now we're sure collaboration.id exists
        await runTransaction(getSyncFirebaseDb(), async (transaction) => {
          logTransaction({
            operation: 'updateCollaboration',
            timestamp: Date.now(),
            details: { collaborationId: collaboration.id, title, description },
            status: 'started'
          });

          // Ensure the collaboration ID exists
          if (!collaboration.id) {
            throw new Error('Collaboration ID is missing');
          }
          
          const collaborationRef = doc(getSyncFirebaseDb(), COLLECTIONS.COLLABORATIONS, collaboration.id);
          const collaborationDoc = await transaction.get(collaborationRef);
          
          if (!collaborationDoc.exists()) {
            throw new Error('Collaboration not found');
          }

          // Update collaboration document
          transaction.update(collaborationRef, {
            title,
            description,
            updatedAt: Timestamp.now()
          });

          // Handle roles (update, create, delete as needed)
          const rolesCollection = collection(collaborationRef, 'roles');
          
          // Get existing roles from Firestore for comparison
          const existingRolesSnapshot = await getDocs(rolesCollection);
          const existingRoles = existingRolesSnapshot.docs.map(doc => {
            const docData = doc.data() as Partial<CollaborationRoleData>;
            return {
              id: doc.id,
              ...docData
            } as CollaborationRoleData;
          });
          
          console.log('Existing roles in Firestore:', 
            existingRoles.map(r => ({ id: r.id, title: r.title }))
          );
          console.log('Current roles in state:', 
            roles.map(r => ({ id: r.id, title: r.title, isTemp: r.id.startsWith('temp-') }))
          );

          // Process each role in our state
          for (const role of roles) {
            // Skip roles that have already been created in Firebase directly
            if (!role.id.startsWith('temp-')) {
              // Handle updating existing roles if needed
              // This is already covered by the modifyRole function called elsewhere
              continue; 
            }

            // This is a temporary role that needs to be created in Firebase
            console.log('Creating new role in handleSubmit:', role.title);
            
            const roleRef = doc(rolesCollection);
            // Create clean role data without the temp ID
            const { ...roleData } = role;
            
            // Add the role document
            transaction.set(roleRef, {
              ...roleData,
              id: roleRef.id,
              collaborationId: collaboration.id,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });

            logTransaction({
              operation: 'createRoleInTransaction',
              timestamp: Date.now(),
              details: { roleId: roleRef.id, roleTitle: role.title },
              status: 'completed'
            });
          }
          
          // Log completion
          logTransaction({
            operation: 'updateCollaboration',
            timestamp: Date.now(),
            details: { 
              collaborationId: collaboration.id, 
              updatedTitle: title,
              roleCount: roles.length 
            },
            status: 'completed'
          });
        });

        addToast('success', 'Collaboration updated successfully');
        onSuccess(collaboration.id);
      }
    } catch (error) {
      console.error('Error with collaboration:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      logTransaction({
        operation: isCreating ? 'createCollaboration' : 'updateCollaboration',
        timestamp: Date.now(),
        details: { error: errorMessage },
        status: 'failed',
        error: errorMessage
      });
      
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoleModal = (roleId?: string): void => {
    const roleIndex = roleId ? roles.findIndex(r => r.id === roleId) : null;
    setEditingRoleIndex(roleIndex);
    setShowRoleModal(true);
  };
  
  const handleRoleSubmit = async (roleData: Partial<CollaborationRoleData>): Promise<void> => {
    try {
      if (!roleData.title || !roleData.description || !roleData.requiredSkills) {
        throw new Error('Missing required role fields');
      }

      const now = Timestamp.now();
      const editingRole = editingRoleIndex !== null ? roles[editingRoleIndex] : null;

      if (editingRole?.id && !editingRole.id.startsWith('temp-') && collaboration) {
        logTransaction({
          operation: 'updateRole',
          timestamp: Date.now(),
          details: { roleId: editingRole.id, roleTitle: roleData.title },
          status: 'started'
        });

        // Update existing role in Firebase
        const updatedRole = {
          ...editingRole,
          title: roleData.title,
          description: roleData.description,
          requiredSkills: roleData.requiredSkills,
          preferredSkills: roleData.preferredSkills || [],
          updatedAt: now
        };

        setRoles(prevRoles => prevRoles.map(r =>
          r.id === editingRole.id ? updatedRole : r
        ) as CollaborationRoleData[]);

        if (!isCreating) {
          await collaborationRoleService.modifyRole(editingRole.id, {
            title: roleData.title,
            description: roleData.description,
            requiredSkills: roleData.requiredSkills,
            preferredSkills: roleData.preferredSkills || []
          });
          logTransaction({
            operation: 'updateRole',
            timestamp: Date.now(),
            details: { roleId: editingRole.id, roleTitle: roleData.title },
            status: 'completed'
          });
        }
      } else {
        logTransaction({
          operation: 'createRole',
          timestamp: Date.now(),
          details: { roleTitle: roleData.title },
          status: 'started'
        });

        // Create new role with temporary ID
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRole: CollaborationRoleData = {
          id: tempId,
          collaborationId: collaboration?.id || '',
          title: roleData.title,
          description: roleData.description,
          maxParticipants: 1,
          requiredSkills: roleData.requiredSkills,
          preferredSkills: roleData.preferredSkills || [],
          status: RoleState.OPEN,
          applicationCount: 0,
          createdAt: now,
          updatedAt: now,
          childRoleIds: []
        };

        // First update local state
        setRoles(prevRoles => [...prevRoles, newRole]);

        // If editing existing collaboration, create role in Firebase immediately
        if (collaboration?.id && !isCreating) {
          try {
            console.log('Creating role with collaboration ID:', collaboration.id);
            
            // Explicitly using the service with detailed logging
            const roleRef = await collaborationRoleService.createRoleHierarchy([newRole]);
            console.log('Role created successfully in Firebase with ID:', roleRef);
            
            if (roleRef) {
              // Update local state with real Firebase ID
              setRoles(prevRoles => {
                const updatedRoles = prevRoles.map(r => 
                  r.id === tempId ? { ...r, id: roleRef } : r
                ) as CollaborationRoleData[];
                
                console.log('Updated roles after Firebase save:', 
                  updatedRoles.map(r => ({ id: r.id, title: r.title }))
                );
                
                return updatedRoles;
              });
              
              // Log successful creation
              logTransaction({
                operation: 'createRole',
                timestamp: Date.now(),
                details: { roleId: roleRef, roleTitle: roleData.title },
                status: 'completed'
              });
            }
          } catch (error) {
            console.error('Error creating role in Firebase:', error);
            addToast('error', 'Failed to create role in Firebase');
            
            logTransaction({
              operation: 'createRole',
              timestamp: Date.now(),
              details: { error: String(error) },
              status: 'failed'
            });
          }
        }
      }
      
      setShowRoleModal(false);
      setEditingRoleIndex(null);
      
      // Increment counter to trigger useEffect monitoring
      setRoleUpdateCounter(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Error creating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setShowRoleModal(false);
      setEditingRoleIndex(null);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        logTransaction({
          operation: 'deleteRole',
          timestamp: Date.now(),
          details: { roleId },
          status: 'started'
        });

        await collaborationRoleService.deleteRole(roleId);

        setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));

        logTransaction({
          operation: 'deleteRole',
          timestamp: Date.now(),
          details: { roleId },
          status: 'completed'
        });

        addToast('success', 'Role deleted successfully');
      } catch (error) {
        console.error('Error deleting role:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        addToast('error', errorMessage);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isCreating ? 'Create New Collaboration' : 'Edit Collaboration'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Collaboration Title</Label>
            <GlassmorphicInput
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter collaboration title"
              label="Collaboration Title"
              variant="glass"
              size="lg"
              animatedLabel
              realTimeValidation
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter collaboration description"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{role.title}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRoleModal(role.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="default"
                onClick={() => handleOpenRoleModal()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : isCreating ? 'Create Collaboration' : 'Update Collaboration'}
          </Button>
        </CardFooter>
      </form>
      
      <AnimatePresence>
        {showRoleModal && (
          <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)}>
            <RoleDefinitionForm
              initialRole={editingRoleIndex !== null ? roles[editingRoleIndex] : undefined}
              onSubmit={handleRoleSubmit}
              onCancel={() => setShowRoleModal(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CollaborationForm;
