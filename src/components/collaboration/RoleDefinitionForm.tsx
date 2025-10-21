import React, { useState, useEffect } from 'react';
import { CollaborationRoleData, Skill } from '../../types/collaboration';
import { SkillSelector } from '../ui/SkillSelector';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

interface RoleDefinitionFormProps {
  initialRole?: Partial<CollaborationRoleData>;
  onSubmit: (roleData: Partial<CollaborationRoleData>) => void;
  onCancel: () => void;
}

export const RoleDefinitionForm: React.FC<RoleDefinitionFormProps> = ({
  initialRole,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(initialRole?.title || '');
  const [description, setDescription] = useState(initialRole?.description || '');
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>(initialRole?.requiredSkills || []);
  const [preferredSkills, setPreferredSkills] = useState<Skill[]>(initialRole?.preferredSkills || []);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    requiredSkills?: string;
  }>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      description?: string;
      requiredSkills?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (requiredSkills.length === 0) {
      newErrors.requiredSkills = 'At least one required skill is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        title,
        description,
        requiredSkills,
        preferredSkills: preferredSkills.length > 0 ? preferredSkills : undefined
      });
    }
  };

  // Filter out duplicate skills between required and preferred
  useEffect(() => {
    const requiredSkillNames = new Set(requiredSkills.map(skill => skill.name.toLowerCase()));
    
    setPreferredSkills(prev => 
      prev.filter(skill => !requiredSkillNames.has(skill.name.toLowerCase()))
    );
  }, [requiredSkills]);

  return (
    <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-xl p-6">
      <h2 className={cn("text-xl font-semibold mb-4", "text-foreground")}>
        {initialRole ? 'Edit Role' : 'Add New Role'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={cn("block text-sm font-medium", "text-foreground")}>
            Role Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "mt-1 block w-full rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.title && "border-red-500 dark:border-red-500"
            )}
            placeholder="e.g., UI Designer, Video Editor"
          />
          {errors.title && (
            <p className={cn("mt-1 text-sm", "text-red-600 dark:text-red-400")}>{errors.title}</p>
          )}
        </div>
        
        <div>
          <label className={cn("block text-sm font-medium", "text-foreground")}>
            Role Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={cn(
              "mt-1 block w-full rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.description && "border-red-500 dark:border-red-500"
            )}
            placeholder="Describe the responsibilities and expectations for this role..."
          />
          {errors.description && (
            <p className={cn("mt-1 text-sm", "text-red-600 dark:text-red-400")}>{errors.description}</p>
          )}
        </div>
        
        <div>
          <label className={cn("block text-sm font-medium", "text-foreground")}>
            Required Skills
          </label>
          <p className={cn("text-sm mb-2", "text-muted-foreground")}>
            Skills that are essential for this role
          </p>
          <SkillSelector
            selectedSkills={requiredSkills}
            onChange={setRequiredSkills}
            withLevels
          />
          {errors.requiredSkills && (
            <p className={cn("mt-1 text-sm", "text-red-600 dark:text-red-400")}>{errors.requiredSkills}</p>
          )}
        </div>
        
        <div>
          <label className={cn("block text-sm font-medium", "text-foreground")}>
            Preferred Skills (Optional)
          </label>
          <p className={cn("text-sm mb-2", "text-muted-foreground")}>
            Additional skills that would be beneficial but aren't required
          </p>
          <SkillSelector
            selectedSkills={preferredSkills}
            onChange={setPreferredSkills}
            withLevels
          />
        </div>
        
        <div className={cn(
          "flex justify-end space-x-4 pt-4 border-t",
          "border-border"
        )}>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={onCancel}
            aria-label="Cancel role definition"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="default"
            aria-label={initialRole ? 'Update role' : 'Add role'}
          >
            {initialRole ? 'Update Role' : 'Add Role'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleDefinitionForm;
