import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { UserProfile } from '../types';
import { Pencil, X, Check, Plus, ThumbsUp, User, Link as LinkIcon, Shield, Palette } from 'lucide-react';
import { ReputationCard } from '../components/ReputationCard';
import { BannerUnlockNotification } from '../components/BannerUnlockNotification';
import { addEndorsement } from '../lib/reputation';
import { ProfilePicture } from '../components/ProfilePicture';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { ProfileBanner } from '../components/ProfileBanner';
import { isValidUsername, isUsernameAvailable } from '../utils/username';

export function Profile() {
  const { user, updateUsername } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [endorsing, setEndorsing] = useState(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState<string | null>(null);
  const [isCustomizingBanner, setIsCustomizingBanner] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      try {
        const db = await getDb();
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const initializedProfile = {
            id: docSnap.id,
            ...profileData,
            level: typeof profileData.level === 'number' ? profileData.level : 0
          } as UserProfile;
          
          // Log profile data for debugging
          console.log('Profile loaded:', initializedProfile);
          
          setProfile(initializedProfile);
          setEditedProfile(initializedProfile);

          // Ensure level is set in database
          if (typeof profileData.level !== 'number') {
            console.log('Initializing user level to 0');
            await updateDoc(docRef, {
              level: 0,
              updatedAt: new Date()
            });
          }
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  // Check for banner unlocks when profile changes
  useEffect(() => {
    if (!profile) return;

    // Define levels at which advanced banners are unlocked
    const bannerUnlocks = [
      { level: 5, bannerId: 'banner-advanced-masculine' },
      { level: 10, bannerId: 'banner-advanced-feminine' },
      { level: 15, bannerId: 'banner-advanced-neutral' }
    ];

    // Find the first unlocked banner that hasn't been selected
    const newUnlock = bannerUnlocks.find(
      unlock => profile.level >= unlock.level && 
      (!profile.selectedBanner || profile.selectedBanner !== unlock.bannerId)
    );

    if (newUnlock) {
      setUnlockedBanner(newUnlock.bannerId);
    }

    // Ensure profile has a level property initialized
    if (typeof profile.level !== 'number') {
      (async () => {
        const db = await getDb();
        await updateDoc(doc(db, 'users', profile.id), {
          level: 0,
          updatedAt: new Date()
        });
      })().catch(console.error);
    }
  }, [profile?.level, profile?.selectedBanner]);

  const handleUsernameChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setEditedProfile(prev => ({ ...prev, username: newUsername }));
    
    // Reset states
    setUsernameError('');
    setUsernameAvailable(false);
    
    if (!newUsername) return;
    
    if (!isValidUsername(newUsername)) {
      setUsernameError('Username must start with @ and contain only letters, numbers, and hyphens');
      return;
    }
    
    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(newUsername);
      if (available || newUsername === profile?.username) {
        setUsernameAvailable(true);
      } else {
        setUsernameError('Username is already taken');
      }
    } catch (err) {
      setUsernameError('Error checking username availability');
    } finally {
      setCheckingUsername(false);
    }
  }, [profile]);

  const handleProfilePictureUpload = async (url: string) => {
    if (!user || !profile) return;
    
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'users', user.uid), {
        profilePicture: url,
        updatedAt: new Date()
      });
      
      // Update both profile and editedProfile states
      setProfile(prev => prev ? { ...prev, profilePicture: url } : null);
      setEditedProfile(prev => ({ ...prev, profilePicture: url }));
    } catch (err) {
      setError('Failed to update profile picture');
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      // Update username if changed
      if (editedProfile.username && editedProfile.username !== profile.username) {
        if (!isValidUsername(editedProfile.username)) {
          throw new Error('Invalid username format');
        }
        await updateUsername(editedProfile.username);
      }

      // Update other profile fields
      const db = await getDb();
      const docRef = doc(db, 'users', user.uid);
      const updates = { ...editedProfile };
      delete updates.username; // Username is handled separately

      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      setProfile({ ...profile, ...editedProfile });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || editedProfile.skills?.includes(newSkill.trim())) return;
    
    setEditedProfile(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill.trim()],
      // Initialize skill level for new skill
      skillLevels: {
        ...prev.skillLevels,
        [newSkill.trim()]: { level: 1, experience: 0 }
      }
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditedProfile(prev => {
      const { [skillToRemove]: removedSkill, ...remainingSkills } = prev.skillLevels || {};
      return {
        ...prev,
        skills: prev.skills?.filter(skill => skill !== skillToRemove) || [],
        skillLevels: remainingSkills
      };
    });
  };

  const handleEndorse = async (skill: string) => {
    if (!user || !profile || endorsing) return;
    
    setEndorsing(true);
    try {
      await addEndorsement(profile.id, user.uid, skill);
      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        const currentEndorsers = prev.endorsements?.[skill] || [];
        return {
          ...prev,
          endorsements: {
            ...prev.endorsements,
            [skill]: [...currentEndorsers, user.uid]
          }
        };
      });
    } catch (err) {
      setError('Failed to endorse skill');
    } finally {
      setEndorsing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          {/* Circular gradient glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink animate-spin opacity-75 blur-lg"></div>
          {/* Container */}
          <div className="relative bg-cyber-gray-900 p-8 rounded-full border border-cyber-gray-800">
            {/* Spinner */}
            <div className="h-8 w-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="mt-4 text-cyber-gray-400 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-cyber-gray-900/50 backdrop-blur-sm border border-cyber-gray-800 rounded-lg p-8 text-center">
          <Shield className="h-12 w-12 text-cyber-gray-400 mx-auto mb-4" />
          <p className="text-cyber-gray-300">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner Unlock Notification */}
      {unlockedBanner && (
        <BannerUnlockNotification
          bannerId={unlockedBanner}
          onClose={() => setUnlockedBanner(null)}
          onClick={() => {
            setIsCustomizingBanner(true);
            setUnlockedBanner(null);
          }}
        />
      )}
      <div className="card overflow-hidden">
        {/* Banner and Profile Picture */}
        <div className="relative">
          <ProfileBanner
            userId={user!.uid}
            selectedBanner={profile.selectedBanner}
            userLevel={typeof profile.level === 'number' ? profile.level : 0}
            editable={true}
            profile={profile}
            onUpdate={async (bannerId) => {
              setIsCustomizingBanner(false);
              try {
                const db = await getDb();
                await updateDoc(doc(db, 'users', user!.uid), {
                  selectedBanner: bannerId,
                  updatedAt: new Date()
                });
                setProfile(prev => prev ? { ...prev, selectedBanner: bannerId } : null);
              } catch (err) {
                setError('Failed to update banner');
              }
            }}
          />
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-8 z-10">
            {isEditing ? (
              <ProfilePictureUpload
                currentUrl={profile.profilePicture}
                userId={user!.uid}
                onUpload={handleProfilePictureUpload}
              />
            ) : (
              <ProfilePicture url={profile.profilePicture} size="xl" />
            )}
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6 mt-16">
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.displayName || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, displayName: e.target.value }))}
                  className="text-2xl font-display font-bold text-gray-900 bg-transparent border-b-2 border-neon-blue focus:outline-none"
                  placeholder="Your name"
                />
              ) : (
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  {profile.displayName}
                </h1>
              )}
              <div className="flex flex-col gap-1">
                <p className="text-gray-600">{profile.email}</p>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={editedProfile.username || ''}
                      onChange={handleUsernameChange}
                      className={`text-sm bg-transparent border-b ${
                        usernameError
                          ? 'border-red-500 text-red-500'
                          : usernameAvailable
                          ? 'border-green-500 text-green-600'
                          : 'border-earth-700 text-gray-600'
                      } focus:outline-none w-48`}
                      placeholder="@username"
                    />
                    {checkingUsername && (
                      <span className="absolute text-xs text-gray-500 mt-1">Checking availability...</span>
                    )}
                    {usernameError ? (
                      <p className="absolute text-xs text-red-500 mt-1">{usernameError}</p>
                    ) : editedProfile.username && usernameAvailable && (
                      <p className="absolute text-xs text-green-600 mt-1">Username available!</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{profile.username}</p>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                    setUsernameError('');
                    setUsernameAvailable(false);
                  }}
                  className="btn-secondary flex items-center gap-2"
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                  disabled={saving || (editedProfile.username !== profile.username && !usernameAvailable)}
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Reputation Card */}
          <div className="mb-8">
            <ReputationCard profile={profile} />
          </div>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">About</h2>
            {isEditing ? (
              <textarea
                name="bio"
                value={editedProfile.bio || ''}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-3 bg-earth-800 border border-earth-700 rounded-lg 
                         text-gray-900 placeholder-gray-500
                         focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/30 
                         transition-all duration-300"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700">
                {profile.bio || 'No bio yet. Click edit to add one!'}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">Skills</h2>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  id="newSkill"
                  name="newSkill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add a skill..."
                  className="flex-1 p-2 bg-earth-800 border border-earth-700 rounded-lg 
                           text-gray-900 placeholder-gray-500
                           focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/30 
                           transition-all duration-300"
                />
                <button
                  onClick={handleAddSkill}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editedProfile.skills : profile.skills)?.map((skill) => (
                <div
                  key={skill}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-earth-800 
                           text-gray-900 rounded-full text-sm border border-earth-700
                           hover:border-neon-blue transition-all duration-300"
                >
                  <span>{skill}</span>
                  {isEditing ? (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-gray-600 hover:text-neon-pink transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEndorse(skill)}
                      disabled={endorsing || user?.uid === profile.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-blue 
                               hover:text-neon-purple disabled:opacity-50"
                      title={user?.uid === profile.id ? "You can't endorse your own skills" : 'Endorse this skill'}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                  )}
                  {!isEditing && profile.endorsements?.[skill] && (
                    <span className="px-1.5 py-0.5 bg-neon-purple/10 text-neon-purple rounded-full text-xs">
                      {profile.endorsements[skill].length}
                    </span>
                  )}
                </div>
              ))}
              {(!isEditing ? profile.skills : editedProfile.skills)?.length === 0 && (
                <p className="text-gray-600">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">Portfolio</h2>
            {isEditing ? (
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  name="portfolioUrl"
                  value={editedProfile.portfolio || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://your-portfolio.com"
                  className="w-full pl-10 pr-4 py-2 bg-earth-800 border border-earth-700 rounded-lg 
                           text-gray-900 placeholder-gray-500
                           focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/30 
                           transition-all duration-300"
                />
              </div>
            ) : (
              profile.portfolio ? (
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neon-blue hover:text-neon-purple transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  {profile.portfolio}
                </a>
              ) : (
                <p className="text-gray-600">No portfolio link added</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
