import React, { useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { X, AtSign } from 'lucide-react';
import type { UserProfile } from '../types/user';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: { id: string; displayName: string }) => void;
  excludeUserId?: string;
}

export function UserSearchModal({ isOpen, onClose, onSelectUser, excludeUserId }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<UserProfile & { id: string }>>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    try {
      const db = await getDb();
      const usersRef = collection(db, 'users');
      const searchTrimmed = searchQuery.trim();
      const searchLower = searchTrimmed.toLowerCase();

      let users: Array<UserProfile & { id: string }> = [];

      // Try first with displayNameLower
      try {
        const q = query(
          usersRef,
          orderBy('displayNameLower'),
          startAt(searchLower),
          endAt(searchLower + '\uf8ff'),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        console.log('Query results:', querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          searchMatch: 'displayNameLower' 
        })));

        users = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }))
          .filter(user => user.id !== excludeUserId);
      } catch (err) {
        console.warn('Error searching by displayNameLower:', err);
        // If first query fails, fallback to displayName
        const q = query(
          usersRef,
          orderBy('displayName'),
          startAt(searchTrimmed),
          endAt(searchTrimmed + '\uf8ff'),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        users = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }))
          .filter(user => user.id !== excludeUserId);
      }

      // Add email matches
      if (users.length < 20) {
        const emailQuery = query(
          usersRef,
          orderBy('email'),
          startAt(searchLower),
          endAt(searchLower + '\uf8ff'),
          limit(20)
        );

        const emailResults = await getDocs(emailQuery);
        const emailUsers = emailResults.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }))
          .filter(user => 
            user.id !== excludeUserId && 
            !users.some(existing => existing.id === user.id)
          );

        users = [...users, ...emailUsers];
      }

      // Filter and sort all results
      const finalUsers = users.filter(user => {
        const displayNameMatch = user.displayName?.toLowerCase().includes(searchLower) ?? false;
        const emailMatch = user.email?.toLowerCase().includes(searchLower) ?? false;
        const usernameMatch = user.username?.toLowerCase().includes(searchLower) ?? false;
        
        return displayNameMatch || emailMatch || usernameMatch;
      });

      // Sort by relevance
      finalUsers.sort((a, b) => {
        const aName = a.displayName?.toLowerCase() ?? '';
        const bName = b.displayName?.toLowerCase() ?? '';
        
        // Exact matches first
        if (aName === searchLower) return -1;
        if (bName === searchLower) return 1;
        
        // Starts with matches next
        if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
        if (!aName.startsWith(searchLower) && bName.startsWith(searchLower)) return 1;
        
        // Contains matches next
        const aContains = aName.includes(searchLower);
        const bContains = bName.includes(searchLower);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        return aName.localeCompare(bName);
      });

      setResults(finalUsers.slice(0, 10));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to search users: ${errMsg}`);
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-earth-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-earth-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Search Users</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or @username..."
                className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-earth-900"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-accent-moss text-earth-50 rounded-lg hover:bg-accent-sage disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-earth-50 text-accent-rust rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser({ id: user.id, displayName: user.displayName ?? 'Unknown User' })}
                className="w-full text-left p-3 hover:bg-earth-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-earth-700 flex items-center justify-center">
                      <span className="text-text-muted text-lg">
                        {(user.displayName?.[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div>
                      <div className="font-medium text-text-primary">{user.displayName ?? 'Unknown User'}</div>
                      <div className="text-sm text-text-muted flex items-center space-x-2">
                        <span className="flex items-center">
                          <AtSign className="h-3 w-3 mr-1" />{user.username ?? 'no-username'}
                        </span>
                        <span>•</span>
                        <span className="truncate">{user.email ?? 'no-email'}</span>
                      </div>
                      {user.bio && (
                        <div className="text-sm text-text-muted truncate mt-1">{user.bio}</div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {results.length === 0 && searchQuery && !loading && (
              <div className="text-center py-4 text-text-muted">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
