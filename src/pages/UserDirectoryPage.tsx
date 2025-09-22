import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { useAuth } from '../AuthContext';
import { getAllUsers, getRelatedUserIds, getUsersByIds, User } from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { AlertCircle } from '../utils/icons';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import UserCardSkeleton from '../components/ui/UserCardSkeleton';
import UserCard from '../components/features/users/UserCard';
import { Button } from '../components/ui/Button';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { EnhancedFilterPanel } from '../components/features/search/EnhancedFilterPanel';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import ProfilePage from '../pages/ProfilePage';

export const UserDirectoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minReputationScore, setMinReputationScore] = useState<number | null>(null);
  const [hasSkills, setHasSkills] = useState<boolean | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  // Relation filter via query params (?relation=followers|following&user=ID)
  const [relationFilter, setRelationFilter] = useState<'followers' | 'following' | null>(null);
  const [relationUserId, setRelationUserId] = useState<string | null>(null);

  // Unique skills and locations for filters
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Enhanced parseSkills function with better error handling and robustness
  const parseSkills = useCallback((skills?: string | string[] | any): { name: string; level?: string }[] => {
    if (!skills) return [];

    try {
      // Handle null or undefined
      if (skills === null || skills === undefined) return [];

      // If skills is already an array of objects
      if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'object') {
        return skills
          .filter(skill => skill && typeof skill === 'object') // Filter out null/undefined items
          .map(skill => ({
            name: (skill.name || skill.toString() || '').trim(),
            level: skill.level ? String(skill.level).trim() : undefined
          }))
          .filter(skill => skill.name.length > 0); // Filter out empty names
      }

      // If skills is an array of strings
      if (Array.isArray(skills)) {
        return skills
          .filter(skill => skill !== null && skill !== undefined) // Filter out null/undefined
          .map(skill => {
            if (typeof skill === 'string') {
              const trimmedSkill = skill.trim();
              if (!trimmedSkill) return null;
              
              const parts = trimmedSkill.split(':');
              return {
                name: parts[0].trim(),
                level: parts.length > 1 ? parts[1].trim() : undefined
              };
            }
            return { name: String(skill).trim(), level: undefined };
          })
          .filter(skill => skill && skill.name.length > 0); // Filter out null and empty names
      }

      // If skills is a string
      if (typeof skills === 'string') {
        const trimmedSkills = skills.trim();
        if (!trimmedSkills) return [];
        
        return trimmedSkills.split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== '')
          .map(skill => {
            const parts = skill.split(':');
            return {
              name: parts[0].trim(),
              level: parts.length > 1 ? parts[1].trim() : undefined
            };
          })
          .filter(skill => skill.name.length > 0); // Filter out empty names
      }

      // If skills is a number, convert to string
      if (typeof skills === 'number') {
        return [{ name: String(skills).trim(), level: undefined }];
      }

      // If skills is a boolean, convert to string
      if (typeof skills === 'boolean') {
        return [{ name: String(skills).trim(), level: undefined }];
      }

      // If we get here, skills is some other type
      console.warn('Unexpected skills type:', typeof skills, skills);
      return [];
    } catch (error) {
      console.error('Error parsing skills:', error, 'Skills data:', skills);
      return [];
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const debouncedSetSearch = debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, 300);

    debouncedSetSearch(searchTerm);

    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm]);

  useEffect(() => {
    // Parse relation filter and other params from query params
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Parse relation filter
      const relation = params.get('relation');
      const user = params.get('user');
      if ((relation === 'followers' || relation === 'following') && user) {
        setRelationFilter(relation);
        setRelationUserId(user);
      } else {
        setRelationFilter(null);
        setRelationUserId(null);
      }

      // Parse search and filter params
      const q = params.get('q') || '';
      const skill = params.get('skill') || '';
      const location = params.get('location') || '';
      const reputation = params.get('reputation');
      const hasSkillsParam = params.get('hasSkills');
      
      if (q) setSearchTerm(q);
      if (skill) setSelectedSkill(skill);
      if (location) setSelectedLocation(location);
      if (reputation) setMinReputationScore(parseInt(reputation, 10));
      if (hasSkillsParam) setHasSkills(hasSkillsParam === 'true');
    } catch (e) {}

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        // If relation filter present, fetch via follows relations first
        if (relationFilter && relationUserId) {
          const rel = await getRelatedUserIds(relationUserId, relationFilter, { limit: 100 });
          if (rel.error) {
            setError(rel.error.message);
            setUsers([]);
            return;
          }
          const { data: relatedUsers, error: relatedErr } = await getUsersByIds(rel.data?.ids || []);
          if (relatedErr) {
            setError(relatedErr.message);
            setUsers([]);
            return;
          }
          const uniqueUsers = (relatedUsers || []).filter((user, index, self) => index === self.findIndex(u => u.id === user.id));
          setUsers(uniqueUsers);
        } else {
          const { data: usersList, error: usersError } = await getAllUsers();

          if (usersError) {
            console.error('[UserDirectoryPage] Error from getAllUsers:', usersError);
            setError(usersError.message);
            return;
          }


        if (usersList?.items) {

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


          // Deduplicate users by ID to prevent duplicate keys
          const uniqueUsers = filteredList.filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
          );


          setUsers(uniqueUsers);

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
  }, [currentUser, parseSkills]);

  // Memoize parsed skills for each user to avoid re-parsing
  const usersWithParsedSkills = useMemo(() => {
    return users.map(user => ({
      ...user,
      parsedSkills: parseSkills(user.skills)
    }));
  }, [users, parseSkills]);

  // Optimized filtering with useMemo and early returns
  const filteredUsers = useMemo(() => {
    // Early return if no users
    if (usersWithParsedSkills.length === 0) return [];

    let result = [...usersWithParsedSkills];

    // Apply filters in order of selectivity (most selective first)
    
    // 1. Reputation score filter (most selective)
    if (minReputationScore !== null) {
      result = result.filter(user =>
        user.reputationScore !== undefined && user.reputationScore >= minReputationScore
      );
      // Early return if no users left
      if (result.length === 0) return [];
    }

    // 2. Has skills filter (very selective)
    if (hasSkills !== null) {
      result = result.filter(user => {
        if (hasSkills) {
          return user.parsedSkills.length > 0;
        } else {
          return user.parsedSkills.length === 0;
        }
      });
      // Early return if no users left
      if (result.length === 0) return [];
    }

    // 3. Location filter (selective)
    if (selectedLocation) {
      const locationTerm = selectedLocation.toLowerCase();
      result = result.filter(user =>
        user.location && user.location.toLowerCase().includes(locationTerm)
      );
      // Early return if no users left
      if (result.length === 0) return [];
    }

    // 4. Skill filter (moderately selective)
    if (selectedSkill) {
      const skillTerm = selectedSkill.toLowerCase();
      result = result.filter(user =>
        user.parsedSkills.some((skill: { name: string; level?: string }) => 
          skill.name.toLowerCase().includes(skillTerm)
        )
      );
      // Early return if no users left
      if (result.length === 0) return [];
    }

    // 5. Search term filter (least selective, most expensive)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(user => {
        const effectiveDisplayName = user.displayName || user.email || `User ${user.id.substring(0, 5)}`;
        return (effectiveDisplayName && effectiveDisplayName.toLowerCase().includes(term)) ||
          (user.bio && user.bio.toLowerCase().includes(term)) ||
          (user.skills && JSON.stringify(user.skills).toLowerCase().includes(term)) ||
          (user.interests && user.interests.toLowerCase().includes(term));
      });
    }

    // 6. Anonymous user filter (always last)
    result = result.filter(user => {
      const effectiveDisplayName = user.displayName || user.email || `User ${user.id.substring(0, 5)}`;
      return effectiveDisplayName &&
        effectiveDisplayName.toLowerCase() !== 'anonymous' &&
        effectiveDisplayName !== 'Unknown User';
    });

    // Apply relation filter if present (client-side placeholder for now)
    if (relationFilter && relationUserId) {
      // TODO: Enhance to server-side query using follow relationships
      // For now, we keep the full list to avoid misleading filters without data
    }

    return result;
  }, [usersWithParsedSkills, debouncedSearchTerm, selectedSkill, selectedLocation, minReputationScore, hasSkills, relationFilter, relationUserId]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || selectedSkill !== '' || selectedLocation !== '' || minReputationScore !== null || hasSkills !== null;
  }, [searchTerm, selectedSkill, selectedLocation, minReputationScore, hasSkills]);

  // Sync search and filters to URL on change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedSkill) params.set('skill', selectedSkill);
    if (selectedLocation) params.set('location', selectedLocation);
    if (minReputationScore !== null) params.set('reputation', minReputationScore.toString());
    if (hasSkills !== null) params.set('hasSkills', hasSkills.toString());
    
    // Preserve relation filter params if they exist
    if (relationFilter && relationUserId) {
      params.set('relation', relationFilter);
      params.set('user', relationUserId);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, selectedSkill, selectedLocation, minReputationScore, hasSkills, relationFilter, relationUserId]);


  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glassmorphic rounded-xl px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {relationFilter && relationUserId
              ? relationFilter === 'followers'
                ? `Followers of ${relationUserId}`
                : `Following of ${relationUserId}`
              : 'Find and connect with other users'}
          </p>
        </div>

      </div>

      {/* Enhanced Search Section */}
      <div className="mb-8">
        <EnhancedSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={(term) => setSearchTerm(term)}
          onToggleFilters={() => setShowFilterPanel(true)}
          hasActiveFilters={hasActiveFilters}
          resultsCount={filteredUsers.length}
          isLoading={loading}
          placeholder="Search users by name, skills, or interests..."
        />
        
        <EnhancedFilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          filters={{
            skill: selectedSkill,
            location: selectedLocation,
            reputation: minReputationScore,
            hasSkills: hasSkills
          }}
          onFiltersChange={(filters: any) => {
            setSelectedSkill(filters.skill || '');
            setSelectedLocation(filters.location || '');
            setMinReputationScore(filters.reputation || null);
            setHasSkills(filters.hasSkills || null);
          }}
          onClearFilters={() => {
            setSelectedSkill('');
            setSelectedLocation('');
            setMinReputationScore(null);
            setHasSkills(null);
          }}
          availableSkills={availableSkills}
          persistenceKey="user-directory-filters"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: usersPerPage }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-md">
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
        </div>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">No Users Found</h2>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <>
          <ErrorBoundary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  currentUserId={currentUser?.uid}
                  parseSkills={parseSkills}
                />
              ))}
            </div>
          </ErrorBoundary>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </>
      )}
      
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

    </div>
  );
};

export default UserDirectoryPage;
