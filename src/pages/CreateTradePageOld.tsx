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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { ProposalSubmitButton, AnimatedButton } from '../components/animations';
import { GlassmorphicInput } from '../components/ui/GlassmorphicInput';
import { GlassmorphicForm } from '../components/ui/GlassmorphicForm';
import { AccessibleFormField } from '../components/ui/AccessibleFormField';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { X, AlertCircle, Plus, CheckCircle, Target, Users } from 'lucide-react';

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
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [helpContext, setHelpContext] = useState<string>('');

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

  // Wizard steps configuration
  const wizardSteps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Tell us about your trade opportunity',
      icon: '📝',
      fields: ['title', 'category', 'description']
    },
    {
      id: 2,
      title: 'Skills You\'re Offering',
      description: 'What skills can you provide in exchange?',
      icon: '🎯',
      fields: ['offeredSkills']
    },
    {
      id: 3,
      title: 'Skills You\'re Requesting',
      description: 'What skills are you looking for in return?',
      icon: '🤝',
      fields: ['requestedSkills']
    },
    {
      id: 4,
      title: 'Review & Submit',
      description: 'Review your information and submit your trade',
      icon: '✅',
      fields: []
    }
  ];

  // Smart contextual help content
  const helpContent = {
    title: {
      title: 'Trade Title Tips',
      content: [
        'Be specific and descriptive',
        'Include what you\'re offering and what you need',
        'Keep it under 60 characters for best visibility',
        'Use action words like "Design", "Build", "Create"'
      ]
    },
    category: {
      title: 'Category Selection',
      content: [
        'Choose the category that best fits your primary skill',
        'This helps others find your trade more easily',
        'You can always edit this later if needed'
      ]
    },
    description: {
      title: 'Description Best Practices',
      content: [
        'Explain what you\'re offering in detail',
        'Mention your experience level',
        'Include examples of your work if possible',
        'Be clear about what you\'re looking for in return'
      ]
    },
    offeredSkills: {
      title: 'Offered Skills Tips',
      content: [
        'Be honest about your skill level',
        'Include specific technologies or tools you know',
        'Mention any certifications or achievements',
        'Add 3-5 skills for the best balance'
      ]
    },
    requestedSkills: {
      title: 'Requested Skills Tips',
      content: [
        'Be specific about what you need help with',
        'Mention your preferred skill level',
        'Include any specific requirements',
        'Consider what would be a fair trade'
      ]
    }
  };

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

  // Wizard navigation functions
  const nextStep = () => {
    if (currentStep < wizardSteps.length) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Smart help functions
  const showContextualHelp = (context: string) => {
    setHelpContext(context);
    setShowHelp(true);
  };

  const hideHelp = () => {
    setShowHelp(false);
    setHelpContext('');
  };

  // Validation functions
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return title.trim() && category && description.trim();
      case 2:
        return offeredSkills.length > 0;
      case 3:
        return requestedSkills.length > 0;
      case 4:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const canProceedToNext = () => {
    return isStepValid(currentStep) && currentStep < wizardSteps.length;
  };

  const canGoBack = () => {
    return currentStep > 1;
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
    <main className="max-w-7xl mx-auto px-xl py-3xl">
      {/* BentoGrid Layout */}
      <BentoGrid
        layoutPattern="asymmetric"
        visualRhythm="progressive"
        contentAwareLayout={true}
        gap="xl"
        columns={6}
      >
        {/* Header Section */}
        <BentoItem colSpan={6} contentType="text" layoutRole="featured">
          <div className="mb-3xl">
            <div className="flex items-center justify-between mb-xl">
              <div className="space-y-md">
                <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  Create a New Trade
                </h1>
                <p className="text-lg text-muted-foreground">
                  Share your skills and find the perfect trading partner
                </p>
              </div>
              <Button
            variant="ghost"
                size="lg"
            onClick={() => navigate('/trades')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full p-sm"
          >
            <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="mb-2xl">
              <div className="flex items-center justify-between mb-lg">
                <h2 className="text-xl font-semibold text-foreground">
                  Step {currentStep} of {wizardSteps.length}
                </h2>
                <div className="flex items-center gap-sm">
                  <span className="text-sm text-muted-foreground">
                    {Math.round((currentStep / wizardSteps.length) * 100)}% Complete
                  </span>
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-500 ease-out"
                      style={{ width: `${(currentStep / wizardSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
        </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between">
                {wizardSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => goToStep(step.id)}
                      disabled={!completedSteps.includes(step.id - 1) && step.id > currentStep}
                      className={`flex items-center gap-sm px-lg py-md rounded-lg transition-all duration-200 ${
                        step.id === currentStep
                          ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                          : completedSteps.includes(step.id - 1)
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      } ${step.id > currentStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step.id === currentStep
                          ? 'bg-primary-500 text-white'
                          : completedSteps.includes(step.id - 1)
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-muted-foreground'
                      }`}>
                        {completedSteps.includes(step.id - 1) ? '✓' : step.id}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs text-muted-foreground">{step.description}</div>
                      </div>
                    </button>
                    {index < wizardSteps.length - 1 && (
                      <div className="w-8 h-px bg-white/20 mx-sm" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </BentoItem>

        {/* Main Form Content */}
        <BentoItem colSpan={4} contentType="mixed" layoutRole="complex">
          <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
            <CardContent className="p-3xl">
          {error && (
            <Alert variant="destructive" className="mb-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

              <form onSubmit={handleSubmit} className="space-y-2xl">
                {/* Current Step Content */}
                {currentStep === 1 && (
                  <section className="space-y-xl">
                    <div className="flex items-center gap-lg mb-xl">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">📝</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                          Basic Information
                        </h2>
                        <p className="text-muted-foreground">
                          Tell us about your trade opportunity
                        </p>
                      </div>
                    </div>
              
                    <GlassmorphicForm className="space-y-xl">
                      <div className="relative">
                        <AccessibleFormField id="title" label="Trade Title *">
              <GlassmorphicInput
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Logo Design for Website Development"
                required
                variant="glass"
                size="lg"
                animatedLabel
                realTimeValidation
                            icon={<span className="text-primary-600 dark:text-primary-400">⚡</span>}
                          />
                        </AccessibleFormField>
                        <button
                          type="button"
                          onClick={() => showContextualHelp('title')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
            </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-xl">
                        <div className="relative">
                          <AccessibleFormField id="category" label="Category *">
              <Select value={category} onValueChange={setCategory}>
                              <SelectTrigger id="category" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 h-12 w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
                          </AccessibleFormField>
                          <button
                            type="button"
                            onClick={() => showContextualHelp('category')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </button>
            </div>

                        <div className="lg:col-span-3 relative">
                          <AccessibleFormField id="description" label="Description *">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                              rows={5}
                placeholder="Describe what you're offering and what you're looking for in detail..."
                required
                              className="glassmorphic border-glass backdrop-blur-xl bg-white/5 min-h-[120px] resize-none w-full"
                            />
                          </AccessibleFormField>
                          <button
                            type="button"
                            onClick={() => showContextualHelp('description')}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </button>
            </div>
          </div>
                    </GlassmorphicForm>
                  </section>
                )}

                {/* Step 2: Skills You're Offering */}
                {currentStep === 2 && (
                  <section className="space-y-xl">
                    <div className="flex items-center gap-lg mb-xl">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">🎯</span>
                      </div>
                      <div className="space-y-sm">
                        <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                          Skills You're Offering *
                        </h2>
                        <p className="text-muted-foreground">
                          What skills can you provide in exchange?
                        </p>
                      </div>
                    </div>
            
            {/* Add skill form */}
            <Card variant="glass" className="border-primary-500/20 mb-xl">
              <CardContent className="p-xl">
                <GlassmorphicForm className="space-y-lg">
                  <div className="space-y-sm">
                    <h3 className="text-lg font-medium text-foreground">Add New Skill</h3>
                    <p className="text-sm text-muted-foreground">Add a skill you can provide to other traders</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                    <div className="md:col-span-3">
                      <AccessibleFormField id="offered-skill" label="Skill Name">
              <GlassmorphicInput
                type="text"
                          id="offered-skill"
                value={newOfferedSkill}
                onChange={(e) => setNewOfferedSkill(e.target.value)}
                placeholder="Enter a skill you can offer"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOfferedSkill())}
                variant="glass"
                          size="lg"
                animatedLabel
                realTimeValidation
                          icon={<span className="text-primary-600 dark:text-primary-400">🎯</span>}
              />
                      </AccessibleFormField>
                    </div>
                    <div>
                      <AccessibleFormField id="offered-skill-level" label="Skill Level">
              <Select value={newOfferedSkillLevel} onValueChange={(value) => setNewOfferedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                          <SelectTrigger id="offered-skill-level" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 h-14 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
                      </AccessibleFormField>
                    </div>
                  </div>
                  <div className="flex justify-end">
              <Button
                type="button"
                onClick={addOfferedSkill}
                      variant="premium"
                      size="lg"
                      topic="trades"
                      className="min-w-[140px]"
              >
                      <Plus className="h-5 w-5 mr-sm" />
                Add Skill
              </Button>
            </div>
                </GlassmorphicForm>
              </CardContent>
            </Card>
            
            {/* Offered skills list */}
            {offeredSkills.length > 0 && (
              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Your Skills</h3>
                  <Badge variant="secondary" className="text-sm">
                    {offeredSkills.length} {offeredSkills.length === 1 ? 'skill' : 'skills'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {offeredSkills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="default" 
                      topic="trades"
                      className="text-sm px-lg py-md flex items-center justify-between gap-sm h-auto min-h-[50px]"
                    >
                      <div className="flex flex-col space-y-xs">
                        <span className="font-medium text-sm">{skill.name}</span>
                        <span className="text-xs opacity-75 capitalize">{skill.level}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeOfferedSkill(index)} 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors p-xs hover:bg-white/10 rounded-full flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
              ))}
            </div>
          </div>
            )}
          </section>
          
          {/* Skills You're Requesting */}
          <section className="space-y-xl">
            <div className="flex items-center gap-lg mb-xl">
              <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">3</span>
              </div>
              <div className="space-y-sm">
                <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
              Skills You're Requesting <span className="text-destructive">*</span>
                </h2>
                <p className="text-base text-muted-foreground">
                  What skills are you looking for in return?
                </p>
              </div>
            </div>
            
            {/* Add skill form */}
            <Card variant="glass" className="border-primary-500/20 mb-xl">
              <CardContent className="p-xl">
                <GlassmorphicForm className="space-y-lg">
                  <div className="space-y-sm">
                    <h3 className="text-lg font-medium text-foreground">Add Requested Skill</h3>
                    <p className="text-sm text-muted-foreground">Add a skill you're looking for from other traders</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                    <div className="md:col-span-3">
                      <AccessibleFormField id="requested-skill" label="Skill Name">
              <GlassmorphicInput
                type="text"
                          id="requested-skill"
                value={newRequestedSkill}
                onChange={(e) => setNewRequestedSkill(e.target.value)}
                placeholder="Enter a skill you are looking for"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequestedSkill())}
                variant="glass"
                          size="lg"
                animatedLabel
                realTimeValidation
                          icon={<span className="text-purple-600 dark:text-purple-400">🤝</span>}
              />
                      </AccessibleFormField>
                    </div>
                    <div>
                      <AccessibleFormField id="requested-skill-level" label="Skill Level">
              <Select value={newRequestedSkillLevel} onValueChange={(value) => setNewRequestedSkillLevel(value as 'beginner' | 'intermediate' | 'expert')}>
                          <SelectTrigger id="requested-skill-level" className="glassmorphic border-glass backdrop-blur-xl bg-white/5 h-14 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
                      </AccessibleFormField>
                    </div>
                  </div>
                  <div className="flex justify-end">
              <Button
                type="button"
                onClick={addRequestedSkill}
                      variant="premium"
                      size="lg"
                      topic="trades"
                      className="min-w-[140px]"
              >
                      <Plus className="h-5 w-5 mr-sm" />
                Add Skill
              </Button>
            </div>
                </GlassmorphicForm>
              </CardContent>
            </Card>
            
            {/* Requested skills list */}
            {requestedSkills.length > 0 && (
              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Skills You Want</h3>
                  <Badge variant="secondary" className="text-sm">
                    {requestedSkills.length} {requestedSkills.length === 1 ? 'skill' : 'skills'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {requestedSkills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="default" 
                      topic="trades"
                      className="text-sm px-lg py-md flex items-center justify-between gap-sm h-auto min-h-[50px]"
                    >
                      <div className="flex flex-col space-y-xs">
                        <span className="font-medium text-sm">{skill.name}</span>
                        <span className="text-xs opacity-75 capitalize">{skill.level}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeRequestedSkill(index)} 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors p-xs hover:bg-white/10 rounded-full flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
              ))}
            </div>
          </div>
            )}
          </section>

          {/* Submit Section */}
          <section className="pt-xl border-t border-white/10 mt-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-lg">
              <div className="space-y-sm">
                <h3 className="text-xl font-semibold text-foreground">
                  Ready to Create Your Trade?
                </h3>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Review your information and submit to make your trade visible to the community
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-md w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/trades')}
                  className="min-h-[44px] min-w-[120px]"
                >
                  Cancel
                </Button>
                <Button
              type="submit"
                  variant="premium"
                  size="lg"
                  topic="trades"
              disabled={isSubmitting}
                  className="min-h-[44px] min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-md" />
                      Creating Trade...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-md" />
              Create Trade
                    </>
                  )}
                </Button>
              </div>
          </div>
          </section>
        </form>
        </CardContent>
      </Card>
        </BentoItem>

        {/* Helpful Sidebar */}
        <BentoItem colSpan={2} contentType="stats" layoutRole="featured">
          <div className="space-y-xl">
            {/* Pro Tips */}
            <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
              <CardContent className="p-xl">
                <div className="space-y-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                      Pro Tips
                    </h3>
                  </div>
                  <div className="space-y-sm">
                    <p className="text-sm text-muted-foreground">
                      • Be specific about your skill level
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Include relevant examples in your description
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Use clear, descriptive titles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
              <CardContent className="p-xl">
                <div className="space-y-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      Community Stats
                    </h3>
                  </div>
                  <div className="space-y-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Trades</span>
                      <Badge variant="default" className="bg-primary-500/10 text-primary-600 dark:text-primary-400">
                        1,247
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        94%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg. Response</span>
                      <Badge variant="default" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        2.3h
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass" className="glassmorphic border-glass backdrop-blur-xl bg-white/5">
              <CardContent className="p-xl">
                <div className="space-y-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-500/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-600 dark:text-secondary-400">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="space-y-sm">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => navigate('/trades')}
                    >
                      Browse Trades
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => navigate('/collaborations')}
                    >
                      View Collaborations
                    </Button>
      </div>
    </div>
              </CardContent>
            </Card>
          </div>
        </BentoItem>
      </BentoGrid>
    </main>
  );
};

export default CreateTradePage;
