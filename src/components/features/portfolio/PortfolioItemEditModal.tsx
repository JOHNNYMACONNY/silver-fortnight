import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { PortfolioItem } from '../../../types/portfolio';
import { updatePortfolioItem } from '../../../services/portfolio';

interface PortfolioItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PortfolioItem | null;
  onSuccess?: () => void;
}

export const PortfolioItemEditModal: React.FC<PortfolioItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    skills?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setSkills(item.skills?.join(', ') || '');
      setRole(item.role || '');
      setErrors({});
    }
  }, [item]);

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
    
    if (!item || !validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Convert comma-separated skills to array
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await updatePortfolioItem(item.userId, item.id, {
        title: title.trim(),
        description: description.trim(),
        skills: skillsArray,
        role: role.trim() || undefined
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrors({ title: result.error || 'Failed to update portfolio item' });
      }
    } catch (error) {
      console.error('Error updating portfolio item:', error);
      setErrors({ title: 'An unexpected error occurred' });
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

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Portfolio Item"
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
        {/* Title Field */}
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="edit-title"
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
          <label htmlFor="edit-description" className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="edit-description"
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
          <label htmlFor="edit-skills" className="block text-sm font-medium text-foreground mb-2">
            Skills
          </label>
          <Input
            id="edit-skills"
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
          <label htmlFor="edit-role" className="block text-sm font-medium text-foreground mb-2">
            Role (Optional)
          </label>
          <Input
            id="edit-role"
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

