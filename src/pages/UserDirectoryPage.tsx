import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { getAllUsers, getRelatedUserIds, getUsersByIds, getUserProfile, User } from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, AlertCircle } from '../utils/icons';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import UserCardSkeleton from '../components/ui/UserCardSkeleton';
import UserCard from '../components/features/users/UserCard';
import { Button } from '../components/ui/Button';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import ProfilePage from '../pages/ProfilePage';
// HomePage patterns imports
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { classPatterns, animations } from '../utils/designSystem';
import { semanticClasses } from '../utils/semanticColors';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';
import { motion } from 'framer-motion';

export const UserDirectoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // EnhancedSearchBar state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Relation filter via query params (?relation=followers|following&user=ID)
  const [relationFilter, setRelationFilter] = useState<'followers' | 'following' | null>(null);
  const [relationUserId, setRelationUserId] = useState<string | null>(null);
  const [relationUserName, setRelationUserName] = useState<string | null>(null);

  // Unique skills and locations for filters
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Parse skills into array of skill objects
  const parseSkills = useCallback((skills?: string | string[] | any): { name: string; level?: string }[] => {
    if (!skills) return [];

    try {
      // If skills is already an array of objects
      if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'object') {
        return skills.map(skill => ({
          name: skill.name || skill.toString(),
          level: skill.level
        }));
      }

      // If skills is an array of strings
      if (Array.isArray(skills)) {
        return skills.map(skill => {
          if (typeof skill === 'string') {
            const parts = skill.split(':');
            return {
              name: parts[0].trim(),
              level: parts.length > 1 ? parts[1].trim() : undefined
            };
          }
          return { name: String(skill), level: undefined };
        });
      }

      // If skills is a string
      if (typeof skills === 'string') {
        return skills.split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== '')
          .map(skill => {
            const parts = skill.split(':');
            return {
              name: parts[0].trim(),
              level: parts.length > 1 ? parts[1].trim() : undefined
            };
          });
      }

      // If we get here, skills is some other type
      console.warn('Unexpected skills type:', typeof skills, skills);
      return [];
    } catch (error) {
      console.error('Error parsing skills:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    // Parse relation filter from query params
    try {
      const params = new URLSearchParams(window.location.search);
      const relation = params.get('relation');
      const user = params.get('user');
      if ((relation === 'followers' || relation === 'following') && user) {
        setRelationFilter(relation);
        setRelationUserId(user);
      } else {
        setRelationFilter(null);
        setRelationUserId(null);
      }
    } catch (e) {
      console.error('Error processing URL parameters:', e);
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        // If relation filter present, fetch via follows relations first
        if (relationFilter && relationUserId) {
          // Fetch the relation user's display name
          const { data: relationUser } = await getUserProfile(relationUserId);
          if (relationUser) {
            setRelationUserName(relationUser.displayName || relationUser.email || 'Unknown User');
          }
          
          const rel = await getRelatedUserIds(relationUserId, relationFilter, { limit: 100 });
          if (rel.error) {
            setError(rel.error.message);
            setUsers([]);
            setFilteredUsers([]);
            return;
          }
          const { data: relatedUsers, error: relatedErr } = await getUsersByIds(rel.data?.ids || []);
          if (relatedErr) {
            setError(relatedErr.message);
            setUsers([]);
            setFilteredUsers([]);
            return;
          }
          const uniqueUsers = (relatedUsers || []).filter((user, index, self) => index === self.findIndex(u => u.id === user.id));
          setUsers(uniqueUsers);
          setFilteredUsers(uniqueUsers);
        } else {
          const { data: usersList, error: usersError } = await getAllUsers();

          if (usersError) {
            console.error('[UserDirectoryPage] Error from getAllUsers:', usersError);
            setError(usersError.message);
            return;
          }

        console.log('[UserDirectoryPage] getAllUsers result:', { usersList, hasItems: !!usersList?.items });

        if (usersList?.items) {
          console.log('[UserDirectoryPage] Raw usersList from getAllUsers:', JSON.stringify(usersList.items.map(u => ({ id: u.id, uid: u.uid, displayName: u.displayName }))));

          // Filter out anonymous users and current user
          const filteredList = usersList.items.filter(user => {
            // Create a display name using the same logic as userUtils
            const effectiveDisplayName = user.displayName || user.email || `User ${user.id.substring(0, 5)}`;
            const hasValidDisplayName = effectiveDisplayName &&
              effectiveDisplayName.toLowerCase() !== 'anonymous' &&
              effectiveDisplayName !== 'Unknown User';
            const isNotCurrentUser = !currentUser || user.id !== currentUser.uid;

            return hasValidDisplayName && isNotCurrentUser;
          });

          console.log('[UserDirectoryPage] Filtered list (before dedupe):', JSON.stringify(filteredList.map(u => ({ id: u.id, uid: u.uid, displayName: u.displayName }))));

          // Deduplicate users by ID to prevent duplicate keys
          const uniqueUsers = filteredList.filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
          );

          console.log('[UserDirectoryPage] Unique users (after dedupe):', JSON.stringify(uniqueUsers.map(u => ({ id: u.id, uid: u.uid, displayName: u.displayName }))));

          setUsers(uniqueUsers);
          setFilteredUsers(uniqueUsers);

          // Extract unique skills and locations
          const skills = new Set<string>();
          const locations = new Set<string>();

          uniqueUsers.forEach(user => {
            if (user.skills) {
              try {
                const parsedSkills = parseSkills(user.skills);
                parsedSkills.forEach((skill: { name: string; level?: string }) => skills.add(skill.name));
              } catch (error) {
                console.error('Error parsing skills for filters:', error);
              }
            }
            if (user.location) locations.add(user.location);
          });

          setAvailableSkills(Array.from(skills).sort());
          setAvailableLocations(Array.from(locations).sort());
        }
        else {
          console.warn('[UserDirectoryPage] No users data received');
          setUsers([]);
          setFilteredUsers([]);
        }
        
      }
      } catch (error) {
        console.error('[UserDirectoryPage] Error in fetchUsers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, parseSkills, relationFilter, relationUserId]);

  const applyFilters = useCallback(() => {
    let result = [...users];

    // Ensure no anonymous users (backup check) - use same logic as main filter
    result = result.filter(user => {
      const effectiveDisplayName = user.displayName || user.email || `User ${user.id.substring(0, 5)}`;
      return effectiveDisplayName &&
        effectiveDisplayName.toLowerCase() !== 'anonymous' &&
        effectiveDisplayName !== 'Unknown User';
    });

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => {
        const effectiveDisplayName = user.displayName || user.email || `User ${user.id.substring(0, 5)}`;
        return (effectiveDisplayName && effectiveDisplayName.toLowerCase().includes(term)) ||
          (user.bio && user.bio.toLowerCase().includes(term)) ||
          (user.skills && JSON.stringify(user.skills).toLowerCase().includes(term)) ||
          (user.interests && user.interests.toLowerCase().includes(term));
      });
    }

    // Apply skill filter
    if (selectedSkill) {
      result = result.filter(user =>
        user.skills && parseSkills(user.skills).some((skill: { name: string; level?: string }) => skill.name.toLowerCase().includes(selectedSkill.toLowerCase()))
      );
    }

    // Apply location filter
    if (selectedLocation) {
      result = result.filter(user =>
        user.location && user.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Apply relation filter if present (client-side placeholder for now)
    if (relationFilter && relationUserId) {
      // TODO: Enhance to server-side query using follow relationships
      // For now, we keep the full list to avoid misleading filters without data
    }

    setFilteredUsers(result);
  }, [users, searchTerm, selectedSkill, selectedLocation, parseSkills, relationFilter, relationUserId]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (selectedSkill) count++;
    if (selectedLocation) count++;
    if (relationFilter && relationUserId) count++;
    setActiveFiltersCount(count);
  }, [selectedSkill, selectedLocation, relationFilter, relationUserId]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSkill('');
    setSelectedLocation('');
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  console.log('[UserDirectoryPage] currentUsers being mapped:', JSON.stringify(currentUsers.map(u => ({ id: u.id, uid: u.uid, displayName: u.displayName }))));

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <Box className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="UserDirectoryPage" />
      <Stack gap="md">
        {/* Hero Section with HomePage-style gradient background */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground 
            variant="secondary" 
            intensity="medium" 
            className={classPatterns.homepageHeroContent}
          >
            <AnimatedHeading 
              as="h1" 
              animation="kinetic" 
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              User Directory
            </AnimatedHeading>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              {relationFilter && relationUserId
                ? relationFilter === 'followers'
                  ? `Followers of ${relationUserName || relationUserId}`
                  : `Following of ${relationUserName || relationUserId}`
                : 'Find and connect with talented users, discover new skills, and build meaningful connections.'}
            </p>
            <Cluster gap="sm" align="center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Badge variant="default" topic="community" className="text-xs">
                {filteredUsers.length} Users
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>

        {/* Search Section with HomePage-style card */}
        <Card variant="glass" className="rounded-xl p-4 md:p-6 mb-6 ">
          <CardHeader className={classPatterns.homepageCardHeader}>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Find Users
              <Badge variant="secondary" className="text-xs">
                {filteredUsers.length} Users
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className={classPatterns.homepageCardContent}>
            <EnhancedSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
              onToggleFilters={() => setShowFilterPanel(true)}
              hasActiveFilters={activeFiltersCount > 0}
              activeFiltersCount={activeFiltersCount}
              resultsCount={filteredUsers.length}
              isLoading={loading}
              placeholder="Search users by name, skills, or location..."
              topic="community"
            />
          </CardContent>
        </Card>

        {/* Users Section with HomePage-style layout */}
        <AnimatedHeading as="h2" animation="slide" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Discover Users
        </AnimatedHeading>

        {loading && (
          <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="lg">
            {Array.from({ length: usersPerPage }).map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </Grid>
        )}

        {error && (
          <Card variant="glass" className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <Card variant="glass" className="text-center p-12">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">No Users Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find more users.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <>
            <ErrorBoundary>
              <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="lg">
                {currentUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    className="h-full"
                    {...animations.homepageCardEntrance}
                    transition={{
                      ...animations.homepageCardEntrance.transition,
                      delay: index * 0.1
                    }}
                  >
                    <UserCard 
                      user={user} 
                      currentUserId={currentUser?.uid}
                      parseSkills={parseSkills}
                    />
                  </motion.div>
                ))}
              </Grid>
            </ErrorBoundary>

            {totalPages > 1 && (
              <Card variant="glass" className="mt-8">
                <CardContent className="p-4">
                  <Cluster justify="center" gap="md">
                    <Button
                      variant="outline"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Previous
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      Page {currentPage} of {totalPages}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Cluster>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* User Profile Modal */}
        {selectedUser && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={selectedUser.displayName || 'User Profile'}
            size="xl"
          >
            <ProfilePage userId={selectedUser.id} />
          </Modal>
        )}
      </Stack>
    </Box>
  );
};

export default UserDirectoryPage;
