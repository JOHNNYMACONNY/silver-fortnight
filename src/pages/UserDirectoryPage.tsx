import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { getAllUsers, User } from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, AlertCircle } from '../utils/icons';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import UserCardSkeleton from '../components/ui/UserCardSkeleton';
import UserCard from '../components/features/users/UserCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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

  // Filters
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: usersList, error: usersError } = await getAllUsers();

        if (usersError) {
          console.error('[UserDirectoryPage] Error from getAllUsers:', usersError);
          setError(usersError.message);
          setLoading(false);
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
        } else {
          console.warn('[UserDirectoryPage] No users data received');
          setUsers([]);
          setFilteredUsers([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('[UserDirectoryPage] Error in fetchUsers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, parseSkills]);

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

    setFilteredUsers(result);
  }, [users, searchTerm, selectedSkill, selectedLocation, parseSkills]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find and connect with other users
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 rounded-lg shadow-sm border mb-6 transition">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  placeholder="Search by name, skills, or interests..."
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="skill-filter" className="block text-sm font-medium text-foreground mb-1">Filter by Skill</label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger id="skill-filter">
                  <SelectValue placeholder="All Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Skills</SelectItem>
                  {availableSkills.map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="location-filter" className="block text-sm font-medium text-foreground mb-1">Filter by Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="location-filter">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {availableLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={resetFilters} className="text-sm">
              Reset Filters
            </Button>
          </div>
        </div>
      )}

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
