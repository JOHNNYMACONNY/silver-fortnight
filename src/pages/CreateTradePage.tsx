import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  createTrade, 
  TradeSkill, 
  getUserProfile, 
  User as UserProfile, // Using alias to avoid conflict if another User type is in scope
  Timestamp 
} from '../services/firestore-exports';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { GlassmorphicInput } from '../components/ui/GlassmorphicInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { X, AlertCircle } from 'lucide-react';
import { logger } from '@utils/logging/logger';
import { Slider } from '../components/ui/Slider';
import { VisualSelectionGroup } from '../components/ui/VisualSelectionGroup';
import { SkillLevelSelector } from '../components/ui/SkillLevelSelector';
import { getCategoryIcon } from '../utils/iconMappings';
import { isVisualSelectionEnabled, isConversationalLabelsEnabled } from '../utils/featureFlags';
import { getLabel } from '../utils/conversationalLabels';

const CreateTradePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [offeredSkills, setOfferedSkills] = useState<TradeSkill[]>([]);
  const [requestedSkills, setRequestedSkills] = useState<TradeSkill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Skill input states
  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newOfferedSkillLevel, setNewOfferedSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [newRequestedSkill, setNewRequestedSkill] = useState('');
  const [newRequestedSkillLevel, setNewRequestedSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  
  // Feature flag for slider inputs (can be toggled for gradual rollout)
  const USE_SLIDER_INPUTS = true;
  
  // Feature flags for UX enhancements
  const useVisualSelection = isVisualSelectionEnabled();
  const useConversationalLabels = isConversationalLabelsEnabled();
  
  // Helper to convert slider value (0-2) to skill level
  const sliderToLevel = (value: number): 'beginner' | 'intermediate' | 'expert' => {
    if (value === 0) return 'beginner';
    if (value === 1) return 'intermediate';
    return 'expert';
  };
  
  // Helper to convert skill level to slider value (0-2)
  const levelToSlider = (level: 'beginner' | 'intermediate' | 'expert'): number => {
    if (level === 'beginner') return 0;
    if (level === 'intermediate') return 1;
    return 2;
  };

  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then(({ data: profile }) => {
        if (profile) {
          setUserProfile(profile);
        }
      });
    }
  }, [currentUser]);

  // Predefined categories
  const categories = [
    'Design',
    'Development',
    'Marketing',
    'Writing',
    'Photography',
    'Video Editing',
    'Business',
    'Music',
    'Art',
    'Other'
  ];

  // Add offered skill
  const addOfferedSkill = () => {
    if (newOfferedSkill.trim()) {
      const skill: TradeSkill = {
        name: newOfferedSkill.trim(),
        level: newOfferedSkillLevel
      };
      setOfferedSkills([...offeredSkills, skill]);
      setNewOfferedSkill('');
      setNewOfferedSkillLevel('intermediate');
    }
  };

  // Remove offered skill
  const removeOfferedSkill = (index: number) => {
    setOfferedSkills(offeredSkills.filter((_, i) => i !== index));
  };

  // Add requested skill
  const addRequestedSkill = () => {
    if (newRequestedSkill.trim()) {
      const skill: TradeSkill = {
        name: newRequestedSkill.trim(),
        level: newRequestedSkillLevel
      };
      setRequestedSkills([...requestedSkills, skill]);
      setNewRequestedSkill('');
      setNewRequestedSkillLevel('intermediate');
    }
  };

  // Remove requested skill
  const removeRequestedSkill = (index: number) => {
    setRequestedSkills(requestedSkills.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to create a trade');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error('Please enter a title for your trade');
      }
      if (!description.trim()) {
        throw new Error('Please enter a description for your trade');
      }
      if (!category) {
        throw new Error('Please select a category');
      }
      if (offeredSkills.length === 0) {
        throw new Error('Please add at least one skill you are offering');
      }
      if (requestedSkills.length === 0) {
        throw new Error('Please add at least one skill you are requesting');
      }

      // Create trade data
      const tradeData = {
        title: title.trim(),
        description: description.trim(),
        category,
        skillsOffered: offeredSkills,
        skillsWanted: requestedSkills,
        // Aliases for backward compatibility
        offeredSkills: offeredSkills,
        requestedSkills: requestedSkills,
        creatorId: currentUser.uid,
        creatorName: userProfile?.displayName || currentUser.displayName || 'Anonymous',
        creatorPhotoURL: (userProfile?.profilePicture || userProfile?.photoURL || currentUser.photoURL) ?? null,
        status: 'open' as const,
        interestedUsers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        visibility: 'public' as const,
      };

      // Create the trade
      const { data: tradeId, error: createError } = await createTrade(tradeData as any);

      if (createError) {
        throw new Error(createError.message);
      }

      if (!tradeId) {
        throw new Error('Failed to create trade');
      }

      // Success!
      addToast('success', 'Trade created successfully!');
      navigate('/trades');

    } catch (err) {
      logger.error('Error creating trade:', 'PAGE', {}, err as Error);
      setError((err as Error).message || 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Create a New Trade</h1>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/trades')}
            className="text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

         {error && (
           <div className="glassmorphic border-red-500/20 bg-red-500/5 backdrop-blur-xl text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
             <AlertCircle className="h-5 w-5 mr-2" />
             {error}
           </div>
         )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <GlassmorphicInput
                type="text"
                id="title"
                inputMode="text"
                autoComplete="off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Logo Design for Website Development"
                label="Trade Title"
                required
                variant="glass"
                size="lg"
                animatedLabel
                realTimeValidation
              />
            </div>

            {useVisualSelection ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {useConversationalLabels ? getLabel('category', true) : 'Category'} 
                  <span className="text-destructive">*</span>
                </label>
                <VisualSelectionGroup
                  options={categories.map(cat => {
                    const Icon = getCategoryIcon(cat);
                    return {
                      value: cat,
                      label: cat,
                      icon: Icon ? <Icon className="w-6 h-6" /> : undefined
                    };
                  })}
                  value={category}
                  onChange={(value) => setCategory(typeof value === 'string' ? value : value[0] || '')}
                  topic="trades"
                  columns={4}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
                Description <span className="text-destructive">*</span>
              </label>
               <Textarea
                 id="description"
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 rows={4}
                 placeholder="Describe what you're offering and what you're looking for in detail..."
                 required
                 autoComplete="off"
                 className="glassmorphic border-glass backdrop-blur-xl bg-white/5"
               />
            </div>
          </div>

          {/* Skills You're Offering */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Skills You're Offering <span className="text-destructive">*</span>
            </label>
            
            {/* Add skill form */}
            <div className="space-y-3 mb-3">
              <div className="flex gap-2">
                <GlassmorphicInput
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={newOfferedSkill}
                  onChange={(e) => setNewOfferedSkill(e.target.value)}
                  placeholder="Enter a skill you can offer"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOfferedSkill())}
                  variant="glass"
                  size="md"
                  animatedLabel
                  realTimeValidation
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addOfferedSkill}
                >
                  Add Skill
                </Button>
              </div>
              {useVisualSelection ? (
                <SkillLevelSelector
                  value={newOfferedSkillLevel}
                  onChange={setNewOfferedSkillLevel}
                  topic="trades"
                />
              ) : USE_SLIDER_INPUTS ? (
                <Slider
                  label="Skill Level"
                  value={levelToSlider(newOfferedSkillLevel)}
                  onValueChange={(value) => setNewOfferedSkillLevel(sliderToLevel(value))}
                  min={0}
                  max={2}
                  step={1}
                  valueLabels={['Beginner', 'Intermediate', 'Expert']}
                  className="px-2"
                />
              ) : (
                <Select value={newOfferedSkillLevel} onValueChange={(value) => setNewOfferedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                  <SelectTrigger className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Offered skills list */}
             <div className="flex flex-wrap gap-2">
               {offeredSkills.map((skill, index) => (
                 <div key={index} className="flex items-center glassmorphic border-glass backdrop-blur-xl bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-3 py-1 text-sm font-medium">
                   <span>{skill.name} ({skill.level})</span>
                   <button type="button" onClick={() => removeOfferedSkill(index)} className="ml-2 text-green-600 dark:text-green-400 hover:text-green-500">
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               ))}
             </div>
          </div>
          
          {/* Skills You're Requesting */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Skills You're Requesting <span className="text-destructive">*</span>
            </label>
            
            {/* Add skill form */}
            <div className="space-y-3 mb-3">
              <div className="flex gap-2">
                <GlassmorphicInput
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={newRequestedSkill}
                  onChange={(e) => setNewRequestedSkill(e.target.value)}
                  placeholder="Enter a skill you are looking for"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequestedSkill())}
                  variant="glass"
                  size="md"
                  animatedLabel
                  realTimeValidation
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addRequestedSkill}
                >
                  Add Skill
                </Button>
              </div>
              {useVisualSelection ? (
                <SkillLevelSelector
                  value={newRequestedSkillLevel}
                  onChange={setNewRequestedSkillLevel}
                  topic="trades"
                />
              ) : USE_SLIDER_INPUTS ? (
                <Slider
                  label="Skill Level"
                  value={levelToSlider(newRequestedSkillLevel)}
                  onValueChange={(value) => setNewRequestedSkillLevel(sliderToLevel(value))}
                  min={0}
                  max={2}
                  step={1}
                  valueLabels={['Beginner', 'Intermediate', 'Expert']}
                  className="px-2"
                />
              ) : (
                <Select value={newRequestedSkillLevel} onValueChange={(value) => setNewRequestedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                  <SelectTrigger className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Requested skills list */}
             <div className="flex flex-wrap gap-2">
               {requestedSkills.map((skill, index) => (
                 <div key={index} className="flex items-center glassmorphic border-glass backdrop-blur-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full px-3 py-1 text-sm font-medium">
                   <span>{skill.name} ({skill.level})</span>
                   <button type="button" onClick={() => removeRequestedSkill(index)} className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-500">
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               ))}
             </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="premium"
              size="lg"
              topic="trades"
              disabled={isSubmitting}
              className="min-h-[44px] min-w-[140px] hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                'Create Trade'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTradePage;
