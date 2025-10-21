import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { MultiStepForm, FormStep, StepComponentProps } from '../forms/MultiStepForm';
import { RoleMappingInterface, SimpleRole } from './RoleMappingInterface';
import { ProgressiveDisclosureWrapper, DisclosureSection } from './ProgressiveDisclosureWrapper';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { 
  Lightbulb, 
  Users, 
  Target, 
  Calendar,
  MapPin,
  Clock,
  Star,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Settings,
  Heart
} from 'lucide-react';

export interface CollaborationWorkflowData {
  // Step 1: Project Idea
  projectIdea: string;
  projectType: 'learning' | 'building' | 'creative' | 'research';
  description: string;
  
  // Step 2: Team & Scope
  teamSize: number;
  timeCommitment: string;
  duration: string;
  isRemote: boolean;
  location?: string;
  
  // Step 3: Skills & Roles
  skillsNeeded: string[];
  selectedRoles: SimpleRole[];
  
  // Step 4: Advanced Settings
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  privacy: 'public' | 'invite-only' | 'private';
  autoAccept: boolean;
  mentorshipAvailable: boolean;
  
  // Step 5: Launch Settings
  recruitmentDeadline?: Date;
  startDate?: Date;
  tags: string[];
}

interface SmartCollaborationWorkflowProps {
  onComplete: (data: CollaborationWorkflowData) => void;
  onCancel?: () => void;
  initialData?: Partial<CollaborationWorkflowData>;
  className?: string;
}

export const SmartCollaborationWorkflow: React.FC<SmartCollaborationWorkflowProps> = ({
  onComplete,
  onCancel,
  initialData = {},
  className = ''
}) => {
  const [workflowData, setWorkflowData] = useState<CollaborationWorkflowData>({
    projectIdea: '',
    projectType: 'building',
    description: '',
    teamSize: 3,
    timeCommitment: '3-5 hours/week',
    duration: '4-6 weeks',
    isRemote: true,
    skillsNeeded: [],
    selectedRoles: [],
    difficulty: 'intermediate',
    privacy: 'public',
    autoAccept: false,
    mentorshipAvailable: false,
    tags: [],
    ...initialData
  });

  // Step 1: Project Idea
  const ProjectIdeaStep: React.FC<StepComponentProps> = ({ data, onChange }) => {
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const projectTypes = [
      { 
        id: 'learning', 
        title: 'Learning Project', 
        description: 'Study together and learn new skills',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'from-yellow-500 to-orange-500'
      },
      { 
        id: 'building', 
        title: 'Building Project', 
        description: 'Create apps, websites, or tools',
        icon: <Target className="w-5 h-5" />,
        color: 'from-blue-500 to-purple-500'
      },
      { 
        id: 'creative', 
        title: 'Creative Project', 
        description: 'Design, art, or creative content',
        icon: <Heart className="w-5 h-5" />,
        color: 'from-pink-500 to-rose-500'
      },
      { 
        id: 'research', 
        title: 'Research Project', 
        description: 'Investigate and analyze topics',
        icon: <Brain className="w-5 h-5" />,
        color: 'from-green-500 to-teal-500'
      }
    ];

    const generateAISuggestions = () => {
      // Mock AI suggestions based on project type
      const suggestions: Record<'learning'|'building'|'creative'|'research', string[]> = {
        learning: [
          'Learn React and build a portfolio website together',
          'Master data structures through collaborative coding',
          'Study machine learning with hands-on projects'
        ],
        building: [
          'Build a recipe sharing mobile app',
          'Create a productivity tool for students',
          'Develop a local community marketplace'
        ],
        creative: [
          'Design a sustainable city of the future',
          'Create an interactive storytelling experience',
          'Develop a brand identity for a social cause'
        ],
        research: [
          'Research renewable energy solutions for urban areas',
          'Analyze social media impact on mental health',
          'Study effective remote work practices'
        ]
      };
      
      setAiSuggestions(suggestions[data.projectType as 'learning'|'building'|'creative'|'research'] || []);
      setShowSuggestions(true);
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">What's Your Project Idea?</h3>
          <p className="text-gray-300">Tell us what you want to create or learn together</p>
        </div>

        {/* Project Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Project Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           {projectTypes.map((type) => (
              <Card
                key={type.id}
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  data.projectType === type.id
                    ? "glassmorphic ring-2 ring-blue-500/50"
                    : "glassmorphic"
                )}
               onClick={() => onChange('projectType', type.id as CollaborationWorkflowData['projectType'])}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r",
                      type.color
                    )}>
                      {type.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium">{type.title}</div>
                      <div className="text-gray-300 text-sm">{type.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Project Idea Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Idea
          </label>
          <Textarea
            value={data.projectIdea}
            onChange={(e) => onChange('projectIdea', e.target.value)}
            placeholder="Describe your project idea in a few sentences..."
            className="bg-gray-800 border-gray-600 text-white"
            rows={3}
          />
        </div>

        {/* AI Suggestions */}
        <div className="space-y-3">
          <Button
            onClick={generateAISuggestions}
            variant="outline"
            className="w-full"
          >
            <Brain className="w-4 h-4 mr-2" />
            Get AI Suggestions
          </Button>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-medium text-gray-300">AI Suggestions:</h4>
                {aiSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-colors"
                    onClick={() => onChange('projectIdea', suggestion)}
                  >
                    <p className="text-blue-300 text-sm">{suggestion}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Detailed Description (Optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Add more details about goals, expected outcomes, or specific requirements..."
            className="bg-gray-800 border-gray-600 text-white"
            rows={4}
          />
        </div>
      </div>
    );
  };

  // Step 2: Team & Scope
  const TeamScopeStep: React.FC<StepComponentProps> = ({ data, onChange }) => {
    const timeCommitmentOptions = [
      '1-2 hours/week',
      '3-5 hours/week',
      '5-10 hours/week',
      '10+ hours/week'
    ];

    const durationOptions = [
      '1-2 weeks',
      '3-4 weeks',
      '4-6 weeks',
      '6-8 weeks',
      '2-3 months',
      '3+ months'
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Users className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Team & Scope</h3>
          <p className="text-gray-300">Define your team size and project timeline</p>
        </div>

        {/* Team Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Team Size (including you)
          </label>
          <div className="flex space-x-2">
            {[2, 3, 4, 5, 6].map((size) => (
              <Button
                key={size}
                variant={data.teamSize === size ? 'default' : 'outline'}
                onClick={() => onChange('teamSize', size)}
                className="flex-1"
              >
                {size} people
              </Button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Time Commitment per Person
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeCommitmentOptions.map((option) => (
              <Button
                key={option}
                variant={data.timeCommitment === option ? 'default' : 'outline'}
                onClick={() => onChange('timeCommitment', option)}
                size="sm"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Project Duration
          </label>
          <div className="grid grid-cols-2 gap-2">
            {durationOptions.map((option) => (
              <Button
                key={option}
                variant={data.duration === option ? 'default' : 'outline'}
                onClick={() => onChange('duration', option)}
                size="sm"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Work Style
          </label>
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button
                variant={data.isRemote ? 'default' : 'outline'}
                onClick={() => onChange('isRemote', true)}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Remote
              </Button>
              <Button
                variant={!data.isRemote ? 'default' : 'outline'}
                onClick={() => onChange('isRemote', false)}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                In-Person
              </Button>
            </div>
            
            {!data.isRemote && (
              <Input
                value={data.location || ''}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="Enter location (city, region, etc.)"
                className="bg-gray-800 border-gray-600 text-white"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Skills & Roles
  const SkillsRolesStep: React.FC<StepComponentProps> = ({ data, onChange }) => {
    const handleRoleSelect = (roles: SimpleRole[]) => {
      onChange('selectedRoles', roles);
      // Extract skills from roles
      const allSkills = roles.flatMap(role => role.skillsNeeded);
      const uniqueSkills = [...new Set(allSkills)];
      onChange('skillsNeeded', uniqueSkills);
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Target className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Skills & Roles</h3>
          <p className="text-gray-300">Define the roles and skills needed for your project</p>
        </div>

        <RoleMappingInterface
          projectType={data.projectType}
          teamSize={data.teamSize}
          onRoleSelect={handleRoleSelect}
        />
      </div>
    );
  };

  // Form steps configuration
  const formSteps: FormStep[] = [
    {
      id: 'project-idea',
      title: 'Project Idea',
      description: 'Define what you want to create or learn',
      component: ProjectIdeaStep,
      validation: (data) => data.projectIdea && data.projectIdea.length > 10
    },
    {
      id: 'team-scope',
      title: 'Team & Scope',
      description: 'Set team size and timeline',
      component: TeamScopeStep,
      validation: (data) => data.teamSize > 1 && data.timeCommitment && data.duration
    },
    {
      id: 'skills-roles',
      title: 'Skills & Roles',
      description: 'Choose team roles and required skills',
      component: SkillsRolesStep,
      validation: (data) => data.selectedRoles && data.selectedRoles.length > 0
    }
  ];

  const handleFormSubmit = (data: any) => {
    onComplete(data as CollaborationWorkflowData);
  };

  const handleDataChange = (field: string, value: any) => {
    setWorkflowData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-3">
          <Zap className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Smart Collaboration Wizard</h2>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Our intelligent workflow will guide you through creating the perfect collaboration project
        </p>
      </div>

      <MultiStepForm
        steps={formSteps}
        initialData={workflowData}
        onSubmit={handleFormSubmit}
        onStepChange={(current, total) => {
          // Update form data as user progresses
          Object.keys(workflowData).forEach(key => {
            handleDataChange(key, workflowData[key as keyof CollaborationWorkflowData]);
          });
        }}
        variant="stepped"
        brandAccent="gradient"
        showProgressBar={true}
        showStepNumbers={true}
        allowStepNavigation={false}
        validateOnStepChange={true}
        persistData={true}
        storageKey="collaboration-workflow"
      />

      {onCancel && (
        <div className="mt-8 text-center">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            Cancel and return to dashboard
          </Button>
        </div>
      )}
    </div>
  );
};
