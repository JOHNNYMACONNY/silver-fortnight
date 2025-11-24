import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { createPortfolioItem } from '../../../services/portfolio';
import { useAuth } from '../../../AuthContext';

interface PortfolioItemAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PortfolioItemAddModal: React.FC<PortfolioItemAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    skills?: string;
    general?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTitle('');
      setDescription('');
      setSkills('');
      setRole('');
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    // Skills validation (optional, but if provided, must be valid)
    if (skills.trim()) {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (skillsArray.length === 0) {
        newErrors.skills = 'Please enter at least one skill';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.uid || !validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Convert comma-separated skills to array
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await createPortfolioItem(currentUser.uid, {
        title: title.trim(),
        description: description.trim(),
        skills: skillsArray,
        role: role.trim() || undefined
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrors({ general: result.error || 'Failed to create portfolio item' });
      }
    } catch (error) {
      console.error('Error creating portfolio item:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal close (reset form if cancelled)
  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Portfolio Item"
      size="lg"
      closeOnClickOutside={!isSaving}
      closeOnEsc={!isSaving}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{errors.general}</p>
          </div>
        )}

        {/* Title Field */}
        <div>
          <label htmlFor="add-title" className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="add-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter portfolio item title"
            disabled={isSaving}
            className={errors.title ? 'border-destructive' : ''}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-destructive">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="add-description" className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="add-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your portfolio item..."
            rows={4}
            disabled={isSaving}
            className={errors.description ? 'border-destructive' : ''}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {description.length} characters (minimum 10)
          </p>
          {errors.description && (
            <p id="description-error" className="mt-1 text-sm text-destructive">
              {errors.description}
            </p>
          )}
        </div>

        {/* Skills Field */}
        <div>
          <label htmlFor="add-skills" className="block text-sm font-medium text-foreground mb-2">
            Skills
          </label>
          <Input
            id="add-skills"
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Node.js (comma-separated)"
            disabled={isSaving}
            className={errors.skills ? 'border-destructive' : ''}
            aria-invalid={!!errors.skills}
            aria-describedby={errors.skills ? 'skills-error' : undefined}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate multiple skills with commas
          </p>
          {errors.skills && (
            <p id="skills-error" className="mt-1 text-sm text-destructive">
              {errors.skills}
            </p>
          )}
        </div>

        {/* Role Field (Optional) */}
        <div>
          <label htmlFor="add-role" className="block text-sm font-medium text-foreground mb-2">
            Role (Optional)
          </label>
          <Input
            id="add-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Frontend Developer, Designer"
            disabled={isSaving}
          />
        </div>

        {/* Form Actions - Submit button inside form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 border-t border-border/30">
          <Button
            type="submit"
            variant="default"
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Creating...' : 'Create Portfolio Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

