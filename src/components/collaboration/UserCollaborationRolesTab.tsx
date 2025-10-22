// src/components/collaboration/UserCollaborationRolesTab.tsx
import React, { useEffect, useState } from 'react';
import CollaborationRolesSection from './CollaborationRolesSection';
import { getUserCollaborationsWithRoles } from '../../services/collaborations';
import { CollaborationRoleData } from '../../types/collaboration';

interface Collaboration {
  id: string;
  title: string;
  roles: CollaborationRoleData[];
  creatorId: string;
}

interface UserCollaborationRolesTabProps {
  userId: string;
}

const UserCollaborationRolesTab: React.FC<UserCollaborationRolesTabProps> = ({ userId }) => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborations = async () => {
    setLoading(true);
    const result = await getUserCollaborationsWithRoles(userId);
    setCollaborations(result as Collaboration[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollaborations();
    // eslint-disable-next-line
  }, [userId]);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading collaborations...</div>;
  }

  if (collaborations.length === 0) {
    return <div className="py-8 text-center text-gray-500">No collaborations found.</div>;
  }

  return (
    <div>
      {collaborations.map(collab => (
        <div key={collab.id} className="mb-8">
          <h3 className="text-lg font-semibold mb-2">{collab.title}</h3>
          <CollaborationRolesSection
            collaborationId={collab.id}
            collaborationTitle={collab.title}
            roles={collab.roles}
            isCreator={collab.creatorId === userId}
            onRolesUpdated={fetchCollaborations}
          />
        </div>
      ))}
    </div>
  );
};

export default UserCollaborationRolesTab;
