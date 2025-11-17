import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { GlassmorphicForm } from '../forms/GlassmorphicForm';
import { GlassmorphicInput } from '../forms/GlassmorphicInput';
import { GlassmorphicTextarea } from '../forms/GlassmorphicTextarea';
import { GlassmorphicDropdown, DropdownOption } from '../forms/GlassmorphicDropdown';
import { Button } from '../ui/Button';
import { useAuth } from '../../AuthContext';
import { createChallenge } from '../../services/challenges';
import { 
  ChallengeType, 
  ChallengeDifficulty, 
  ChallengeCategory,
  SoloChallengeConfig,
  TradeChallengeConfig,
  CollaborationChallengeConfig
} from '../../types/gamification';
import { Timestamp } from 'firebase/firestore';
import { Zap, TrendingUp, Users, Calendar, Target, Award } from 'lucide-react';
import { logger } from '@utils/logging/logger';

// Challenge Creation Data Interface
export interface ChallengeCreationData {
  title: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory | '';
  difficulty: ChallengeDifficulty;
  timeEstimate: string;
  instructions: string[];
  objectives: string[];
  tags: string[];
  maxParticipants?: number;
  endDate: Date;
  rewards?: { xp: number };
  
  // Type-specific configurations
  soloConfig?: SoloChallengeConfig;
  tradeConfig?: TradeChallengeConfig;
  collaborationConfig?: CollaborationChallengeConfig;
}

interface ChallengeCreationFormProps {
  onSubmit: (data: ChallengeCreationData) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Partial<ChallengeCreationData>;
  className?: string;
  allowedTypes?: ChallengeType[];
}

// Dropdown options
const DIFFICULTY_OPTIONS: DropdownOption[] = [
  { value: ChallengeDifficulty.BEGINNER, label: 'Beginner', description: 'Perfect for newcomers' },
  { value: ChallengeDifficulty.INTERMEDIATE, label: 'Intermediate', description: 'Some experience required' },
  { value: ChallengeDifficulty.ADVANCED, label: 'Advanced', description: 'Experienced users only' },
  { value: ChallengeDifficulty.EXPERT, label: 'Expert', description: 'Master level challenge' }
];

const TIME_ESTIMATE_OPTIONS: DropdownOption[] = [
  { value: '15-min', label: '15 minutes', description: 'Quick challenge' },
  { value: '30-min', label: '30 minutes', description: 'Short session' },
  { value: '1-hour', label: '1 hour', description: 'Standard challenge' },
  { value: '2-hour', label: '2 hours', description: 'Extended challenge' },
  { value: 'multi-day', label: 'Multi-day', description: 'Long-term project' }
];

const CATEGORY_OPTIONS: DropdownOption[] = (
  Object.values(ChallengeCategory) as string[]
).map((value) => ({
  value,
  label: value
    .replace('_', ' ')
    .replace('3d', '3D')
    .replace(/^(\w)/, (m) => m.toUpperCase())
}));

export const ChallengeCreationForm: React.FC<ChallengeCreationFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  className = '',
  allowedTypes = [ChallengeType.SOLO, ChallengeType.TRADE, ChallengeType.COLLABORATION]
}) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ChallengeCreationData>({
    title: '',
    description: '',
    type: ChallengeType.SOLO,
    category: '',
    difficulty: ChallengeDifficulty.BEGINNER,
    timeEstimate: '1-hour',
    instructions: [''],
    objectives: [''],
    tags: [],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get challenge type options based on allowed types
  const getTypeOptions = (): DropdownOption[] => {
    const typeMap: Record<ChallengeType.SOLO | ChallengeType.TRADE | ChallengeType.COLLABORATION, { label: string; description: string; icon: JSX.Element } > = {
      [ChallengeType.SOLO]: { 
        label: 'Solo Challenge', 
        description: 'Individual skill building',
        icon: <Zap className="w-4 h-4" />
      },
      [ChallengeType.TRADE]: { 
        label: 'Trade Challenge', 
        description: 'Skill exchange with others',
        icon: <TrendingUp className="w-4 h-4" />
      },
      [ChallengeType.COLLABORATION]: { 
        label: 'Collaboration Challenge', 
        description: 'Team-based project',
        icon: <Users className="w-4 h-4" />
      }
    };

    const allowedCore = allowedTypes.filter(t => 
      t === ChallengeType.SOLO || t === ChallengeType.TRADE || t === ChallengeType.COLLABORATION
    ) as (ChallengeType.SOLO | ChallengeType.TRADE | ChallengeType.COLLABORATION)[];

    return allowedCore.map((type) => ({
      value: type,
      label: typeMap[type].label,
      description: typeMap[type].description,
      icon: typeMap[type].icon
    }));
  };

  // Update form data
  const updateFormData = useCallback((field: keyof ChallengeCreationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (formData.instructions.filter(i => i.trim()).length === 0) {
      newErrors.instructions = 'At least one instruction is required';
    }
    if (formData.objectives.filter(o => o.trim()).length === 0) {
      newErrors.objectives = 'At least one objective is required';
    }
    if (!formData.endDate || isNaN(formData.endDate.getTime())) {
      newErrors.endDate = 'Valid end date is required';
    }
    const xp = Number(formData.rewards?.xp ?? 0);
    if (Number.isNaN(xp) || xp < 0) {
      newErrors.rewards = 'XP reward must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean up arrays (remove empty strings)
      const cleanedData: ChallengeCreationData = {
        ...formData,
        instructions: formData.instructions.filter(i => i.trim()),
        objectives: formData.objectives.filter(o => o.trim()),
        tags: formData.tags.filter(t => t.trim()),
        rewards: { xp: Number(formData.rewards?.xp ?? 0) }
      };

      await onSubmit(cleanedData);
    } catch (error) {
      logger.error('Challenge creation error:', 'COMPONENT', {}, error as Error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create challenge. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle array field updates
  const updateArrayField = (field: 'instructions' | 'objectives' | 'tags', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    updateFormData(field, newArray);
  };

  const addArrayField = (field: 'instructions' | 'objectives' | 'tags') => {
    updateFormData(field, [...formData[field], '']);
  };

  const removeArrayField = (field: 'instructions' | 'objectives' | 'tags', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    updateFormData(field, newArray);
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <GlassmorphicForm
        variant="stepped"
        brandAccent="gradient"
        className="space-y-8"
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3"
          >
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">Create New Challenge</h1>
          </motion.div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Design an engaging challenge that helps users build skills and connect with others
          </p>
        </div>

        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-primary" />
            <span>Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassmorphicInput
              label="Challenge Title"
              placeholder="Enter a compelling challenge title"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              error={errors.title}
              required
              className="md:col-span-2"
            />

            <GlassmorphicDropdown
              label="Challenge Type"
              placeholder="Select challenge type"
              options={getTypeOptions()}
              value={formData.type}
              onChange={(value) => updateFormData('type', value)}
              variant="glass"
              brandAccent="orange"
              required
            />

            <GlassmorphicDropdown
              label="Category"
              placeholder="Select category"
              options={CATEGORY_OPTIONS}
              value={formData.category}
              onChange={(value) => updateFormData('category', value)}
              error={errors.category}
              searchable
              required
              id="challenge-category-dropdown"
            />

            <GlassmorphicDropdown
              label="Difficulty Level"
              placeholder="Select difficulty"
              options={DIFFICULTY_OPTIONS}
              value={formData.difficulty}
              onChange={(value) => updateFormData('difficulty', value)}
              variant="glass"
              brandAccent="blue"
              required
            />

            <GlassmorphicDropdown
              label="Time Estimate"
              placeholder="Select time estimate"
              options={TIME_ESTIMATE_OPTIONS}
              value={formData.timeEstimate}
              onChange={(value) => updateFormData('timeEstimate', value)}
              variant="glass"
              brandAccent="purple"
              required
            />
          </div>

          <GlassmorphicTextarea
            label="Challenge Description"
            placeholder="Describe what participants will learn and accomplish"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            error={errors.description}
            rows={4}
            required
          />
        </motion.div>

        {/* Instructions and Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Challenge Details</span>
          </h2>

          {/* Instructions */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Instructions <span className="text-red-400">*</span>
            </label>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <GlassmorphicInput
                  placeholder={`Step ${index + 1}: What should participants do?`}
                  value={instruction}
                  onChange={(e) => updateArrayField('instructions', index, e.target.value)}
                  className="flex-1"
                />
                {formData.instructions.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('instructions', index)}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('instructions')}
              className="w-full"
            >
              + Add Instruction
            </Button>
            {errors.instructions && (
              <p className="text-red-400 text-sm">{errors.instructions}</p>
            )}
          </div>

          {/* Objectives */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Learning Objectives <span className="text-red-400">*</span>
            </label>
            {formData.objectives.map((objective, index) => (
              <div key={index} className="flex gap-2">
                <GlassmorphicInput
                  placeholder={`Objective ${index + 1}: What will participants learn?`}
                  value={objective}
                  onChange={(e) => updateArrayField('objectives', index, e.target.value)}
                  className="flex-1"
                />
                {formData.objectives.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('objectives', index)}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('objectives')}
              className="w-full"
            >
              + Add Objective
            </Button>
            {errors.objectives && (
              <p className="text-red-400 text-sm">{errors.objectives}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Tags (Optional)
            </label>
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex gap-2">
                <GlassmorphicInput
                  placeholder={`Tag ${index + 1}: e.g., react, beginner, frontend`}
                  value={tag}
                  onChange={(e) => updateArrayField('tags', index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayField('tags', index)}
                  className="px-3"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('tags')}
              className="w-full"
            >
              + Add Tag
            </Button>
          </div>
        </motion.div>

        {/* Type-specific Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            {formData.type === ChallengeType.SOLO && <Zap className="w-5 h-5 text-primary" />}
            {formData.type === ChallengeType.TRADE && <TrendingUp className="w-5 h-5 text-blue-400" />}
            {formData.type === ChallengeType.COLLABORATION && <Users className="w-5 h-5 text-purple-400" />}
            <span>{formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Configuration</span>
          </h2>

          {formData.type === ChallengeType.SOLO && (
            <div className="space-y-4 bg-primary/10 rounded-lg p-6 border border-primary/20">
              <p className="text-primary/70 text-sm">
                Solo challenges focus on individual skill building with optional AI mentoring support.
              </p>
              {/* Solo-specific fields would go here */}
            </div>
          )}

          {formData.type === ChallengeType.TRADE && (
            <div className="space-y-4 bg-blue-500/10 rounded-lg p-6 border border-blue-500/20">
              <p className="text-blue-200 text-sm">
                Trade challenges involve skill exchange between two participants.
              </p>
              <GlassmorphicInput
                label="Maximum Participants"
                type="number"
                placeholder="2"
                value={formData.maxParticipants?.toString() || '2'}
                onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value) || 2)}
                min="2"
                max="2"
              />
            </div>
          )}

          {formData.type === ChallengeType.COLLABORATION && (
            <div className="space-y-4 bg-purple-500/10 rounded-lg p-6 border border-purple-500/20">
              <p className="text-purple-200 text-sm">
                Collaboration challenges involve team-based projects with multiple roles.
              </p>
              <GlassmorphicInput
                label="Maximum Participants"
                type="number"
                placeholder="6"
                value={formData.maxParticipants?.toString() || '6'}
                onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value) || 6)}
                min="3"
                max="12"
              />
            </div>
          )}
        </motion.div>

        {/* Submit Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-end"
        >
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="sm:w-auto bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600"
          >
            {isSubmitting ? 'Creating Challenge...' : 'Create Challenge'}
          </Button>
        </motion.div>

        {/* Error Display */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4"
          >
            <p className="text-red-200 text-sm">{submitError}</p>
          </motion.div>
        )}
      </GlassmorphicForm>
    </div>
  );
};
