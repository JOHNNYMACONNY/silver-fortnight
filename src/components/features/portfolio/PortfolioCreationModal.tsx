import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Trash2, User, Calendar, Award, Tag } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../contexts/ToastContext';
import { addDoc, collection } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../../firebase-config';
import { PortfolioItem } from '../../../types/portfolio';

interface PortfolioCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const CATEGORY_OPTIONS = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Data Science',
  'Marketing',
  'Writing',
  'Business',
  'Education',
  'Other'
];

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'C#',
  'HTML', 'CSS', 'Vue.js', 'Angular', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'Figma', 'Adobe Creative Suite', 'Photoshop',
  'Illustrator', 'Sketch', 'Framer', 'Webflow', 'WordPress', 'Shopify', 'Salesforce',
  'Marketing', 'SEO', 'Content Writing', 'Social Media', 'Project Management', 'Agile',
  'Scrum', 'Leadership', 'Communication', 'Public Speaking', 'Teaching', 'Mentoring'
];

export const PortfolioCreationModal: React.FC<PortfolioCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    skills: [] as string[],
    collaborators: [] as Array<{ id: string; name: string; role: string; photoURL?: string }>,
    evidence: [] as Array<{ id: string; type: string; url: string; title: string }>,
    rating: 0
  });
  const [newSkill, setNewSkill] = useState('');
  const [newCollaborator, setNewCollaborator] = useState({ name: '', role: '' });
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      handleInputChange('skills', [...formData.skills, newSkill.trim()]);
      setNewSkill('');
      setShowSkillSuggestions(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    handleInputChange('skills', formData.skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddCollaborator = () => {
    if (newCollaborator.name.trim() && newCollaborator.role.trim()) {
      const collaborator = {
        id: `collaborator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newCollaborator.name.trim(),
        role: newCollaborator.role.trim()
      };
      handleInputChange('collaborators', [...formData.collaborators, collaborator]);
      setNewCollaborator({ name: '', role: '' });
    }
  };

  const handleRemoveCollaborator = (index: number) => {
    handleInputChange('collaborators', formData.collaborators.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // For now, we'll just add placeholder evidence
    // In a real implementation, you'd upload to Cloudinary or similar
    const newEvidence = Array.from(files).map(file => ({
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      url: URL.createObjectURL(file), // Temporary URL for preview
      title: file.name
    }));

    handleInputChange('evidence', [...formData.evidence, ...newEvidence]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const db = getSyncFirebaseDb();
      const portfolioRef = collection(db, 'users', userId, 'portfolio');
      
      const portfolioItem: Omit<PortfolioItem, 'id'> = {
        userId,
        sourceId: `manual-${Date.now()}`,
        sourceType: 'manual',
        title: formData.title.trim(),
        description: formData.description.trim(),
        skills: formData.skills,
        completedAt: new Date(),
        visible: true,
        featured: false,
        pinned: false,
        evidence: formData.evidence,
        collaborators: formData.collaborators,
        category: formData.category,
        rating: formData.rating > 0 ? formData.rating : undefined
      };

      await addDoc(portfolioRef, portfolioItem);
      
      showToast('Portfolio item created successfully!', 'success');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Other',
        skills: [],
        collaborators: [],
        evidence: [],
        rating: 0
      });
    } catch (error) {
      console.error('Error creating portfolio item:', error);
      showToast('Failed to create portfolio item. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(skill =>
    skill.toLowerCase().includes(newSkill.toLowerCase()) &&
    !formData.skills.includes(skill)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Add New Project</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter project title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your project, what you built, and what you learned"
                  rows={4}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  {CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Self Rating (1-5 stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange('rating', star)}
                      className={`text-2xl transition-colors ${
                        star <= formData.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {formData.rating > 0 ? `${formData.rating}/5` : 'No rating'}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Skills Used
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newSkill}
                        onChange={(e) => {
                          setNewSkill(e.target.value);
                          setShowSkillSuggestions(true);
                        }}
                        onFocus={() => setShowSkillSuggestions(true)}
                        placeholder="Add a skill"
                      />
                      {showSkillSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                          {filteredSuggestions.slice(0, 8).map(skill => (
                            <button
                              key={skill}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                              onClick={() => {
                                setNewSkill(skill);
                                setShowSkillSuggestions(false);
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddSkill}
                      disabled={!newSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Collaborators */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Collaborators
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newCollaborator.name}
                      onChange={(e) => setNewCollaborator(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Collaborator name"
                      className="flex-1"
                    />
                    <Input
                      value={newCollaborator.role}
                      onChange={(e) => setNewCollaborator(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="Role"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCollaborator}
                      disabled={!newCollaborator.name.trim() || !newCollaborator.role.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.collaborators.length > 0 && (
                    <div className="space-y-2">
                      {formData.collaborators.map((collaborator, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{collaborator.name}</span>
                            <span className="text-xs text-muted-foreground">({collaborator.role})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCollaborator(index)}
                            className="h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Evidence (Screenshots, Documents, etc.)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload files to showcase your work
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('evidence-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                {formData.evidence.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.evidence.map((evidence, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{evidence.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {evidence.type}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInputChange('evidence', formData.evidence.filter((_, i) => i !== index))}
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.description.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
