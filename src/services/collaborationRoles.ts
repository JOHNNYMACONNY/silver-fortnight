// Collaboration role service functions
import { collection, doc, getDocs, updateDoc, deleteDoc, setDoc, Timestamp, increment } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';
import { CollaborationRoleData } from '../types/collaboration';
import { ServiceResponse } from '../types/services'; // Import ServiceResponse

// Function needed by multiple files
export const updateCollaborationRoleCounts = async (
  collaborationId: string,
  roleId: string
): Promise<void> => {
  // Implementation goes here
  console.log(`Updating role counts for collaboration ${collaborationId}, role ${roleId}`);
};

// Function imported in CollaborationDetailPage
export const getCollaborationRoles = async (collaborationId: string): Promise<ServiceResponse<CollaborationRoleData[]>> => {
  try {
    // Implementation using collaborationId parameter
    const rolesRef = collection(db(), `collaborations/${collaborationId}/roles`);
    const rolesSnapshot = await getDocs(rolesRef);
    const roles = rolesSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        collaborationId,
        title: data.title || '',
        description: data.description || '',
        maxParticipants: data.maxParticipants || 0, // Added from interface
        childRoleIds: data.childRoleIds || [],
        status: data.status || 'open',
        applicationCount: data.applicationCount || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        parentRoleId: data.parentRoleId,
        participantId: data.participantId,
        participantName: data.participantName,
        participantPhotoURL: data.participantPhotoURL,
        completionStatus: data.completionStatus,
        requiredSkills: data.requiredSkills || [],
        preferredSkills: data.preferredSkills || [],
        filledAt: data.filledAt,
        completedAt: data.completedAt
      } as CollaborationRoleData;
    });
    return { success: true, data: roles }; // Return ServiceResponse
  } catch (error: any) {
    console.error("Error fetching collaboration roles:", error);
    return { success: false, error: error.message || 'Failed to fetch roles' }; // Return ServiceResponse
  }
};

// Add the missing methods to the service
export const modifyRole = async (roleId: string, roleData: any) => {
  try {
    // Check if roleId contains the collaboration ID
    let collaborationId, actualRoleId;
    
    if (roleId.includes('_')) {
      // Format is collaborationId_roleId
      [collaborationId, actualRoleId] = roleId.split('_');
    } else {
      // Assuming roleData contains collaborationId
      collaborationId = roleData.collaborationId;
      actualRoleId = roleId;
      
      if (!collaborationId) {
        throw new Error("Missing collaborationId for role update");
      }
    }
    
    const roleRef = doc(db(), `collaborations/${collaborationId}/roles/${actualRoleId}`);
    await updateDoc(roleRef, {
      ...roleData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error modifying role:", error);
    throw error;
  }
};

export const createRoleHierarchy = async (roles: CollaborationRoleData[]) => {
  try {
    if (!roles || roles.length === 0) {
      throw new Error("No roles provided to createRoleHierarchy");
    }

    const role = roles[0]; // We're usually only creating one at a time
    
    if (!role.collaborationId) {
      throw new Error("Role is missing collaborationId");
    }

    // Split temp ID if present
    const collaborationId = role.collaborationId;
    
    // Create a document reference in the roles subcollection
    const rolesRef = collection(db(), `collaborations/${collaborationId}/roles`);
    const roleRef = doc(rolesRef);
    
    // Prepare role data (removing the temp id)
    const { id, ...roleData } = role;
    
    // Add the role document
    await setDoc(roleRef, {
      ...roleData,
      id: roleRef.id, // Use Firestore's generated ID
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Also update the role count in the collaboration
    const collaborationRef = doc(db(), 'collaborations', collaborationId);
    await updateDoc(collaborationRef, {
      roleCount: increment(1),
      updatedAt: Timestamp.now()
    });
    
    // Return the new role ID
    return roleRef.id;
  } catch (error) {
    console.error("Error creating role hierarchy:", error);
    throw error;
  }
};

// Update deleteRole to accept a parameter
export const deleteRole = async (roleId: string, collaborationId?: string) => {
  try {
    let actualRoleId, actualCollabId;
    
    if (roleId.includes('_')) {
      // Format is collaborationId_roleId
      [actualCollabId, actualRoleId] = roleId.split('_');
    } else {
      // Direct roleId
      actualRoleId = roleId;
      actualCollabId = collaborationId;
      
      if (!actualCollabId) {
        throw new Error("Missing collaborationId for role deletion");
      }
    }
    
    const roleRef = doc(db(), `collaborations/${actualCollabId}/roles/${actualRoleId}`);
    await deleteDoc(roleRef);
    
    // Update collaboration document
    const collaborationRef = doc(db(), 'collaborations', actualCollabId);
    await updateDoc(collaborationRef, {
      roleCount: increment(-1),
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting role:", error);
    return false;
  }
};

// Service object imported in CollaborationForm
export const collaborationRoleService = {
  getRoles: getCollaborationRoles,
  createRole: async () => ({}),
  updateRole: async () => ({}),
  deleteRole,
  modifyRole,
  createRoleHierarchy
};
