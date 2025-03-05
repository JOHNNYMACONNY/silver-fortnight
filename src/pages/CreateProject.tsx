import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks';
import { X, Plus } from 'lucide-react';
import type { Collaboration } from '../types';

interface ProjectRole {
  title: string;
  skills: string[];
}

export function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useFirestore<Collaboration>('collaborations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roles: [] as ProjectRole[],
    currentRole: {
      title: '',
      skill: '',
      skills: [] as string[]
    }
  });

  const handleAddSkill = () => {
    const { skill } = formData.currentRole;
    if (!skill.trim()) return;

    if (!formData.currentRole.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        currentRole: {
          ...prev.currentRole,
          skills: [...prev.currentRole.skills, skill.trim()],
          skill: ''
        }
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      currentRole: {
        ...prev.currentRole,
        skills: prev.currentRole.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const handleAddRole = () => {
    const { title, skills } = formData.currentRole;
    if (!title.trim() || skills.length === 0) return;

    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, { title: title.trim(), skills }],
      currentRole: {
        title: '',
        skill: '',
        skills: []
      }
    }));
  };

  const handleRemoveRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.roles.length === 0) {
      setError('Please add at least one role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await add({
        title: formData.title,
        description: formData.description,
        roles: formData.roles.map(role => ({
          ...role,
          filled: false
        })),
        creatorId: user.uid,
        status: 'recruiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      navigate('/projects');
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-earth-800 border border-earth-700 rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold text-text-primary mb-6">Create a New Project</h1>

          {error && (
            <div className="mb-4 p-3 bg-accent-rust/20 text-accent-rust rounded-lg border border-accent-rust/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                Project Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 bg-earth-50 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted
                          focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
                placeholder="Enter project title"
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
                className="w-full p-2 bg-earth-50 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted
                          focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
                rows={4}
                placeholder="Describe your project in detail..."
                required
              />
            </div>

            {/* Current Role */}
            <div className="mb-6 p-4 bg-earth-700/20 border border-earth-700 rounded-lg">
              <h3 className="text-lg font-display font-medium text-text-primary mb-4">Add Role</h3>
              
              {/* Role Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={formData.currentRole.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currentRole: { ...prev.currentRole, title: e.target.value }
                  }))}
                  className="w-full p-2 bg-earth-50 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted
                            focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
                  placeholder="e.g., Frontend Developer"
                />
              </div>

              {/* Role Skills */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.currentRole.skill}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      currentRole: { ...prev.currentRole, skill: e.target.value }
                    }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 p-2 bg-earth-50 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted
                              focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
                    placeholder="Add required skills..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-moss text-earth-50 rounded-lg
                              hover:bg-accent-moss/90 transition-colors duration-300"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.currentRole.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-accent-sage/20 text-text-primary rounded-full text-sm flex items-center
                                border border-accent-sage/30"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-accent-sage hover:text-accent-moss transition-colors duration-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add Role Button */}
              <button
                type="button"
                onClick={handleAddRole}
                disabled={!formData.currentRole.title || formData.currentRole.skills.length === 0}
                className="w-full bg-accent-moss text-earth-50 py-2 rounded-lg hover:bg-accent-moss/90 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                Add Role to Project
              </button>
            </div>

            {/* Added Roles */}
            {formData.roles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-display font-medium text-text-primary mb-4">Project Roles</h3>
                <div className="space-y-3">
                  {formData.roles.map((role, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-earth-700/20 
                                              border border-earth-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-text-primary">{role.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {role.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-accent-sage/20 text-text-primary rounded-full text-xs
                                        border border-accent-sage/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(index)}
                        className="text-accent-rust hover:text-accent-rust/80 transition-colors duration-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-moss text-earth-50 py-3 rounded-lg hover:bg-accent-moss/90 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
