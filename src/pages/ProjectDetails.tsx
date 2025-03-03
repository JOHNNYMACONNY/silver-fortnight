import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb, withRetry } from '../lib/firebase';
import { Calendar, Users, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { ProfilePicture } from '../components/ProfilePicture';
import type { Collaboration, UserProfile } from '../types';
import { XP_CONFIG, awardExperience, checkAndAwardBadges } from '../lib/reputation';

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Collaboration | null>(null);
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchProjectAndCreator() {
      if (!id) return;

      const firestore = await getDb();
      try {
        await withRetry(async () => {
          const projectDoc = await getDoc(doc(firestore, 'collaborations', id));
          if (!projectDoc.exists()) {
            throw new Error('Project not found');
          }

          const projectData = { id: projectDoc.id, ...projectDoc.data() } as Collaboration;
          setProject(projectData);

          // Fetch creator details
          const creatorDoc = await getDoc(doc(firestore, 'users', projectData.creatorId));
          if (creatorDoc.exists()) {
            const creatorData = { id: creatorDoc.id, ...creatorDoc.data() } as UserProfile;
            console.log('Creator data:', creatorData);
            setCreator(creatorData);
          }
        });
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    }

    fetchProjectAndCreator();
  }, [id]);

  const handleJoinRole = async (roleIndex: number) => {
    if (!user || !project || joining) return;

    setJoining(true);
    const firestore = await getDb();
    try {
      await withRetry(async () => {
        const updatedRoles = [...project.roles];
        updatedRoles[roleIndex] = {
          ...updatedRoles[roleIndex],
          filled: true,
          userId: user.uid
        };

        await updateDoc(doc(firestore, 'collaborations', project.id), {
          roles: updatedRoles,
          updatedAt: serverTimestamp()
        });

        setProject(prev => prev ? { ...prev, roles: updatedRoles } : null);
      });
    } catch (err) {
      setError('Failed to join role');
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Collaboration['status']) => {
    if (!project || !user || updatingStatus) return;

    setUpdatingStatus(true);
    const firestore = await getDb();
    try {
      await withRetry(async () => {
        await updateDoc(doc(firestore, 'collaborations', project.id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        });

        // Award XP when project is completed
        if (newStatus === 'completed') {
          // Award XP to all participants
          const participants = project.roles
            .filter(role => role.filled && role.userId)
            .map(role => ({
              userId: role.userId!,
              skills: role.skills
            }));

          for (const participant of participants) {
            await awardExperience(
              participant.userId,
              XP_CONFIG.COLLABORATION_COMPLETION,
              participant.skills
            );
            
            // Check and award badges
            const participantProfile = await getDoc(doc(firestore, 'users', participant.userId));
            if (participantProfile.exists()) {
              await checkAndAwardBadges(participant.userId, participantProfile.data() as UserProfile);
            }
          }
        }

        setProject(prev => prev ? { ...prev, status: newStatus } : null);
        setShowStatusModal(false);
      });
    } catch (err) {
      setError('Failed to update project status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleContact = async () => {
    if (!user || !project || !creator) return;
    
    const firestore = await getDb();
    try {
      await withRetry(async () => {
        // Create or get conversation
        const conversationRef = await addDoc(collection(firestore, 'conversations'), {
          participants: [user.uid, project.creatorId],
          projectId: id,
          projectName: project.title,
          lastMessage: '',
          unreadCount: {
            [project.creatorId]: 0,
            [user.uid]: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        navigate(`/messages/${conversationRef.id}`);
      });
    } catch (err) {
      setError('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  const isCreator = user?.uid === project.creatorId;
  const allRolesFilled = project.roles.every(role => role.filled);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card card-form">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Posted {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span className={`badge-${project.status}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>

          {/* Creator Info */}
          {creator && (
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mr-4">
                <ProfilePicture url={creator.profilePicture} size="md" />
              </div>
              <div>
                <Link to={`/profile/${creator.id}`} className="hover:underline">
                  <h3 className="font-medium text-gray-900">{creator.displayName}</h3>
                </Link>
                <p className="text-gray-600 text-sm">{creator.bio || 'No bio available'}</p>
              </div>
              {!isCreator && (
                <button
                  onClick={handleContact}
                  className="ml-auto flex items-center gap-2 btn-primary btn-with-icon px-4 py-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact
                </button>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About the Project</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
          </div>

          {/* Roles */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Team Roles</h2>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>
                  {project.roles.filter(role => role.filled).length}/{project.roles.length} filled
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {project.roles.map((role, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{role.title}</h3>
                    {role.filled ? (
                      <span className="px-2 py-1 bg-accent-ochre/20 text-gray-900 text-sm rounded-full border border-accent-ochre/30">
                        Filled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinRole(index)}
                        disabled={joining || !user || isCreator}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-sage/30 bg-accent-sage/20 text-gray-900 border border-accent-sage/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {joining ? 'Joining...' : 'Join Role'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-accent-sage/20 text-gray-900 text-sm rounded-full border border-accent-sage/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {isCreator && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowStatusModal(true)}
                disabled={updatingStatus}
                className="btn-primary btn-full py-2 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-5 w-5" />
                Update Status
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="card card-form p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Project Status</h3>
            <div className="space-y-3">
              {project.status === 'recruiting' && (
                <button
                  onClick={() => handleUpdateStatus('in-progress')}
                  disabled={!allRolesFilled || updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-clay/30 bg-accent-clay/20 text-gray-900 border border-accent-clay/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircle className="h-5 w-5" />
                  Start Project
                </button>
              )}
              {project.status !== 'completed' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-ochre/30 bg-accent-ochre/20 text-gray-900 border border-accent-ochre/30"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Mark as Completed
                </button>
              )}
              {project.status !== 'recruiting' && (
                <button
                  onClick={() => handleUpdateStatus('recruiting')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-sage/30 bg-accent-sage/20 text-gray-900 border border-accent-sage/30"
                >
                  Reopen Recruitment
                </button>
              )}
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
