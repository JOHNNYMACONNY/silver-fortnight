import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getCollaboration,
  deleteCollaboration,
  getCollaborationApplications,
  updateCollaborationApplication,
  getUserProfile,
  Collaboration,
  CollaborationApplication,
  User
} from '../services/firestore-exports';
import CollaborationForm_legacy from '../components/features/collaborations/CollaborationForm_legacy';
import CollaborationApplicationForm from '../components/features/collaborations/CollaborationApplicationForm';
import CollaborationApplicationCard from '../components/features/collaborations/CollaborationApplicationCard';
import { RoleCard } from '../components/collaboration/RoleCard';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Edit, Trash2, MapPin, Clock, DollarSign, Users } from 'lucide-react';
import ProfileHoverCard from '../components/ui/ProfileHoverCard';
import { CollaborationRoleData, RoleState, Skill } from '../types/collaboration';

import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/dateUtils';
import { getProfileImageUrl } from '../utils/imageUtils';

// Transform legacy roles to new CollaborationRoleData format
const transformLegacyRoles = (roles: any[], collaborationId: string): CollaborationRoleData[] => {
  if (!roles || !Array.isArray(roles)) return [];

  return roles.map((role, index) => ({
    id: `role-${index}`,
    collaborationId,
    title: role.title || 'Untitled Role',
    description: role.description || '',
    maxParticipants: 1,
    childRoleIds: [],
    status: role.filled ? RoleState.FILLED : RoleState.OPEN,
    applicationCount: 0,
    requiredSkills: role.skills ? role.skills.map((skill: string) => ({
      name: skill,
      level: 'intermediate' as const
    })) : [],
    preferredSkills: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

export const CollaborationDetailPage: React.FC = () => {
  const { id: collaborationId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [collaboration, setCollaboration] = useState<Collaboration | undefined>(undefined);
  const [applications, setApplications] = useState<CollaborationApplication[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<User | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details');

  // Check if current user is a collaborator
  const isCollaborator = currentUser && collaboration && collaboration.collaborators?.includes(currentUser.uid);

  useEffect(() => {
    const fetchCollaborationData = async () => {
      if (!collaborationId) {
        setError('Collaboration ID is missing');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: collaborationData, error: collaborationError } = await getCollaboration(collaborationId);
      if (collaborationError) {
        setError(`Failed to fetch collaboration: ${collaborationError.message}`);
      } else if (collaborationData) {
        setCollaboration(collaborationData);
        setIsOwner(currentUser?.uid === (collaborationData as any).creatorId || currentUser?.uid === (collaborationData as any).ownerId);

        // Fetch creator profile for live data
        const creatorId = (collaborationData as any).creatorId || (collaborationData as any).ownerId;
        if (creatorId) {
          setIsLoadingCreator(true);
          const { data: profileData } = await getUserProfile(creatorId);
          if (profileData) {
            setCreatorProfile(profileData);
          }
          setIsLoadingCreator(false);
        }

        // Fetch applications only if collaboration is loaded
        const { data: applicationsData, error: applicationsError } = await getCollaborationApplications(collaborationId);
        if (applicationsError) {
          setError(`Failed to fetch applications: ${applicationsError.message}`);
        } else if (applicationsData) {
          setApplications(applicationsData);
          const userApplication = applicationsData.find(app => app.applicantId === currentUser?.uid);
          setHasApplied(!!userApplication);
        } else {
          // Handle case where collaborationData is null but no explicit error
          setError('Collaboration not found');
        }
      }

      setIsLoading(false);
    };

    fetchCollaborationData();
  }, [collaborationId, currentUser]);

  const handleUpdateCollaboration = async () => {
    setIsEditing(false);
    addToast('success', 'Collaboration updated successfully');
  };

  const handleDeleteCollaboration = async () => {
    if (!collaborationId) return;

    try {
      const { error: deleteError } = await deleteCollaboration(collaborationId);

      if (deleteError) {
        throw new Error(deleteError.message || 'Failed to delete collaboration');
      }

      addToast('success', 'Collaboration deleted successfully');
      navigate('/collaborations');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete collaboration');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplicationSubmit = () => {
    setShowApplicationForm(false);
    setHasApplied(true);
  };

  const handleAcceptApplication = async (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      setError('Application not found');
      return;
    }
    
    if (!collaborationId) {
      setError('Collaboration ID is missing');
      return;
    }
    
    const { error } = await updateCollaborationApplication(applicationId, { status: 'accepted' }, collaborationId, application.roleId);
    if (error) {
      setError(`Failed to accept application: ${error.message}`);
      return;
    }

    addToast('success', 'Application accepted');
    setApplications(prevApps =>
      prevApps.map(app =>
        app.id === applicationId ? { ...app, status: 'accepted' } : app
      )
    );
    if (collaboration && collaboration.status !== 'in-progress') {
      setCollaboration(prevCollaboration => prevCollaboration ? { ...prevCollaboration, status: 'in-progress' } : undefined);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      setError('Application not found');
      return;
    }
    
    if (!collaborationId) {
      setError('Collaboration ID is missing');
      return;
    }
    
    const { error } = await updateCollaborationApplication(applicationId, { status: 'rejected' }, collaborationId, application.roleId);
    if (error) {
      setError(`Failed to reject application: ${error.message}`);
      return;
    }

    addToast('success', 'Application rejected');
    setApplications(prevApps =>
      prevApps.map(app =>
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      )
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'Collaboration not found'}
          </p>
          <Link
            to="/collaborations"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Back to Collaborations
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const formattedDate = collaboration.createdAt 
    ? formatDate(collaboration.createdAt)
    : 'Recently posted';

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/90"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Collaboration
          </button>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h1 className="text-2xl font-bold text-card-foreground mb-6">Edit Collaboration</h1>

          <CollaborationForm_legacy
            collaboration={collaboration}
            onSuccess={handleUpdateCollaboration}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          to="/collaborations"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/90"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Collaborations
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Collaboration Header */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-foreground">{collaboration.title}</h1>
                <span className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  collaboration.status === 'open' ? 'bg-success/10 text-success-foreground border-success/20' :
                  collaboration.status === 'in-progress' ? 'bg-info/10 text-info-foreground border-info/20' :
                  collaboration.status === 'completed' ? 'bg-muted text-muted-foreground border-border' :
                  'bg-destructive/10 text-destructive-foreground border-destructive/20'
                }`}>
                  {collaboration.status === 'open' ? 'Open' :
                   collaboration.status === 'in-progress' ? 'In Progress' :
                   collaboration.status === 'completed' ? 'Completed' :
                   'Cancelled'}
                </span>
              </div>

              <div className="mt-2 flex items-center">
                <ProfileHoverCard
                  userId={creatorProfile?.id || (collaboration as any).creatorId || (collaboration as any).ownerId || ''}
                  displayName={creatorProfile?.displayName || (collaboration as any).creatorName || (collaboration as any).ownerName || 'Owner'}
                  photoURL={creatorProfile?.photoURL || creatorProfile?.profilePicture || (collaboration as any).creatorPhotoURL || (collaboration as any).ownerPhotoURL || ''}
                >
                  <div className="flex items-center">
                    <img
                      src={
                        getProfileImageUrl(
                          creatorProfile?.profilePicture || 
                          (collaboration as any).creatorPhotoURL || 
                          (collaboration as any).ownerPhotoURL,
                          32
                        ) || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          creatorProfile?.displayName || 
                          (collaboration as any).creatorName || 
                          (collaboration as any).ownerName || 
                          'Owner'
                        )}&background=random`
                      }
                      alt={
                        creatorProfile?.displayName || 
                        (collaboration as any).creatorName || 
                        (collaboration as any).ownerName || 
                        'Owner'
                      }
                      className="h-6 w-6 rounded-full mr-2"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {creatorProfile?.displayName || 
                       (collaboration as any).creatorName || 
                       (collaboration as any).ownerName || 
                       'Owner'}
                    </span>
                  </div>
                </ProfileHoverCard>
                <span className="mx-2 text-muted-foreground">&middot;</span>
                <span className="text-sm text-muted-foreground">{formattedDate}</span>
              </div>
            </div>

            {isOwner && (
              <div className="mt-4 md:mt-0 flex-shrink-0 flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  <Edit className="-ml-0.5 mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus_ring-offset-2 focus:ring-destructive"
                >
                  <Trash2 className="-ml-0.5 mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">About this Collaboration</h2>
            <p className="mt-2 text-base text-muted-foreground whitespace-pre-wrap">{collaboration.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Details</h3>
              <dl className="mt-2 space-y-4">
                {collaboration.location && (
                  <div className="flex">
                    <dt className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </dt>
                    <dd className="ml-3 text-base text-foreground">{collaboration.location}</dd>
                  </div>
                )}
                {collaboration.timeline && (
                  <div className="flex">
                    <dt className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </dt>
                    <dd className="ml-3 text-base text-foreground">{collaboration.timeline}</dd>
                  </div>
                )}
                {collaboration.compensation && (
                  <div className="flex">
                    <dt className="flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </dt>
                    <dd className="ml-3 text-base text-foreground">{collaboration.compensation}</dd>
                  </div>
                )}
                {collaboration.maxParticipants > 0 && (
                  <div className="flex">
                    <dt className="flex-shrink-0">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </dt>
                    <dd className="ml-3 text-base text-foreground">
                      Up to {collaboration.maxParticipants} collaborators
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">Skills Needed</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {collaboration.skillsNeeded && collaboration.skillsNeeded.length > 0 ? (
                  collaboration.skillsNeeded.map(skill => (
                    <span key={skill} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specific skills required</p>
                )}
              </div>
            </div>
          </div>

          {/* Roles Section */}
          {collaborationId && ((collaboration as any).roles && Array.isArray((collaboration as any).roles) && (collaboration as any).roles.length > 0) && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-foreground mb-4">Available Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformLegacyRoles((collaboration as any).roles, collaborationId).map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    collaborationId={collaborationId}
                    isCreator={isOwner}
                  />
                ))}
              </div>
            </div>
          )}

          {!isOwner && !isCollaborator && (
            <div className="mt-8">
              <button
                onClick={() => setShowApplicationForm(true)}
                disabled={hasApplied}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {hasApplied ? 'Application Submitted' : 'Apply to Collaborate'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs for Details/Applications */}
      <div className="mt-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Collaborators
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('applications')}
                className={`${
                  activeTab === 'applications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Applications ({applications.filter(app => app.status === 'pending').length})
              </button>
            )}
          </nav>
        </div>
        <div className="mt-6">
          {activeTab === 'details' && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Current Collaborators</h3>
              {collaboration.collaborators && collaboration.collaborators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {collaboration.collaborators.map(userId => (
                    <ProfileHoverCard key={userId} userId={userId}>
                      <div className="bg-muted/50 p-3 rounded-lg flex items-center space-x-3">
                        {/* Placeholder for user avatar */}
                        <div className="h-10 w-10 rounded-full bg-muted"></div>
                        {/* Placeholder for user name */}
                        <span className="text-sm font-medium text-foreground">User {userId.substring(0, 5)}</span>
                      </div>
                    </ProfileHoverCard>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No collaborators have joined yet.</p>
              )}
            </div>
          )}
          {activeTab === 'applications' && isOwner && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Pending Applications</h3>
              {applications.filter(app => app.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {applications
                    .filter(app => app.status === 'pending' && app.id)
                    .map(application => (
                      <CollaborationApplicationCard
                        key={application.id}
                        application={application}
                        isOwner={isOwner}
                        onAccept={() => handleAcceptApplication(application.id!)}
                        onReject={() => handleRejectApplication(application.id!)}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No pending applications.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Confirm Deletion"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCollaboration}>Delete</Button>
          </div>
        }
      >
        <p>Are you sure you want to delete this collaboration? This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
        title="Apply to Collaborate"
      >
        {collaboration.id && (
          <CollaborationApplicationForm
            collaborationId={collaboration.id}
            collaborationTitle={collaboration.title}
            onSuccess={handleApplicationSubmit}
            onCancel={() => setShowApplicationForm(false)}
          />
        )}
      </Modal>
      </div>
    </>
  );
};

export default CollaborationDetailPage;
