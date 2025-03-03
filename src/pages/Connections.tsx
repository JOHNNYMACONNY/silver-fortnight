import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { useFirestoreDb } from '../hooks/useFirestoreDb';
import { startConversation } from '../lib/messaging';
import { 
  acceptConnectionRequest, 
  declineConnectionRequest 
} from '../lib/connections';
import { Connection, UserProfile } from '../types';
import { ProfilePicture } from '../components/ProfilePicture';
import { ProfileHoverCard } from '../components/ProfileHoverCard';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Check, 
  X, 
  MessageSquare,
  ExternalLink 
} from 'lucide-react';

export function Connections() {
  const { user } = useAuth();
  const { db, loading: dbLoading, error: dbError } = useFirestoreDb();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch user profiles for connections
  const fetchProfiles = async (userIds: string[]) => {
    if (!db) return;
    const uniqueIds = Array.from(new Set(userIds));
    const newProfiles: { [key: string]: UserProfile } = {};
    
    for (const userId of uniqueIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          newProfiles[userId] = {
            id: userDoc.id,
            ...userDoc.data()
          } as UserProfile;
        }
      } catch (err) {
        console.error(`Failed to fetch profile for ${userId}:`, err);
      }
    }
    
    setProfiles(prev => ({ ...prev, ...newProfiles }));
  };

  // Real-time updates for connections
  useEffect(() => {
    if (!user || !db) return;

    // Query for pending requests
    const pendingQuery = query(
      collection(db, `users/${user.uid}/connections`),
      where('status', '==', 'pending')
    );

    // Query for accepted connections
    const acceptedQuery = query(
      collection(db, `users/${user.uid}/connections`),
      where('status', '==', 'accepted')
    );

    // Subscribe to pending requests
    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Connection[];
      setPendingRequests(requests);
      
      // Fetch profiles for new requests
      const userIds = requests.map(req => req.userId);
      fetchProfiles(userIds);
    }, (err) => {
      console.error('Error in pending requests subscription:', err);
      setError('Failed to load pending requests');
    });

    // Subscribe to accepted connections
    const unsubAccepted = onSnapshot(acceptedQuery, (snapshot) => {
      const acceptedConnections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Connection[];
      setConnections(acceptedConnections);
      
      // Fetch profiles for new connections
      const userIds = acceptedConnections.map(conn => conn.userId);
      fetchProfiles(userIds);
      setLoading(false);
    }, (err) => {
      console.error('Error in accepted connections subscription:', err);
      setError('Failed to load connections');
      setLoading(false);
    });

    // Cleanup subscriptions
    return () => {
      unsubPending();
      unsubAccepted();
    };
  }, [user, db]);

  const handleAcceptRequest = async (connectionId: string) => {
    if (!user) return;
    try {
      await acceptConnectionRequest(user.uid, connectionId);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    if (!user) return;
    try {
      await declineConnectionRequest(user.uid, connectionId);
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
  };

  if (loading || dbLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-earth-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-earth-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-earth-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Your Network
        </h1>
        <p className="text-gray-200">
          Manage your professional connections and requests
        </p>
      </div>

      {(error || dbError) && (
        <div className="mb-8 bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {dbError?.message || error}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent-clay" />
            Pending Requests
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const profile = profiles[request.userId];
              if (!profile) return null;

              return (
                <div key={request.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ProfilePicture url={profile.profilePicture} size="md" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {profile.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {profile.bio || 'No bio available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="p-2 text-accent-sage hover:text-accent-moss transition-colors"
                        title="Accept Request"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="p-2 text-accent-rust hover:text-red-700 transition-colors"
                        title="Decline Request"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connections */}
      <div>
        <h2 className="text-xl font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent-clay" />
          Your Connections
          <span className="text-sm text-gray-400">({connections.length})</span>
        </h2>

        {connections.length === 0 ? (
          <div className="card p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Connections Yet
            </h3>
            <p className="text-gray-600">
              Start building your network by connecting with other professionals
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => {
              const profile = profiles[connection.userId];
              if (!profile) return null;

              return (
                <div key={connection.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    <ProfileHoverCard
                      profile={profile}
                      onMessageClick={async () => {
                        try {
                          const conversationId = await startConversation(user!.uid, profile);
                          navigate(`/messages/${conversationId}`);
                        } catch (err) {
                          console.error('Failed to start conversation:', err);
                        }
                      }}
                    >
                      <ProfilePicture url={profile.profilePicture} size="lg" />
                    </ProfileHoverCard>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {profile.displayName}
                      </h3>
                      {profile.portfolio && (
                        <a
                          href={profile.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent-clay hover:text-accent-ochre flex items-center gap-1"
                        >
                          Portfolio <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {profile.bio || 'No bio available'}
                      </p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Top Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-accent-sage/20 text-gray-900 text-sm rounded-full border border-accent-sage/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-earth-700">
                    <button
                      onClick={async () => {
                        try {
                          const conversationId = await startConversation(user!.uid, profile);
                          navigate(`/messages/${conversationId}`);
                        } catch (err) {
                          console.error('Failed to start conversation:', err);
                        }
                      }}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
