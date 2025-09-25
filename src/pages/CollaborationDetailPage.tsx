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
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import { TopicLink } from '../components/ui/TopicLink';
import { semanticClasses } from '../utils/semanticColors';
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
        }
      } else {
        // Handle case where collaborationData is null but no explicit error
        setError('Collaboration not found');
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
            className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
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
    <Box className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stack gap="lg">
        {/* Back Navigation */}
        <Box className="mb-4">
          <TopicLink 
            to="/collaborations" 
            topic="collaboration"
            className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Collaborations
          </TopicLink>
        </Box>

        {/* Hero Section with GradientMeshBackground */}
        <Box className="relative rounded-2xl overflow-hidden mb-8">
          <GradientMeshBackground variant="primary" intensity="medium" className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <AnimatedHeading as="h1" animation="kinetic" className="text-3xl md:text-4xl font-bold text-foreground mr-4">
                    {collaboration.title}
                  </AnimatedHeading>
                  <Badge 
                    variant={collaboration.status === 'open' ? 'default' : 
                            collaboration.status === 'in-progress' ? 'default' : 
                            collaboration.status === 'completed' ? 'secondary' : 'destructive'}
                    topic={collaboration.status === 'open' ? 'success' : 
                           collaboration.status === 'in-progress' ? 'collaboration' : 
                           collaboration.status === 'completed' ? 'community' : undefined}
                    className="text-sm"
                  >
                    {collaboration.status === 'open' ? 'Open' :
                     collaboration.status === 'in-progress' ? 'In Progress' :
                     collaboration.status === 'completed' ? 'Completed' :
                     'Cancelled'}
                  </Badge>
                </div>

                <div className="flex items-center mb-4">
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
                            40
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
                        className="h-8 w-8 rounded-full mr-3"
                      />
                      <span className="text-lg font-medium text-foreground">
                        {creatorProfile?.displayName || 
                         (collaboration as any).creatorName || 
                         (collaboration as any).ownerName || 
                         'Owner'}
                      </span>
                    </div>
                  </ProfileHoverCard>
                  <span className="mx-3 text-muted-foreground">&middot;</span>
                  <span className="text-muted-foreground">{formattedDate}</span>
                </div>

                <p className="text-lg text-muted-foreground max-w-3xl">
                  {collaboration.description}
                </p>
              </div>

              {isOwner && (
                <div className="mt-6 md:mt-0 flex-shrink-0 flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleting(true)}
                    className="flex items-center"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </GradientMeshBackground>
        </Box>

        {/* Main Content - Optimized Layout for Better Card Display */}
        <div className="space-y-8 mb-8">
          {/* Application CTA - Full Width for Prominence */}
          {!isOwner && !isCollaborator && (
            <Card variant="premium" depth="md" glow="subtle" glowColor="purple">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Ready to Collaborate?</h3>
                  <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                    Join this collaboration and work with talented people to create something amazing together
                  </p>
                </div>
                <Button
                  size="lg"
                  topic="collaboration"
                  onClick={() => setShowApplicationForm(true)}
                  disabled={hasApplied}
                  className="px-12 py-4 text-lg"
                >
                  {hasApplied ? 'Application Submitted ✓' : 'Apply to Collaborate'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Roles Section - Full Width with Proper Grid */}
          {collaborationId && ((collaboration as any).roles && Array.isArray((collaboration as any).roles) && (collaboration as any).roles.length > 0) && (
            <Card variant="premium" depth="md" glow="subtle" glowColor="green">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold">Available Roles</CardTitle>
                <p className="text-base text-muted-foreground">Choose a role that matches your skills and interests</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {transformLegacyRoles((collaboration as any).roles, collaborationId).map((role) => (
                    <div key={role.id} className="w-full">
                      <RoleCard
                        role={role}
                        collaborationId={collaborationId}
                        isCreator={isOwner}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills and Details - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills Section */}
            <Card variant="premium" depth="md" glow="subtle" glowColor="purple">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Skills Needed</CardTitle>
                <p className="text-sm text-muted-foreground">Required and preferred skills for this collaboration</p>
              </CardHeader>
              <CardContent>
                {collaboration.skillsNeeded && collaboration.skillsNeeded.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {collaboration.skillsNeeded.map(skill => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        topic="collaboration"
                        className="text-sm rounded-full px-4 py-2"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific skills required</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Details */}
            <Card variant="premium" depth="md" glow="subtle" glowColor="blue">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Quick Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {collaboration.location && (
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                      <p className="text-base font-medium text-foreground break-words">{collaboration.location}</p>
                    </div>
                  </div>
                )}
                {collaboration.timeline && (
                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
                      <p className="text-base font-medium text-foreground break-words">{collaboration.timeline}</p>
                    </div>
                  </div>
                )}
                {collaboration.compensation && (
                  <div className="flex items-start space-x-4">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Compensation</p>
                      <p className="text-base font-medium text-foreground break-words">{collaboration.compensation}</p>
                    </div>
                  </div>
                )}
                {collaboration.maxParticipants > 0 && (
                  <div className="flex items-start space-x-4">
                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Max Participants</p>
                      <p className="text-base font-medium text-foreground">{collaboration.maxParticipants}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status & Stats - Full Width */}
          <Card variant="premium" depth="md" glow="subtle" glowColor="orange">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Collaboration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {collaboration.collaborators?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">
                    Current Collaborators
                  </div>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {applications.filter(app => app.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">
                    Pending Applications
                  </div>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {((collaboration as any).roles?.length || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">
                    Available Roles
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Details/Applications */}
        <Box className="mt-8">
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
              <Card variant="premium" depth="md" glow="subtle" glowColor="blue">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Current Collaborators</CardTitle>
                </CardHeader>
                <CardContent>
                  {collaboration.collaborators && collaboration.collaborators.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {collaboration.collaborators.map(userId => (
                        <ProfileHoverCard key={userId} userId={userId}>
                          <div className="bg-muted/50 p-4 rounded-lg flex items-center space-x-3 hover:bg-muted/70 transition-colors cursor-pointer">
                            <div className="h-10 w-10 rounded-full bg-muted"></div>
                            <span className="text-sm font-medium text-foreground">User {userId.substring(0, 5)}</span>
                          </div>
                        </ProfileHoverCard>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No collaborators have joined yet.</p>
                  )}
                </CardContent>
              </Card>
            )}
            {activeTab === 'applications' && isOwner && (
              <Card variant="premium" depth="md" glow="subtle" glowColor="purple">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Pending Applications</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <p className="text-muted-foreground text-center py-8">No pending applications.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </Box>
      </Stack>

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
    </Box>
  );
};

export default CollaborationDetailPage;
