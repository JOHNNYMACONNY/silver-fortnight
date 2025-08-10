import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useParams } from 'react-router-dom';
import { getUserProfile } from '../services/firestore-exports';
import { PortfolioTab } from '../components/features/portfolio/PortfolioTab';
// Lazy-load heavy gamification components
import ReactLazy = React.lazy;
import { User, Trophy, Settings, Mail, Calendar, Hash } from 'lucide-react';
import { ProfileImage } from '../components/ui/ProfileImage';
import { ProfileBanner } from '../components/ui/ProfileBanner';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';


type TabType = 'about' | 'portfolio' | 'gamification' | 'collaborations' | 'trades';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  profilePicture?: string; // Added for consistency with ProfileImage component
}

interface ProfilePageProps {
  userId?: string; // Optional prop for when used in modals
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId: propUserId }) => {
  const { currentUser } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Use prop userId if provided, otherwise use URL param
  const userId = propUserId || paramUserId;

  // Determine if this is the user's own profile
  const isOwnProfile = !userId || userId === currentUser?.uid;
  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        if (targetUserId) {
          // Always fetch Firestore profile data to get Cloudinary profilePicture
          const { data: profile, error } = await getUserProfile(targetUserId);
          if (error) {
            console.error('Error loading user profile:', error);
            // Fallback to Firebase Auth data for own profile if Firestore fetch fails
            if (isOwnProfile && currentUser) {
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || undefined,
                photoURL: currentUser.photoURL || undefined,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime
                }
              });
            }
          } else if (profile) {
            // Merge Firestore data with Firebase Auth metadata for own profile
            if (isOwnProfile && currentUser) {
              setUserProfile({
                ...profile,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime
                }
              } as UserProfile);
            } else {
              setUserProfile(profile as UserProfile);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to Firebase Auth data for own profile if there's an error
        if (isOwnProfile && currentUser) {
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || undefined,
            photoURL: currentUser.photoURL || undefined,
            metadata: {
              creationTime: currentUser.metadata.creationTime,
              lastSignInTime: currentUser.metadata.lastSignInTime
            }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, currentUser, isOwnProfile, targetUserId]);

  const tabs: { id: TabType; label: string; icon?: React.ReactNode; onHover?: () => void }[] = [
    { id: 'about', label: 'About', icon: <User className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'gamification', label: 'Progress', icon: <Trophy className="w-4 h-4" />, onHover: () => {
      // Prefetch gamification bundle on hover for faster tab switch
      import('../components/gamification');
    } },
    { id: 'collaborations', label: 'Collaborations' },
    { id: 'trades', label: 'Trades' }
  ];

  // Define lazy components after component mount to avoid SSR issues
  const GamificationDashboardLazy = ReactLazy(() => import('../components/gamification').then(m => ({ default: m.GamificationDashboard })));
  const NotificationPreferencesLazy = ReactLazy(() => import('../components/gamification').then(m => ({ default: m.NotificationPreferences })));

  if (loading) {
    return (
      <Box className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="bg-muted h-48 rounded mb-6" />
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-6 w-56 bg-muted rounded mb-2" />
                <div className="h-4 w-72 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">User Not Found</h1>
        <p className="text-muted-foreground">The requested user profile could not be found.</p>
      </Box>
    );
  }

  return (
    <Box className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Banner */}
      <ProfileBanner height="md" />

      {/* Profile Header */}
      <Box className="relative -mt-10 bg-card text-card-foreground rounded-lg shadow-sm border border-border mb-6">
        <Box className="p-6">
          <Cluster gap="md" align="center">
            <Box className="relative -mt-12 w-24 h-24 rounded-full ring-4 ring-background shadow-md overflow-hidden bg-background">
              {userProfile.photoURL || userProfile.profilePicture ? (
                <ProfileImage
                  photoURL={userProfile.photoURL}
                  profilePicture={userProfile.profilePicture}
                  displayName={userProfile.displayName}
                  size="xl"
                  className="h-24 w-24"
                />
              ) : (
                <Box className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </Box>
              )}
            </Box>
            <Stack gap="xs" className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-card-foreground truncate">
                {userProfile.displayName || 'Anonymous User'}
              </h1>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{userProfile.email}</span>
              </p>
              {userProfile.bio && (
                <p className="text-muted-foreground mt-2 line-clamp-3">{userProfile.bio}</p>
              )}
            </Stack>
          </Cluster>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Box className="bg-card text-card-foreground rounded-lg shadow-sm border border-border">
        <Box className="border-b border-border">
          <Cluster gap="lg" className="-mb-px px-6" align="center" role="tablist" aria-label="Profile sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={tab.id}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onMouseEnter={() => tab.onHover?.()}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </Cluster>
        </Box>

        {/* Tab Content */}
        <Box className="p-6">
          {activeTab === 'about' && (
            <Box id="panel-about" role="tabpanel" aria-labelledby="about">
              <Stack gap="lg">
                <Grid columns={{ base: 1, md: 2 }} gap="lg">
                <Box>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  <p className="px-3 py-2 bg-muted rounded text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile.email}</span>
                  </p>
                </Box>
                <Box>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">User ID</label>
                  <p className="px-3 py-2 bg-muted rounded text-foreground font-mono text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span className="truncate">{userProfile.uid}</span>
                  </p>
                </Box>
                {userProfile.metadata?.creationTime && (
                  <Box>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Account Created</label>
                    <p className="px-3 py-2 bg-muted rounded text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(userProfile.metadata.creationTime).toLocaleDateString()}</span>
                    </p>
                  </Box>
                )}
                {userProfile.metadata?.lastSignInTime && (
                  <Box>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Last Sign In</label>
                    <p className="px-3 py-2 bg-muted rounded text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(userProfile.metadata.lastSignInTime).toLocaleDateString()}</span>
                    </p>
                  </Box>
                )}
                </Grid>
              </Stack>
            </Box>
          )}

          {activeTab === 'portfolio' && targetUserId && (
            <Box id="panel-portfolio" role="tabpanel" aria-labelledby="portfolio">
              <PortfolioTab userId={targetUserId} isOwnProfile={isOwnProfile} />
            </Box>
          )}

          {activeTab === 'gamification' && targetUserId && (
            <Box id="panel-gamification" role="tabpanel" aria-labelledby="gamification">
              <React.Suspense fallback={<div className="text-muted-foreground">Loading progress...</div>}>
                <Stack gap="xl">
                  <GamificationDashboardLazy userId={targetUserId} />
                  {isOwnProfile && (
                    <Box className="border-t border-border pt-8">
                      <Cluster gap="sm" align="center" className="mb-6">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground">Notification Settings</h3>
                      </Cluster>
                      <NotificationPreferencesLazy />
                    </Box>
                  )}
                </Stack>
              </React.Suspense>
            </Box>
          )}

          {activeTab === 'collaborations' && (
            <Box id="panel-collaborations" role="tabpanel" aria-labelledby="collaborations" className="text-center py-12">
              <p className="text-muted-foreground">Collaborations feature coming soon</p>
            </Box>
          )}

          {activeTab === 'trades' && (
            <Box id="panel-trades" role="tabpanel" aria-labelledby="trades" className="text-center py-12">
              <p className="text-muted-foreground">Trades feature coming soon</p>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
