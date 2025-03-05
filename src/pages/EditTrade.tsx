import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { X, Plus, Search } from 'lucide-react';
import type { Trade } from '../types';
import { UserSearchModal } from '../components/UserSearchModal';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export function EditTrade() {
  // Avoid logging in the component body to prevent logs on re-renders
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, adminModeEnabled } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offeredSkill: '',
    requestedSkill: '',
    offeredSkills: [] as string[],
    requestedSkills: [] as string[],
    preferredUserId: '',
    preferredUserName: '',
    publiclyAvailable: true,
    status: 'open' as Trade['status']
  });

  // Fetch trade data and check permissions
  useEffect(() => {
    async function fetchTradeAndCheckPermissions() {
      if (!id || !user) {
        console.log('Edit Trade: Missing id or user', { id, userId: user?.uid, pathname: window.location.pathname });
        return;
      }
      
      try {
        const db = await getDb();
        const tradeDoc = await getDoc(doc(db, 'trades', id));
        if (!tradeDoc.exists()) {
          console.log('Edit Trade: Trade not found', { id });
          console.log('Edit Trade: Trade not found, delaying navigation');
          setError('Trade not found');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const tradeData = tradeDoc.data() as Trade;
        
        // Check if user has permission to edit
        const isCreator = tradeData.creatorId === user.uid;
        const hasPermission = isCreator || (isAdmin && adminModeEnabled);
        
        console.log('Edit Trade: Permission check', {
          isCreator,
          isAdmin,
          adminModeEnabled,
          hasPermission,
          userId: user.uid,
          creatorId: tradeData.creatorId
        });

        if (!hasPermission) {
          console.log('Edit Trade: Permission denied');
          console.log('Edit Trade: Permission denied, delaying navigation');
          setError('You do not have permission to edit this trade');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Avoid using formData directly in setState to prevent stale closure issues
        setFormData(prev => ({
          ...prev,
          title: tradeData.title,
          description: tradeData.description,
          offeredSkills: tradeData.offeredSkills,
          requestedSkills: tradeData.requestedSkills,
          preferredUserId: tradeData.preferredUserId || '',
          publiclyAvailable: tradeData.publiclyAvailable ?? true,
          status: tradeData.status
        }));
      } catch (err) {
        setError('Failed to load trade');
        console.log('Edit Trade: Error occurred, delaying navigation');
        setError('Failed to load trade');
        setTimeout(() => navigate('/'), 2000);
      }
    }
    fetchTradeAndCheckPermissions();
  }, [id, user, isAdmin, adminModeEnabled, navigate]);

  const handleAddSkill = (type: 'offered' | 'requested') => {
    const skill = type === 'offered' ? formData.offeredSkill : formData.requestedSkill;
    if (!skill.trim()) return;

    const skillsArray = type === 'offered' ? 'offeredSkills' : 'requestedSkills';
    const skillField = type === 'offered' ? 'offeredSkill' : 'requestedSkill';

    if (!formData[skillsArray].includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        [skillsArray]: [...prev[skillsArray], skill.trim()],
        [skillField]: ''
      }));
    }
  };

  const handleRemoveSkill = (type: 'offered' | 'requested', skillToRemove: string) => {
    const skillsArray = type === 'offered' ? 'offeredSkills' : 'requestedSkills';
    setFormData(prev => ({
      ...prev,
      [skillsArray]: prev[skillsArray].filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Edit Trade: Submitting form', { id, userId: user?.uid });
    if (!user || !id) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.offeredSkills.length === 0 || formData.requestedSkills.length === 0) {
      setError('Please add at least one skill in each category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First verify permissions again before update
      const db = await getDb();
      const tradeDoc = await getDoc(doc(db, 'trades', id));
      if (!tradeDoc.exists()) {
        throw new Error('Trade no longer exists');
      }

      const tradeData = tradeDoc.data();
      const isCreator = tradeData.creatorId === user.uid;
      const hasPermission = isCreator || (isAdmin && adminModeEnabled);

      if (!hasPermission) {
        throw new Error('You do not have permission to update this trade');
      }

      // Proceed with update if permissions check passes
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        offeredSkills: formData.offeredSkills,
        requestedSkills: formData.requestedSkills,
        status: formData.status,
        preferredUserId: formData.preferredUserId || null,
        publiclyAvailable: formData.publiclyAvailable,
        updatedAt: serverTimestamp()
      };

      console.log('Edit Trade: Starting database update...', {
        id,
        data: updateData
      });
      
      const docRef = doc(db, 'trades', id);  // Use the db instance from above
      await updateDoc(docRef, updateData);
      
      console.log('Edit Trade: Update successful');
      setError('');
      
      // Add a small delay before navigation with cleanup
      const navigationTimer = setTimeout(() => {
        navigate(`/trades/${id}`);
      }, 500);

      return () => clearTimeout(navigationTimer);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Edit Trade: Update failed', { error: err, message: errorMessage });
      setError(`Failed to update trade: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-earth-800 rounded-lg shadow-md overflow-hidden relative">
        <div className="p-6 relative">
          <h1 className="text-2xl font-bold text-text-primary font-display mb-6">Edit Trade</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-accent-rust rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                placeholder="What are you looking to trade?"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                rows={4}
                placeholder="Describe your trade offer in detail..."
                required
              />
            </div>

            {/* Status */}
            <div className="mb-6 relative z-10">
              <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  status: e.target.value as Trade['status']
                }))}
                className="w-full p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary relative z-10"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Skills Offered */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Skills Offered
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.offeredSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, offeredSkill: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('offered'))}
                  className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                  placeholder="Add a skill offered..."
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill('offered')}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-sage text-earth-50 rounded-lg hover:bg-accent-moss transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.offeredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-accent-sage bg-opacity-20 text-accent-moss rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill('offered', skill)}
                      className="ml-2 text-accent-moss hover:text-accent-sage transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills Requested */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Skills Requested
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.requestedSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedSkill: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('requested'))}
                  className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                  placeholder="Add a skill requested..."
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill('requested')}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-sage text-earth-50 rounded-lg hover:bg-accent-moss transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requestedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-accent-clay bg-opacity-20 text-accent-rust rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill('requested', skill)}
                      className="ml-2 text-accent-rust hover:text-accent-clay transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Public Availability Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.publiclyAvailable}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    publiclyAvailable: e.target.checked
                  }))}
                  className="h-4 w-4 text-accent-sage focus:ring-accent-sage border-earth-700 rounded"
                />
                <span className="text-sm text-text-secondary">
                  Trade is visible to all users
                </span>
              </label>
            </div>

            {/* User Search Modal */}
            <UserSearchModal
              isOpen={showUserSearch}
              onClose={() => setShowUserSearch(false)}
              onSelectUser={(user) => {
                setFormData(prev => ({
                  ...prev,
                  preferredUserId: user.id,
                  preferredUserName: user.displayName
                }));
                setShowUserSearch(false);
              }}
              excludeUserId={user?.uid}
            />

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/discover')}
                className="flex-1 bg-earth-700 text-text-secondary py-2 rounded-lg hover:bg-earth-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent-sage text-earth-50 py-2 rounded-lg hover:bg-accent-moss transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
