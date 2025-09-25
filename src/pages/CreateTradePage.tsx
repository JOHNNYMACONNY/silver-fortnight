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
import { ProposalSubmitButton, AnimatedButton } from '../components/animations';
import { GlassmorphicInput } from '../components/ui/GlassmorphicInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { X, AlertCircle } from 'lucide-react';

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
        creatorPhotoURL: userProfile?.profilePicture || userProfile?.photoURL || currentUser.photoURL || undefined,
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
      console.error('Error creating trade:', err);
      setError((err as Error).message || 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-card-foreground">Create a New Trade</h1>
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/trades')}
            tradingContext="general"
          >
            <X className="h-6 w-6" />
          </AnimatedButton>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center">
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

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1">
                Category <span className="text-destructive">*</span>
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              />
            </div>
          </div>

          {/* Skills You're Offering */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Skills You're Offering <span className="text-destructive">*</span>
            </label>
            
            {/* Add skill form */}
            <div className="flex gap-2 mb-3">
              <GlassmorphicInput
                type="text"
                value={newOfferedSkill}
                onChange={(e) => setNewOfferedSkill(e.target.value)}
                placeholder="Enter a skill you can offer"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOfferedSkill())}
                variant="glass"
                size="md"
                animatedLabel
                realTimeValidation
              />
              <Select value={newOfferedSkillLevel} onValueChange={(value) => setNewOfferedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addOfferedSkill}
              >
                Add Skill
              </Button>
            </div>
            
            {/* Offered skills list */}
            <div className="flex flex-wrap gap-2">
              {offeredSkills.map((skill, index) => (
                <div key={index} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  <span>{skill.name} ({skill.level})</span>
                  <button type="button" onClick={() => removeOfferedSkill(index)} className="ml-2 text-primary hover:text-primary/90">
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
            <div className="flex gap-2 mb-3">
              <GlassmorphicInput
                type="text"
                value={newRequestedSkill}
                onChange={(e) => setNewRequestedSkill(e.target.value)}
                placeholder="Enter a skill you are looking for"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequestedSkill())}
                variant="glass"
                size="md"
                animatedLabel
                realTimeValidation
              />
              <Select value={newRequestedSkillLevel} onValueChange={(value) => setNewRequestedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addRequestedSkill}
              >
                Add Skill
              </Button>
            </div>
            
            {/* Requested skills list */}
            <div className="flex flex-wrap gap-2">
              {requestedSkills.map((skill, index) => (
                <div key={index} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  <span>{skill.name} ({skill.level})</span>
                  <button type="button" onClick={() => removeRequestedSkill(index)} className="ml-2 text-primary hover:text-primary/90">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <ProposalSubmitButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Create Trade
            </ProposalSubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTradePage;
