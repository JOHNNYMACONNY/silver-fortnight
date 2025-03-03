import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Tag } from 'lucide-react';
import type { UserProfile } from '../types';
import { UserProfileCard } from '../components/UserProfileCard';
import { getConnectionStatus, sendConnectionRequest } from '../lib/networking';

export function UserDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<{ [key: string]: 'none' | 'pending' | 'accepted' }>({});
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { data: users, loading: usersLoading, error } = useFirestore<UserProfile>('users');

  // Fetch connection statuses for all users
  useEffect(() => {
    if (!user || usersLoading) return;

    const fetchConnectionStatuses = async () => {
      const statuses: { [key: string]: 'none' | 'pending' | 'accepted' } = {};
      
      for (const profile of users) {
        if (profile.id !== user.uid) {
          try {
            const status = await getConnectionStatus(user.uid, profile.id);
            statuses[profile.id] = status;
          } catch (err) {
            console.error(`Failed to get connection status for ${profile.id}:`, err);
            statuses[profile.id] = 'none';
          }
        }
      }
      
      setConnectionStatuses(statuses);
      setLoading(false);
    };

    fetchConnectionStatuses();
  }, [user, users, usersLoading]);

  const filteredUsers = users.filter(profile => {
    if (profile.id === user?.uid) return false; // Don't show current user

    const matchesSearch = 
      profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkills = selectedSkills.length === 0 || 
      profile.skills.some(skill => selectedSkills.includes(skill));
    
    return matchesSearch && matchesSkills;
  });

  const allSkills = Array.from(new Set(
    users.flatMap(profile => profile.skills)
  )).sort();

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleConnect = async (otherUserId: string) => {
    if (!user) return;
    
    // Prevent duplicate requests
    if (connectingUsers.has(otherUserId)) return;
    
    setConnectingUsers(prev => new Set(prev).add(otherUserId));
    
    try {
      await sendConnectionRequest(user.uid, otherUserId);
      
      // Update local state
      setConnectionStatuses(prev => ({
        ...prev,
        [otherUserId]: 'pending'
      }));
    } catch (err) {
      console.error('Failed to send connection request:', err);
      
      // Revert local state on error
      setConnectionStatuses(prev => ({
        ...prev,
        [otherUserId]: 'none'
      }));
    } finally {
      setConnectingUsers(prev => {
        const next = new Set(prev);
        next.delete(otherUserId);
        return next;
      });
    }
  };


  if (loading || usersLoading) {
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
          User Directory
        </h1>
        <p className="text-gray-200">
          Find skilled professionals to collaborate with
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, bio, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-earth-800 border border-earth-700 rounded-lg 
                         text-gray-900 placeholder-gray-500
                         focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 
                         transition-all duration-300"
            />
          </div>
        </div>

        {/* Skills Filter */}
        <div className="bg-earth-800 border border-earth-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Filter by Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                  selectedSkills.includes(skill)
                    ? 'bg-accent-clay text-white'
                    : 'bg-earth-700 text-gray-900 hover:bg-earth-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((profile) => (
          <UserProfileCard
            key={profile.id}
            profile={profile}
            currentUserId={user?.uid}
            connectionStatus={connectionStatuses[profile.id]}
            onConnect={(success) => {
              if (success) {
                setConnectionStatuses(prev => ({
                  ...prev,
                  [profile.id]: 'pending'
                }));
              }
            }}
          />
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="bg-earth-800 border border-earth-700 rounded-lg p-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-700">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
