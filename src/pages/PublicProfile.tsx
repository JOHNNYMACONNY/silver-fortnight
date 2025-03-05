import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { UserProfile, Trade } from '../types';
import { ReputationCard } from '../components/ReputationCard';
import { ProfilePicture } from '../components/ProfilePicture';
import { Link as LinkIcon, Star, History, Shield, UserPlus, MessageSquare, Clock } from 'lucide-react';
import { getConnectionStatus, sendConnectionRequest } from '../lib/networking';

export function PublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedTrades, setCompletedTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        const db = await getDb();
        // Fetch public profile data
        const profileDoc = await getDoc(doc(db, 'users', id));
        if (!profileDoc.exists()) {
          setError('Profile not found');
          return;
        }

        const profileData = {
          id: profileDoc.id,
          ...profileDoc.data()
        } as UserProfile;

        setProfile(profileData);

        // Fetch completed trades
        const tradesQuery = query(
          collection(db, 'trades'),
          where('creatorId', '==', id),
          where('status', '==', 'completed')
        );
        const tradesSnapshot = await getDocs(tradesQuery);
        const trades = tradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trade[];
        setCompletedTrades(trades);

        // Fetch connection status if user is logged in
        if (user) {
          const status = await getConnectionStatus(user.uid, id);
          setConnectionStatus(status);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  const handleConnect = async () => {
    if (!user || !profile || isConnecting) return;
    
    setIsConnecting(true);
    setConnectionStatus('pending');
    
    try {
      await sendConnectionRequest(user.uid, profile.id);
    } catch (err) {
      console.error('Failed to send connection request:', err);
      setConnectionStatus('none');
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-earth-800 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-8 bg-earth-800 rounded w-1/3"></div>
            <div className="h-4 bg-earth-800 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error || 'Profile not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink relative">
          <div className="absolute inset-0 bg-mesh opacity-30"></div>
          <div className="absolute inset-0 bg-noise opacity-50"></div>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-8">
            <ProfilePicture url={profile.profilePicture} size="xl" />
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6 mt-16">
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {profile.displayName}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            
            {user && user.uid !== profile.id && (
              <div className="flex gap-2">
                {connectionStatus === 'accepted' ? (
                  <Link
                    to={`/messages/${profile.id}`}
                    className="btn-primary flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Link>
                ) : connectionStatus === 'pending' ? (
                  <button
                    disabled
                    className="btn-secondary flex items-center gap-2 opacity-75"
                  >
                    <Clock className="h-4 w-4" />
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reputation Card */}
          <div className="mb-8">
            <ReputationCard profile={profile} showEndorsements={false} />
          </div>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700">
              {profile.bio || 'No bio available'}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-accent-ochre" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <div
                  key={skill}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-earth-800 
                           text-gray-900 rounded-full text-sm border border-earth-700
                           hover:border-neon-blue transition-all duration-300"
                >
                  <span>{skill}</span>
                  {profile.endorsements?.[skill] && (
                    <span className="px-1.5 py-0.5 bg-neon-purple/10 text-neon-purple rounded-full text-xs">
                      {profile.endorsements[skill].length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Completed Trades */}
          {completedTrades.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-display font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-accent-ochre" />
                Completed Trades
              </h2>
              <div className="space-y-4">
                {completedTrades.map((trade) => (
                  <Link
                    key={trade.id}
                    to={`/trades/${trade.id}`}
                    className="block p-4 bg-earth-800 rounded-lg hover:bg-earth-700 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{trade.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{trade.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {profile.portfolio && (
            <div>
              <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">Portfolio</h2>
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-neon-blue hover:text-neon-purple transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                {profile.portfolio}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
