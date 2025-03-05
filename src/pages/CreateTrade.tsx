import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { X, Plus, Search } from 'lucide-react';
import type { Trade } from '../types';
import { UserSearchModal } from '../components/UserSearchModal';

export function CreateTrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useFirestore<Trade>('trades');
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
  });

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
    if (!user) return;

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
      await add({
        title: formData.title,
        description: formData.description,
        offeredSkills: formData.offeredSkills,
        requestedSkills: formData.requestedSkills,
        creatorId: user.uid,
        status: formData.preferredUserId ? 'reserved' : 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredUserId: formData.preferredUserId || undefined,
        publiclyAvailable: formData.publiclyAvailable,
      });
      navigate('/discover');
    } catch (err) {
      setError('Failed to create trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-earth-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary font-display mb-6">Create a New Trade</h1>

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

            {/* Skills Offered */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Skills You're Offering
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.offeredSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, offeredSkill: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('offered'))}
                  className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                  placeholder="Add a skill you're offering..."
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
                Skills You're Looking For
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.requestedSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedSkill: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('requested'))}
                  className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                  placeholder="Add a skill you're looking for..."
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

            {/* Preferred User */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Invite Specific User (Optional)
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.preferredUserName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferredUserName: e.target.value,
                      preferredUserId: '', // Reset ID when name changes
                    }))}
                    className="flex-1 p-2 border border-earth-700 rounded-lg focus:ring-2 focus:ring-accent-sage focus:border-accent-sage bg-earth-50 text-text-primary"
                    placeholder="Search user by name..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserSearch(true)}
                    className="px-4 py-2 bg-earth-700 text-text-secondary rounded-lg hover:bg-earth-600 flex items-center gap-2 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    Search Users
                  </button>
                </div>
                {formData.preferredUserId && (
                  <div className="flex items-center justify-between p-2 bg-earth-700 rounded-lg">
                    <span className="text-sm text-text-light">{formData.preferredUserName}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferredUserId: '',
                        preferredUserName: ''
                      }))}
                      className="text-accent-rust hover:text-accent-clay transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Public Availability Toggle */}
              {formData.preferredUserId && (
                <div className="mt-4">
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
                      Keep trade visible to other users
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-text-muted">
                    Other users can request to join if the invited user declines
                  </p>
                </div>
              )}
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-sage text-earth-50 py-2 rounded-lg hover:bg-accent-moss transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Trade...' : 'Create Trade'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
